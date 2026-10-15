package authz

import (
    "context"
)

// TrustedScope is a per-request data predicate derived ONLY from a successful
// Function Operation decision. It contains no menu permission.
type TrustedScope struct {
    tenantID string
    subjectID string
    resourceType string
    operationID string
    mode PermissionMode
    permissions []string
    grants map[string][]Grant
}
type dataScopeContextKey struct{}

// InjectDataScope is called by the secured HTTP operation handler before
// dispatching to the owning Domain. The Domain must enforce the returned
// constraint as a tenant-scoped query/write predicate (not in UI filtering).
func (d Decision) InjectDataScope(ctx context.Context) (context.Context, error) {
    if d.operation.ID == "" || d.operation.Audience == AudiencePublic ||
        d.operation.ResourceType == "" || d.principal.TenantID == "" {
        return ctx, Denial{PermissionDenied}
    }
    s := TrustedScope{
        tenantID: d.principal.TenantID, subjectID: d.principal.SubjectID,
        resourceType: d.operation.ResourceType, operationID: d.operation.ID,
        mode: d.operation.Mode, permissions: append([]string(nil), d.operation.Permissions...),
        grants: make(map[string][]Grant),
    }
    for _, p := range s.permissions {
        for _, g := range d.grants[p] {
            g.ResourceIDs = append([]string(nil), g.ResourceIDs...)
            s.grants[p] = append(s.grants[p], g)
        }
    }
    return context.WithValue(ctx, dataScopeContextKey{}, s), nil
}

func ScopeFromContext(ctx context.Context) (TrustedScope, bool) {
    s, ok := ctx.Value(dataScopeContextKey{}).(TrustedScope)
    return s, ok && s.tenantID != "" && s.resourceType != ""
}
func (s TrustedScope) TenantID() string { return s.tenantID }
func (s TrustedScope) SubjectID() string { return s.subjectID }
func (s TrustedScope) OperationID() string { return s.operationID }
func (s TrustedScope) ResourceType() string { return s.resourceType }

// GrantsFor returns a defensive copy suitable for an allowlisted SQL query builder.
// The owning domain MUST apply tenant_id AND the function-specific predicates.
func (s TrustedScope) GrantsFor(permission string) []Grant {
    out := []Grant{}
    for _, p := range s.permissions {
        if p != permission { continue }
        for _, g := range s.grants[permission] {
            g.ResourceIDs = append([]string(nil), g.ResourceIDs...)
            out = append(out, g)
        }
    }
    return out
}

// AllowsResource supplies a second resource-level check using trusted,
// domain-loaded ResourceFacts, independent of frontend Menu visibility.
func (s TrustedScope) AllowsResource(r ResourceFacts) bool {
    if r.ID == "" || r.TenantID == "" || r.TenantID != s.tenantID || r.Type != s.resourceType { return false }
    valid := 0
    for _, p := range s.permissions {
        allowed := false
        for _, g := range s.grants[p] {
            if g.TenantID != s.tenantID { continue }
            switch g.Scope {
            case ScopeTenant:
                allowed = true
            case ScopeSelf:
                allowed = r.OwnerSubjectID == s.subjectID
            case ScopeAssigned:
                for _, account := range r.AssignedSubjectIDs { if account == s.subjectID { allowed = true; break } }
            case ScopeExplicit:
                for _, id := range g.ResourceIDs { if id == r.ID { allowed = true; break } }
            }
            if allowed { break }
        }
        if allowed { valid++ }
    }
    if s.mode == ModeAny { return valid > 0 }
    return valid == len(s.permissions) && len(s.permissions) > 0
}
