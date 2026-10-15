// Package telemetry owns local Consumer telemetry configuration and bounded
// cleanup. The fixed Yunka Provider owns instrumentation; this package does not
// implement a second tracing SDK or expose production destinations.
package telemetry

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/url"
	"os"
	"sync/atomic"
	"time"

	"github.com/hvritual/yunka.io/framework/observability"
	"go.opentelemetry.io/otel"
)

type Runtime struct {
	Provider     *observability.Provider
	Timeout      time.Duration
	exportFailed atomic.Bool
}

// New permits only the local qualification exporters. Environment defaults are
// installed before constructing the SDK; credentials and identity are excluded.
func New(ctx context.Context, output io.Writer) (*Runtime, error) {
	for _, key := range []string{"OTEL_TRACES_EXPORTER", "OTEL_METRICS_EXPORTER"} {
		value := os.Getenv(key)
		if value == "" {
			value = "none"
			if err := os.Setenv(key, value); err != nil {
				return nil, err
			}
		}
		if value != "none" && value != "otlp" {
			return nil, fmt.Errorf("unsupported local exporter: %s", key)
		}
	}
	for _, key := range []string{"OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT"} {
		if value := os.Getenv(key); value != "" {
			endpoint, err := url.Parse(value)
			if err != nil || endpoint.User != nil || endpoint.RawQuery != "" || endpoint.Fragment != "" || (endpoint.Scheme != "http" && endpoint.Scheme != "https") {
				return nil, errors.New("invalid local telemetry endpoint")
			}
			ip := net.ParseIP(endpoint.Hostname())
			if ip == nil || !ip.IsLoopback() {
				return nil, errors.New("telemetry endpoint must use a loopback IP")
			}
		}
	}
	for _, key := range []string{"OTEL_EXPORTER_OTLP_HEADERS", "OTEL_EXPORTER_OTLP_TRACES_HEADERS", "OTEL_EXPORTER_OTLP_METRICS_HEADERS", "OTEL_RESOURCE_ATTRIBUTES"} {
		if os.Getenv(key) != "" {
			return nil, errors.New("credentials and arbitrary resource attributes are not allowed in local probe")
		}
	}
	timeout := 2 * time.Second
	if value := os.Getenv("CS_BIZ_SHUTDOWN_TIMEOUT"); value != "" {
		parsed, err := time.ParseDuration(value)
		if err != nil || parsed <= 0 || parsed > 10*time.Second {
			return nil, errors.New("shutdown timeout must be within (0,10s]")
		}
		timeout = parsed
	}
	config := observability.Config{ServiceName: env("OTEL_SERVICE_NAME", "cs-biz-runtime"), ServiceVersion: env("CS_BIZ_VERSION", "development"),
		InstanceID: env("CS_BIZ_INSTANCE", "local"), Environment: env("CS_BIZ_ENV", "development"), LogOutput: output, IncludeIdentity: false}
	startup, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	provider, err := observability.New(startup, config)
	if err != nil {
		return nil, errors.New("telemetry exporter configuration failed")
	}
	runtime := &Runtime{Provider: provider, Timeout: timeout}
	// This local process owns one Provider. Background batch-export errors do
	// not necessarily propagate through ForceFlush, so retain a sanitized state.
	otel.SetErrorHandler(otel.ErrorHandlerFunc(func(error) {
		runtime.exportFailed.Store(true)
		provider.Warn(context.Background(), "telemetry.export_failed", "exporter_status", "failed")
	}))
	return runtime, nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// Close shares one deadline across Flush and Shutdown, preserving export errors.
// Provider Shutdown is idempotent; callers must not run application work after it.
func (r *Runtime) Close(ctx context.Context) error {
	bounded, cancel := context.WithTimeout(ctx, r.Timeout)
	defer cancel()
	err := errors.Join(r.Provider.ForceFlush(bounded), r.Provider.Shutdown(bounded))
	if r.exportFailed.Load() {
		err = errors.Join(err, errors.New("background telemetry export failed"))
	}
	if err != nil {
		r.Provider.Warn(bounded, "telemetry.flush_failed", "exporter_status", "failed")
	}
	return err
}
