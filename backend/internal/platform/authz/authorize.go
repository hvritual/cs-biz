package authz

import (
	"context"
	"fmt"
)

type PrincipalKind string

const (
	Human    PrincipalKind = "human"
	Platform PrincipalKind = "platform"
	Service  PrincipalKind = "service"
	Worker   PrincipalKind = "worker"
)

// Principal is a verified identity. Only a trusted credential/session/job adapter
// may insert it into context; HTTP headers or request JSON must never do so.
type Principal struct {
	Kind      PrincipalKind
	SubjectID string
	TenantID  string
}

type principalContextKey struct{}

func WithVerifiedPrincipal(ctx context.Context, p Principal) context.Context {
	return context.WithValue(ctx, principalContextKey{}, p)
}
func currentPrincipal(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(principalContextKey{}).(Principal)
	return p, ok && p.SubjectID != ""
}

type Scope string

const (
	ScopeTenant   Scope = "tenant"
	ScopeSelf     Scope = "self"
	ScopeAssigned Scope = "assigned"
	ScopeExplicit Scope = "explicit"
)

// Grant is an *operation-specific* permission/scope pair from the current IAM authority.
// Grant.TenantID must match the verified tenant (or be empty for non-tenant actors).
type Grant struct {
	Permission  string
	TenantID    string
	Scope       Scope
	ResourceIDs []string
}

// CurrentAuthority must re-read committed facts for every protected request.
// A snapshot with bounded caching is a future, separately verified optimization.
type CurrentAuthority interface {
	ActiveMembership(ctx context.Context, subjectID, tenantID string) (bool, error)
	Grants(ctx context.Context, p Principal, permissions []string) ([]Grant, error)
}

type Reason string

const (
	Unauthenticated       Reason = "UNAUTHENTICATED"
	TenantContextRequired Reason = "TENANT_CONTEXT_REQUIRED"
	MembershipInactive    Reason = "MEMBERSHIP_INACTIVE"
	PermissionDenied      Reason = "PERMISSION_DENIED"
	ResourceNotVisible    Reason = "RESOURCE_NOT_VISIBLE"
	AuthorityUnavailable  Reason = "AUTHORITY_UNAVAILABLE"
	UnknownOperation      Reason = "UNKNOWN_OPERATION"
)

type Denial struct{ Code Reason }

func (d Denial) Error() string { return string(d.Code) }

// Authorizer is an operation-level PEP/PDP. A successful Decision is not
// sufficient to read or modify resource objects; the owning domain must apply
// current tenant/object predicates and the permission-specific scope.
type Authorizer struct {
	registry  Registry
	authority CurrentAuthority
}

func NewAuthorizer(registry Registry, authority CurrentAuthority) (*Authorizer, error) {
	if authority == nil {
		return nil, fmt.Errorf("authz: current authority required")
	}
	return &Authorizer{registry: registry, authority: authority}, nil
}

type Decision struct {
	operation Operation
	principal Principal
	grants    map[string][]Grant
}

func (d Decision) OperationID() string          { return d.operation.ID }
func (d Decision) TrustedTenantID() string      { return d.principal.TenantID }
func (d Decision) TrustedSubjectID() string     { return d.principal.SubjectID }
func (d Decision) PrincipalKind() PrincipalKind { return d.principal.Kind }

func (a *Authorizer) Authorize(ctx context.Context, operationID string) (Decision, error) {
	op, known := a.registry.Lookup(operationID)
	if !known {
		return Decision{}, Denial{UnknownOperation}
	}
	if op.Audience == AudiencePublic {
		return Decision{operation: op}, nil
	}
	p, ok := currentPrincipal(ctx)
	if !ok {
		return Decision{}, Denial{Unauthenticated}
	}
	expected := map[Audience]PrincipalKind{AudienceTenant: Human, AudiencePlatform: Platform, AudienceService: Service, AudienceWorker: Worker}[op.Audience]
	if p.Kind != expected {
		return Decision{}, Denial{PermissionDenied}
	}
	if op.Audience == AudienceTenant {
		if p.TenantID == "" {
			return Decision{}, Denial{TenantContextRequired}
		}
		active, err := a.authority.ActiveMembership(ctx, p.SubjectID, p.TenantID)
		if err != nil {
			return Decision{}, Denial{AuthorityUnavailable}
		}
		if !active {
			return Decision{}, Denial{MembershipInactive}
		}
	}
	raw, err := a.authority.Grants(ctx, p, append([]string(nil), op.Permissions...))
	if err != nil {
		return Decision{}, Denial{AuthorityUnavailable}
	}
	grants := make(map[string][]Grant, len(op.Permissions))
	for _, g := range raw {
		if g.TenantID != p.TenantID || !validScope(g.Scope) {
			continue
		}
		for _, key := range op.Permissions {
			if g.Permission == key {
				g.ResourceIDs = append([]string(nil), g.ResourceIDs...)
				grants[key] = append(grants[key], g)
			}
		}
	}
	matched := 0
	for _, key := range op.Permissions {
		if len(grants[key]) > 0 {
			matched++
		}
	}
	if (op.Mode == ModeAll && matched != len(op.Permissions)) || (op.Mode == ModeAny && matched == 0) {
		return Decision{}, Denial{PermissionDenied}
	}
	return Decision{operation: op, principal: p, grants: grants}, nil
}
func validScope(s Scope) bool {
	return s == ScopeTenant || s == ScopeSelf || s == ScopeAssigned || s == ScopeExplicit
}

// ResourceFacts MUST be loaded by the owning domain under the authoritative
// tenant predicate, never populated straight from client-supplied JSON/headers.
type ResourceFacts struct {
	Type               string
	ID                 string
	TenantID           string
	OwnerSubjectID     string
	AssignedSubjectIDs []string
}

// RequireResource must be invoked before a specific object is returned/mutated.
// List/export queries must apply equivalent permission-specific predicates in
// their repository; RequireResource on one row cannot authorize a full list.
func (d Decision) RequireResource(permission string, resource ResourceFacts) error {
	if d.operation.ID == "" || d.operation.Audience == AudiencePublic ||
		d.operation.ResourceType == "" || resource.Type != d.operation.ResourceType ||
		resource.ID == "" || resource.TenantID == "" || d.principal.TenantID == "" ||
		resource.TenantID != d.principal.TenantID {
		return Denial{ResourceNotVisible}
	}
	for _, g := range d.grants[permission] {
		switch g.Scope {
		case ScopeTenant:
			return nil
		case ScopeSelf:
			if resource.OwnerSubjectID == d.principal.SubjectID {
				return nil
			}
		case ScopeAssigned:
			for _, user := range resource.AssignedSubjectIDs {
				if user == d.principal.SubjectID {
					return nil
				}
			}
		case ScopeExplicit:
			for _, id := range g.ResourceIDs {
				if id == resource.ID {
					return nil
				}
			}
		}
	}
	return Denial{ResourceNotVisible}
}

// ScopesFor is a *constraint* supplied to an owning domain's scoped SQL/query
// builder. It must never be interpreted as global access or copied across actions.
func (d Decision) ScopesFor(permission string) ([]Grant, error) {
	if d.operation.ID == "" || d.operation.Audience == AudiencePublic || d.operation.ResourceType == "" || len(d.grants[permission]) == 0 {
		return nil, Denial{PermissionDenied}
	}
	result := make([]Grant, 0, len(d.grants[permission]))
	for _, g := range d.grants[permission] {
		g.ResourceIDs = append([]string(nil), g.ResourceIDs...)
		result = append(result, g)
	}
	return result, nil
}
