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

Use **doc/ci/NO-STALL-GATES.md**. Record the smallest failing assertion and source ownership; the Fast Gate outcome; targeted Desktop verification for visible UI work; then the frozen head SHA and the **Human-triggered Full Gate** evidence (dispatching actor, PR number, exact SHA, run ID/attempt, approved environment, independent receipt and conclusion). Ready for review does not start Full. No Human Full decision/receipt means awaiting Human action; an exact-SHA authorized governance waiver is recorded separately as HUMAN_WAIVED, never PASS. No per-push full-browser validation, unverified test changes, duplicate CI conclusions or merging a red/pending/unavailable Full Gate. GitHub branch protection requires admin configuration and cannot be inferred from a successful workflow.

## Goal / Resume（跨会话任务）

- 权威 Issue URL、冻结 Goal 文件与摘要、全部 AC ID（包含 blocked/unproven）：
- 当前 Run ID、累计 attempt、原任务预算（新会话不得重置）：
- Git 中的 Resume 引用、精确 candidate SHA、approved design / authority 摘要、环境：
- 每项 AC 的状态、实际证据 URL/命令及对应 SHA；证据引用不是完成证明：
- 等待原因、恢复事件/依赖、负责方、未知外部效果的对账方法：
- 已处理事件 ID、唯一下一动作、独立授权/证据回读：
- 本地临时缓存不得成为唯一持久来源；参见 [恢复协议](../workflow/CONTINUATION.md)。
