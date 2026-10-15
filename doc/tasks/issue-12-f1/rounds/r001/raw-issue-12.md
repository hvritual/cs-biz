> 父任务：https://github.com/hvritual/cs-biz/issues/10。状态：**PLANNED / NOT IMPLEMENTED**。该 Issue 仅授权分阶段规划与审查，不代表功能已开发/集成或可生产部署。

## 依赖
#10 + F0 设计/版本审批

## 目标与交付物
确定 backend Go 升级路径；引入锁定的 Yunka 模块版本、契约源与 .yunka/project.json/source-policy；将 proto→OperationPlan/OpenAPI/TS Client/Adapter/AssemblyPlan 生成纳入 backend/ci；保留现有前端与 Authz V2 仅作受控兼容。

## 明确不做
不将纯生成物视为业务 API、IAM/数据库完成；不改 generated 文件或消费浮动 main；不建两套 runtime。

## 必须通过的验收
Go build/test/vet、Yunka generate/check、二次生成零漂移、source/dependency/assembly 检查真实通过；若缺固定依赖发布则阻塞并给出消费锁。

## 修改范围与治理
建议修改路径：backend/**, backend/ci/**, 必需的 doc/contracts/**, doc/tasks/**。以独立冻结切片 + 独立 PR 实施；所有真实代码按仓库 `AGENTS.md`、`doc/ci/NO-STALL-GATES.md`、`doc/workflow/SDLC-ADOPTION.md` 控制。

## 证据与 Done
提交确切 Consumer/Yunka SHA、所有生成校验命令、Go/浏览器/真实 DB 正反例、CI 跑次、独立审阅、main 回读。不得把 source/Mock/旧 PR 测试当生产资格。未批准的身份/DB/工具链决策必须标注 BLOCKED 而不是猜默认。

## O1 可观测性基础切片（[Issue #19](https://github.com/hvritual/cs-biz/issues/19)）

**F1 输出**：在 Yunka 固定 Consumer 中复用 `framework/observability.Provider`，以 `slog` JSON stdout 为默认日志，操作/服务资源字段统一；接入本地可查询 OTel Collector/Trace Backend，所有配置由部署环境提供，SLS 默认关闭且不是服务启动依赖。确定进程 Shutdown/Flush 有界行为。

**F1 验收**：OTLP exporter 开关与 collector 可用/不可用均有明确结果；终端始终可读 `trace_id` 关联日志（存在有效 Trace Context 时），禁 Token/Session/PII；可在本地按 TraceID 找到 span。不能把 Yunka 框架自身测试冒充 cs-biz Consumer 连通性。
