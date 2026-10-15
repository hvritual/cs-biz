# S02-ID：从用户生命周期/登录规范到 cs-biz 完整旅程的实施任务

> 基线：`cs-biz main@af021df9721d745920d4147763e895c982ee601d`。来源：`biz@a8a2368f` 的生命周期与登录旅程，现已适配 `cs-biz` 的 Scope、Desktop 和按标签页独立企业选择规则。**本候选只包含可无凭据落地的前端旅程与纯 Go 决策；不是声称真实登录/邀请已实现。**

## 1. 目标、范围与验收权威

**最终可交付结果：** 平台创建/启用企业 → 有效 Owner 邀请员工 → 邀请经真实渠道投递 → 员工本人激活身份 → 安全登录 → 0/1/N 企业选择 → 页面/业务资源按权限开放 → 角色更改、停用、移除与恢复正确 → 用户可检查操作完成、失败知道下一步；同时两个浏览器标签页的选择可以不同但不会造成跨企业写入。

**本阶段非目标：** 复杂商业 PlanVersion/计费/付费、经营模块全部实现、手机布局、真实生产发布或跨仓库搬源码。

- 规范源：[ID-01](../journeys/ID-01-member-lifecycle.md)、[ID-02](../journeys/ID-02-login-workspace.md)、[身份旅程 YAML 候选](../contracts/identity-journey-v1.yaml)。
- 现有 `backend/internal/platform/authz` 是唯一 Operation 授权内核；**禁止第二套 IAM/Grant 引擎**。商业应用开通不加入 authz 内核。
- 现有 `frontend/apps/console`、Vben5/Element Plus、[Desktop 规范](../design/desktop-ui.md) 不替换；不新增移动端断点。
- 业务 API 合同必须在 `doc/contracts/openapi/` 形成唯一正式结构源；当前 Markdown 中的路径是提案，尚不能供生产消费者依赖。
- 安全边界是一个新授权决策点：旧预览 `selectUser` 与 LocalStorage 绝不是正式登录。

## 2. 当前实现状态与迁移差异

| 能力 | 主线事实 | 本候选增量 | 剩余生产缺口 |
|---|---|---|---|
| 用户登录入口 | 本地账号选择，无密码校验 | 保留 Preview 与用户主动“选账号”的行为分离 | 真正的 Account/IdP/BFF |
| 企业选择 | S01 同一标签页自动恢复/首选第一个企业 | 0/1/N 策略、`/auth/tenants`、zero-tenant recovery、路由保护 | 服务端签发并校验标签工作区上下文 |
| 前端授权菜单 | S01 本地 Mock 投影/本地 viewKey 白名单 | 切企业前清业务 Context、保留旧迟到请求防护 | 由可信 API 提供会话与菜单；实际服务端拦截 |
| 成员 | S01 active/disabled + 本地创建即 active | Go 四态迁移和 last Owner 纯规则/测试 | persistent invited/activation/remove/restore/审计/outbox |
| 权限 | V2 `internal/platform/authz` 已合入 | 不改 Kernel，只将身份规则加到 `internal/access/identity` | 真实 CurrentAuthority、账户、Role/Grant/Scope DB Adapter |
| 真实投递 | 无 | 不假称已发送 | SMS/Email provider、密钥、callback/worker/审计 |
| 风险/测试 | 浏览器 Mock、Go authz Fake | 纯 Go 正反例 + 0/1/N UI 浏览器测试定义 | MySQL+OIDC+API+Browser 真链路资格 |

## 3. MVP Roadmap

| 切片 | 目标/输入 | 交付输出 | 不做什么 | 风险与 Human Gate | Codex 一次完成? |
|---|---|---|---|---|---|
| **S02-ID-01 本 PR** | 现有 Mock 账号及租户+来源用户旅程 | 0/1/N 企业选择页；登录后的 tenantless 区分；Go 纯成员状态/Session 判断；规格、单元/E2E 候选 | 不接真 IdP、DB、短信/邮件，不把 Mock 当真权限 | 默认预选/失败重定向/旧测试回归，需 Full Browser 证明 | 是，限制当前差量 |
| **S02-ID-02** | 已选择并获批准的身份提供者、Session 策略和账号生命周期政策 | `AccountSession` + 单标签 `WorkspaceContext` 的信任边界，服务端 Cookie/CSRF/过期/撤销，OpenAPI | 不复制 Biz 全局 tenant cookie；不发布业务模块 | Security+PO 审批 Session TTL/多标签语义 | 每次选一条垂直流 |
| **S02-ID-03** | 既定 DB/迁移技术 + 唯一 Account 关联规则 | 真实 Account/Tenant/Membership/Role/Grant DB、CurrentAuthority 适配、请求时授权及资源隔离 | 不引商业 PlanVersion、跨仓库 ORM 搬迁 | 迁移/并发/账号唯一性等需审批 | 分成多次 |
| **S02-ID-04** | 前两项真实 API | 真实登录/身份探针/选企业/授权投影前端 typed service，Demo service 显式独立 | 不允许有凭据的页面掉回 Mock 成功 | 浏览器路由/深链接/CSRF/跨标签隔离 | 各独立 |
| **S03-ID-01** | 真实持久 Access + 安全邮件或短信 | 成员 invited→本人激活→active；创建 receipt/readback；安全通知 | 未获真实渠道不能声称 delivered | 供应商/凭据/邮件来源地址审核 | 多次小切片 |
| **S03-ID-02** | 正式 Member API + 当前授权 | 停用/恢复/移除/本人退出、最后 Owner 与会话撤销、角色/数据范围重验 | 不直接改 Account 全局密码 | Owner 并发/删除恢复策略需批准 | 多次小切片 |
| **S03-ID-03** | 真实 IdP+BFF+Access+浏览器 | E2E 从建立用户到跨企业业务，再到撤权/恢复完整覆盖 | Mock/快照不充当生产证据 | 验收责任/独立审阅 | 独立验收 |

