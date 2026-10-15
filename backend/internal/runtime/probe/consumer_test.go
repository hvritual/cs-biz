package probe

import (
	"testing"

	"github.com/hvritual/cs-biz/backend/internal/assembly"
	canonical "github.com/hvritual/yunka.io/framework/modules/outboxruntime"
	facade "github.com/hvritual/yunka.io/infras/modules/outboxruntime"
)

// The real Consumer keeps the four fixed external modules in its module graph,
// and verifies that the public facade refers to the single canonical runtime.
func TestAssemblyRejectsMissingBindings(t *testing.T) {
	if _, err := assembly.BuildApplications(nil, nil); err == nil {
		t.Fatal("nil factories accepted")
	}
	if err := assembly.RegisterTransports(assembly.TransportBindings{}, assembly.Applications{}, nil); err == nil {
		t.Fatal("missing executor accepted")
	}
	a, b := canonical.GeneratedDescriptor(), facade.GeneratedDescriptor()
	if a.Name != b.Name {
		t.Fatal("outbox facade diverged")
	}
	if _, err := (factories{}).BuildRuntimeProbe(assembly.RuntimeProbeDependencies{}); err != nil {
		t.Fatal(err)
	}
}
