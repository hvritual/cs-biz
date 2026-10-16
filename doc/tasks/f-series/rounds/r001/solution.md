# r001 方案：先建立真实资源，再兑现 F 系列业务链

状态：`proposed / DESIGN_REVIEW`；资源方向已由 Human 确认，新增策略仍待本轮审阅。本方案回答如何推进，不复制具体实现或把候选当已发布能力。

## 背景、问题与影响

当前 main 有固定 Yunka Consumer、生成/装配、纯 Go Authz 与本地技术 Trace；Console 仍依赖本地 Mock。F2 的真实营销、F3 的登录/持久 Access、F4 的 SQL Scope、F5 的统一执行和 F6 的生产资格并非互不相关的功能清单。只按编号实现 F2 容易用 Fake 主体或临时角色替代尚缺的 F3，形成第二授权源。

目标：开发者和测试人员使用可重建、凭据隔离的 Docker MySQL/真实非生产 IdP；最终用户通过 BFF 获得可信身份，每个标签页独立选择企业；服务端按当前 Access、Function 与对应 Scope 执行业务，未知结果可恢复。生产接入保留为相同标准 OIDC 适配面的配置和资格要求，不等于现在发布生产。

影响 backend 的部署资源/身份/Access/Domain、对应 typed PB 和受控 Console 接入、必要 CI 与验收材料。Yunka 上游仓库、已审 F0/F1 原件、现行门禁、许可与非任务业务不变。

## 已选路线与替代方案

| 路线 | 判断 | 代价/反证 |
| --- | --- | --- |
| Docker MySQL + 非生产 Keycloak + 标准 OIDC BFF | 本轮推荐，满足已确认资源方向；Keycloak 是可替换的开发供应端 | JVM/数据库和镜像维护成本必须计入；不能把 Keycloak realm 当 SaaS tenant 或照搬角色 |
| 复用已有企业 OIDC | 未来生产可接入；同样消费 Discovery/JWKS/code flow | 当前未提供供应端；issuer 变更可能涉及账户链接，不能只换 URL 后按同名 sub/email 自动认领 |
| 自写认证服务或用 Mock 身份 | 不采用 | 新建密码/签发/恢复权威，与真实 OIDC 要求冲突；Mock 不能证明 F2/F3 |

Keycloak 26.8.1 是当前固定候选，镜像摘要见来源；MySQL 8.4 线为推荐兼容目标，**最终镜像资格未完成**。Docker Library 实际 index 观察为 8.4.11、官方 MySQL 另有 8.4.12 容器安全补丁说明；标签/版本号不同不足以独立证明具体镜像安全或不安全，必须核对来源、实际字节和安全发现后才采用。不得因镜像拉取失败偷偷改源或绕过资格。

## 分步出口：始终复用一个实施分支

| 步骤 | 对应原 Issue | 输入/独立出口 | 本步不宣称 |
| --- | --- | --- | --- |
| S0 资源资格 | #14 的必要前提；#13 共享 | 固定镜像、隔离 MySQL/IdP、Discovery/JWKS、真实 code+PKCE、SQL 最小权限/持久化和重启证明 | 不关闭 F3，不证明 BFF/业务 IAM |
| S1 可信基础 | #14 子切片 | 原已审身份语义 + r001 获准策略；持久 Account/Access、OIDC BFF/Session、Yunka 读取唯一 Access Store | 不以页面本地 ID 或 IdP role 代替业务授权 |
| S2 营销纵向链 | #13 | S1 准入主体/数据资源；Function-only、Scope/跨租户拒绝、真实 Domain/回执和 Browser→BFF→Yunka→DB Trace | 不把有菜单作为 API 权限，不造第二生产入口 |
| S3 完整身份旅程 | #14 | 0/1/N 企业、双标签页、邀请/成员状态、最后 Owner 并发、撤权/CSRF/真实浏览器 | 部分基建合入不能提前关闭 #14 |
| S4 Domain 范围 | #15 | S1–S3；真实查询/写入/分页/导出/批量/统计与资源归属竞争 | 不从客户端过滤、不同动作 Scope 或 legacy group 扩权 |
| S5 统一执行 | #16 | 实际目标 Operation 清单和差分证据；HTTP/gRPC/Worker/Child 无旁路、UoW/Outbox 与回滚 | 未暴露/未测的 transport 不算已覆盖 |
| S6 资格与发布准备 | #17 | 真库/跨端/并发/恢复/观测、固定版本、演练与发布材料 | 未获生产环境/显式发布授权/实际回读时 #17 和父 #10 保持未完成 |

S2/S3 协作时必须先把子切片依赖写明，不能将互相等待伪装成完成。每步只保留一个 active 候选；main 合并后回读并重新对账，再在同一分支继续。仍有阻塞则保存候选与恢复条件，不丢弃必需项。

## 风险、资源与 Human 边界

非生产默认只绑定 loopback；其他成员访问云端环境需明确的受控入口/TLS，不自行公开管理台或数据库。凭据通过运行时文件/secret 提供，不提交测试默认密码或生产秘密；CI 随机生成并销毁自己的资源，不删除开发持久卷。

用户已决定 Docker MySQL / 非生产 OIDC，不再询问。剩余会话、邀请/恢复、旧 group 的取舍集中在 [决策表](decision-review.md)。部署目标、生产容量/SLO、诊断账户、SLS 开启凭据与费用预算仍属于 F6 Owner 的实际资源；未提供就保留 BLOCKED，不虚构生产准入。

验收以 [原义务映射](requirements.md) 和实际 Issue 原文为分母。这个技术路线不替代尚需项目 Preview 的 UI 同版设计，也不把“r001 文档审阅通过”写成“所有 F Issue 已冻结/可生产运行”。
