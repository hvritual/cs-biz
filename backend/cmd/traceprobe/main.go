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
)

func main() {
	addr, err := traceprobe.LoopbackAddress(os.Getenv("CSBIZ_TRACE_PROBE_ADDR"))
	if err != nil {
		slog.Error("traceprobe.invalid_config", "error_code", "INVALID_LOOPBACK_BIND")
		os.Exit(1)
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	server := &http.Server{
		Addr:              addr,
		Handler:           traceprobe.NewHandler(os.Stdout),
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
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("traceprobe.failed", "error_code", "LISTENER_FAILED")
		os.Exit(1)
	}
}
