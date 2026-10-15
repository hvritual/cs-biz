// runtime-probe is a loopback-only qualification process, not a business API.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	runtimev1 "github.com/hvritual/cs-biz/backend/contracts/runtime/v1"
	"github.com/hvritual/cs-biz/backend/internal/platform/telemetry"
	"github.com/hvritual/cs-biz/backend/internal/runtime/probe"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "runtime probe failed")
		os.Exit(1)
	}
}
func run() error {
	address := os.Getenv("CS_BIZ_PROBE_ADDRESS")
	if address == "" {
		address = "127.0.0.1:18081"
	}
	// Validate destination as well as listener; client mode cannot address remote services.
	if len(os.Args) > 1 && os.Args[1] == "inspect" {
		if err := probe.ValidateAddress(address); err != nil {
			return err
		}
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		connection, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			return err
		}
		defer connection.Close()
		var header metadata.MD
		result, err := runtimev1.NewRuntimeServiceClient(connection).Inspect(ctx, &runtimev1.InspectRequest{}, grpc.Header(&header))
		if err != nil {
			return err
		}
		return json.NewEncoder(os.Stdout).Encode(map[string]any{"status": result.Status, "trace_id": header.Get("x-trace-id"), "span_id": header.Get("x-span-id")})
	}
	telemetry, err := telemetry.New(context.Background(), os.Stdout)
	if err != nil {
		return err
	}
	listener, err := probe.Listen(address)
	if err != nil {
		_ = telemetry.Close(context.Background())
		return err
	}
	server, err := probe.NewServer(telemetry)
	if err != nil {
		_ = listener.Close()
		_ = telemetry.Close(context.Background())
		return err
	}
	done := make(chan error, 1)
	go func() { done <- server.Serve(listener) }()
	signals, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	select {
	case <-signals.Done():
	case err = <-done:
	}
	// Force Stop at the deadline even if GracefulStop has blocked on active RPCs.
	stopped := make(chan struct{})
	go func() { server.GracefulStop(); close(stopped) }()
	select {
	case <-stopped:
	case <-time.After(telemetry.Timeout):
		server.Stop()
	}
	_ = listener.Close()
	return errors.Join(err, telemetry.Close(context.Background()))
}
