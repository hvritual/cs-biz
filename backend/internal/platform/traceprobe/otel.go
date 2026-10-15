package traceprobe

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/hvritual/yunka.io/framework/core/runtimecontext"
	"github.com/hvritual/yunka.io/framework/observability"
	"go.opentelemetry.io/otel/trace"
)

// A bounded W3C carrier may propagate tracing, never identity or access grants.
type safeTraceCarrier struct{ parent string }

func (c safeTraceCarrier) Get(k string) string {
	if k == "traceparent" {
		return c.parent
	}
	return ""
}
func (safeTraceCarrier) Set(string, string) {}
func (safeTraceCarrier) Keys() []string { return []string{"traceparent"} }

// runWithOTel creates a real SDK span; its span ID, not a locally fabricated
// placeholder, is returned and exported to the configured Collector.
func runWithOTel(provider *observability.Provider, fail bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		parent, valid := parseTraceparent(r.Header.Get("traceparent"))
		ctx := r.Context()
		if valid {
			ctx = observability.Extract(ctx, safeTraceCarrier{parent: r.Header.Get("traceparent")})
		}
		ctx = runtimecontext.WithMetadata(ctx, runtimecontext.Metadata{
			Transport: "http",
			Protocol: "http",
			Route: "/__dev/otel",
			Operation: "observability.traceprobe.otel",
		})
		_ = provider.Middleware()(func(child context.Context) error {
			sc := trace.SpanFromContext(child).SpanContext()
			if !sc.IsValid() {
				http.Error(w, "unavailable", http.StatusServiceUnavailable)
				return errors.New("TRACE_CONTEXT_UNAVAILABLE")
			}
			traceID, spanID, parentID := sc.TraceID().String(), sc.SpanID().String(), ""
			if valid {
				parentID = parent.spanID
			}
			status, code := http.StatusOK, ""
			if fail {
				status, code = http.StatusInternalServerError, "TRACE_PROBE_FAILURE"
			}
			w.Header().Set("X-Trace-ID", traceID)
			w.Header().Set("X-Span-ID", spanID)
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Cache-Control", "no-store")
			w.WriteHeader(status)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"traceId": traceID,
				"spanId": spanID,
				"ok": !fail,
				"code": code,
			})
			// No query, raw headers, credentials, PII, or request body in logs.
			if fail {
				provider.Error(child, "traceprobe.otel.failure",
					"error_code", code, "status", status, "parent_span_id", parentID)
				return errors.New("TRACE_PROBE_FAILURE")
			}
			provider.Info(child, "traceprobe.otel.success",
				"error_code", code, "status", status, "parent_span_id", parentID)
			return nil
		})(ctx)
	}
}
