# Developer Permission Definition Flow — 新功能从需求到三权上架

适用：`hvritual/cs-biz` 所有新的租户业务模块、后台 Console 页面、营销/API-only 能力；采用现有 `backend/internal/platform/authz` 的 Operation Registry，禁止第二套权限目录。基于用户确认的“菜单可视、功能可用、数据可见”约束。

## 0. 开发前冻结输入

开发者创建 Feature Task，明确：业务 Actor、Tenant、使用入口（Console / Marketing / Service / Worker）、业务对象/所有权、具体操作（读/创建/编辑/执行/导出）、每种操作需要的数据范围、模块可用性、失败及恢复、数据归属、UI 路径、API HTTP/RPC/Worker、事务与审计。

**不可通过“新增一个按钮”代替以上定义。** 缺少资源所有权、Data Scope 的业务语义时，该功能必须在数据授权步骤暂停，不能默认放大至全部数据。

## 1. 定义三个独立合同

| 合同 | 何时需要 | 定义与权威 |
|---|---|---|
| Menu | 需要渲染 Console 页面时 | `viewKey` 白名单、`menuCode`、路径、标题、排序、模块条件；API 授权不读此字段 |
| Function | 每个可执行受保护操作 | 代码唯一 `Operation.ID`、`Audience`、`Permissions`、`ModeAll/ModeAny`、HTTP binding / Worker message binding |
| Data | Function 涉及资源时 | `ResourceType`、可信 Tenant、许可 Scope、OWNER/ASSIGNED/EXPLICIT 事实、SQL 谓词、列表/详情/写入/批量/导出/统计正反例 |

营销页面若与后台 Console 不同入口，**只定义营销 Function/Data，不授予任何 Console Menu**。Menu 不能自动发出 Function，Function 不能自动生成 Menu。Data 是 Function 的作用范围，不应成为另一个可独立冒用的功能权限。

## 2. Go Registry 定义 Operation（唯一编码来源）

```go
registry, err := authz.NewRegistry(authz.Operation{
    ID: "campaign.execute",
    Audience: authz.AudienceTenant,
    Permissions: []string{"marketing.campaign.execute"},
    Mode: authz.ModeAll,
    ResourceType: "marketing.campaign",
    HTTP: []authz.HTTPBinding{{Method:"POST", Pattern:"/v1/marketing/campaigns/{id}/execute"}},
})
if err != nil { return err }
```

`PermissionCatalog()` 是只读派生目录，绝不能作为第二套独立可编辑权限目录；今后的实际前端 Function 列表从这个 Registry 的 OpenAPI/typed projection 生成。S01 本地模拟 `PERMISSIONS` 是预览适配，不能成为生产 IAM 权威。

## 3. 注册唯一受保护入口

Go HTTP 路由使用 `HTTPRouter.HandleOperation(operationID, handler)`；启动前 `CheckCoverage()` 必须通过。非 HTTP 的 Worker/Service 单独验证 Audience、消息签名/身份与幂等，不可冒用浏览器 User Principal。`Public` 显式说明原因并通过安全审查。

可信 Account + 目标 TabWorkspaceContext + 当前 Membership 是前置条件；不能把客户端 `tenantId` 或 `X-User-ID` 当成受信认证。平台人员不能通过 Tenant API 隐式获取租户 Owner 角色。

## 4. 服务端 Function 授权及 Data 注入

```go
decision, err := authorizer.Authorize(ctx, "campaign.execute")
if err != nil { /* 稳定 401/403/503 拒绝 */ }
ctx, err = decision.InjectDataScope(ctx)
if err != nil { /* fail closed */ }
scope, ok := authz.ScopeFromContext(ctx)
if !ok { /* fail closed */ }
// Domain 用 scope.TenantID() + scope.GrantsFor(permission)
// 创建自己的白名单化查询/写入条件；不得从 body 重新读取授权范围。
```

- `InjectDataScope` 不检查 Console Menu，仅由已授权的 Operation 决策获得受信约束。
- `ModeAll` 多 Permission 的资源范围必须求**交集**，`ModeAny` 是满足权限范围的安全并集；不要把 read tenant Scope 借给 write self。
- `group` 是旧 Mock 的同部门业务范围，Go V2 **没有等价 Scope**；在具体 Domain 安全实现前不得映射成 Assigned 或 Tenant。

## 5. Domain Owner 的数据处理

