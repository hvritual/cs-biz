# 当前路线与任务出口

核验：2026-10-16，main `29c525d7f90cf61075f00a20efc1465a29b2c6db`。来源为 [GitHub/源码快照](evidence/repository-state-2026-10-16.json)；它是状态投影，不是新的任务数据库或实施授权。继续工作前回读 main、完整 Issue/PR 和当前验收。任务原件见 [导航](tasks/README.md)。

## 当前已交付与未完成

| 能力 | 当前 main 事实 | 来源 / 完成边界 |
| --- | --- | --- |
| S00 / S01 | 结构和 Vue/Vben/Element Plus Console 已合入；业务 UI 仍由本地 Mock 支撑 | PR [#1](https://github.com/hvritual/cs-biz/pull/1)、[#3](https://github.com/hvritual/cs-biz/pull/3)，[前端源码/文档](../frontend/doc/README.md) |
| Authz V2 | 纯 Go Operation PEP、HTTP 绑定与授权负例已存在 | PR [#4](https://github.com/hvritual/cs-biz/pull/4)，[Authz](../backend/doc/AUTHORIZATION-V2.md)；不等于真实 IAM |
| F0 / #11 | r005 同版设计已确认并交付，Issue 已关闭 | PR [#27](https://github.com/hvritual/cs-biz/pull/27)，[设计与交付入口](tasks/F0-yunka-freeze.md) |
| F1 / #12 | 固定 Consumer/工具链、生成/装配零漂移、loopback 只读探针、JSON stdout 与本地 Collector/Jaeger 查询已交付，Issue 已关闭 | PR [#31](https://github.com/hvritual/cs-biz/pull/31)，[F1 任务](tasks/issue-12-f1/task.md)、[Consumer](../backend/doc/YUNKA-CONSUMER.md) |
| 开发治理 | 风险门禁、tester-army、模块验收冻结和 Design/Build/Deploy Agent 工作流已合入 | PR [#29](https://github.com/hvritual/cs-biz/pull/29)、[#30](https://github.com/hvritual/cs-biz/pull/30)、[#32](https://github.com/hvritual/cs-biz/pull/32)、[#33](https://github.com/hvritual/cs-biz/pull/33) |
| 真实业务闭环 | 真实 IAM/Session/DB、营销 Operation、Domain Tenant+Scope、统一执行链和生产资格仍未完成 | F2–F6 原验收保留；[SAAS-01](journeys/SAAS-01-tenant-onboarding.md) 仍缺真实跨端证明 |

开放 PR #2/#7/#8/#18/#21/#23/#25 是候选，不能视为 main 能力；旧分支须先做当前基线/设计/依赖对账。#19 的完整可观测性和 #22 的持续目标外循环仍开放；F1 本地技术 Trace 不证明浏览器全链路、商业运行或整个 #19 完成。Issue/PR 正文中的历史状态也须与最新回执和源码交叉核实。

## MVP：F0–F3 的一条真实纵向链

| 单元 | 依赖与输入 | 可观察出口 | 当前准入 |
| --- | --- | --- | --- |
| F0 [#11](https://github.com/hvritual/cs-biz/issues/11) | 事实、权限/Consumer边界、同版本审阅 | 固定设计、资源/权限与负例 | 已交付；不要重做旧冻结 |
| F1 [#12](https://github.com/hvritual/cs-biz/issues/12) | F0 固定工具/SDK/CLI | 真 Consumer 生成/装配与本地技术查询资格 | 已交付；继续遵守锁/制品到期检查 |
| F2 [#13](https://github.com/hvritual/cs-biz/issues/13) | F1；复核 #8 营销设计、可信主体/当前 grants、真实资源及 Trace 条件 | 无 Console Menu 仍可依法执行营销 Function；Scope/跨租户/无权/未知结果反例和跨端 Trace | 待设计准入；不能用本地身份/Fake 代替实际前提 |
| F3 [#14](https://github.com/hvritual/cs-biz/issues/14) | F1；复核 #7/#8；D2 DB、D3 IdP/Session 与组织资源 | 持久 Access/Session、0/1/N 企业、标签页上下文、撤权/CSRF/并发/真实 DB/API/浏览器 | 材料性资源/决定仍需 Owner；可与 F2 划分已冻结子切片 |

## Full Runtime 与 Production

| 单元 | 依赖 | 验收结果 |
| --- | --- | --- |
| F4 [#15](https://github.com/hvritual/cs-biz/issues/15) | F2 + F3 | CRM/营销真实查询、写入、批量/导出/统计强制 Tenant AND Scope |
| F5 [#16](https://github.com/hvritual/cs-biz/issues/16) | F2–F4 | 统一受保护执行，旧 Router 在兼容/负例/回退证据后下线 |
| F6 [#17](https://github.com/hvritual/cs-biz/issues/17) | F3–F5、真实环境/资源/发布授权 | 真库、安全、审计、幂等/恢复、性能与生产发布/回读 |

F4–F6 均待实施。父 [#10](https://github.com/hvritual/cs-biz/issues/10) 保持开放，只有全部必需 AC 和整体集成出口有当前证据才关闭。后续客户/点位/设备、租赁/服务、经营计费等仍须独立业务定义和旅程，不能凭此技术路线推定完成。

## 如何继续

从实际任务和 [工作流接入](workflow/SDLC-ADOPTION.md) 选择一个已授权且依赖满足的单元，先核实原验收/未合并候选/资源；模块批次先冻结完整分母，不仅筛 open 列表。一个分支阻塞不丢成员、不私改标准；记录 Owner、原始证据和恢复条件，按授权继续独立分支。现行交付政策只有 [风险门禁](ci/RISK-BASED-GATES.md)。
