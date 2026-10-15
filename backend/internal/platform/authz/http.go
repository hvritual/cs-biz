package authz

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// HTTPHandler receives the authorized operation decision. For resource-bound
// operations it MUST additionally use RequireResource or an equivalent scoped
// domain query. HTTPRouter deliberately does not own business repositories.
type HTTPHandler func(http.ResponseWriter, *http.Request, Decision)

type HTTPRouter struct {
	mux        *http.ServeMux
	authorizer *Authorizer
	registered map[string]bool
}

func NewHTTPRouter(a *Authorizer) (*HTTPRouter, error) {
	if a == nil {
		return nil, fmt.Errorf("authz: authorizer required")
	}
	return &HTTPRouter{mux: http.NewServeMux(), authorizer: a, registered: map[string]bool{}}, nil
}

func (r *HTTPRouter) HandleOperation(operationID string, h HTTPHandler) (err error) {
	if h == nil {
		return fmt.Errorf("authz: nil HTTP handler")
	}
	op, ok := r.authorizer.registry.Lookup(operationID)
	if !ok || len(op.HTTP) == 0 {
		return fmt.Errorf("authz: unknown or unbound operation %q", operationID)
	}
	if r.registered[operationID] {
		return fmt.Errorf("authz: duplicate handler for %q", operationID)
	}
	// Go ServeMux rejects conflicting patterns. Convert the rejection into a
	// registration error rather than silently allowing an unguarded fallback.
	defer func() {
		if v := recover(); v != nil {
			err = fmt.Errorf("authz: conflicting HTTP route: %v", v)
		}
	}()
	for _, binding := range op.HTTP {
		r.mux.HandleFunc(binding.Method+" "+binding.Pattern, func(w http.ResponseWriter, req *http.Request) {
			d, authErr := r.authorizer.Authorize(req.Context(), operationID)
			if authErr != nil {
				writeDenial(w, authErr)
				return
			}
			// Inject per-Operation Data Scope after Function authorization, never Menu Grant.
			// The owning Domain must still enforce tenant and scope in its queries.
			if op.ResourceType != "" {
				trusted, scopeErr := d.InjectDataScope(req.Context())
				if scopeErr != nil {
					writeDenial(w, scopeErr)
					return
				}
				req = req.WithContext(trusted)
			}
			h(w, req, d)
		})
	}
	r.registered[operationID] = true
	return nil
}

// CheckCoverage is a mandatory bootstrap/CI check: every declared HTTP operation
// must have exactly one guarded handler. The private ServeMux forbids raw routes.
func (r *HTTPRouter) CheckCoverage() error {
	for _, op := range r.authorizer.registry.Operations() {
		if len(op.HTTP) > 0 && !r.registered[op.ID] {
			return fmt.Errorf("authz: HTTP operation %s has no handler", op.ID)
		}
	}
	return nil
}
func (r *HTTPRouter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.mux.ServeHTTP(w, req)
}
func writeDenial(w http.ResponseWriter, err error) {
	reason := AuthorityUnavailable
	if d, ok := err.(Denial); ok {
		reason = d.Code
	}
	status := http.StatusForbidden
	switch reason {
	case Unauthenticated:
		status = http.StatusUnauthorized
	case ResourceNotVisible:
		status = http.StatusNotFound
	case AuthorityUnavailable:
		status = http.StatusServiceUnavailable
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(struct {
		Code Reason `json:"code"`
	}{reason})
}
