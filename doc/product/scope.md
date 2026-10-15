# cs-biz 产品范围、三权与可验收业务结果（2026-10-15）

## 当前产品目标

将咖啡机运营及租赁相关租户工作，从设备与企业身份基础能力逐步落到可直接使用、可复核、可授权的数据与业务操作。最先兑现的结果是**新企业可进入、负责人可授权、员工可完成自己的任务且不会跨企业越权**，而非仅完成租户/角色页面。

**现实边界：** main 已有 Vue 3 + Vben Admin 5 + Element Plus Desktop 控制台、有状态本地 Mock 和 Go 1.23 Operation 授权内核测试。真实 Account/IdP/BFF、数据库 IAM、可部署 REST、Yunka Consumer 及生产交付均不存在。[PR #7](https://github.com/hvritual/cs-biz/pull/7) 的身份第一切片、[PR #8](https://github.com/hvritual/cs-biz/pull/8) 的三权/营销候选尚未合并；代码候选测试通过不代表生产业务。

## 固定业务规则：权限分为 Menu / Function / Data

| 场景 | 菜单可视 | 功能可用 | 数据可见 | 价值结果 |
| --- | --- | --- | --- | --- |
| 企业管理负责人 | 具有企业中心授权菜单 | 成员/角色/客户等各 Function | 各 Function 的有效 Tenant/分配范围 | 在同企业范围内分配权限和管理运营 |
| 客户经理 | 客户页面可见（仅当授予 Menu） | 看客户、更新客户可分别授权 | read=tenant、update=self 可以并存 | 全部客户可读，只有本人客户可修改 |
| **营销执行普通成员** | **无 Console 菜单，不能进入后台** | marketing.campaign.read/execute | 本人负责营销活动 | 不进入管理后台也能按权限营销 |
| 有菜单但无功能 | 菜单可见 | 无具体受保护 Function | 无对应数据访问 | 进入受控页面，不可通过 API 直读/改 |
| 成员禁用/退出 | 会话/工作区按当前状态撤销 | 新请求被拒 | 不可再取已撤权企业数据 | A 企业停用不影响同账号 B 企业的合法成员 |

**重要前提：** “不能进入管理后台”不等于“不能通过身份认证”；MenuGrant 只控制 Console 的前端导航/路由，不是后端 API 权限。API 验证当前可信 Account/Tenant/Membership + Function，并注入该 Function 的 Data Scope；Domain 负责安全 SQL/更新。商业模块开通是另外一个条件，不授权角色。

## S01 已实现的体验范围

已有工作台、客户、成员、权限集、企业资料、应用中心、平台企业管理和个人偏好页面，支持中英文、主题、动态菜单和本地账户/企业切换。Mock 包含客户搜索/筛选/分页/详情/添加/编辑/归档，成员本地创建/停用、角色分配、模块申请/开通、必要的幂等模拟。账号切换不验证密码、成员创建不发送真实邀请、模块申请不支付。这些只证明浏览器演示行为。

PR #7 追加 0/1/N 企业选择、四态成员纯 Go 决策候选；PR #8 追加独立 MenuGrant/Function/逐操作 Scope 编辑器、Marketing-only 页面与 Scope 纯逻辑。二者尚未合入 main；不得把候选 seed、角色、菜单与 main 的本地数据混为一套。

## 首个真实业务闭环与验收

**SAAS-01：** 平台创建租户并开通必要模块→Owner 邀请/激活成员→成员经真 IdP 登录→独立标签页选择 Tenant→授权 Console Menu 或营销入口→每个 Function 的当前 Permission+Data Scope→执行真实 CRM/营销业务→事务/审计/回执→撤权、切企业、失败重试都正确。

**MKT-01：** 没有 Console Menu 的营销成员能正常营销，但所有后台深链和未授权资源 API 拒绝；关闭营销模块不删除 IAM Grant。

真正完成要有真实 API、持久数据库、跨租户/越界读写负例、无副作用拒绝、在途撤权、幂等与丢回执 readback、浏览器测试与安全审阅。不能拿 Mock 菜单和 Go Fake 测试声明 SaaS 业务已完成。

目标细节：[SAAS-01](../journeys/SAAS-01-tenant-onboarding.md)、[MKT-01](../journeys/MKT-01-function-without-console.md)、[Access V3](../contracts/three-rights-v3.md)。

## 后续业务地图（建议，不是实现清单）

| 业务角色或领域 | 真实业务结果 | 数据/权限重点 |
| --- | --- | --- |
| 平台运营 | 租户创建、模块开通和审计 | Platform 独立 Audience，不自动取得租户数据 |
| 企业中心 | 成员授权、企业组织与应用状态 | Role 委派上限、最后 Owner、每租户的账号关系 |
| 客户/点位/设备 | 客户关系、点位运营数据与设备真实归属 | 点位为数据归属单位，客户为经营汇总单位；Data Scope 按 Operation 而非只按菜单 |
| 租赁/服务 | 租赁合同、服务工单、执行者、操作结果 | 多角色协作与状态、额度/账务规则待确认 |
| 营销 | 内容/活动及执行 | 无后台菜单仍可拥有独立 Function/Scope |
| 经营与资金 | 用量、收入、支出、应收应付与参与人分配 | 真实账务数据、幂等对账、审计与恢复 |
| 开放集成 | IoT、支付、通知、开放 API | Service/Worker 身份、受保护 Operation 和事件回执 |

## 当前路线与开发约束

[Issue #10](https://github.com/hvritual/cs-biz/issues/10) 记录 F0–F6：契约冻结→Yunka 版本/Consumer 生成→营销纵向试点→Access/Session 真链→SQL Scope→单执行路径切换→Production。**Yunka 条件采纳尚未实际导入**；工具链从 Go 1.23 到锁定 Go 1.25.13/protoc 3.21.12 的实际兼容，连同 IdP/数据库/用户激活策略，均需独立测试与人审。路线和代码状态见 [Roadmap](../roadmap.md)，新功能接入见 [SOP](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)。

对外 UI 只能显示真实业务结果，不显示 Mock/未接入等工程术语；工程限制要写在开发文档。目标市场、商业套餐/税费/支付/退款及海外合规需要业务决策，暂不虚构收费或已上线能力。
