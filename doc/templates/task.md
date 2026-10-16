# TASK-ID：一个可观察成果

## 状态与来源

- 状态：proposed / ready / in-progress / verified / merged / blocked
- 来源：业务意图、Issue、关联用户旅程
- 仓库与基线：owner/repo、分支、完整 SHA、核验时间
- 当前授权：允许的实现、仓库写入、合并、部署范围分别记录
- 必须先决定的事项：仅列会实质改变产品、架构、数据或风险的事项

## 目标与成果

用一句话写出哪个角色在什么条件下完成什么操作，最终看到什么结果。列出如何从外部证明成果存在。

## 依赖与边界

| 字段 | 内容 |
| --- | --- |
| 必需输入与依赖 | 真实数据、接口、账号、环境、上游任务及其当前证据 |
| 本任务输出 | 代码、契约、可见行为、测试与交付证据 |
| 允许改动 | 精确文件/目录或有边界的模块 |
| 禁止改动 | 本任务外的实现、受保护路径、生产数据等实际限制 |
| 排除范围 | 本次不承诺的邻近业务成果 |
| 回退 | 可逆步骤及对数据的影响 |

## 用户旅程与状态

写出入口、关键操作、确认、成功、无数据、无权限、未开通、错误、重试与结果未知的处理；适用时列 Screen ID。业务写入明确幂等、恢复和撤权语义。

## 契约与技术边界

引用唯一 PRD/ADR/OpenAPI/权限码来源，描述 schema、兼容性、消费者、租户、数据范围与业务状态。未实现的契约明确标记 proposed。

## 验收

| 结果断言 | 准备条件/反例 | 真实命令 | 预期 | 证据位置 |
| --- | --- | --- | --- | --- |
| 填写可观察结果 | 至少覆盖相关失败或越权情形 | 必须对应真实入口 | 明确通过/拒绝条件 | 日志/截图/报告 |

## Human Full CI 决策（仅引用真实 GitHub 记录）

当前请优先记录 `doc/ci/RISK-BASED-GATES.md` 的 base/head/tier、真实所选 job、quality-gate 和 receipt、内容审阅、main 回读。自动风险门禁通过后不再要求以下逐 PR Human Full/豁免字段；它们仅用于可选手动诊断或真实例外。Human 设计/价值/不可逆事项审批仍分别保留。

先按 `doc/ci/DOCS-AUTO-DELIVERY.md` 分类：符合条件的文档 PR 记录 base/head、分类/内容核验及适用检查，使用 DOCS_AUTO_QUALIFIED / NOT_REQUIRED_DOCS，无需 Human 审核或豁免。以下 Human 决策字段仅适用于非文档自动交付候选。设计确认与产品决定不在豁免范围内。

- 决策：RUN_FULL / WAIVE_FULL（仅严格限定的治理/文档/Skill 类）/ DEFER。
- PR 号、完整 head SHA、Human 在 GitHub 的实际身份与批准记录：
- RUN_FULL：主分支手动 Run ID / attempt、Frontend Full 结果、独立 receipt 与测试环境：
- WAIVE_FULL：具体范围、未运行检查、剩余风险、独立审查和真实 Human 批准；不得写为 PASS：
- SHA 变化或无有效决策时保持 WAITING_HUMAN_FULL，不推定可合并。

## 交付记录

- 实际改动文件、分支及 head SHA。
- 必需门禁逐项 pass / fail / unavailable，并记录真实输出；跳过不算通过。
- 独立评审发现、修复与重跑证据。
- PR、必要授权、合并状态、合并后主线 SHA 与回读证据。
- 尚存风险、阻塞、下一动作和负责方。

## 自检

范围是否匹配目标？依赖是否真实存在？文档与代码是否同一语义？门禁能否从反例证明行为？当前声称的完成状态是否有同版本证据？是否把界面/Mock、仓库合并和线上结果混为一谈？

## UI task contract

Before a frontend implementation, read **doc/design/desktop-ui.md**. Record UI page template, authorized actions, desktop screenshots at 1366/1440/1536 widths, negative interaction checks and actual Playwright results tied to the same commit.

## Required delivery gate for any new frontend task

Use **doc/ci/RISK-BASED-GATES.md**. Record failing assertion/source, Fast and focused UI proof, then final exact base/head/tier, all selected jobs, browser reports/counts, independent quality receipt and review. Wait for real results, not a repeated Human dispatch. No unverified assertion changes, stale/duplicate conclusions or merging a red/pending/unavailable required gate. GitHub protection requires actual admin configuration and cannot be inferred from a successful workflow.

## Intent / Design 交接（新任务）

按 [工作流 v2](../workflow/INTENT-DESIGN-WORKFLOW.md) 与 [交接索引](../workflow/DESIGN-HANDOFF-CONTRACT.md) 记录，现有任务仍为唯一状态来源。

- 原始要求原文/来源/摘要、优化提示、IntentSpec、逐项 raw → Intent → 设计/AC 追溯：
- 自动引用的 ADR/doc/当前源码（路径、完整 commit、摘要、定位、accepted/proposed/superseded/conflict/current_source 等状态）：
- 使用条件、可提供 API/数据/账号/环境、资源/预算、Human 偏好与决策树（依据、选项/代价、答案来源、未决项/责任方）：
- 同轮 solution.md、requirements.md、design.md、journey.md、flow.mmd、UX 分析和 design-loop.json：
- 前端 Preview 的项目内源码/复用组件、隔离方式、入口/命令、场景、精确候选、真实浏览器日志/截图；非 UI 须说明理由：
- 自动完成哪些工作、Human 判断哪些工作；批量是否采用文本导入选定，去重/匹配/歧义/权限/范围/影响/部分结果/未知恢复：
- Human 对同版本方案与旅程的真实审阅记录；partial 不视为 approved；旧版本修改后重新确认：
- 交给工作流外执行模型的 R/AC、保留项、允许/禁止路径、资源/风险、验证建议、独立实施授权与退回条件：

实施模型负责落地、核实、门禁和证据回读；Design 交接、Fast、Human Full、合并、部署与业务完成分别记。

## 板块批次（仅整个板块/全部 Issue 任务适用）

按 [板块成果协议](../workflow/MODULE-OUTCOME-CONTRACT.md) 在本任务目录引用 module-contract.json。填写完整成员（含 closed/blocked/必要未建任务）、排除决定、设计/R/AC/状态双向追踪、可观察条件与失败/恢复/约束、板块集成出口、依赖与资源/owner、范围/预算及分别获准的动作。冻结前做独立语义审查并引用真实同版批准和 locked commit；实现者不能重算摘要冒充批准。

每轮记录实际 main/Issue/PR 回读、当前 AC 证据、阻塞恢复动作和一个 next action。授权内连续推进所有必需成员，保留完整分母。最终逐项证据及整体集成核验通过才关闭父板块；静态检查、Issue closed 或单项 merge 不能代替完成。
