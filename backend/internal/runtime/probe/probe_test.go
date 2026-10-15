package probe

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	runtimev1 "github.com/hvritual/cs-biz/backend/contracts/runtime/v1"
	"github.com/hvritual/cs-biz/backend/internal/platform/telemetry"
	collectorpb "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
)

func defaults(t *testing.T) {
	t.Helper()
	// Qualification must exercise exporter failures, not inherit a host's
	// production ratio sampler and silently produce zero sampled spans.
	t.Setenv("OTEL_TRACES_SAMPLER", "always_on")
	for _, key := range []string{"OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "OTEL_EXPORTER_OTLP_HEADERS", "OTEL_EXPORTER_OTLP_TRACES_HEADERS", "OTEL_EXPORTER_OTLP_METRICS_HEADERS", "OTEL_RESOURCE_ATTRIBUTES"} {
		t.Setenv(key, "")
	}
	t.Setenv("OTEL_TRACES_EXPORTER", "none")
	t.Setenv("OTEL_METRICS_EXPORTER", "none")
	t.Setenv("CS_BIZ_SHUTDOWN_TIMEOUT", "1s")
}
func call(t *testing.T, runtime *telemetry.Runtime, parent string) string {
	t.Helper()
	server, err := NewServer(runtime)
	if err != nil {
		t.Fatal(err)
	}
	listener, err := Listen("127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go func() { _ = server.Serve(listener) }()
	defer server.Stop()
	conn, err := grpc.NewClient(listener.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	ctx = metadata.NewOutgoingContext(ctx, metadata.Pairs("traceparent", parent, "authorization", "secret-token-marker", "cookie", "secret-session-marker", "baggage", "email=private-person-marker"))
	var header metadata.MD
	response, err := runtimev1.NewRuntimeServiceClient(conn).Inspect(ctx, &runtimev1.InspectRequest{}, grpc.Header(&header))
	if err != nil || response.Status != "ready" {
		t.Fatalf("probe result: %v %v", response, err)
	}
	values := header.Get("x-trace-id")
	if len(values) != 1 || len(values[0]) != 32 {
		t.Fatalf("trace context missing: %v", header)
	}
	return values[0]
}

func TestConsumerExporterModesAndPrivacy(t *testing.T) {
	for _, mode := range []string{"none", "otlp"} {
		t.Run(mode, func(t *testing.T) {
			defaults(t)
			var mu sync.Mutex
			var requests []*collectorpb.ExportTraceServiceRequest
			receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
				request := new(collectorpb.ExportTraceServiceRequest)
				if err := proto.Unmarshal(body, request); err != nil {
					http.Error(w, "invalid OTLP", 400)
					return
				}
				mu.Lock()
				requests = append(requests, request)
				mu.Unlock()
				w.Header().Set("Content-Type", "application/x-protobuf")
				_, _ = w.Write([]byte{})
			}))
			defer receiver.Close()
			t.Setenv("OTEL_TRACES_EXPORTER", mode)
			t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", receiver.URL)
			t.Setenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf")
			var output bytes.Buffer
			runtime, err := telemetry.New(context.Background(), &output)
			if err != nil {
				t.Fatal(err)
			}
			traceID := call(t, runtime, "00-11111111111111111111111111111111-2222222222222222-01")
			if traceID != "11111111111111111111111111111111" {
				t.Fatal("W3C parent lost")
			}
			if err := runtime.Close(context.Background()); err != nil {
				t.Fatal(err)
			}
			mu.Lock()
			defer mu.Unlock()
			spans := 0
			for _, request := range requests {
				for _, resource := range request.ResourceSpans {
					service := false
					for _, attr := range resource.Resource.Attributes {
						if attr.Key == "service.name" && attr.Value.GetStringValue() == "cs-biz-runtime" {
							service = true
						}
					}
					if !service {
						t.Fatal("service resource absent")
					}
					for _, scope := range resource.ScopeSpans {
						for _, span := range scope.Spans {
							if span.Name != "runtime.inspect" {
								t.Fatalf("unexpected operation: %s", span.Name)
							}
							spans++
						}
					}
				}
			}
			if mode == "none" && spans != 0 {
				t.Fatal("disabled exporter sent spans")
			}
			if mode == "otlp" && spans < 1 {
				t.Fatal("real Consumer emitted no OTLP span")
			}
			lines := strings.Split(strings.TrimSpace(output.String()), "\n")
			correlated := false
			for _, line := range lines {
				var row map[string]any
				if err := json.Unmarshal([]byte(line), &row); err != nil {
					t.Fatal(err)
				}
				if row["trace_id"] == traceID {
					correlated = true
				}
			}
			if !correlated {
				t.Fatalf("no correlated stdout: %s", output.String())
			}
			for _, forbidden := range []string{"secret-token-marker", "secret-session-marker", "private-person-marker"} {
				if strings.Contains(output.String(), forbidden) {
					t.Fatal("sensitive metadata leaked")
				}
			}
		})
	}
}

func TestCollectorUnavailableDoesNotBlockProbe(t *testing.T) {
	defaults(t)
	t.Setenv("OTEL_TRACES_EXPORTER", "otlp")
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:1")
	t.Setenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf")
	t.Setenv("OTEL_EXPORTER_OTLP_TIMEOUT", "100")
	t.Setenv("CS_BIZ_SHUTDOWN_TIMEOUT", "200ms")
	var output bytes.Buffer
	runtime, err := telemetry.New(context.Background(), &output)
	if err != nil {
		t.Fatal(err)
	}
	call(t, runtime, "invalid-parent")
	start := time.Now()
	if err := runtime.Close(context.Background()); err == nil {
		t.Fatalf("unreachable collector export must report failure; stdout=%s", output.String())
	}
	if time.Since(start) > time.Second {
		t.Fatal("cleanup exceeded deadline")
	}
	if !strings.Contains(output.String(), "operation.completed") {
		t.Fatal("stdout unavailable")
	}
	// A repeated provider Shutdown is safe after the first attempt.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	if err := runtime.Provider.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
}
func TestProbeRejectsRemoteListener(t *testing.T) {
	for _, address := range []string{"0.0.0.0:1234", ":1234", "example.com:80", "192.0.2.1:80", "127.0.0.1:not-a-port"} {
		listener, err := Listen(address)
		if err == nil {
			listener.Close()
			t.Fatalf("unsafe listener accepted: %s", address)
		}
	}
	if _, err := NewServer(nil); err == nil {
		t.Fatal("nil telemetry accepted")
	}
}
