# 后端设计与已实现能力

通用权限 V2 已导入 `internal/platform/authz`，实施说明见 [AUTHORIZATION-V2](AUTHORIZATION-V2.md)，开发接入流程见 [FEATURE-ONBOARDING-V2](FEATURE-ONBOARDING-V2.md)。这两份文档区分本轮可运行的纯 Go 基础库与 S02/S03 尚未实现的后端业务服务。

## 模块责任（规划）

- `identity`：真实认证源、可信 Principal、Session/CSRF（未实现）。
- `tenancy`：租户生命周期、成员关系与租户选择（未实现）。
- `access/iam`：角色、实际 Permission Grants 和数据范围权威（目前仅通过 `CurrentAuthority` 接口抽象）。
- `authz`：**已实现** Operation Registry + Operation PEP + HTTP 绑定 + 资源级辅助授权，无商业 Guard。
- `audit`：安全和业务操作审计（未实现）。
- `application-availability`：SaaS 模块开通/禁用等独立业务条件（仅现有产品需求，未实现、不授予 IAM 权限）。
- 实际业务域：客户、点位、设备、服务、合同等按独立用户旅程后续接入。

不预先拆分多个部署进程；授权与资源校验必须发生在服务端可信边界。一个 Account 可关联多个 Tenant，但不能把客户端 `tenantId` 当可信主体，不能通过角色名推断无界数据访问。

Go 包仅选择语言与最小接口，不代表已锁定 HTTP 框架、数据库、认证供应商或 OpenAPI 结构。跨端 OpenAPI 仍由 [全局契约](../../doc/contracts/README.md) 在 S02 建立唯一来源；业务前端不直接复用测试 Fake 或菜单当授权器。

## S02-ID 独立身份规则切片

新增 `backend/internal/access/identity/`：Account/成员四态、0/1/N 企业入口、CAS/最后 Owner 与租户会话拒绝逻辑的**纯 Go 决策层**。后端的 `internal/platform/authz/` 仍是唯一 Operation 权限内核。当前没有凭据验证、真实 Session、数据库迁移、受保护 HTTP 服务或通知送达，不能把纯规则测试称为生产登录。

产品与跨端规范：[ID-01](../../doc/journeys/ID-01-member-lifecycle.md)、[ID-02](../../doc/journeys/ID-02-login-workspace.md)、[S02-ID 任务](../../doc/tasks/S02-identity-journeys.md)。