必须强制 `tenant_id = trusted_tenant`，再根据该 Function 的 Scope 编译 SQL/查询谓词；业务自定义过滤器只能做交集缩小。详情/删除/编辑通过可信资源事实再校验，批量/导出/统计不能只对分页后的行做前端过滤。写入事务在必要情况下重新读取当前授权与资源状态；CAS/幂等/审计/回执由 Domain 负责。

例：客户全部可读、本人才可更新——客户列表 WHERE tenant_id，更新 WHERE tenant_id AND owner_id=current_account；其他客户更新必须无副作用，不能以隐藏按钮作为 API 测试通过。

## 6. 配置 Menu / Function / Data 前端

前端 `PermissionSetEditor.vue` 的三列是同一个管理体验，不是三个权限引擎。

- Menu：Vue Router 本地 `viewKey` 白名单，权限集保存 `menuGrants`，企业菜单投影从当前 Role 的有效 Menu 集合生成，模块不可用的路由不开放。
- Function：`grants[action]` 勾选独立；页面和行操作按当前 Function 及业务状态渲染；用户深链无菜单直接阻止后台渲染。
- Data：在每个已勾选 Action 的行里配置 Scope，使用本 Action 的授权投影展示筛选边界；前端选择的 filter 绝对不能扩大服务端查询范围。
- Account+Tenant+AccessVersion 改变后清理菜单/按钮/筛选/缓存和草稿；失效投影不能临时回退到旧企业。

**例外**：纯营销人员无 Console Menu，登录后进入 `/marketing`，受限营销权限仍可使用，`/customers` 和 `/members` 直接拒绝。

## 7. 最小正反例验收矩阵

| 编号 | 准入/数据条件 | 结果 |
|---|---|---|
| MKT-01 | 无 Console Menu、有营销 read/execute + own | Marketing 可用、Console 不可进、只见本人活动 |
| CON-01 | 有客户页面 Menu、无 customer.read | 页面可访问，读 API 403，按钮不显示 |
| CON-02 | Read=tenant、Update=self | 所有客户可读，仅本人客户可改，跨范围无写入 |
| CON-03 | Function 有、Console Menu 无 | API Function 按 Scope 判定，不因为缺菜单拒绝；Console 路由阻止 |
| SCP-01 | 旧 group 未获安全映射 | 禁止隐式扩大至 tenant 或 assigned |
| TEN-01 | 同 Account 两 Tenant / 多标签页 | 两个可信 Workspace 独立，A 撤权不影响 B |
| POL-01 | 编辑 read Scope 不更改 update Scope | 保存、重读、API 结果均正确 |
| MOD-01 | 营销模块关闭但 IAM Grant 仍在 | 模块业务拒绝，恢复后仍需要 Function |
| REV-01 | Role、Membership、Scope 动态撤销 | 新 API 按当前权威拒绝，旧按钮不能放行 |
| REC-01 | 首回执丢失 / 同键并发 / 改参重试 | 一次业务结果、409 冲突、按既有 operation_id 回读 |

所有 API 拒绝必须检查**业务数据未改变**，不把 HTTP 403 本身当成无副作用证明。需要绑定实际数据库、HTTP、E2E、时间和准确 commit SHA。

## 8. 固定质量循环与交付

1. **RED**：先锁定用户旅程的允许和拒绝断言，包括直调 API 和越权反例；
2. **GREEN**：先 Go Registry/CurrentAuthority/TrustedScope/Domain，再接前端投影；
3. **REFACTOR**：在不减弱反例的条件下清理重复代码和错误映射；
4. Fast：`python3 doc/ci/check_repository.py`、`cd backend && bash ci/check.sh`、`cd frontend && corepack pnpm check:fast`；
5. UI 变更：`cd frontend && corepack pnpm check:desktop:runtime`，检查 1366×768 / 1440×900 / 1536×1024；
6. 同一 SHA 的独立 Ready PR：`cd frontend && corepack pnpm check:full`，记录 Playwright 原始截图和跳过项；
7. PR Review：逐项查 Menu 没有被服务器用作 Function、没有越权 Scope、没有直接 trust header、未接入的真实 API 没有伪成功；
8. 真实发布需独立批准，并完成 IdP/BFF/持久 Store、Domain SQL、授权撤销、外部通知及恢复测试；**模拟验收不等于生产完成**。

阶段性 Done：所有 V2.2 本地数据演示和 Go 内核测试通过，可标记 `S01/V2.2 READY`；在真实 Access 与数据库未接通前，`Production IAM DONE = false`。
