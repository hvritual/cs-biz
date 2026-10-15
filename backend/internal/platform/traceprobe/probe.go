// Package traceprobe provides a loopback-only transport qualification probe.
// It is NOT an OpenTelemetry SDK, a production endpoint or an identity provider.
// Yunka's OpenTelemetry runtime is the target for production instrumentation.
package traceprobe

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	// DefaultAddress never exposes the anonymous development probe externally.
	DefaultAddress = "127.0.0.1:8097"
	operationID    = "observability.traceprobe"
)

type traceParent struct {
	traceID string
	spanID  string
	flags   string
}

// Only W3C traceparent version 00 is admitted at this bounded bridge.
// Reject zero IDs, malformed lengths and unsupported versions; never promote
// trace headers, baggage or an X-Trace-ID into authentication authority.
func parseTraceparent(value string) (traceParent, bool) {
	if len(value) != 55 || value[:3] != "00-" || value[35] != '-' || value[52] != '-' {
		return traceParent{}, false
	}
	traceID, errTrace := hex.DecodeString(value[3:35])
	parentID, errSpan := hex.DecodeString(value[36:52])
	flags, errFlags := hex.DecodeString(value[53:55])
	if errTrace != nil || errSpan != nil || errFlags != nil ||
		allZero(traceID) || allZero(parentID) || len(flags) != 1 {
		return traceParent{}, false
	}
	return traceParent{traceID: hex.EncodeToString(traceID), spanID: hex.EncodeToString(parentID), flags: value[53:55]}, true
}

func allZero(bytes []byte) bool {
	if len(bytes) == 0 {
		return true
	}
	for _, b := range bytes {
		if b != 0 {
			return false
		}
	}
	return true
}

func newNonZeroID(length int) (string, error) {
	bytes := make([]byte, length)
	for attempts := 0; attempts < 3; attempts++ {
		if _, err := rand.Read(bytes); err != nil {
			return "", err
		}
		if !allZero(bytes) {
			return hex.EncodeToString(bytes), nil
		}
	}
	return "", errors.New("traceprobe: secure randomness returned zero IDs")
}

// LoopbackAddress must be applied before ListenAndServe; no wildcard binding,
// hostname fallback or arbitrary external destination is supported.
func LoopbackAddress(configured string) (string, error) {
	if configured == "" {
		configured = DefaultAddress
	}
	host, port, err := net.SplitHostPort(configured)
	if err != nil {
		return "", errors.New("traceprobe: invalid listen address")
	}
	ip := net.ParseIP(host)
	p, err := strconv.Atoi(port)
	if ip == nil || !ip.IsLoopback() || err != nil || p < 1 || p > 65535 {
		return "", errors.New("traceprobe: only explicit loopback IP and TCP port are allowed")
	}
	return net.JoinHostPort(ip.String(), strconv.Itoa(p)), nil
}

func allowedOrigin(origin string) bool {
	return origin == "http://127.0.0.1:5777" || origin == "http://127.0.0.1:5778"
}
func allowedPath(path string) bool {
	return path == "/__dev/trace" || path == "/__dev/trace/failure" || path == "/__dev/ready"
}
func isLoopbackRemote(remoteAddr string) bool {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return false
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// NewHandler intentionally exposes only non-business, non-authenticated probe
// routes. The production API server must never mount this handler.
func NewHandler(output io.Writer) http.Handler {
	if output == nil {
		output = os.Stdout
	}
	logger := slog.New(slog.NewJSONHandler(output, &slog.HandlerOptions{Level: slog.LevelInfo})).
		With(slog.String("service.name", "cs-biz-traceprobe"))

	run := func(fail bool) http.HandlerFunc {
		return func(w http.ResponseWriter, request *http.Request) {
			start := time.Now()
			parent, hasParent := parseTraceparent(request.Header.Get("traceparent"))
			traceID := parent.traceID
			if !hasParent {
				var err error
				traceID, err = newNonZeroID(16)
				if err != nil {
					http.Error(w, "unavailable", http.StatusServiceUnavailable)
					return
				}
			}
			spanID, err := newNonZeroID(8)
			if err != nil {
				http.Error(w, "unavailable", http.StatusServiceUnavailable)
				return
			}
			// Extremely unlikely collision still must not construct a self-parent.
			if hasParent && spanID == parent.spanID {
				spanID, err = newNonZeroID(8)
				if err != nil {
					http.Error(w, "unavailable", http.StatusServiceUnavailable)
					return
				}
			}
			parentSpanID := ""
			if hasParent {
				parentSpanID = parent.spanID
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
			_ = json.NewEncoder(w).Encode(struct {
				TraceID string `json:"traceId"`
				SpanID  string `json:"spanId"`
				Code    string `json:"code,omitempty"`
				OK      bool   `json:"ok"`
			}{TraceID: traceID, SpanID: spanID, Code: code, OK: !fail})

			level := slog.LevelInfo
			if fail {
				level = slog.LevelError
			}
			// Fixed-route and stable codes only. No URL query, body, auth header,
			// cookie, identity, credentials or unbounded client attributes.
			logger.LogAttrs(request.Context(), level, "traceprobe.completed",
				slog.String("trace_id", traceID),
				slog.String("span_id", spanID),
				slog.String("parent_span_id", parentSpanID),
				slog.String("operation_id", operationID),
				slog.Int("status", status),
				slog.String("error_code", code),
				slog.Float64("duration_ms", float64(time.Since(start).Microseconds())/1000),
			)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /__dev/ready", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusNoContent)
	})
	mux.HandleFunc("GET /__dev/trace", run(false))
	mux.HandleFunc("GET /__dev/trace/failure", run(true))
	return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		// Defense in depth even if a caller accidentally binds another listener.
		if !isLoopbackRemote(request.RemoteAddr) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		origin := request.Header.Get("Origin")
		if origin != "" {
			if !allowedOrigin(origin) {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Expose-Headers", "X-Trace-ID, X-Span-ID")
		}
		if request.Method == http.MethodOptions {
			if !allowedPath(request.URL.Path) || origin == "" ||
				request.Header.Get("Access-Control-Request-Method") != http.MethodGet ||
				strings.ToLower(strings.TrimSpace(request.Header.Get("Access-Control-Request-Headers"))) != "traceparent" {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "traceparent")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, request)
	})
}
