# 后端能力与执行边界（当前 + 目标）

**当前 main：** Go 1.23 `backend/internal/platform/authz` V2 基础库，功能点和 Go 测试见 [AUTHORIZATION-V2](AUTHORIZATION-V2.md)。暂没有 IdP、BFF、API Server、DB/IAM 持久化或 Yunka Consumer。

**目标（Issue #10–#17，尚未实现）：** typed PB→Yunka OperationPlan/Gateway GrantAuthorizer→cs-biz Access GrantResolver→OperationGuard→Domain Tenant+Scope→Executor/UoW/Readback。MenuGrant 始终为 Console UI 投影，营销成员没有 Console 菜单也能使用营销 Function。详细合同 [Access V3](../../doc/contracts/three-rights-v3.md)、[架构 ADR](../../doc/architecture/adr/0002-yunka-runtime-adoption.md)、[Developer Flow](../../doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)。

## 责任归属

| 能力 | 当前状态/长期 Owner |
| --- | --- |
| `identity/session` | cs-biz：真实 Account/IdP/BFF/CSRF、每标签页 Workspace（未实现，PR #7 候选不是 IdP） |
| `tenancy/access/iam` | cs-biz：Membership/Role/Menu/Function+Data Grants 持久权威（未实现，PR #8 本地 Mock） |
| `authz` | **当前** Go V2 内核已实现；**目标** Yunka Gateway 是唯一受保护 Function 执行边界 |
| `data-scope` | cs-biz OperationGuard 解释 Yunka opaque Grants、Domain 执行 SQL Tenant+Scope（未实现真 SQL） |
| `application-availability` | cs-biz 独立产品模块状态；不授予权限 |
| `domain` | CRM/Marketing/点位/设备/租赁等行业数据所有权、业务状态、审计/回执 |
| `runtime/infrastructure` | Yunka Executor/ExecutionScope/Assembly/Platform（目标待 Consumer 引入） |

历史功能接入：[FEATURE-ONBOARDING-V2](FEATURE-ONBOARDING-V2.md)；它记录现有 Go V2 用法，不再是未来新 Operation 的唯一计划。新功能必须按 [Yunka SOP](../../doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) 进行授权定义、统一生成/CI 和安全反例。正式 DB/Provider/版本必须通过 F0–F3 独立决策与验证。
