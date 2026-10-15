// Package probe assembles the local, read-only technical operation. It exposes
// no business data and uses only the generated transport/assembly and the Yunka
// Executor. Existing cs-biz Authz remains a separate compatibility library.
package probe

import (
	"context"
	"errors"
	"net"

	runtimev1 "github.com/hvritual/cs-biz/backend/contracts/runtime/v1"
	"github.com/hvritual/cs-biz/backend/internal/assembly"
	"github.com/hvritual/cs-biz/backend/internal/platform/telemetry"
	runtimeapplication "github.com/hvritual/cs-biz/backend/internal/runtime/application"
	"github.com/hvritual/yunka.io/framework/core/middleware"
	"github.com/hvritual/yunka.io/framework/core/runtimecontext"
	"github.com/hvritual/yunka.io/framework/observability"
	"github.com/hvritual/yunka.io/framework/operation"
	"github.com/hvritual/yunka.io/gateway/authz"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

type application struct{}

func (application) Inspect(context.Context, *runtimev1.InspectRequest) (*runtimev1.InspectResponse, error) {
	return &runtimev1.InspectResponse{Status: "ready"}, nil
}

type factories struct{}

func (factories) BuildRuntimeProbe(assembly.RuntimeProbeDependencies) (runtimeapplication.RuntimeService, error) {
	return application{}, nil
}

// denyPermissions cannot grant authority to future nonpublic operations.
type denyPermissions struct{}

func (denyPermissions) HasPermissions(context.Context, string, []string, []authz.PermissionKey, authz.PermissionMode) (bool, error) {
	return false, nil
}

func Listen(address string) (net.Listener, error) {
	if err := ValidateAddress(address); err != nil {
		return nil, err
	}
	return net.Listen("tcp", address)
}

func ValidateAddress(address string) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return errors.New("probe address must be a loopback IP and port")
	}
	ip := net.ParseIP(host)
	if ip == nil || !ip.IsLoopback() {
		return errors.New("probe listener must be loopback")
	}
	return nil
}

// NewServer cannot be used as a business authorization entrypoint: only the
// generated public runtime.inspect method is registered, with deny-all grants.
func NewServer(telemetry *telemetry.Runtime) (*grpc.Server, error) {
	if telemetry == nil || telemetry.Provider == nil {
		return nil, errors.New("telemetry is required")
	}
	provider := telemetry.Provider
	server := grpc.NewServer(grpc.UnaryInterceptor(func(ctx context.Context, request any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (response any, err error) {
		// Whitelist propagation. Baggage, credentials and arbitrary client metadata
		// never become log fields, resource attributes or runtime authority.
		incoming, _ := metadata.FromIncomingContext(ctx)
		carrier := metadataCarrier{"traceparent": first(incoming.Get("traceparent")), "tracestate": first(incoming.Get("tracestate"))}
		ctx = observability.Extract(ctx, carrier)
		ctx = runtimecontext.WithMetadata(ctx, runtimecontext.Metadata{Operation: "runtime.inspect", Transport: "rpc", Attributes: map[string]string{"rpc.direction": "server"}})
		err = provider.Middleware()(middleware.Handler(func(inner context.Context) error {
			span := trace.SpanContextFromContext(inner)
			if span.IsValid() {
				_ = grpc.SetHeader(inner, metadata.Pairs("x-trace-id", span.TraceID().String(), "x-span-id", span.SpanID().String()))
			}
			response, err = handler(inner, request)
			return err
		}))(ctx)
		return
	}))
	authorizer, err := authz.NewRBACAuthorizer(denyPermissions{})
	if err != nil {
		return nil, err
	}
	security, err := authz.NewExecutionSecurity(authorizer, nil)
	if err != nil {
		return nil, err
	}
	executor := operation.NewExecutor(security)
	applications, err := assembly.BuildApplications(factories{}, executor)
	if err != nil {
		return nil, err
	}
	if err = assembly.RegisterTransports(assembly.TransportBindings{RPC: server}, applications, executor); err != nil {
		return nil, err
	}
	// Validate the generated module catalog in this Consumer before accepting work.
	catalog, err := assembly.NewCatalog()
	if err != nil {
		return nil, err
	}
	if _, err = catalog.Seal(); err != nil {
		return nil, err
	}
	return server, nil
}
func first(values []string) string {
	if len(values) == 1 {
		return values[0]
	}
	return ""
}

type metadataCarrier map[string]string

func (c metadataCarrier) Get(k string) string { return c[k] }
func (c metadataCarrier) Set(k, v string)     { c[k] = v }
func (c metadataCarrier) Keys() []string      { return []string{"traceparent", "tracestate"} }
