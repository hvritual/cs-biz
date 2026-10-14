// Package authz provides a commercial-independent operation/permission boundary.
// It does not authenticate credentials, own roles, or query business objects.
package authz

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
)

type Audience string

const (
	AudiencePublic   Audience = "public"
	AudienceTenant   Audience = "tenant_user"
	AudiencePlatform Audience = "platform"
	AudienceService  Audience = "service"
	AudienceWorker   Audience = "worker"
)

type PermissionMode string

const (
	ModeAll PermissionMode = "all"
	ModeAny PermissionMode = "any"
)

type HTTPBinding struct {
	Method  string
	Pattern string
}

// Operation is the sole programmatic source of API permissions and HTTP bindings.
// ResourceType means that domain code must enforce object/list visibility too.
type Operation struct {
	ID           string
	Audience     Audience
	Permissions  []string
	Mode         PermissionMode
	ResourceType string
	HTTP         []HTTPBinding
	PublicReason string
}

type Registry struct {
	operations   map[string]Operation
	httpBindings map[string]string
}

var keyPattern = regexp.MustCompile(`^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$`)

func NewRegistry(ops ...Operation) (Registry, error) {
	r := Registry{operations: make(map[string]Operation, len(ops)), httpBindings: map[string]string{}}
	for _, operation := range ops {
		op := cloneOperation(operation)
		if !keyPattern.MatchString(op.ID) {
			return Registry{}, fmt.Errorf("authz: invalid operation id %q", op.ID)
		}
		if _, exists := r.operations[op.ID]; exists {
			return Registry{}, fmt.Errorf("authz: duplicate operation %s", op.ID)
		}
		switch op.Audience {
		case AudiencePublic:
			if len(op.Permissions) != 0 || op.Mode != "" || strings.TrimSpace(op.PublicReason) == "" || op.ResourceType != "" {
				return Registry{}, fmt.Errorf("authz: public operation %s requires reason and no permissions/resource", op.ID)
			}
		case AudienceTenant, AudiencePlatform, AudienceService, AudienceWorker:
			if len(op.Permissions) == 0 || strings.TrimSpace(op.PublicReason) != "" {
				return Registry{}, fmt.Errorf("authz: protected operation %s requires permissions", op.ID)
			}
			if op.Mode == "" {
				op.Mode = ModeAll
			}
			if op.Mode != ModeAll && op.Mode != ModeAny {
				return Registry{}, fmt.Errorf("authz: invalid permission mode for %s", op.ID)
			}
		default:
			return Registry{}, fmt.Errorf("authz: invalid audience for %s", op.ID)
		}
		if op.Audience != AudienceTenant && op.ResourceType != "" && op.Audience != AudienceService && op.Audience != AudienceWorker {
			return Registry{}, fmt.Errorf("authz: resource scope on unsupported audience %s", op.ID)
		}
		if op.ResourceType != "" && !keyPattern.MatchString(op.ResourceType) {
			return Registry{}, fmt.Errorf("authz: invalid resource type %q", op.ResourceType)
		}
		permissionSeen := map[string]bool{}
		for _, permission := range op.Permissions {
			if !keyPattern.MatchString(permission) || permissionSeen[permission] {
				return Registry{}, fmt.Errorf("authz: invalid or duplicate permission %q on %s", permission, op.ID)
			}
			permissionSeen[permission] = true
		}
		if len(op.HTTP) == 0 && op.Audience == AudiencePublic {
			return Registry{}, fmt.Errorf("authz: public operation %s must have an explicit binding", op.ID)
		}
		for _, binding := range op.HTTP {
			if binding.Method != strings.ToUpper(binding.Method) || binding.Method == "" ||
				!strings.HasPrefix(binding.Pattern, "/") || strings.ContainsAny(binding.Pattern, "?#") {
				return Registry{}, fmt.Errorf("authz: invalid http binding on %s", op.ID)
			}
			key := binding.Method + " " + binding.Pattern
			if owner, exists := r.httpBindings[key]; exists {
				return Registry{}, fmt.Errorf("authz: duplicate http binding %q on %s and %s", key, owner, op.ID)
			}
			r.httpBindings[key] = op.ID
		}
		r.operations[op.ID] = op
	}
	return r, nil
}

func cloneOperation(o Operation) Operation {
	o.Permissions = append([]string(nil), o.Permissions...)
	o.HTTP = append([]HTTPBinding(nil), o.HTTP...)
	return o
}

func (r Registry) Lookup(id string) (Operation, bool) {
	op, ok := r.operations[id]
	return cloneOperation(op), ok
}

// Operations/PermissionCatalog are derived read-only projections, not role grants.
func (r Registry) Operations() []Operation {
	ids := make([]string, 0, len(r.operations))
	for id := range r.operations {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	result := make([]Operation, 0, len(ids))
	for _, id := range ids {
		result = append(result, cloneOperation(r.operations[id]))
	}
	return result
}
func (r Registry) PermissionCatalog() []string {
	seen := map[string]struct{}{}
	for _, op := range r.operations {
		for _, key := range op.Permissions {
			seen[key] = struct{}{}
		}
	}
	result := make([]string, 0, len(seen))
	for key := range seen {
		result = append(result, key)
	}
	sort.Strings(result)
	return result
}
