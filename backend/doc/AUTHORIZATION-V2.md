> **当前实现与后续目标分开（2026-10-15）：** 本文准确描述已合并 main 的纯 Go V2 `internal/platform/authz`；其源码存在且可测试，但**不是真实服务端授权/数据库**。F0–F5 的目标将单一执行链路迁至 Yunka typed PB + Gateway GrantAuthorizer/OperationGuard + Executor，Access/Scope 业务权威继续在 cs-biz；旧 Go Registry/HTTPRouter 不再作为新功能的**目标**合同源。不要在单个生产 Operation 上同时使用两套判定。查看 [ADR-0002](../../doc/architecture/adr/0002-yunka-runtime-adoption.md)、[SOP](../../doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)。

# 通用后端授权内核 V2.0 — cs-biz 实施基线

状态：**基础库已实现，真实服务/持久 IAM/跨端授权尚未实现**。此文档描述 `backend/internal/platform/authz/` 当前代码，不表示 S02/S03 已通过业务验收。

## 范围与权威

- **不依赖 Commercial Guard、PlanVersion、Subscription、Entitlement Resolver**；没有第二套商业角色或商用模块目录。
- `Operation` 是代码定义的稳定业务动作与 HTTP 映射来源；`Registry.PermissionCatalog()` 是只读派生目录，不是可编辑的授权权威。
- `CurrentAuthority` 仅由未来可信 Access/IAM 持久化适配提供，**每次请求**读取当前 Membership 和 Permission+Scope Grants。现阶段只有测试 Fake，未接实际身份提供方或 DB。
- `WithVerifiedPrincipal` 必须只由未来已完成凭证、会话与租户关系校验的信任边界调用；不能由 `X-User-ID`、`X-Tenant-ID`、body、路由或任意客户端内容调用。
- `ResourceFacts` 只能来自资源所属 Domain 在可信租户条件下读取的权威数据。`RequireResource` 是具体对象的辅助检查；列表、聚合、分页、批量、下载和导出要由资源域 **在真实查询谓词中**执行同等范围限制。
- `HTTPRouter` 将每个已声明的 HTTP 绑定与 `Authorize` 结合；通过 `CheckCoverage()` 启动前检查全部 HTTP Operation。未来的正式服务器应以此 Router 为唯一业务路由入口；绕过它调用原生 mux 的路径不在本基础库的全局静态检查覆盖内。
- ResourceScope 与 ObjectState 不相同。`authz` 对当前身份、动作、授予范围做安全检查，业务状态、CAS、幂等、审计和回执由 Domain/UseCase 负责。
- `AudiencePublic` 必须明确说明公共暴露理由，且无业务权限；平台/租户/服务/Worker 是互不冒用的主体类型。后台任务不能通过信任未经验证的消息体冒充用户。

## 授权执行

```text
受信身份或明确 Public
    → canonical Operation
    → audience 校验
    → 当前 Membership（tenant_user）
    → 当前 IAM Grants（每个 Permission 与 Scope 绑定）
    → Domain-owned Tenant/Resource 查询与 Scope 限制
    → Domain ObjectState 与写入不变量
    → Receipt / Readback / Audit（后续真实领域实现）
```

入口 PEP 和领域资源检查是两个独立责任，不能由前端菜单显示替代服务端授权。`Grant.TenantID` 与 Principal 的可信租户不一致时无效；权限撤销后新请求重新读取权威记录。`ALL`/`ANY` 原样处理，不能从读权限中的全量 Scope 提取成写权限范围。

## 已实现的最小接口

| 类型/函数 | 用途 | 边界 |
| --- | --- | --- |
| `NewRegistry`、`Operation` | 声明业务 Operation、HTTP binding、audience、Permission | 重复 ID、未知 audience、空保护 Permission 直接失败 |
| `Registry.PermissionCatalog` | 前端/角色管理的只读权限清单来源 | 不向用户授予 Grant |
| `CurrentAuthority` | 有效成员与当前 Grant 读取接口 | 不含生产 Store 实现 |
| `NewAuthorizer` / `Authorize` | 当前 Operation 级安全决策 | 不执行领域写入 |
| `Decision.RequireResource` | 对一个**领域已核验**对象做权限专属范围限制 | 不代替列表 SQL 谓词 |
| `Decision.ScopesFor` | 为领域 SQL/筛选提供只读的本动作范围约束 | 不允许跨动作拼接或绕过 Tenant 谓词 |
| `HTTPRouter.HandleOperation` | 将 Operation 声明映射到守护式 HTTP handler | 不允许注册未知操作 |
| `HTTPRouter.CheckCoverage` | 验证已声明的所有 HTTP Operation 都有 handler | 不扫描其他第三方 mux 或 RPC/Worker |

## 当前测试证据与缺失

可在 `backend` 运行：

```bash
go test -count=1 ./...
go vet ./...
go test -race -count=1 ./internal/platform/authz/...
```

测试使用 **内存 Fake Authority**，验证当前权限重读、动态撤权、无 Membership、跨租户 Grant、Operation/路由覆盖、对象范围、不同动作 Scope 不混淆、公共入口、错误响应以及伪造客户端头不能直接获得身份。它们只证明内核行为，不证明真实 DB/API/登录/跨端链路。

S02 需要单独交付并验证：身份源、Session/CSRF、租户选择、真实 Membership/Role/Grant 持久化、领域查询层与 OpenAPI；S03 才能宣称真实用户旅程。数据库、HTTP 框架、业务模块、线上环境在本切片没有决定或实现。

## 模块启用与授权严格分离

现有 `doc/contracts/access-context.md` 及 SAAS-01 仍提出“租户模块已启用”的**业务前置条件**。本次移除的是**通用授权内核对商业套餐体系的依赖**，不是默许绕过 SaaS 真实模块开通规则。未来的 `ApplicationAvailability`/业务模块状态应由相应 Domain 持有并在执行业务动作前校验，且**不能自动赋予 IAM Permission**。具体权威、API、失效、恢复与 CI 场景在其所属 S02/S03 设计接受后实现；在此之前不得把前端 Mock 的应用状态当后端权威。

## Go 使用示例（示意，无真实认证/数据库）

```go
registry, err := authz.NewRegistry(authz.Operation{
    ID: "customer.get", Audience: authz.AudienceTenant,
    Permissions: []string{"customer.read"},
    ResourceType: "crm.customer",
    HTTP: []authz.HTTPBinding{{Method: "GET", Pattern: "/v1/customers/{id}"}},
})
if err != nil { return err }
// currentIAM 必须由真实持久 Authority 适配实现，不能在生产使用测试 Fake。
authorizer, err := authz.NewAuthorizer(registry, currentIAM)
if err != nil { return err }
router, err := authz.NewHTTPRouter(authorizer)
if err != nil { return err }
err = router.HandleOperation("customer.get", customerHandler)
if err != nil { return err }
if err := router.CheckCoverage(); err != nil { return err }
// 未来 HTTP Server 必须只暴露经过审核的路由和可信认证适配。
```

资源详情的 `customerHandler` 必须在带可信 tenant 的仓储查询获取对象后，调用 `Decision.RequireResource("customer.read", facts)`；对列表应直接把 `ScopesFor("customer.read")` 转为受 tenant 约束的安全 SQL 谓词。不要先查询所有资源再按内存过滤、再分页。
