package traceprobe

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const validParent = "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01"

func requestFor(path string) *http.Request {
	request := httptest.NewRequest(http.MethodGet, path, nil)
	request.RemoteAddr = "127.0.0.1:55555"
	return request
}

func logFields(t *testing.T, output *bytes.Buffer) map[string]any {
	t.Helper()
	scanner := bufio.NewScanner(bytes.NewReader(output.Bytes()))
	if !scanner.Scan() {
		t.Fatal("missing JSON stdout record")
	}
	var entry map[string]any
	if err := json.Unmarshal(scanner.Bytes(), &entry); err != nil {
		t.Fatalf("invalid JSON stdout: %v", err)
	}
	return entry
}

func TestTraceparentValidationAndFreshTrace(t *testing.T) {
	parent, ok := parseTraceparent(validParent)
	if !ok || parent.traceID != "0123456789abcdef0123456789abcdef" || parent.spanID != "0123456789abcdef" {
		t.Fatalf("valid W3C parent rejected: %+v", parent)
	}
	for _, raw := range []string{
		"", "00-0123", strings.ToUpper(validParent),
		"ff-0123456789abcdef0123456789abcdef-0123456789abcdef-01",
		"00-00000000000000000000000000000000-0123456789abcdef-01",
		"00-0123456789abcdef0123456789abcdef-0000000000000000-01",
		"00-0123456789abcdef0123456789abcdef-0123456789abcdef-zz",
	} {
		if _, ok := parseTraceparent(raw); ok {
			t.Errorf("accepted malformed parent %q", raw)
		}
	}
	out := &bytes.Buffer{}
	handler := NewHandler(out)
	request := requestFor("/__dev/trace")
	request.Header.Set("traceparent", "bad-parent")
	request.Header.Set("X-Trace-ID", "forged-id-not-authority")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	got := response.Header().Get("X-Trace-ID")
	if response.Code != http.StatusOK || len(got) != 32 || got == strings.Repeat("0", 32) ||
		got == "forged-id-not-authority" {
		t.Fatalf("invalid header must produce a fresh valid trace: %d %s", response.Code, got)
	}
	entry := logFields(t, out)
	if entry["trace_id"] != got || entry["parent_span_id"] != "" {
		t.Fatalf("incorrect root trace fields: %+v", entry)
	}
}

func TestBrowserParentServerChildJSONAndFailure(t *testing.T) {
	for _, testCase := range []struct {
		route  string
		status int
		code   string
	}{
		{"/__dev/trace", http.StatusOK, ""},
		{"/__dev/trace/failure", http.StatusInternalServerError, "TRACE_PROBE_FAILURE"},
	} {
		t.Run(testCase.route, func(t *testing.T) {
			output := &bytes.Buffer{}
			handler := NewHandler(output)
			request := requestFor(testCase.route + "?access_token=secret-in-url")
			request.Header.Set("traceparent", validParent)
			request.Header.Set("Authorization", "Bearer secret-auth")
			request.Header.Set("Cookie", "session=secret-cookie")
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != testCase.status || response.Header().Get("X-Trace-ID") != "0123456789abcdef0123456789abcdef" {
				t.Fatalf("response: %d %s", response.Code, response.Body.String())
			}
			serverSpan := response.Header().Get("X-Span-ID")
			if len(serverSpan) != 16 || serverSpan == "0123456789abcdef" || serverSpan == strings.Repeat("0", 16) {
				t.Fatalf("invalid server child span: %q", serverSpan)
			}
			var body struct {
				TraceID string `json:"traceId"`
				SpanID  string `json:"spanId"`
				Code    string `json:"code"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if body.TraceID != response.Header().Get("X-Trace-ID") || body.SpanID != serverSpan || body.Code != testCase.code {
				t.Fatalf("body and header mismatch: %+v", body)
			}
			log := logFields(t, output)
			if log["trace_id"] != body.TraceID || log["span_id"] != body.SpanID ||
				log["parent_span_id"] != "0123456789abcdef" || log["operation_id"] != operationID ||
				log["status"] != float64(testCase.status) || log["error_code"] != testCase.code {
				t.Fatalf("JSON log and W3C trace mismatch: %+v", log)
			}
			if strings.Contains(output.String(), "secret") || strings.Contains(output.String(), "Authorization") ||
				strings.Contains(output.String(), "session=") {
				t.Fatal("sensitive data reached structured stdout")
			}
		})
	}
}

func TestLoopbackOnlyAndExplicitCORS(t *testing.T) {
	for _, addr := range []string{"0.0.0.0:8097", ":8097", "example.com:8097", "127.0.0.1:0", "[::]:8097"} {
		if _, err := LoopbackAddress(addr); err == nil {
			t.Errorf("unsafe bind allowed: %q", addr)
		}
	}
	if addr, err := LoopbackAddress(""); err != nil || addr != DefaultAddress {
		t.Fatalf("unexpected default %s / %v", addr, err)
	}

	handler := NewHandler(&bytes.Buffer{})
	disallowed := requestFor("/__dev/trace")
	disallowed.Header.Set("Origin", "https://untrusted.example")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, disallowed)
	if response.Code != http.StatusForbidden || response.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("unexpected cross-origin admission: %d", response.Code)
	}

	remote := requestFor("/__dev/trace")
	remote.RemoteAddr = "192.0.2.7:4000"
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, remote)
	if response.Code != http.StatusForbidden {
		t.Fatalf("unexpected remote admission: %d", response.Code)
	}

	preflight := httptest.NewRequest(http.MethodOptions, "/__dev/trace", nil)
	preflight.RemoteAddr = "127.0.0.1:4000"
	preflight.Header.Set("Origin", "http://127.0.0.1:5777")
	preflight.Header.Set("Access-Control-Request-Method", "GET")
	preflight.Header.Set("Access-Control-Request-Headers", "traceparent")
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, preflight)
	if response.Code != http.StatusNoContent ||
		response.Header().Get("Access-Control-Allow-Origin") != "http://127.0.0.1:5777" ||
		!strings.Contains(response.Header().Get("Access-Control-Allow-Headers"), "traceparent") {
		t.Fatalf("allowed local preflight failed: %d %+v", response.Code, response.Header())
	}
	preflight.Header.Set("Access-Control-Request-Headers", "authorization, traceparent")
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, preflight)
	if response.Code != http.StatusForbidden {
		t.Fatalf("unsafe preflight headers accepted: %d", response.Code)
	}
	unknown := requestFor("/api/customers")
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, unknown)
	if response.Code != http.StatusNotFound {
		t.Fatalf("business routes must not be fabricated: %d", response.Code)
	}
}
