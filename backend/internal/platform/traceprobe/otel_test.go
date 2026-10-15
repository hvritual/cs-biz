package traceprobe

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/hvritual/yunka.io/framework/observability"
)

func testYunkaProvider(t *testing.T, output *bytes.Buffer) *observability.Provider {
	t.Helper()
	t.Setenv("OTEL_TRACES_EXPORTER", "none")
	t.Setenv("OTEL_METRICS_EXPORTER", "none")
	p, err := observability.New(context.Background(), observability.Config{
		ServiceName: "cs-biz-traceprobe-test",
		Environment: "test",
		LogOutput: output,
		IncludeIdentity: false,
		InstallGlobal: false,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = p.Shutdown(context.Background()) })
	return p
}

func TestYunkaSpanAndStructuredLogHaveTheSameID(t *testing.T) {
	for _, tc := range []struct{ path string; status int; fail bool }{
		{path: "/__dev/otel", status: http.StatusOK},
		{path: "/__dev/otel/failure", status: http.StatusInternalServerError, fail: true},
	} {
		t.Run(tc.path, func(t *testing.T) {
			var out bytes.Buffer
			p := testYunkaProvider(t, &out)
			handler := NewHandlerWithOTel(&out, p)
			req := requestFor(tc.path + "?password=do-not-record")
			req.Header.Set("traceparent", validParent)
			req.Header.Set("Cookie", "secret-session")
			req.Header.Set("Authorization", "Bearer secret-token")
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			if res.Code != tc.status {
				t.Fatalf("status=%d, body=%s", res.Code, res.Body.String())
			}
			var data map[string]any
			if err := json.Unmarshal(res.Body.Bytes(), &data); err != nil {
				t.Fatal(err)
			}
			traceID, _ := data["traceId"].(string)
			spanID, _ := data["spanId"].(string)
			if traceID != "0123456789abcdef0123456789abcdef" ||
				spanID == "0123456789abcdef" || spanID == strings.Repeat("0",16) ||
				len(spanID) != 16 || res.Header().Get("X-Span-ID") != spanID ||
				res.Header().Get("X-Trace-ID") != traceID {
				t.Fatalf("incorrect Yunka span identity: %v", data)
			}
			logged := out.String()
			if !strings.Contains(logged, "\"trace_id\":\""+traceID+"\"") ||
				!strings.Contains(logged, "\"span_id\":\""+spanID+"\"") ||
				!strings.Contains(logged, "\"parent_span_id\":\"0123456789abcdef\"") ||
				!strings.Contains(logged, "\"operation\":\"observability.traceprobe.otel\"") ||
				!strings.Contains(logged, "\"msg\":\"operation.completed\"") {
				t.Fatalf("missing Yunka span/operation evidence: %s", logged)
			}
			if tc.fail && !strings.Contains(logged, "\"error_code\":\"TRACE_PROBE_FAILURE\"") {
				t.Fatalf("missing stable failure: %s", logged)
			}
			for _, secret := range []string{"do-not-record", "secret-session", "secret-token"} {
				if strings.Contains(logged, secret) {
					t.Fatalf("request secret leaked into stdout: %s", logged)
				}
			}
		})
	}
}

func TestYunkaInvalidTraceAndRemoteCallFailClosed(t *testing.T) {
	var out bytes.Buffer
	p := testYunkaProvider(t, &out)
	handler := NewHandlerWithOTel(&out, p)
	r := requestFor("/__dev/otel")
	r.Header.Set("traceparent", "00-00000000000000000000000000000000-0123456789abcdef-01")
	r.Header.Set("X-Trace-ID", "forged-id")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)
	if w.Code != http.StatusOK || len(w.Header().Get("X-Trace-ID")) != 32 ||
		w.Header().Get("X-Trace-ID") == "forged-id" {
		t.Fatalf("invalid parent did not establish independent root span: %d", w.Code)
	}
	remote := requestFor("/__dev/otel")
	remote.RemoteAddr = "192.0.2.77:1234"
	w = httptest.NewRecorder()
	handler.ServeHTTP(w, remote)
	if w.Code != http.StatusForbidden {
		t.Fatalf("external client not rejected: %d", w.Code)
	}
	origin := requestFor("/__dev/otel")
	origin.Header.Set("Origin", "https://untrusted.example")
	w = httptest.NewRecorder()
	handler.ServeHTTP(w, origin)
	if w.Code != http.StatusForbidden {
		t.Fatalf("foreign origin not rejected: %d", w.Code)
	}
}


// A failed telemetry destination cannot be allowed to turn a business-safe
// HTTP response into a failed request, or suppress the required stdout log.
// Export failure is an operational signal, not a gateway auth decision.
func TestUnavailableCollectorPreservesHTTPAndStdout(t *testing.T) {
	t.Setenv("OTEL_TRACES_EXPORTER", "otlp")
	t.Setenv("OTEL_METRICS_EXPORTER", "none")
	t.Setenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf")
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:1")
	t.Setenv("OTEL_EXPORTER_OTLP_TIMEOUT", "1000")
	t.Setenv("OTEL_BSP_SCHEDULE_DELAY", "100")

	var output bytes.Buffer
	p, err := observability.New(context.Background(), observability.Config{
		ServiceName: "cs-biz-traceprobe-offline-test",
		Environment: "test",
		LogOutput: &output,
		IncludeIdentity: false,
		InstallGlobal: false,
	})
	if err != nil {
		t.Fatalf("collector outage must not block provider startup: %v", err)
	}
	req := requestFor("/__dev/otel")
	req.Header.Set("traceparent", validParent)
	rec := httptest.NewRecorder()
	NewHandlerWithOTel(&output, p).ServeHTTP(rec, req)
	if rec.Code != http.StatusOK || rec.Header().Get("X-Trace-ID") != "0123456789abcdef0123456789abcdef" {
		t.Fatalf("collector outage changed HTTP outcome: %d", rec.Code)
	}
	if !strings.Contains(output.String(), "\"msg\":\"traceprobe.otel.success\"") ||
		!strings.Contains(output.String(), "\"trace_id\":\"0123456789abcdef0123456789abcdef\"") {
		t.Fatalf("stdout trace lost without collector: %s", output.String())
	}
	closeCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	// A bounded failure during flush is expected; it cannot erase stdout or
	// retroactively change the already-committed HTTP response.
	_ = p.Shutdown(closeCtx)
}
