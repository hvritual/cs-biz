# 文档地图：按当前任务读取

先读根 [AGENTS](../AGENTS.md) 的行为与权限边界，再用下表选择需要的事实。本文负责导航和所有权，不复制业务契约、任务状态或门禁规则。根目录责任见 [布局](architecture/repository-layout.md)。

| 当前问题 | 唯一入口 / 所有者 | 按需读取 |
| --- | --- | --- |
| 当前交付到哪里、哪些依赖未满足 | [roadmap](roadmap.md) | 当前 main / 实际 Issue、PR、精确版本证据；快照仅作起点 |
| 本次任务原始目标、验收、允许文件 | [任务导航](tasks/README.md) → 具体 Issue/task | 已审 rounds/handoffs、当前交付证据；新任务用 [模板](templates/task.md) |
| 业务结果与用户旅程 | [产品范围](product/scope.md)、[旅程索引](journeys/README.md) | 相关旅程的成功、拒绝、未知结果和恢复，不预读全部旅程 |
| 系统边界与已采纳决定 | [架构](architecture/README.md) | [ADR-0001](architecture/adr/0001-frontend.md)、[ADR-0003](architecture/adr/0003-yunka-f0-consumer-contract.md)、[历史选型](research/vue-admin-selection.md) |
| 何处是合同源，什么只是提案 | [契约索引](contracts/README.md) | canonical typed PB、Access 需求或具体已审设计；不复制第二份 schema |
| 如何选择/恢复阶段、消费哪个格式 | [工作流接入](workflow/SDLC-ADOPTION.md) | 所属工作流 Skill、当前能力与其引用；不预加载所有 Skill |
| 意图不完整、如何调查/准备决定/选择操作路线 | [目标协调](../.agents/skills/intent-to-outcome-closure/SKILL.md) | 多源证据、产品方案、独立架构分析、资源与 Human 请求；沿当前任务按需读取 |
| 当前检查、失败恢复与交付条件 | [CI 地图](ci/README.md) | [风险门禁](ci/RISK-BASED-GATES.md)、[恢复](ci/NO-STALL-GATES.md)、适用端的检查 |
| 前端布局/数据/浏览器 | [前端文档](../frontend/doc/README.md) | [Desktop 契约](design/desktop-ui.md)、[来源适配](design/biz-v12-sync.md)、Mock、E2E |
| 后端权限/Consumer/生成/Trace | [后端文档](../backend/doc/README.md) | Authz、接入规程、实际锁/生成源与 CI |
| 一个结论有什么证据 | [证据导航](evidence/README.md) | 精确提交、命令、环境、原始结果、实际外部回执 |

## 冲突与时效

- 当前授权来自真实用户/组织记录；仓库规范不能自行扩大权限。
- 目标含义来自原始要求和同版本已审设计；proposed 文本只提供选项。语义变化回 Design，不用实现反改验收。
- 已有能力以当前源码/消费者和测试核实；合并以 Git/GitHub 回读核实，部署以目标环境直接观察核实。
- 路线和快照有日期/基线；与 live state 不同时先回读并更新投影，不重新实现已交付能力。
- [历史记录](evidence/README.md) 只解释所记版本，不覆盖现行门禁。冻结记录不改；旧文件按其 commit 查询，不能用旧状态要求重复批准或把旧 PASS 冒写为新执行。

结构检查可以证明文件、归属、链接和引用有效，不能自动证明语义完整、审批真实或业务已完成。新增现行文档必须明确职责，并从所属入口链接；历史原件留在原任务，避免进入默认加载路径。
