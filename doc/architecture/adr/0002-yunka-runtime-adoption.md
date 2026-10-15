# ADR-0002：有条件引入 Yunka Operation 运行基座并保留 cs-biz 三权业务权威

**状态：Roadmap decision / proposed integration，尚未实施；待 F0 版本、身份及安全审批后才能进行真实消费。**
提出日期：2026-10-15。路线跟踪：[Issue #10](https://github.com/hvritual/cs-biz/issues/10)，审定切片 [#11](https://github.com/hvritual/cs-biz/issues/11)。

## 业务决策

普通成员即使**没有任何 Console 菜单**，仍可用已获授权的营销 Function + 自己的数据范围完成营销任务。三权含义固定：
- **MenuGrant：**仅控制 Console 菜单/页面/路由；后台无有效菜单时不能进入后台。不作为后端业务 API 授权项。
- **FunctionGrant：**Operation 所需 Permission，控制按钮以及服务器每次业务请求功能许可。
- **DataGrant：**与**同一 Permission**绑定的可信 Scope；后端注入，Domain 在真实数据库查询/写入/批量/导出/统计前强制过滤。

Account 与 Tenant Membership 分离；同一 Account 多企业独立；每浏览器标签页各自选择 Workspace。Platform/Human/Service/Worker 不互相冒用。ApplicationAvailability 是独立业务可用性前提，不授予 IAM 权限。

## 框架采纳决定

**Conditional Adopt：**将 Yunka 用作 Go 后端 canonical typed PB Operation → 编译期 OperationPlan、OpenAPI/TypeScript、统一 REST/gRPC 适配 → Gateway Authorizer → OperationGuard → Executor/ExecutionScope/UoW/幂等 → 生成装配/治理/质量门禁的目标基座。

**不采纳：**将业务 Menu、成员、角色、Scope 资源关系迁到 Yunka 中通用的数据表/legacy button_permission；新建第二套 IAM/权限目录；Yunka 框架自行解释 CRM/营销/点位 SQL 过滤；引入第二个 supervisor/自建 Executor。

**唯一权威：**
1. 当前已运行基线：cs-biz `backend/internal/platform/authz`（Go 1.23、内存 Fake），不是生产 IAM。
2. **迁移目标**（未实施）：`backend/contracts/proto/**` 中 typed PB Operation 是受保护业务操作、Permission、Audience、transport 的唯一**可写合同真相**；Yunka 生成的 OperationPlan/PermissionCatalog/TypeScript/OpenAPI 是派生只读产物。
3. `cs-biz Access` 是 Account、Membership、Role、MenuGrants、Permission+Scope Grants 的唯一**持久授权数据权威**，由 `gateway/authz.GrantResolver` 适配。旧 Authz V2 代码在 F2–F5 作为只读对照／受控兼容，单个生产 Operation **不得**双重放行。
4. `cs-biz OperationGuard` 从授权通过的 Grants 生成类型化 Scope；`Domain/Repository` 对 tenant+scope 强制过滤，Yunka `ScopeKey.With` 本身不是身份／授权证明。
5. Yunka 处理已明确 Operation 执行策略下的 root UoW/幂等；业务侧定义状态、审计、readback。重复执行抑制**不等于**回执丢失自动重放结果。

## 框架来源和消费者差异

- cs-biz main `f088a90fd5a0305cc00a5679e368306dce62167f`：Go `1.23.0`；PR [#7](https://github.com/hvritual/cs-biz/pull/7) 身份决策与 [#8](https://github.com/hvritual/cs-biz/pull/8) V2.2 三权分别未合并；PR #8 的 20 passed / 1 skipped 只证明其候选 Mock 浏览器与 Go 内核。
- Yunka [main](https://github.com/hvritual/yunka.io) 评估固定 `3527488325030fbf86fe52804140c936e9d937a4`；该树要求 Go `1.25.13`、protoc `3.21.12`；必须在 F0/F1 指定模块 release/消费锁、toolchain、供应链与兼容矩阵。不能直接依赖浮动 `main`。
- 框架技术事实：[Gateway Authz](https://github.com/hvritual/yunka.io/blob/3527488325030fbf86fe52804140c936e9d937a4/docs/authz.md)、[Typed PB Domain Authoring](https://github.com/hvritual/yunka.io/blob/3527488325030fbf86fe52804140c936e9d937a4/docs/domain-authoring.md)、[C9 runtime](https://github.com/hvritual/yunka.io/blob/3527488325030fbf86fe52804140c936e9d937a4/docs/waves/C9-operation-contract-runtime.md)、[C9.7 UoW](https://github.com/hvritual/yunka.io/blob/3527488325030fbf86fe52804140c936e9d937a4/docs/waves/C9.7-execution-semantics-closure.md)。
- YAML/proto 编译到应用实现的真实接口形状、Yunka API 差异，以**固定版本可编译消费者**为准，不能把旧 `@yunka.*` 指令作为新 protobuf 真相。

## 关键负例与可回滚策略

- Function 有但 Menu 无，合法营销 API 允许、Console 深链拒绝；Menu 有但 Function 无，页面可见、直调 API 拒绝。
- READ=tenant 与 UPDATE=self 并存时不可拼接 Scope 扩权；旧 Mock 的 `group`（同部门）不能自动映射 Yunka opaque `assigned` 或 `tenant`。
- `X-User-ID`/`X-Tenant-ID`、空租户、伪造平台/Worker 不能建立 Principal。
- 模块关停不删除 IAM Grant；租户切换、成员撤权后每次新请求按当前权威拒绝。
- 成功的 Mock/Go Fake/Framework 自有 CI 不等于 cs-biz 真 IDP/DB/SQL 生产证据。
- F2 测试留回退路径，F5 经覆盖证明下线旧 `HTTPRouter`；禁止两路共享生产流量时分别判定权限。

## 落地依赖

主线 [#10](https://github.com/hvritual/cs-biz/issues/10) → [#11 F0](https://github.com/hvritual/cs-biz/issues/11) → [#12 F1](https://github.com/hvritual/cs-biz/issues/12) → [#13 F2](https://github.com/hvritual/cs-biz/issues/13)、[#14 F3](https://github.com/hvritual/cs-biz/issues/14) → [#15 F4](https://github.com/hvritual/cs-biz/issues/15) → [#16 F5](https://github.com/hvritual/cs-biz/issues/16) → [#17 F6](https://github.com/hvritual/cs-biz/issues/17)。

此 ADR 是**采用方向**而非“Yunka 已导入”的状态声明；实现、审查、合并、生产发布是独立授权和证据。
