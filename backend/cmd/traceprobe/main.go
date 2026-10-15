// traceprobe is a development-only localhost qualification server.
// Do not mount it into any production backend or expose it on a public port.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hvritual/cs-biz/backend/internal/platform/traceprobe"
	"github.com/hvritual/yunka.io/framework/observability"
)

func main() {
	addr, err := traceprobe.LoopbackAddress(os.Getenv("CSBIZ_TRACE_PROBE_ADDR"))
	if err != nil {
		slog.Error("traceprobe.invalid_config", "error_code", "INVALID_LOOPBACK_BIND")
		os.Exit(1)
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if os.Getenv("OTEL_TRACES_EXPORTER") == "" {
		_ = os.Setenv("OTEL_TRACES_EXPORTER", "none")
	}
	if os.Getenv("OTEL_METRICS_EXPORTER") == "" {
		_ = os.Setenv("OTEL_METRICS_EXPORTER", "none")
	}
	provider, err := observability.New(context.Background(), observability.Config{
		ServiceName: "cs-biz-traceprobe",
		ServiceVersion: "o1-p1",
		Environment: "development",
		IncludeIdentity: false,
		InstallGlobal: false,
		LogOutput: os.Stdout,
	})
	if err != nil {
		logger.Error("traceprobe.otel_init_failed", "error_code", "OTEL_INIT_FAILED")
		os.Exit(1)
	}
	server := &http.Server{
		Addr:              addr,
		Handler:           traceprobe.NewHandlerWithOTel(os.Stdout, provider),
		ReadHeaderTimeout: 5 * time.Second,
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()
	logger.Info("traceprobe.started", "service.name", "cs-biz-traceprobe", "address", addr)
	serveErr := server.ListenAndServe()
	flushCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	if err := provider.ForceFlush(flushCtx); err != nil {
		logger.Warn("traceprobe.otel_flush_unavailable", "error_code", "OTEL_FLUSH_FAILED")
	}
	if err := provider.Shutdown(flushCtx); err != nil {
		logger.Warn("traceprobe.otel_shutdown_unavailable", "error_code", "OTEL_SHUTDOWN_FAILED")
	}
	cancel()
	if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
		logger.Error("traceprobe.failed", "error_code", "LISTENER_FAILED")
		os.Exit(1)
	}
}
