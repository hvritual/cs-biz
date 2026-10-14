package authz

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHTTPRouterCoverageAndUntrustedHeader(t *testing.T) {
	a, s, _ := setup(t)
	r, err := NewHTTPRouter(a)
	if err != nil {
		t.Fatal(err)
	}
	if err := r.CheckCoverage(); err == nil {
		t.Fatal("missing bindings must fail")
	}
	invoked := 0
	if err := r.HandleOperation("customer.get", func(w http.ResponseWriter, _ *http.Request, d Decision) {
		invoked++
		if d.TrustedTenantID() != "A" {
			t.Fatal("bad trusted tenant")
		}
		w.WriteHeader(http.StatusNoContent)
	}); err != nil {
		t.Fatal(err)
	}
	if err := r.HandleOperation("system.health", func(w http.ResponseWriter, _ *http.Request, _ Decision) { w.WriteHeader(http.StatusOK) }); err != nil {
		t.Fatal(err)
	}
	if err := r.CheckCoverage(); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/v1/customers/id", nil)
	req.Header.Set("X-Tenant-ID", "A")
	req.Header.Set("X-User-ID", "alice")
	unauth := httptest.NewRecorder()
	r.ServeHTTP(unauth, req)
	if unauth.Code != http.StatusUnauthorized || invoked != 0 {
		t.Fatalf("spoofed headers accepted: %d", unauth.Code)
	}
	body, _ := io.ReadAll(unauth.Result().Body)
	if !strings.Contains(string(body), "UNAUTHENTICATED") {
		t.Fatal("unexpected denial payload")
	}
	s.setGrants(Grant{Permission: "customer.read", TenantID: "A", Scope: ScopeTenant})
	req = req.WithContext(WithVerifiedPrincipal(req.Context(), Principal{Kind: Human, SubjectID: "alice", TenantID: "A"}))
	ok := httptest.NewRecorder()
	r.ServeHTTP(ok, req)
	if ok.Code != http.StatusNoContent || invoked != 1 {
		t.Fatalf("authorized response=%d invoked=%d", ok.Code, invoked)
	}
	wrong := httptest.NewRecorder()
	r.ServeHTTP(wrong, httptest.NewRequest(http.MethodGet, "/v1/unknown", nil))
	if wrong.Code != http.StatusNotFound {
		t.Fatal("unknown API was exposed")
	}
	health := httptest.NewRecorder()
	r.ServeHTTP(health, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if health.Code != http.StatusOK {
		t.Fatal("public health failed")
	}
	if err := r.HandleOperation("customer.get", func(http.ResponseWriter, *http.Request, Decision) {}); err == nil {
		t.Fatal("duplicate handler")
	}
	if err := r.HandleOperation("unlisted.op", func(http.ResponseWriter, *http.Request, Decision) {}); err == nil {
		t.Fatal("unknown handler accepted")
	}
}
