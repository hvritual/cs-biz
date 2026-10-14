package authz

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"sync"
	"testing"
)

type fakeCurrentAuthority struct {
	mu          sync.RWMutex
	active      map[string]bool
	grants      []Grant
	unavailable bool
}

func (s *fakeCurrentAuthority) ActiveMembership(_ context.Context, user, tenant string) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.unavailable {
		return false, errors.New("database unavailable")
	}
	return s.active[tenant+":"+user], nil
}
func (s *fakeCurrentAuthority) Grants(_ context.Context, _ Principal, _ []string) ([]Grant, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.unavailable {
		return nil, errors.New("database unavailable")
	}
	return append([]Grant(nil), s.grants...), nil
}
func (s *fakeCurrentAuthority) setGrants(gs ...Grant) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.grants = gs
}
func (s *fakeCurrentAuthority) setUnavailable(v bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.unavailable = v
}
func (s *fakeCurrentAuthority) setMembership(id string, active bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.active[id] = active
}

func registryForTest(t *testing.T) Registry {
	t.Helper()
	r, err := NewRegistry(
		Operation{ID: "customer.get", Audience: AudienceTenant, Permissions: []string{"customer.read"}, ResourceType: "crm.customer", HTTP: []HTTPBinding{{Method: "GET", Pattern: "/v1/customers/{id}"}}},
		Operation{ID: "customer.update", Audience: AudienceTenant, Permissions: []string{"customer.update"}, ResourceType: "crm.customer"},
		Operation{ID: "customer.create", Audience: AudienceTenant, Permissions: []string{"customer.create"}},
		Operation{ID: "member.create", Audience: AudienceTenant, Permissions: []string{"member.manage", "role.assign"}, Mode: ModeAll},
		Operation{ID: "customer.lookup", Audience: AudienceTenant, Permissions: []string{"customer.read", "customer.audit"}, Mode: ModeAny},
		Operation{ID: "platform.tenants", Audience: AudiencePlatform, Permissions: []string{"platform.tenants.read"}},
		Operation{ID: "system.health", Audience: AudiencePublic, PublicReason: "public health endpoint", HTTP: []HTTPBinding{{Method: "GET", Pattern: "/healthz"}}},
	)
	if err != nil {
		t.Fatal(err)
	}
	return r
}
func setup(t *testing.T) (*Authorizer, *fakeCurrentAuthority, context.Context) {
	t.Helper()
	s := &fakeCurrentAuthority{active: map[string]bool{"A:alice": true, "B:alice": false}}
	a, err := NewAuthorizer(registryForTest(t), s)
	if err != nil {
		t.Fatal(err)
	}
	ctx := WithVerifiedPrincipal(context.Background(), Principal{Kind: Human, SubjectID: "alice", TenantID: "A"})
	return a, s, ctx
}
func assertDenied(t *testing.T, err error, code Reason) {
	t.Helper()
	var d Denial
	if !errors.As(err, &d) || d.Code != code {
		t.Fatalf("expected %s, got %v", code, err)
	}
}
func TestRegistryFailClosedAndDerivedCatalog(t *testing.T) {
	r := registryForTest(t)
	want := []string{"customer.audit", "customer.create", "customer.read", "customer.update", "member.manage", "platform.tenants.read", "role.assign"}
	if got := r.PermissionCatalog(); !reflect.DeepEqual(got, want) {
		t.Fatalf("catalog=%v", got)
	}
	ops := r.Operations()
	for i := range ops {
		if ops[i].ID == "customer.get" {
			ops[i].Permissions[0] = "pwn"
			ops[i].HTTP[0].Pattern = "/pwn"
		}
	}
	original, _ := r.Lookup("customer.get")
	if original.Permissions[0] != "customer.read" || original.HTTP[0].Pattern != "/v1/customers/{id}" {
		t.Fatal("registry projection was mutable")
	}
	bad := []Operation{
		{ID: "invalid", Audience: AudienceTenant, Permissions: []string{"customer.read"}},
		{ID: "customer.read", Audience: AudienceTenant},
		{ID: "customer.read", Audience: AudiencePublic, PublicReason: "oops", Permissions: []string{"customer.read"}},
		{ID: "customer.read", Audience: AudiencePublic, HTTP: []HTTPBinding{{Method: "GET", Pattern: "/x"}}},
		{ID: "customer.read", Audience: AudienceTenant, Permissions: []string{"*"}},
		{ID: "customer.read", Audience: AudienceTenant, Permissions: []string{"customer.read"}, Mode: "maybe"},
	}
	for _, op := range bad {
		if _, err := NewRegistry(op); err == nil {
			t.Errorf("accepted invalid definition: %+v", op)
		}
	}
	dup := Operation{ID: "customer.read", Audience: AudienceTenant, Permissions: []string{"customer.read"}}
	if _, err := NewRegistry(dup, dup); err == nil {
		t.Fatal("duplicate operation accepted")
	}
	d1 := Operation{ID: "customer.one", Audience: AudienceTenant, Permissions: []string{"customer.read"}, HTTP: []HTTPBinding{{Method: "GET", Pattern: "/x"}}}
	d2 := Operation{ID: "customer.two", Audience: AudienceTenant, Permissions: []string{"customer.read"}, HTTP: []HTTPBinding{{Method: "GET", Pattern: "/x"}}}
	if _, err := NewRegistry(d1, d2); err == nil {
		t.Fatal("duplicate HTTP binding accepted")
	}
}
func TestAuthorizationMatrixCurrentAuthority(t *testing.T) {
	a, s, ctx := setup(t)
	_, err := a.Authorize(context.Background(), "customer.get")
	assertDenied(t, err, Unauthenticated)
	_, err = a.Authorize(ctx, "customer.nonexistent")
	assertDenied(t, err, UnknownOperation)
	_, err = a.Authorize(WithVerifiedPrincipal(context.Background(), Principal{Kind: Human, SubjectID: "alice"}), "customer.get")
	assertDenied(t, err, TenantContextRequired)
	s.setGrants(Grant{Permission: "customer.read", TenantID: "A", Scope: ScopeTenant})
	_, err = a.Authorize(WithVerifiedPrincipal(context.Background(), Principal{Kind: Human, SubjectID: "alice", TenantID: "B"}), "customer.get")
	assertDenied(t, err, MembershipInactive)
	s.setGrants()
	_, err = a.Authorize(ctx, "customer.get")
	assertDenied(t, err, PermissionDenied)
	s.setGrants(Grant{Permission: "customer.read", TenantID: "B", Scope: ScopeTenant})
	_, err = a.Authorize(ctx, "customer.get")
	assertDenied(t, err, PermissionDenied)
	s.setGrants(Grant{Permission: "customer.read", TenantID: "A", Scope: ScopeTenant})
	d, err := a.Authorize(ctx, "customer.get")
	if err != nil || d.OperationID() != "customer.get" || d.TrustedTenantID() != "A" {
		t.Fatalf("allowed=%+v err=%v", d, err)
	}
	s.setGrants()
	_, err = a.Authorize(ctx, "customer.get")
	assertDenied(t, err, PermissionDenied)
	s.setUnavailable(true)
	_, err = a.Authorize(ctx, "customer.get")
	assertDenied(t, err, AuthorityUnavailable)
	s.setUnavailable(false)
	s.setMembership("A:alice", false)
	_, err = a.Authorize(ctx, "customer.get")
	assertDenied(t, err, MembershipInactive)
}
func TestPermissionModeAndAudienceIsolation(t *testing.T) {
	a, s, ctx := setup(t)
	s.setGrants(Grant{Permission: "member.manage", TenantID: "A", Scope: ScopeTenant}, Grant{Permission: "customer.read", TenantID: "A", Scope: ScopeSelf})
	_, err := a.Authorize(ctx, "member.create")
	assertDenied(t, err, PermissionDenied)
	if _, err := a.Authorize(ctx, "customer.lookup"); err != nil {
		t.Fatal(err)
	}
	_, err = a.Authorize(ctx, "platform.tenants")
	assertDenied(t, err, PermissionDenied)
	s.setGrants(Grant{Permission: "platform.tenants.read", TenantID: "", Scope: ScopeTenant})
	platformCtx := WithVerifiedPrincipal(context.Background(), Principal{Kind: Platform, SubjectID: "staff"})
	if _, err := a.Authorize(platformCtx, "platform.tenants"); err != nil {
		t.Fatal(err)
	}
	if _, err := a.Authorize(context.Background(), "system.health"); err != nil {
		t.Fatal(err)
	}
}
func TestResourceScopePermissionIsNotCrossMultiplied(t *testing.T) {
	a, s, ctx := setup(t)
	s.setGrants(
		Grant{Permission: "customer.read", TenantID: "A", Scope: ScopeTenant},
		Grant{Permission: "customer.update", TenantID: "A", Scope: ScopeSelf},
	)
	d, err := a.Authorize(ctx, "customer.update")
	if err != nil {
		t.Fatal(err)
	}
	other := ResourceFacts{Type: "crm.customer", ID: "other", TenantID: "A", OwnerSubjectID: "bob"}
	assertDenied(t, d.RequireResource("customer.update", other), ResourceNotVisible)
	self := ResourceFacts{Type: "crm.customer", ID: "self", TenantID: "A", OwnerSubjectID: "alice"}
	if err := d.RequireResource("customer.update", self); err != nil {
		t.Fatal(err)
	}
	assertDenied(t, d.RequireResource("customer.read", self), ResourceNotVisible)
	cross := ResourceFacts{Type: "crm.customer", ID: "outside", TenantID: "B", OwnerSubjectID: "alice"}
	assertDenied(t, d.RequireResource("customer.update", cross), ResourceNotVisible)
	read, err := a.Authorize(ctx, "customer.get")
	if err != nil {
		t.Fatal(err)
	}
	if err := read.RequireResource("customer.read", other); err != nil {
		t.Fatal(err)
	}
	if _, err := read.ScopesFor("customer.update"); err == nil {
		t.Fatal("foreign action scope exposed")
	}
	g, err := read.ScopesFor("customer.read")
	if err != nil {
		t.Fatal(err)
	}
	g[0].Permission = "tampered"
	again, _ := read.ScopesFor("customer.read")
	if again[0].Permission != "customer.read" {
		t.Fatal("mutable snapshot")
	}
	s.setGrants(Grant{Permission: "customer.update", TenantID: "A", Scope: ScopeExplicit, ResourceIDs: []string{"only-one"}})
	explicit, err := a.Authorize(ctx, "customer.update")
	if err != nil {
		t.Fatal(err)
	}
	if err := explicit.RequireResource("customer.update", ResourceFacts{Type: "crm.customer", ID: "only-one", TenantID: "A"}); err != nil {
		t.Fatal(err)
	}
	assertDenied(t, explicit.RequireResource("customer.update", self), ResourceNotVisible)
	s.setGrants(Grant{Permission: "customer.update", TenantID: "A", Scope: ScopeAssigned})
	assigned, err := a.Authorize(ctx, "customer.update")
	if err != nil {
		t.Fatal(err)
	}
	if err := assigned.RequireResource("customer.update", ResourceFacts{Type: "crm.customer", ID: "assigned", TenantID: "A", AssignedSubjectIDs: []string{"alice"}}); err != nil {
		t.Fatal(err)
	}
}
func TestNoHeaderTrustAndErrorsDoNotEchoDetails(t *testing.T) {
	a, _, ctx := setup(t)
	_, err := a.Authorize(ctx, "customer.get")
	if strings.Contains(err.Error(), "alice") || strings.Contains(err.Error(), "A:") {
		t.Fatal("denial leaked identity")
	}
}
