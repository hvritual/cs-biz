# r001 实现设计：资源与生产 OIDC 适配边界

状态 `proposed`。WHY：缺少可信资源和唯一持久授权源，不能用浏览器演示作为 F2/F3 的主体。WHAT：非生产真实资源、OIDC/BFF、当前 Access 与 Domain 分责。BOUNDARY：先资源/后端合同与策略审阅；UI 另补项目 Preview；无生产发布。PROOF：真实容器/SQL/OIDC/API/浏览器和精确版本证据分别验证，不互相抵扣。

## 1. 非生产资源

- 推荐 Docker Compose 的独立项目名与专用卷。MySQL 中 `cs_biz` 与 IdP schema 分开，业务账号不得读取/写入 IdP schema，IdP 账号不得读取/写入业务 schema；root 只用于初始化/管理，不成为应用 DSN。开发卷保留；CI 卷只属于本轮操作 ID，清理前解析精确对象，不提供默认删除开发数据命令。
- Keycloak 是开发/CI IdP，不是新的 cs-biz IAM。一个开发 realm 容纳测试主体，cs-biz Tenant/Membership/Role/Menu/Function/Scope 都保存在唯一 Access Store；realm/role 不映射租户或业务 Owner。
- 版本与镜像按实际 registry manifest digest 固定；启动前检查声明平台、secret、端口和 environment。`start-dev` 只能在明确非生产且 loopback 的 profile 中使用，生产 profile 拒绝该模式、测试 realm/bootstrap/test accounts 和 HTTP issuer。
- 测试凭据运行时生成；Docker compose、Git、CI日志、artifact 不包含 client secret、密码、Token、Cookie 或邀请原文。失败日志脱敏，不能仅依赖 GitHub 掩码。应用、IdP、MySQL 分别有启动与就绪出口，避免健康端口可达就宣布业务 SQL 可用。
- 首个 S0 可执行验收：实际 MySQL 读写、用户权限反例、卷保留后的重启读回、IdP Discovery/JWKS、真实授权码+S256 PKCE 交换与 ID token 验证。错误 verifier、nonce/state、issuer/audience、过期/签名及 code replay 均拒绝。不能以 password grant 替代授权码旅程。

## 2. 标准生产供应端适配面

拟议配置项：`environment`、`issuer`、`client_id`、`client_secret_file` 或获准的标准客户端认证方式、`redirect_uri`、`scopes`、`allowed_origins`、有界连接/发现超时。管理/seed/bootstrap/realm-import 仅属于非生产资源工具，不能进入应用 Provider 接口。

运行时通过标准 Discovery/JWKS 与成熟 OIDC 客户端校验库处理 code flow，不自写 Token 签名或缓存认证裁判；按 exact issuer/client audience、签名算法 allowlist、时间、state/nonce 与 PKCE 绑定验证。Token 不发给 Vue 或 localStorage，浏览器只持有 BFF 的不透明 Session cookie。最终 Go 库、版本/安全/Consumer 兼容须在实施准入时实际核对，不写浮动依赖。

生产接入能力必须用两种层次证明：非生产两个不同 issuer/配置跑同一适配面且无 Keycloak role/Admin API 依赖；真正生产 IdP 的 discovery、client registration、TLS、claims、logout/恢复能力仍须目标环境资格。前者不是后者。回调不能任意接受 issuer/redirect URL，配置来源由服务端控制，限制出站/重定向并设置有界请求，防止 SSRF/混淆供应端。

Account 的外部身份键为 `(issuer, subject)`，不是 email 或客户端 userId。切换生产 issuer 不按相同 sub/email 自动合并账户、继承成员关系或授予 Owner；需要显式受控账户链接/迁移、审计和恢复方案，资源切片不会执行该迁移。

## 3. BFF / Access / Domain

BFF 验证 IdP 后查询/建立受控 Account，Session 与标签页 Workspace 分开。一个浏览器共享认证 Session，每个标签页的 tenant context 独立；服务端每次验证当前 Membership/角色/模块可用性/Function+该动作 Scope。平台身份没有租户 Owner 特权。客户端 Header、trace、菜单和旧缓存都不产生身份。

CSRF、会话期限、退出/邀请/恢复推荐值见 [决策表](decision-review.md)，获准前不落成运行默认值。成员/角色/资源范围变化在数据库事务/版本边界重验；最后 Owner 使用同租户可证明的锁定顺序与并发反例。S0 不创建假的 Membership 或业务 JWT 来绕过 S1。

Yunka canonical typed PB 驱动 OperationPlan/适配器/生成客户端/装配，开发者只写 source-owned 逻辑。Function Authorizer 读取当前 Access；OperationGuard 解释该动作 opaque Grants；Domain SQL 强制 Tenant AND Scope 与资源状态。`READ=tenant / UPDATE=self` 不做动作/范围笛卡尔积。旧 Authz 只有覆盖/影子/回滚证明后才退休，不双重放行同一 Operation。

真实业务写入的业务效果、幂等键/请求摘要、回执/审计在受控事务边界内提交；未知结果按原 operation ID 或预生成幂等键查询，查询仍检查当前读取权限。相同键不同参数冲突，不把 TraceID 或 Yunka root 重复抑制当结果回放。外部效果经 Outbox 与消费幂等处理。

## 4. 可观测与错误

沿已固定 Yunka Provider 传播 W3C，默认 JSON stdout。身份 Token、Cookie、邀请、SQL 参数、个人字段、资源完整列表不进入日志/Span；只存安全 code、Operation、时长和关联字段。Trace 不是认证或业务完成证明。

API 与 Console 受控错误可提供安全排障 ID；诊断查询另受授权。401/403/跨租户不泄露存在性、Scope/Domain错误、Collector不可达、超时/重试和未采样状态分别有真实证据。RPC/Outbox 用 correlation/causation 连接异步因果，重启/重投不伪装成同一永久 Trace。

## 5. 文件与变更边界

S0 拟允许：`backend/deploy/identity/**`、必要 `backend/ci/**` 与端内文档/本任务记录；真实 CI 增加资源验证接线需保持原裁判、所有既有检查和超时预算，若发生门禁意义变化须另审批。S0 不改应用、UI、依赖锁、Yunka生成源或生产资源。

S1–S5 各自先冻结 allowlist、typed PB/持久化/API/生成差异及兼容测试；预计涉及 `backend/internal`、contracts、受控前端适配。不能用这份预期路径当全部文件修改批准。所有封存原件、其他候选、上游仓库、凭据和门禁判定保持禁止。

真实目标 route/Operation 清单应从当前 main 和获准目标定义枚举，F5 要求 100% 对照该清单，不能只统计测试碰巧覆盖的方法。无现成 Worker/RPC 不是删掉原验收的理由，须在对应阶段确认适用性和原承诺。
