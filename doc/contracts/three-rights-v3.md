# Access Contract V3：Menu / Function / Data 三权分离与 Yunka 合同适配

> 状态：**target contract（已纳入路线，真实 API/数据库未实现）**，源自 V2.2 设计与 PR #8；技术路线 [ADR-0002](../architecture/adr/0002-yunka-runtime-adoption.md)。旧 `access-context.md` 保留访问生命周期、失败/幂等设计，本文覆盖三权及唯一合同源的冲突部分。

## 1. 三类授权，彼此独立

| 权限 | 持久化权威（目标） | 前端行为 | 服务端执行 |
| --- | --- | --- | --- |
| **MenuGrant** | cs-biz Access Role→ConsoleMenu | Console 导航/页面/路由，可见性与后台入口；无菜单不进入 Console | **业务 API 完全不校验 Menu** |
| **FunctionGrant** | cs-biz Access Role→Permission | 按 Function Projection 显示操作按钮 | Yunka typed PB Operation → Gateway 当前 Permission 校验 |
| **DataGrant** | cs-biz Access Grant.Permission + Grant.Scope | 显示范围信息、允许缩小筛选 | OperationGuard 注入当前 Permission 的 Scope；Domain 必须执行 SQL/写入过滤 |

菜单与 Function 没有隐式传播关系：开菜单不自动给 `customer.read`；关菜单不删除 `customer.update`；读全部与写本人不合并；营销使用入口只需要营销 Function，不需要任何 Console Menu。

## 2. 身份、会话与空间

`AccountSession` 为账号身份会话；`WorkspaceContext` 为各浏览器标签页的目标企业，服务端绑定当前 Tenant/Membership/version；`AccessContext` 是当前窗口可信权限投影，缓存至少按 `account + tenant + accessVersion` 区分，任何菜单/按钮数据均不能替代服务端每次授权。

目标 Membership 四态（invited/active/suspended/removed）属于 PR #7 的尚未合并的候选规则；S01 main 仍为 active/disabled 的本地 Mock，身份登录没有真实凭据。无可进入企业显示受控恢复；有一个企业可直入；多个企业须显式选择。

## 3. Access Projection（响应设计，不是已经可调用的 API）

```json
{
  "subjectId": "account-001",
  "tenantId": "tenant-a",
  "accessVersion": "opaque-v17",
  "menuGrants": ["crm.customer.list"],
  "permissions": ["crm.customer.read", "crm.customer.update"],
  "dataScopes": [
    {"permission": "crm.customer.read", "scope": "tenant"},
    {"permission": "crm.customer.update", "scope": "self"}
  ],
  "navigation": [
    {"viewKey":"crm.customer.list","name":"customers","path":"/customers","titleKey":"menu.customers","order":20}
  ]
}
```

这是目标业务接口**设计示意**，不得用作已发布 OpenAPI；其中 `menuGrants/permissions/dataScopes` 是同一逻辑版本的服务端投影；`dataScopes` 非授权输入。PR #8 的 S01 浏览器字段仍是 `Grant(action, scope)` 和 `all/group/own`，不是最终 SQL Scope 合同。正式接口字段须在 F1/F3 的固定 typed PB 和生成 TypeScript/OpenAPI 中审定并测试。

## 4. 单一可写合同源

- 未来服务器 `backend/contracts/proto/**` typed Protobuf Operation（示意位置，F1 由项目 profile 冻结）是**唯一**受保护 Operation/Permission/HTTP/gRPC 可写合同源。
- `Yunka OperationPlan、permission catalog、OpenAPI、TS Client、REST/gRPC adapters、AssemblyPlan` 为由 canonical PB 派生并通过零漂移检查的生成物；禁止维护一个相互冲突的 Go Registry 和 OpenAPI 权限清单。
- **独立业务可写事实**：菜单目录/本地 `viewKey` 白名单与 Access Role/Menu 权威；Role/Permission 的实际分配、Scope 的归属关系由 Access Store 持有；业务状态/模块可用性归 Domain，不写入 PB SQL 语义。
- Yunka `gateway/authz.GrantResolver` 读取 cs-biz Access 当前 Membership、Permission+Scope；`OperationGuard` 解释为业务 Scope；此过程不读 Console Menu。
- Runtime Principal 的平台、人、服务、Worker 信任来源必须明确；不能通过 `X-User-ID`、`X-Tenant-ID`、body/空 Tenant 产生已认证主体。

## 5. Data Scope 不变式

同租户强制；`ALL` 功能的多 Permission 资源约束是交集、`ANY` 是已授权 Permission 对应资源谓词的受限合并；无 Permission 拒绝。查询必须在分页/聚合前加 WHERE，写入/批量/导出同样加 Tenant+Scope。客户端 filter 只能缩小范围，不能扩大。跨租户 ID 默认不暴露数据存在性；拒绝不产生副作用。

历史 Mock `group` 指同部门数据，Yunka `Grant.Scope` 是不透明字符串，`assigned` 为分配事实，两者不能自动替换；F4 必须按领域确立已分组成员/资源映射与负例。

## 6. 典型测试矩阵

| 场景 | 预期 |
| --- | --- |
| MKT-01：有营销 Function + own、无 Console Menu | 正常访问营销，后台深链不可达，仅自己活动可读/执行 |
| CON-01：有客户 Menu、无 customer.read | 客户页面有入口但 API 403，不能显示真实客户数据 |
| CON-02：read=tenant、update=self | 全量可读，本人可改，其他人不可改且无副作用 |
| TEN-03：账号同时在 A/B、多标签选择独立 | A 被停用只禁 A；新请求检验当前工作区 |
| SCP-04：legacy group 未定义 SQL | fail closed，绝不等同 tenant 或 assigned |
| MOD-05：模块关闭，IAM Function 仍在 | 相应业务拒绝，但保留 IAM 授予事实 |
| REV-06：撤权/Role+Scope 更新 | 服务端新请求拒绝；旧 UI Snapshot 不是权威 |
| EXEC-08：丢失回执／幂等键重试 | 副作用仅一次；可 readback 原结果/状态 |
| DB-09：分页、统计、导出、批量 | 真库强制 tenant+Scope，禁止页面先全取再过滤 |
| OP-10：REST/gRPC/内部子操作 | 同一 Operation 唯一授权执行路径 |

## 7. 变更政策

新 Function 的定义必须先查 PB/Registry 已有权限和行为，复用优先；新增或收缩权限需审核租户与委派影响。更改 Scope/身份/Operation 是安全语义变化，必须附直调 API 和真库反例以及旧角色迁移处理。菜单目录不在 PB 里推断生成，除非独立业务验证证明确切 View↔Menu 配置；Yunka 永远不承担浏览器路由权限权威。
