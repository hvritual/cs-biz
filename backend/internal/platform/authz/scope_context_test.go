package authz

import (
    "context"
    "testing"
)

func TestTrustedScopeInjectionIsFunctionAndTenantBound(t *testing.T) {
    a, authority, ctx := setup(t)
    authority.setGrants(
      Grant{Permission:"customer.read",TenantID:"A",Scope:ScopeTenant},
      Grant{Permission:"customer.update",TenantID:"A",Scope:ScopeSelf},
    )
    dec, err := a.Authorize(ctx, "customer.update")
    if err != nil { t.Fatal(err) }
    injected, err := dec.InjectDataScope(context.Background())
    if err != nil { t.Fatal(err) }
    scope, ok := ScopeFromContext(injected)
    if !ok || scope.TenantID() != "A" || scope.OperationID() != "customer.update" { t.Fatalf("scope %+v", scope) }
    self := ResourceFacts{Type:"crm.customer",ID:"1",TenantID:"A",OwnerSubjectID:"alice"}
    other := ResourceFacts{Type:"crm.customer",ID:"2",TenantID:"A",OwnerSubjectID:"bob"}
    foreign := ResourceFacts{Type:"crm.customer",ID:"1",TenantID:"B",OwnerSubjectID:"alice"}
    if !scope.AllowsResource(self) || scope.AllowsResource(other) || scope.AllowsResource(foreign) { t.Fatal("Scope was widened") }
    if len(scope.GrantsFor("customer.read")) != 0 || len(scope.GrantsFor("customer.update")) != 1 { t.Fatal("different functions mixed") }
    if _, ok := ScopeFromContext(context.Background()); ok { t.Fatal("untrusted context carried scope") }
}

func TestTrustedScopeModeAllRequiresIntersection(t *testing.T) {
    r, err := NewRegistry(Operation{ID:"customer.audit",Audience:AudienceTenant,
      Permissions:[]string{"customer.read","customer.audit"},Mode:ModeAll,ResourceType:"crm.customer"})
    if err!=nil { t.Fatal(err) }
    auth:=&fakeCurrentAuthority{active:map[string]bool{"A:alice":true},grants:[]Grant{
      {Permission:"customer.read",TenantID:"A",Scope:ScopeTenant},
      {Permission:"customer.audit",TenantID:"A",Scope:ScopeSelf},
    }}
    a,err:=NewAuthorizer(r,auth);if err!=nil {t.Fatal(err)}
    ctx:=WithVerifiedPrincipal(context.Background(),Principal{Kind:Human,SubjectID:"alice",TenantID:"A"})
    d,err:=a.Authorize(ctx,"customer.audit");if err!=nil {t.Fatal(err)}
    injected,err:=d.InjectDataScope(ctx);if err!=nil {t.Fatal(err)}
    scope,_:=ScopeFromContext(injected)
    if !scope.AllowsResource(ResourceFacts{Type:"crm.customer",ID:"1",TenantID:"A",OwnerSubjectID:"alice"}) {t.Fatal("expected self")}
    if scope.AllowsResource(ResourceFacts{Type:"crm.customer",ID:"2",TenantID:"A",OwnerSubjectID:"other"}) {t.Fatal("cross-grant scope escalation")}
}
