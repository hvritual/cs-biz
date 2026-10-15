# O1-P1 目标与锁定验收：Yunka OTel → Collector → Trace 查询

Issue [#24](https://github.com/hvritual/cs-biz/issues/24)，父任务 [#19](https://github.com/hvritual/cs-biz/issues/19)，实现 PR [#25](https://github.com/hvritual/cs-biz/pull/25)；前置 P0 [#20](https://github.com/hvritual/cs-biz/issues/20)/[PR #21](https://github.com/hvritual/cs-biz/pull/21)。

## 目标

由用户明确批准推进 P1 的代码候选，必须把 P0 的 TraceID 传递升级为可以在后端 SDK Span、Collector、Jaeger 中按 TraceID 查询到的证据。**真实 Browser→BFF→租户业务与 SLS 属于后续阶段**。完成后停止并等待 Human 审核。

## 范围与门禁

| 字段 | 合同 |
| --- | --- |
| 最小输入 | P0 精确 head、Yunka 只读固定 SHA、Go1.25/OTel 1.45 依赖锁、TraceID/Client Parent Span |
| 实际输出 | Go 真实 SDK Span + 上下文记录，stdout JSON，OTLP → 本地 Collector → 可查 Jaeger 及自动安全正反例 |
| 允许改动 | P0 traceprobe 增量、Go module/工具链锁、`backend/deploy/observability` 本地配置、专项 CI/Test、文档 |
| 禁止改动 | 未授权修改 Authz/Access/营销业务、真实 IdP/BFF、外部 Yunka 仓库、生产密钥、SLS、Human Full Workflow |
| 受信边界 | TraceID、Origin、Baggage 不是授权凭据；身份默认不进入日志/Span |
| 前置审批 | 用户本轮的“开始下一阶段”仅授权 P1 实施；P0 未经 Human Full/正式合并不得认为进入 main |
| 后置审核 | 精确候选 SHA 的 Go/Race/Vet、Frontend Fast、P0回归、P1 Query、Scope 安全反例；Human-only Full 和独立 Merge 决策 |

## 验收 Case

- P1-01：固定 Go/Yunka/OTel 模块，Go Sum、`go mod tidy` 无差异；当前 P0 功能不回退；
- P1-02：Browser W3C Parent → Yunka SDK Server Span → Header / JSON Log 关联，一条 SDK Span 可在 Jaeger 中检索到并有正确父子关系；
- P1-03：成功与错误分别有 SDK Span 和固定错误码，无敏感信息暴露；
- P1-04：Collector 关闭时 terminal slog 仍可查、HTTP 返回不因 exporter 故障失效；未导出时不虚构 Trace 存在；
- P1-05：本地 Collector/Jaeger 端口仅 loopback，自动化真实启动，E2E 用 Jaeger 实际 Query，不只看模拟日志；
- P1-06：不触发 Human-only Full，保留独立审阅、合并及后续 P2 的审批。

## 实施证据

以 PR #25 精确 SHA 的 GitHub Actions 结果、Docker Collector Logs、Playwright 查询结果、Go 单测/Trace JSON 样例为准。任务文档的存在本身只说明设计，不能标注生产 Done。

**候选通过自动门禁后：WAITING_HUMAN_REVIEW / WAITING_HUMAN_FULL，不自动进入 P2 或可选 SLS。**
