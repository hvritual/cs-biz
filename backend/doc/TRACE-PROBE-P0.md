# O1-P0：本地 Trace 传递与 JSON 终端日志

> 本文仅记录 Issue #20 第一阶段的可运行验证入口，并不代表生产 Yunka OpenTelemetry、真实 SaaS API、Trace 存储或 SLS 已接入。

## 范围

- 仅使用 Go 1.23 标准库启动 loopback HTTP 探针：从 backend 目录执行 `go run ./cmd/traceprobe`，默认地址 `127.0.0.1:8097`；`CSBIZ_TRACE_PROBE_ADDR` 只能配置显式 loopback IP 和非零 TCP 端口。
- 固定路由为 `GET /__dev/ready`、`GET /__dev/trace`、`GET /__dev/trace/failure`；服务没有租户、客户、营销或角色数据，没有任何真实业务写入。
- 前端使用 `frontend/apps/console/src/platform/trace-request.ts` 以 Web Crypto 生成 W3C `traceparent`。后端验证版本 00、合法非零 ID，生成独立服务端 span ID，并通过响应头 `X-Trace-ID`、`X-Span-ID` 和 JSON body 回传。
- 默认 `slog` JSON stdout 记录固定 `trace_id`、`span_id`、`parent_span_id`、`operation_id`、`status`、`error_code` 和 `duration_ms`；不记录 URL query、请求体、Cookie、Authorization 或身份内容。
- 非本地来源、异常 Origin、额外跨域头、非允许路由被拒；本地浏览器 Origin 仅 127.0.0.1:5777/5778。该诊断服务禁止部署为公网入口。

## 最小可复现实验

```sh
cd backend
go test -race -count=1 ./internal/platform/traceprobe/...
go run ./cmd/traceprobe
```

第二终端执行：

```sh
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm check:fast
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e:trace
```

Playwright 的独立配置会自动启动 Vite dev 和本机 Go 服务，因此执行定向测试时不要同时占用默认端口。CI `Observability Trace Targeted` 只执行这一个新跨端测试，而不是全面浏览器测试。正式 Full 必须由用户本人依据 `doc/ci/HUMAN-FULL-CONTROL.md` 在 GitHub Actions 手动发起。

## 真实能力边界

这是 W3C Trace Context **传输兼容**、父子 Span 标识关联和终端日志的最小闭环。它没有 OpenTelemetry TracerProvider、Span Exporter、Collector、TraceAnalyzer、SLS 或生产会话和 BFF；仅凭生成 trace_id/span_id 不可宣称可在 Trace 后端搜索真实 Span。真正的 Yunka/Collector/可查询 Trace 后端属于经人工评审批准后的下一阶段。

排障不能以 TraceID 替代访问控制、资源授权或业务结果凭据。业务执行成功/失败仍以真实业务回执读回为准。
