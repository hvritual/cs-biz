# O1-P1：Yunka 真正的 OpenTelemetry Span 到可查询 Trace Backend

**状态：独立候选、等待 Human Review/Full；未合并、未部署。**

主任务 [#19](https://github.com/hvritual/cs-biz/issues/19)、实施切片 [#24](https://github.com/hvritual/cs-biz/issues/24)、提交 [PR #25](https://github.com/hvritual/cs-biz/pull/25)。本 PR 以 [P0 PR #21](https://github.com/hvritual/cs-biz/pull/21) 未合并的精确 Head 为基线，禁止直接视为 main 已拥有 P0。

## 技术事实与实现

- 仅为原有 `traceprobe` 增加 `/__dev/otel`、`/__dev/otel/failure`。保留 P0 `/__dev/trace`、`/__dev/trace/failure` 的所有回归及本机来源限制；没有业务 API 或身份/租户信息。
- `Yunka framework/observability.Provider` 持有真正 SDK TracerProvider、Span 创建、`slog` JSON 和 OTLP exporter。新的 `X-Trace-ID/X-Span-ID` 来自 SDK 创建的 SpanContext，**不等于** P0 仅随机生成的未导出 SpanID。
- 业务代码不自建独立 TracerProvider，不继承任何客户端 Principal。只从已校验的版本 00 `traceparent` 提取追踪上下文，不信任来自 HTTP 的账户/租户/角色或 `X-Trace-ID`。
- SDK 通过 `OTEL_TRACES_EXPORTER` 等标准环境变量配置 exporter，默认该本机工具 `none`。`OTEL_TRACES_EXPORTER=otlp` 时经 [本地 Collector/Jaeger](../deploy/observability/README.md) 存储并可按 TraceID 查到已导出的 Span。
- Provider 的根执行日志和固定响应日志都带一致 `trace_id/span_id` 与 `operation_id`。出错用固定 `TRACE_PROBE_FAILURE` 记录状态，不包含查询参数、Cookie、Token、Secret 或租户等敏感值。日志默认 `stdout`，没有 SLS 依赖。
- 仅为跨端可执行 P1 测试升级 backend Go 1.25.13 并固定 Yunka `352748832503...` 以及 OTel 1.45 和全部 Go module checksum。没有引入 Yunka Application/Assembly/IAM 生产运行时。

## 实际验收与未完成

P1-PASS 要求同一候选 SHA 的 Go 测试、`go mod tidy` 无漂移、前端 Fast、P0 回归、Collector+Jaeger 查询及一个浏览器 E2E。专项 E2E 必须查询 Collector 转发后的 Jaeger `/api/traces/{traceId}`，同时验证成功和预期故障的 SDK Span、Operation、ParentSpan。仅 HTTP 响应头或 stdout 相同不能证明导出。

**排除**：真实 BFF/营销/CRM/Domain API；前端 SDK 的真实浏览器 Span Exporter；RPC/Outbox/Worker；TraceAnalyzer 生产查询服务；SLS/生产监控与数据保留配置。后续功能必须重新获得 Human 审批，P1 不能冒充 O1 整体完成。

**人工门禁**：仓库的 `doc/ci/HUMAN-FULL-CONTROL.md` 要求由 Human 从 main 手动发起 Full，并获取准确候选 SHA 的收据；P0 仍未合并。P1 阶段只能在独立 PR Ready 后请求 Human 审核，不能自动合并、上线或开始 P2。
