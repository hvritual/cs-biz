# cs-biz Intent / Design 接入与模型执行责任

当前协议见 [Intent/Design v2](INTENT-DESIGN-WORKFLOW.md)，交接字段见 [DESIGN-HANDOFF-CONTRACT](DESIGN-HANDOFF-CONTRACT.md)。本次按 Human 六项要求调整原六 Skill 的职责，接入固定来源的 b2b-product-ux；不增加后台调度器或任务数据库。

## 当前链路

Raw Intent 原文与来源 → Prompt Optimizer（自动 ADR/doc/当前源码研究、条件/资源/偏好决策树）→ IntentSpec（逐项追溯与材料性 Human 选择）→ Design Loop（方案、设计、旅程、现有工程 Preview 同轮）→ Human 反馈修订/同版本确认 → 设计交接。

工作流到此结束。执行模型在已有授权范围内接手计划、落地、核实、Fast/适用 Targeted、独立审查与真实证据回读，继续使用 `task-progression` 和 `sdlc-build`。最终候选按 [风险门禁](../ci/RISK-BASED-GATES.md) 自动运行所需检查及 Full，核验独立回执后在授权范围内合并；发布另行授权，不把常规工程职责丢给 Human。

UI 设计使用当前 Vue/Vben/Element Plus 工程、壳层和 Token；不能用独立 demo.html 代替。每轮交付 solution.md / requirements.md / design.md / journey.md / flow.mmd / ux-analysis.yaml、项目预览源码/入口/场景/运行证据及 design-loop.json。Human 同时检查方案和可操作旅程；不是先批准孤立预览再看到方案。系统负责可确定且已授权的工作；批量场景评估文本导入快速选定，保留权限、消歧、影响确认和安全恢复。

## 权威与证据

AGENTS、实际任务/Issue、accepted ADR、当前源码、绑定版本 Human 决策与真实 CI 各司其职。历史 proposed ADR 不是技术约束；Mock 不是后端可用证据；作者填写批准引用不是身份认证。任务状态沿用 doc/tasks 和既有任务模板；产物必须有 Git 持久引用，不只放在 ignored .sdlc 缓存。

`python3 doc/ci/check_sdlc_workflow.py --mode structure` 检查接线；`python3 doc/ci/check_design_workflow.py --task <task-dir> --repo-root .` 只检查 v2 交接结构/摘要/引用。结构通过不证明原意无偏差、九维语义、浏览器、生产隔离或 Human 身份。这些仍需执行模型核实并由独立 reviewer/实际证据验证。

b2b 核心、模板和上游设计示例已引入，项目绑定/检查入口已适配；未移植上游完整 YAML checker、Page Contract/源码索引或任何运行期业务能力。上游案例 URL 是背景，不证明 cs-biz 已实现对应功能。来源见 [固定提交记录](b2b-product-ux-source.json)。

## 历史协议兼容

旧 `intent.json` / `design-preview.json` / `design-approval.json` / `build-manifest.json` 和 `check_sdlc_workflow.py --mode intent|design|build` 保留用于历史任务。v0.2 / v0.4 兼容检查见 [运行验证边界](ORIGINAL-RUNTIME-VALIDATION.md)。旧 checker 所接受的 demo.html 不能满足 v2 UI 交接；不要混合协议或重写封存轮次。明确迁移时建立新轮和新批准。CAS、可信外部审批/CI 适配和真实端到端模型试点仍不由 Markdown 或离线检查补齐。

## 本治理候选的验证

执行 `python3 doc/ci/check_repository.py`、`python3 doc/ci/check_build_workflow.py`、SDLC 结构与 Python 正反例，随后运行仓库 Fast。真实 UI 任务需模型运行项目预览与适用 Desktop，缺工具则 unavailable；最终 Full 遵循 [风险门禁](../ci/RISK-BASED-GATES.md)。W02 历史候选未修改业务 UI，没有实际业务预览或用户旅程完成声明。历史结果见 [W02 验证](../evidence/W02-validation.md)。

## 板块级连续交付补充（W03）

[板块成果协议](MODULE-OUTCOME-CONTRACT.md) 和仓库 intent-to-outcome-closure 提供设计子流程之外的协调层：先冻结完整成员、明确验收、依赖/授权和板块集成出口，再由执行模型连续完成每个已授权 Issue。原 DESIGN_HANDOFF/auto_execute=false 及历史协议保持不变；这些限制不要求每完成一个已授权 Issue 都重新等待 Human。

Quality 静态任务执行模块契约扫描和正反例。结果仅为静态可准入建议；语义完整性、实际审批、运行/CI/合并和整体出口由独立证据核验。不新增未合并 PR #23 的依赖、后台触发器或状态库；本次不执行真实产品批次。
