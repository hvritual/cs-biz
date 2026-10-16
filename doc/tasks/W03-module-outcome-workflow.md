# W03：板块级验收冻结与连续 Issue 交付

## 状态与来源

- 来源：2026-10-16 Human 要求更新 intent-to-outcome-closure、SDLC workflow，先明确验收，再自主完成板块全部 Issue，设计测试后合入 cs-biz main。
- 基线：hvritual/cs-biz main `26461fec924d5132445d9b662f3db8f5b760b158`。
- 授权：本治理单元的技能、契约、检查器、测试及必要工作流接线，创建 PR、合并 main；不批准任何未确认的产品设计、不批量运行 F2–F6，不部署。
- 模式：T0 治理 / static；使用现有风险策略的 Full 档，不能用 docs 例外豁免 Skill/门禁。

## 目标与边界

让执行模型在已确认板块范围内持续选择必需 Issue，先锁定完整设计验收，再逐项交付并以整体结果收口。保留现有 intent-design-v2 设计职责、单 Issue Build 和 Risk-based Quality。只读检查器不创建新引擎、任务数据库或审批权。

允许 `.agents/skills/` 中闭环及衔接技能、`doc/workflow/`、`doc/ci/`、模板、任务/验证记录、AGENTS 和统一质量入口。禁止业务 frontend/backend 代码、产品验收/封存设计、生产和其他仓库。

## 验收

| ID | 可观察出口 | 验证与反例 |
| --- | --- | --- |
| W03-AC1 | 自动前冻结完整成员、R/AC、可观察方法、反例/恢复、依赖/资源、授权和确切批准版 | 契约正例；遗漏/额外成员、孤立 AC、TBD、环、未决选择、错来源/摘要拒绝 |
| W03-AC2 | 一次一个候选按依赖连续选择，支持续跑、独立分支、阻塞保留及停滞升级 | 合成多 Issue 调度；closed 不冒充集成、未满足依赖/资源不推进、权限不足不扩大 |
| W03-AC3 | 板块集成出口和同版本证据必需，静态通过不冒充真实结果 | 缺证据/旧 main/错误环境或 kind/坏日志拒绝；完整声明只返回 CLOSURE_CANDIDATE_STATIC |
| W03-AC4 | 两个主技能与现有设计、Build、任务模板、统一 CI 一致衔接 | 结构/链接检查、全体 Python 治理回归、技能 quick_validate、独立前向评估与修复 |
| W03-AC5 | PR 满足当前真实门禁，合并后 main 实际包含改动并通过门禁 | 精确 head/base、真实 quality-gate/receipt、独立审阅、合并后 GitHub 回读 |

## 证据

见 [W03 验证记录](../evidence/W03-validation.md) 和最终 PR 的真实 run/receipt/合并回执。合成 fixture 仅验证协调与拒绝行为，不证明 F2–F6、真实产品旅程、审批认证或生产成果。
