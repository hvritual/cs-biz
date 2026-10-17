# 当前业务路线

核验：2026-10-16，main `191189ba63ffcbda8f62be1981ae3b892172a9c9`；[来源快照](evidence/repository-state-2026-10-16.json)。这是带基线的投影，执行前回读 main、完整 Issue/PR 与原验收。[任务入口](tasks/README.md) 只保留实际业务消费者；工作流方法在所属 Skill，不再堆叠一次性建设任务。

## 当前成果和边界

| 能力 | main 已证明范围 | 仍缺的业务结果 |
| --- | --- | --- |
| Console / Authz V2 | 现有 Vue/Vben/Element Plus Mock、纯 Go Operation PEP / HTTP 绑定和授权负例；[前端](../frontend/doc/README.md)、[Authz](../backend/doc/AUTHORIZATION-V2.md) | 真实 IAM/Session/DB 与跨端业务闭环 |
| F0 / #11 | [PR #27](https://github.com/hvritual/cs-biz/pull/27) 交付同版 r005 设计；[冻结原件](tasks/F0-yunka-freeze.md) | 后续 F 实现不由设计交付自动证明 |
| F1 / #12 | [PR #31](https://github.com/hvritual/cs-biz/pull/31) 交付固定 Consumer/工具链、生成装配零漂移、只读探针、JSON stdout、本地可查询 Trace；[任务](tasks/issue-12-f1/task.md) | 真实业务 Browser/BFF/Domain/RPC/Outbox 和生产资格 |
| S0 资源 | [PR #38](https://github.com/hvritual/cs-biz/pull/38) 真实 CI 验证 Docker MySQL / 非生产 OIDC，保留标准生产 IdP 适配入口；[资源任务](tasks/f-series/S0-resources.md) | 资源可用不等于业务 IAM/Session/Domain DB 或生产接入已验证 |
| 工作流连续性 | [PR #39](https://github.com/hvritual/cs-biz/pull/39) 已合入；main [Full #38914775714](https://github.com/hvritual/cs-biz/actions/runs/38914775714) QUALIFIED | 宿主会话驱动的协调，不是无人值守服务；恢复以实际Human来源为准 |

## Yunka F：恢复设计，保留完整出口

当前状态为 **DESIGN_CONTENT_COMPLETE / REVIEW_DELIVERY_UNVERIFIED**：Human 于2026-10-16 22:49明确恢复F2–F6，22:54要求开始同版设计/旅程/验收与准入对账；见 [F系列任务](tasks/f-series/task.md)。r003历史内容候选保留，正式交互审阅交付尚未核实；r002保留历史，不代表本版验收；P1/P2/P4/P7按影响范围待决定，生产P6只阻塞相应出口。Goal继续维护完整原R/AC与逐切片准入。

| 单元 | 必需结果与依赖 | 当前缺口 |
| --- | --- | --- |
| [F2 #13](https://github.com/hvritual/cs-biz/issues/13) | 首条营销 Function-only Operation；无 Menu 仍依法执行，Scope/跨租户/未知结果负例和跨端 Trace | 设计准入、真实主体/grants 与业务纵向链待完成 |
| [F3 #14](https://github.com/hvritual/cs-biz/issues/14) | 持久 Access/Session、0/1/N 企业、标签页上下文、撤权/CSRF/并发及真实 DB/API/浏览器 | 资源已具备局部前提；业务策略、前端同版设计待Human审核，真实实现/证据仍缺 |
| [F4 #15](https://github.com/hvritual/cs-biz/issues/15) | F2+F3；CRM/营销查询/写入/批量/导出/统计强制 Tenant AND Scope | 待依赖与真实 Domain 实现 |
| [F5 #16](https://github.com/hvritual/cs-biz/issues/16) | F2–F4；统一受保护执行链，兼容/负例/回退验证后下线旧 Router | 不能在本轮“旧协议清理”中直接删除业务 Router |
| [F6 #17](https://github.com/hvritual/cs-biz/issues/17) | F3–F5；真库、安全、审计、幂等/恢复、性能、生产发布/回读 | 缺实际目标环境资格与生产发布授权 |

父 [#10](https://github.com/hvritual/cs-biz/issues/10) 保持开放。只有全部原 AC 与整体集成出口有当前充分证据才关闭；[SAAS-01](journeys/SAAS-01-tenant-onboarding.md) 仍缺真实跨端证明。客户/点位/设备、租赁/服务、经营计费另需业务定义。

## Observability O1

[#19](https://github.com/hvritual/cs-biz/issues/19) 保持开放；[O1 任务](tasks/observability/task.md) 保留 TR-01–04、LG-01–03、SEC-01、QUAL-01 与 P0–P3 全部分母。F1 是技术前提，真实浏览器错误、业务 Trace、RPC/Outbox、SLS 开关/故障/采样/隐私及运维 SOP 仍待验收。

旧 PR #2/#7/#8/#18/#21/#23/#25 是未合并候选，不能算 main 能力或重合并整包。分支清理只退出历史候选，不关闭其未完成业务 Issue；精确 head/原始讨论可从 PR 与清理 PR 的恢复清单查询。恢复前以当前 main 核对差异、依赖与原审核边界。

当前工程交付政策只在 [风险门禁](ci/RISK-BASED-GATES.md)。局部完成或阻塞先返回 Goal，按原目标回读实际证据、限定受影响范围并选择下一项已授权工作；Human stop 优先。

当前F2–F6设计推进到 [r003完整页面与异常旅程](tasks/f-series/rounds/r003/solution.md)：先完成可交互设计及浏览器验证，再由Human同版审阅。业务Build与生产资格不因设计页面完成而通过。

F系列r003现已形成[完整交互审阅候选](tasks/f-series/rounds/r003/review-summary.md)，精确源码Full验证见该轮记录。最终入口验证及新增任务效率/批量/结果义务待后续修订，不直接转交Human排障；业务F2–F6/O1与生产资格继续保持未完成。

审阅交付状态纠正及本次维护：[工作流修订记录](tasks/f-series/workflow-review-delivery.md)。原封存轮次保持字节，工作流修订不恢复已停止的业务实施。

2026-10-17 Human确认执行 [r004完整用户旅程与UI计划](tasks/f-series/rounds/r004/solution.md)：沿最新分支建立新轮，原32页/233声明状态、J01–15与X01–12不缩减，补齐三种批量入口、已选详情、内联影响、就地结果及恢复。当前内容计划已独立反查；Preview实际路径及最终入口仍在验证，不提前标记正式可审阅，不进入业务Build/合并/生产。当前旅程见[r004](tasks/f-series/rounds/r004/journey.md)。

2026-10-17 Human确认[Design完整角色旅程审阅调整](tasks/f-series/review-role-journeys.md)。r004改以正常入口、真实业务导航和同一对象跨角色交接组织Human体验；[完整脚本](tasks/f-series/rounds/r004/human-review.md)已编排，连续旅程证据及Human审阅未完成，保持CHANGES_REQUESTED。

2026-10-17需求发起人进一步明确Design loop四项目标：完善需求、规划旅程、设计前端、输出体验操作流程；产品体验与工程检查分开。当前修正见[体验定义](tasks/f-series/review-role-journeys.md)，全量交付状态按实际证据保留。