**每一个 slice 输入**至少包括冻结基线、业务 Actor/Object、期望结果、范围、权限、数据源、已有组件、正反验收和失败恢复；不满足时必须返回 `BLOCKED`，不得捏造 Provider/数据库凭据。

## 4. Full Runtime Roadmap

完成正式身份闭环后，再接客户/点位/设备管理、组织、租赁/工单和跨租户协作；所有新模块复用上述 Account→WorkspaceContext→Canonical Operation→ResourceScope→Readback，另由应用领域检查租户是否开通。对系统已有的 CRM 应采用真实跨租户列表/写入/批量/导出权限证据验证，不能只测试导航隐藏。

预计专属协作角色（经销商、服务商、租赁商、使用方）仍然是业务主体关系，不再创建另一套登录系统；如需要代理/委托必须有独立授权协议和审计。

## 5. Production Roadmap

- **身份安全**：最小密码要求、登录锁定、OTP 限流、Email/SMS sandbox、Cookie/CSRF/session fixation/同源跨域、回调重放、密钥轮换/撤销；
- **隔离与正确性**：真实数据库 CAS、最后 Owner 并发、双租户共享账号、用户 A/B 标签页独立工作区、撤权写入前重验、lost reply/幂等重放；
- **投递**：Outbox、provider accepted vs delivered、重试预算、不可达通知的恢复；
- **运行**：审计、监控、恢复演练、多实例、备份/恢复和清晰的用户支持路径；
- **发布**：与当前 PR 不同的显式生产授权；固定 SHA、Migration 版本、真实测试材料、人审结果和可回滚方案。

没有上述环境和证据，不得把页面存在或 Go unit green 称作生产资格。

## 6. 修改边界、命令与门禁

| 阶段 | 允许修改 | 禁止修改 | 验收命令/证据 |
|---|---|---|---|
| 本 PR | `frontend/apps/console/src/{views/auth,platform,router,store,locales}`、目标 E2E；`backend/internal/access/identity`、`backend/ci/check.sh`；本任务下 `doc/**` | Vben 上游包、全局 CSS Token、Authz V2 内核、S01 mock 服务安全模型、其他仓库、真实生产配置 | `python3 doc/ci/check_repository.py`；`cd backend && bash ci/check.sh`；`cd frontend && corepack pnpm check:fast`；按当前 No-Stall 运行 Desktop/Full |
| 后端服务切片 | 受审定的 `backend/internal/access` + API/迁移 + `doc/contracts/openapi` | 裸写绕过 Operation HTTPRouter、第二套 Permission Catalog、真实 secret 入仓 | 真实 Go Test/Race/Vet、真实存储正反例、API contract、session recovery |
| 前端 API 切片 | `frontend/apps/console/src/api`、相应 store/页面和 E2E | 用演示数据兜底真实请求失败、页面重新定义 Shell/token | Type/lint/i18n、Desktop 1366×768/1440×900/1536×1024、真实浏览器截图 |
| 生产资格 | 审批后的 deploy/CI/配置/审计/运行手册 | 未审批上线、直接 push main、保护门禁退化 | 明确的发布审批、provider sandbox、故障/数据恢复、独立验收 |

**注意：** `backend/ci/check.sh` 这轮只证明 Go 规则，不做数据库或服务端登录验证。前端 Typecheck/E2E 要同精确 SHA 关联；旧主线绿色不能替代当前候选。遵守 [No-Stall Gate](../ci/NO-STALL-GATES.md)：Fast→Targeted Desktop→Full，在 Fail 时审查真实根因，不能反复无改动重跑。

## 7. Human 决策（不由 AI 默默设置为默认）

| 需要决策 | 当前建议/边界 |
|---|---|
| 认证体系 | 优先使用标准 OIDC Code+PKCE、同源 BFF；具体 IdP/Account Authority 未选择 |
| MySQL/Postgres、迁移 | 采用 Go 模块化后端与交易型关系数据库，但正式选型及运维约束未批准 |
| 会话策略 | TabWorkspaceContext 按标签页独立是 cs-biz 已有明确要求；TTL/注销粒度、全局强退/风控需审批 |
| 邀请/密码/OTP | 只在有真实安全渠道时打开对应功能；验证码 TTL/次数、账号标识政策需审批 |
| 成员删除与恢复 | `removed` 为目标四态之一，但旧角色/范围恢复细则需审批，不得重放撤销的 Grant |
| 生产责任 | 身份/安全/隐私/消息验收责任人与证据签署，必须有真实组织角色 |

## 8. 本候选检查与结论

**Scope check：** 修改现有 Console 的选择路由和纯 Go 安全决策，不创建新框架或整套运行服务。**Dependency check：** 前端依赖现有预览服务；后端仅用标准库；真 API 需要另一个独立切片。**Authority check：** `platform/authz` 不变，CSRF/IdP/DB 不冒充存在。**Evidence check：** 只有 CI 对精确提交完成后才能报告 Fast/Full PASS；此文档本身是规范，不能自证验收通过。

**Done 规则：** `S02-ID-01` 可标记实现候选；`S02`/ `S03`/真实用户旅程 **NOT_DONE**，直到真登录、存储、通知、API 负例与浏览器全链路通过。
