# 项目工作流接入

从 [AGENTS](../../AGENTS.md) 和真实 Issue/task 开始；[文档地图](../README.md) 按问题选择事实源，[路线](../roadmap.md) 提供带基线的交付投影。可查事实自行核实，材料性目标/权限/不可逆选择保留 Owner，不重复询问已确认的决定。

不完整意图先由 [目标协调](../../.agents/skills/intent-to-outcome-closure/SKILL.md) 调查和收敛；[记录合同](../../.agents/skills/intent-to-outcome-closure/references/goal-coordination.md) 定义版本绑定、候选比较、准备充分的决定与资源请求。广义软件目标使用 Design 内的 architecture 角色形成独立技术路线，再进入原三阶段；已有业务能力的批量操作走完整清单/预览/审核/获准生效/实际回读。探索可有假设，实施前冻结当期承诺与验收；新反馈按影响集处理。新方法不改写旧冻结合同；旧外循环 PR 是历史候选，不能当成已安装的调度服务。

## 选择当前阶段

读 [sdlc-workflow](../../.agents/skills/sdlc-workflow/SKILL.md) 路由；整体板块先读 [intent-to-outcome-closure](../../.agents/skills/intent-to-outcome-closure/SKILL.md)，冻结完整成员/R/AC/集成出口后再逐项推进。各阶段所需 Agent、内部 Skill、方法、契约、模板、样例与检测器只在所属包维护。

| 输入条件 | 所属包 | 给下一环节的文件 |
| --- | --- | --- |
| 原始意图和项目事实，需要同版方案/旅程/验收 | [Design](../../.agents/skills/sdlc-design/SKILL.md) | design-to-build.json |
| 完整已审设计、独立实施授权和真实验证条件 | [Build](../../.agents/skills/sdlc-build/SKILL.md) | build-to-deploy.json |
| 合格不可变产物、独立发布请求及观察/恢复能力 | [Deploy](../../.agents/skills/sdlc-deploy/SKILL.md) | deploy-receipt.json |

一个阶段的 checker `--task TASK --include-skill` 只输出当前能力、输入摘要、输出合同和资源路径。Agent 读取实际原件、产出/验证后再串联；内部 Skill 不派发后继。`exit 0` 可以是合法 BLOCKED，必须解析 state。静态 candidate/EXAMPLE_ONLY 不认证批准、CI、运行或执行权限。

## 项目绑定

UI 使用既有 `frontend/apps/console`、[Desktop 规范](../design/desktop-ui.md) 及 Design 内部 UX/Preview 能力；纯技术任务不制造业务 Demo。后端遵循 `backend/AGENTS.md` 和实际 Consumer/生成治理。当前业务与资源边界以 [架构](../architecture/README.md)、[契约](../contracts/README.md) 和具体已审任务为准。

日常检查、Node/Go/Python 前提及真实命令在 [CI 地图](../ci/README.md)；最终交付遵循 [风险门禁](../ci/RISK-BASED-GATES.md)。合并、部署及外部副作用分别验证现有授权，按冻结完成边界退出；main 集成任务不额外执行 Deploy。

## 继续已有记录

先恢复既有候选/未知副作用，核对当前 main、资源和已审原件；修改协议/方法会使相关 definition digest 失效，不重签旧审批求通过。当前入口按 [协议表](../../.agents/skills/sdlc-workflow/references/current-protocols.md) 选择检测器；已退休格式仅在其原 Git 版本恢复，禁止混用格式。

[迁移与退休路径](../../.agents/skills/sdlc-workflow/references/migration.md) 解释移除的别名、历史查询和必须保留的分发副本。单包复制检查只验证检测器/样例可运行；原生 Agent 发现与启动需要支持的宿主和实证。仓库不安装常驻调度器，也不因新增 Skill 授权自动部署。
