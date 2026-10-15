## 目标和交付原则

在保留 `cs-biz` 的 Menu / Function / Data 三权业务语义、独立营销准入、每标签页 Workspace Context 的前提下，将 Go 后端的 **Operation 合同、受保护执行、事务/幂等、模块装配与生成检查** 有条件迁入 `Yunka.io`。

本 Issue 是**规划/任务跟踪权威**，不表示框架已经接入、生产 IAM 已完成或批准部署。

## 冻结来源（2026-10-15）

- `cs-biz main@f088a90fd5a0305cc00a5679e368306dce62167f`：Go 1.23 的独立 `backend/internal/platform/authz` V2 基础库，真实 IdP/BFF/IAM/DB 未实现。
- [身份旅程 PR #7](https://github.com/hvritual/cs-biz/pull/7) `d257fa8c...`：候选通过，但当前仍未合并。
- [三权候选 PR #8](https://github.com/hvritual/cs-biz/pull/8) `6d391604...`：20 个浏览器用例通过、1 跳过，当前未合并且依赖 #7；此证据**不能**证明真实登录/DB。
- `Yunka main@3527488325030fbf86fe52804140c936e9d937a4`：typed PB Operation → generated OperationPlan/REST/gRPC/TS → Gateway Authorizer → OperationGuard → Executor/ExecutionScope；工具链锁 Go 1.25.13 / protoc 3.21.12。需锁定具体消费版本，不直接追踪浮动 main。

## 权威边界（Hard Gates）

1. Console **MenuGrant** 仅决定后台页面／路由是否可见；无菜单但有营销 Function 的成员仍能使用营销 API。业务 API 不检查 MenuGrant。
2. **Function** 通过 Yunka canonical typed PB Operation 声明，`gateway/authz.GrantResolver` 只读取 `cs-biz Access` 当前 Membership/Role/Permission/Scope；**不复制 Yunka legacy 角色数据库**。
3. **Data**：`OperationGuard` 将经过 Function 授权的 opaque Grants 解释为 cs-biz 业务 Scope，Domain 在 SQL/写入、导出、分页、统计中强制 `Tenant AND Scope`；禁止 `group => assigned/tenant` 隐式映射。
4. 单个生产 Operation 只能有一条可用授权执行链路；旧 `HTTPRouter` 与 Yunka Gateway 仅能通过影子/负例迁移，不能双重放行；移除旧入口需要覆盖和回滚证明。
5. IdP/BFF/账号和 per-tab Tenant、Platform/Human/Service/Worker 身份受信映射属于 cs-biz；客户端 userId/tenantId、空 Tenant 不产生权限。
6. `ApplicationAvailability` 与 IAM 解耦；Yunka root UoW/幂等抑制重复执行但**不承诺响应重放**，业务回执/审计/结果读回由 Domain 定义。
7. 现有 Vue/Vben/Element Plus Desktop 与 Skills/No-Stall CI 不回退；Yunka 生成物不可手改，必须二次 generate/check 零漂移。

## 阶段 F0–F6 与独立切片

- **F0** 事实与契约冻结：PR #7/#8、身份/三权正反例和 ADR、工具链/依赖差异；范围审批。
- **F1** 固定版本的 Yunka compiler/assembly 接入，签名化来源、兼容与零漂移；不得宣称可用认证。
- **F2** 营销无 Console Menu 的真实 Operation 纵向试点：PB/REST、Access GrantResolver/Scope Guard、本人数据与负例；不能形成双授权入口。
- **F3** Access + Session 真实持久化：Account、Tenant/Membership、Role/Menu/Function+Scope，IdP/BFF/CSRF、独立标签页工作区、撤权。
- **F4** Domain 查询权限：客户/营销真实 DB 资源级范围、列表/写入/导出/批量/统计；由领域负责。
- **F5** 所有目标 Operation 统一执行路径：HTTP/gRPC/Worker/内部子操作覆盖、移除旧 Router、回滚与消费者兼容。
- **F6** Production：真实 MySQL、SLO、安全、事务/幂等/Outbox/Readback、并发、恢复、独立审查与显式发布审批。

**MVP = F0–F3 的一条可验证业务纵向链；Full Runtime = F4–F5；Production = F6。**
按阶段独立 PR，后续 Issue 将挂接本路线。

## 完整 Done Gate

完整业务完成不仅要求界面显示，还要求真 IdP/BFF+持久 Access+Yunka Gateway/Executor+真实数据库、操作级 Function 权限和数据范围、跨租户安全、模块关闭及动态撤权、lost-reply 读回、部署/回滚证据。任何仅 Mock、Go Fake、源文件、设计或历史 CI 均不得标记为 Production Done。

## 文档权威

文档更新候选已经提交 [PR #18](https://github.com/hvritual/cs-biz/pull/18)：`doc/architecture/adr/`（Yunka 选型与边界）、`doc/architecture/`（目标架构）、`doc/contracts/`（三权访问契约）、`doc/tasks/`（F0–F6 与开发 SOP）、`doc/roadmap.md`（唯一阶段地图）、相关 README/旅程/模板（同步状态）。历史草案按新权威标记 superseded，不删除真实证据或声称旧代码已经迁移。

## 风险审批仍需实证

- 固定的 Yunka release/module 组合和工具链升级/Go 1.23 → 1.25 的消费者兼容；
- 数据库供应端、IdP、Session TTL/CSRF/凭据来源；
- 角色委派上限、最后 Owner、旧 `group` 的业务含义及 SQL 表达；
- 后台/API Worker 身份适配、幂等回执、上线环境与回滚权限。

**当前状态：PLANNED / NOT_IMPLEMENTED。**
## 子 Issue 与依赖顺序（2026-10-15 已建档）

- [ ] #11 — F0 冻结权限与 Yunka Consumer 兼容基线（先行）
- [ ] #12 — F1 固定工具链和生成/装配零漂移（依赖 F0）
- [ ] #13 — F2 营销 Function-only 试点（依赖 F1）
- [ ] #14 — F3 真实 Access/Session/Workspace IAM（依赖 F1、复用 #7/#8，和 F2 通过受控子切片协作）
- [ ] #15 — F4 真实 Domain SQL Scope（依赖 F2+F3）
- [ ] #16 — F5 单 Yunka 执行路径、旧 Router 下线（依赖 F2–F4）
- [ ] #17 — F6 生产资格和部署回读（依赖 F3–F5）

本 Issue 只有在子任务逐项有精确验收、独立评审、main/生产读回时才能关闭；文档 PR 通过不构成迁移完成。


## 文档同步交付（2026-10-15）

- [PR #18](https://github.com/hvritual/cs-biz/pull/18)：统一 README、roadmap、架构 ADR、三权 V3、开发者权限定义 SOP、MKT-01 旅程、Feature Template V3、前后端/CI/SDLC 引用和 Legacy 文档状态。
- 当前是 docs/Issue 同步，**Yunka Runtime 及生产 IAM 仍未导入**；PR #7/#8 尚未合并，不能把候选代码写成 main。
- 合并/部署状态和实际 CI 以 PR #18 固定 HEAD 及仓库后续回读为准。

## 新增横向能力：全链路 Trace / 终端 Log / 可选 SLS（#19）

- [ ] [#19 可观测性主任务：前端→BFF→Yunka→Domain→RPC/Outbox/Worker](https://github.com/hvritual/cs-biz/issues/19)（横跨 F0–F6，不应仅在 F6 发布时补日志）。
- **Trace**：W3C Trace Context；一个同步业务请求在 Vue、BFF、Gateway、OperationGuard、Domain、RPC 中可由同一 TraceID 定位。异步事件以 `correlation_id/causation_id` 串联，不能强制把长时任务冒充单一 Trace；外部效果仍需 receipt/readback。
- **Log**：服务端 `slog` JSON stdout 为默认必备，错误日志与 span 共享 `trace_id/span_id/operation_id/error_code`。支持按 TraceID 检索 `span/log/operation/event`；前端错误向用户提供可复制的安全排障编号。
- **存储与可用性**：开发/CI 必须有可查询 Trace 数据源；可选 OpenTelemetry Collector / LoongCollector 转发到阿里云 SLS。SLS 未启用、不可达时终端日志持续可用，业务及 Function/Scope 授权结果不能受影响。
- **隐私与安全**：不在 Trace、Baggage、日志中泄漏 Token/凭据/PII/业务机密；Trace ID 不能代替认证或产生跨租户可见权；诊断接口须受控。
- **阶段责任**：F0 #11 冻结协议，F1 #12 接基础 OTel/stdout/本地采集，F2 #13 证明首条营销跨前后端 Trace，F3 #14 覆盖真实 BFF/浏览器错误，F4 #15 覆盖数据查询阶段，F5 #16 RPC/Outbox 因果链，F6 #17 验收 SLS 选配、采样、保留、成本、故障降级与支持排障 SOP。
- **完成条件**：#19 的 TR/LG/SEC/QUAL 验收矩阵有固定 Consumer SHA、真实集成环境和原始证据。当前仍为 **PLANNED / NOT_IMPLEMENTED**，不得宣称 Yunka 的可观测性库已经在 cs-biz 生效。
