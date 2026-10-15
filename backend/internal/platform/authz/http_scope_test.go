package authz

import (
    "context"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHTTPRouterInjectsFunctionSpecificTrustedDataScope(t *testing.T) {
    registry,err:=NewRegistry(Operation{
      ID:"customer.update",Audience:AudienceTenant,Permissions:[]string{"customer.update"},
      ResourceType:"crm.customer",HTTP:[]HTTPBinding{{Method:"POST",Pattern:"/v1/customers/{id}"}},
    })
    if err!=nil {t.Fatal(err)}
    store:=&fakeCurrentAuthority{active:map[string]bool{"A:alice":true},
      grants:[]Grant{{Permission:"customer.update",TenantID:"A",Scope:ScopeSelf}}}
    a,err:=NewAuthorizer(registry,store);if err!=nil {t.Fatal(err)}
    router,err:=NewHTTPRouter(a);if err!=nil {t.Fatal(err)}
    if err:=router.HandleOperation("customer.update",func(w http.ResponseWriter,r *http.Request,_ Decision){
      scope,ok:=ScopeFromContext(r.Context())
      if !ok || scope.TenantID()!="A" || scope.OperationID()!="customer.update" {
        t.Error("handler did not receive trusted data scope")
        w.WriteHeader(http.StatusInternalServerError);return
      }
      if !scope.AllowsResource(ResourceFacts{Type:"crm.customer",ID:"one",TenantID:"A",OwnerSubjectID:"alice"}) ||
          scope.AllowsResource(ResourceFacts{Type:"crm.customer",ID:"two",TenantID:"A",OwnerSubjectID:"other"}) {
        t.Error("function scope widened")
        w.WriteHeader(http.StatusInternalServerError);return
      }
      w.WriteHeader(http.StatusNoContent)
    });err!=nil {t.Fatal(err)}
    if err:=router.CheckCoverage();err!=nil {t.Fatal(err)}
    input:=httptest.NewRequest(http.MethodPost,"/v1/customers/one",nil)
    input=input.WithContext(WithVerifiedPrincipal(context.Background(),Principal{
      Kind:Human,SubjectID:"alice",TenantID:"A",
    }))
    w:=httptest.NewRecorder()
    router.ServeHTTP(w,input)
    if w.Code!=http.StatusNoContent {t.Fatalf("status %d body %s",w.Code,w.Body.String())}
    // Spoofing a header must not create a trusted Principal or Scope.
    forged:=httptest.NewRequest(http.MethodPost,"/v1/customers/one",nil)
    forged.Header.Set("X-User-ID","alice")
    forged.Header.Set("X-Tenant-ID","A")
    w=httptest.NewRecorder()
    router.ServeHTTP(w,forged)
    if w.Code!=http.StatusUnauthorized {t.Fatalf("forged headers accepted: %d",w.Code)}
}
