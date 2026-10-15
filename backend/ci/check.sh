#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
unset GOROOT
export GOWORK=off
test "$(go env GOVERSION)" = 'go1.26.9'
tools="$(mktemp -d)"
trap 'rm -rf "$tools"' EXIT
evidence="${RUNNER_TEMP:-/tmp}/cs-biz-backend-evidence"
mkdir -p "$evidence"

# F0-qualified external CLI bytes; no source rebuild or floating fallback.
python3 ci/consumer.py install --tools "$tools/yunka"
curl --fail --location --silent --show-error \
  https://github.com/protocolbuffers/protobuf/releases/download/v21.12/protoc-21.12-linux-x86_64.zip -o "$tools/protoc.zip"
echo '3a4c1e5f2516c639d3079b1586e703fc7bcfa2136d58bda24d1d54f949c315e8  '"$tools/protoc.zip" | sha256sum --check --status
unzip -q "$tools/protoc.zip" -d "$tools/protoc"
export GOBIN="$tools/bin"
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.11
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.6.2
go install golang.org/x/vuln/cmd/govulncheck@v1.7.0
export PATH="$tools/protoc/bin:$tools/bin:$PATH"
test "$(protoc --version)" = 'libprotoc 3.21.12'
test "$(protoc-gen-go --version)" = 'protoc-gen-go v1.36.11'
test "$(protoc-gen-go-grpc --version)" = 'protoc-gen-go-grpc 1.6.2'
python3 ci/consumer.py check --tools "$tools/yunka" --evidence "$evidence"
go build -mod=readonly ./...
go test -mod=readonly -count=1 -json ./... > "$evidence/go-tests.jsonl"
go vet -mod=readonly ./...
go test -mod=readonly -race -count=1 ./...
govulncheck ./... > "$evidence/govulncheck.txt"
python3 ci/trace_query.py "$evidence"
echo 'PASS: actual Consumer generation/source/dependency/assembly, build/unit/race/vet/security and queried local traces; no IAM/DB or production qualification.'
