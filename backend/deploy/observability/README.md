# O1-P1 本地 OpenTelemetry Collector + Jaeger

> **仅本机开发与 CI 演示**，不得直接按此配置部署生产。该目录不包含 SLS、RAM 密钥、真实用户/企业业务数据或公网 Trace 查询入口。

## 固定版本与边界

- Go Consumer 依赖 `github.com/hvritual/yunka.io/framework` 的固定主源提交 `3527488325030fbf86fe52804140c936e9d937a4`；真实 Go 模块锁见 [go.mod](../../go.mod) / [go.sum](../../go.sum)；工具链 Go 1.25.13，OTel v1.45。
- 本地 Collector：`otel/opentelemetry-collector-contrib:0.153.0`；Trace 查询：`jaegertracing/jaeger:2.20.0`，内存数据重启即失效。
- 仅宿主机 `127.0.0.1:4318`（OTLP/HTTP）、`127.0.0.1:13133`（Collector Health）、`127.0.0.1:16686`（Jaeger UI/API）可访问。容器之间才访问 Jaeger 的 OTLP gRPC 端口。
- 本阶段不配置 SLS、不传送生产凭据、不接真实租户、身份或权限业务；TraceID 只是技术关联键，不能用作访问凭证。

## 本地运行

从仓库根目录：

```bash
docker compose -f backend/deploy/observability/compose.yaml up -d
curl -fsS http://127.0.0.1:13133/
curl -fsS http://127.0.0.1:16686/
```

在另一个终端：

```bash
cd backend
export OTEL_TRACES_EXPORTER=otlp
export OTEL_METRICS_EXPORTER=none
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
go run ./cmd/traceprobe
```

然后请求真实 Yunka OTel Span 路由（客户端 TraceID/SpanID 仅为本地样例）：

```bash
curl -i -H 'traceparent: 00-0123456789abcdef0123456789abcdef-0123456789abcdef-01' \
  http://127.0.0.1:8097/__dev/otel
curl -fsS http://127.0.0.1:16686/api/traces/0123456789abcdef0123456789abcdef
```

Jaeger 接收有批处理延时；实际自动验收会重试查询，验证 SDK 产生的 `spanID` 与 Client ParentSpan 在 Jaeger 中的关系，不只检查服务端日志和 HTTP 响应。UI 位于 http://127.0.0.1:16686 。

关闭环境：

```bash
docker compose -f backend/deploy/observability/compose.yaml down -v --remove-orphans
```

## 无 SLS / 离线降级

默认运行 `go run ./cmd/traceprobe` 时，如果未指定 `OTEL_TRACES_EXPORTER`，本地探针使用 `none`，仍会创建有实际 SDK 上下文的 SpanID 并在终端输出 `slog` JSON，但**不会导出可查询 Span**。

指定 `otlp` 但 Collector 不可达时，OpenTelemetry 异步 exporter 的采集可能丢失/延后；HTTP 与授权逻辑不依赖采集服务，stdout 日志继续。Go 单元测试覆盖离线终端日志，保留原 P0 浏览器测试及 localhost/CORS/身份安全反例。

**此处的 Jaeger 仅为本地无认证临时存储，且查询 API 属于开发演示接口**。生产 Traces 的采样、脱敏、跨租户访问控制、保留和可选 SLS 等由后续 O1-P2/P3 单独审批与落地。云端专项 E2E 不等于 Full 或生产资格。
