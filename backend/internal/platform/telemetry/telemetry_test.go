package telemetry

import (
	"context"
	"io"
	"testing"
)

func TestInvalidEnvironmentFailsClosed(t *testing.T) {
	for _, test := range []struct{ key, value string }{
		{"OTEL_TRACES_EXPORTER", "sls"}, {"OTEL_METRICS_EXPORTER", "unknown"},
		{"CS_BIZ_SHUTDOWN_TIMEOUT", "0s"}, {"CS_BIZ_SHUTDOWN_TIMEOUT", "1m"},
		{"OTEL_EXPORTER_OTLP_ENDPOINT", "https://user:password@127.0.0.1:4318"},
		{"OTEL_EXPORTER_OTLP_ENDPOINT", "http://192.0.2.1:4318"},
		{"OTEL_EXPORTER_OTLP_HEADERS", "authorization=secret"}, {"OTEL_RESOURCE_ATTRIBUTES", "email=secret"},
	} {
		t.Run(test.key+test.value, func(t *testing.T) {
			t.Setenv("OTEL_TRACES_EXPORTER", "none")
			t.Setenv("OTEL_METRICS_EXPORTER", "none")
			t.Setenv(test.key, test.value)
			runtime, err := New(context.Background(), io.Discard)
			if err == nil {
				runtime.Close(context.Background())
				t.Fatal("unsafe environment accepted")
			}
		})
	}
}
