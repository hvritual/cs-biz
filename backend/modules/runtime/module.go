package runtime

const ModuleName = "runtime"

type Module struct {
	dependencies Dependencies
}

func NewModule(dependencies Dependencies) (*Module, error) {
	return &Module{dependencies: dependencies}, nil
}

func (*Module) Name() string { return ModuleName }
