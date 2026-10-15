# W02：基于项目知识与可运行预览的 Intent / Design 工作流

## 状态与来源

- 状态：review-ready candidate；本地治理验证完成，未合并、未获 Human Full 决策。
- 来源：2026-10-15 Human 的六项工作流调整要求，原文保存在本文件末尾。
- 仓库与基线：`hvritual/cs-biz`，`main@25f5b96748545066abe428e3e3749db06a6e00b5`。
- 分支：`codex/intent-design-workflow`；核验日期：2026-10-15。
- 原始授权：调整工作流、Skill、契约与验证，不包含业务实现或部署。
- 追加授权：2026-10-15 17:48（Asia/Shanghai）Human 明确“授权推送，并合并到最新的main分支”；因此可推送候选、创建 PR 并在实际门禁满足后合并。未授权自动 Full、替 Human 签署豁免或生产部署。
- 本任务基于 main；不吸收尚未合并的 PR #23 Goal/Resume 或 PR #25 可观测性实现。

## 目标与成果

收到原始业务意图后，模型能引用项目历史与当前事实，通过有依据的决策树明确可用条件和偏好，在现有前端工程完成用户旅程预览，交付同版本方案、设计与 demo。设计工作流交接后，实施模型继续承担落地、核实和门禁责任。

## 依赖与边界

| 字段 | 内容 |
| --- | --- |
| 必需输入 | 六项 Human 要求、现有六 Skill、ADR-0001、Desktop 规范；固定 biz 来源的 b2b-product-ux |
| 允许改动 | `.agents/skills/**`、`AGENTS.md`、`frontend/AGENTS.md`、`doc/workflow/**`、`doc/templates/task.md`、本任务及验证记录、`doc/ci/*design_workflow.py`、现有 SDLC 结构入口、`.github/workflows/sdlc-skills.yml` |
| 禁止改动 | 前后端业务运行代码、依赖锁、已有验收断言、Full 触发方式、生产配置、其他仓库 |
| 排除范围 | 本次没有具体业务 UI 设计需求，不制造任意业务 demo；不实现 ADR 搜索服务、后台模型调度、可信审批适配器 |
| 回退 | 撤销本候选；旧协议和既有执行 Skill 保持可读，不重写既有封存产物 |

## 验收

| ID | 结果断言 | 反例 / 检查 |
| --- | --- | --- |
| AC-01 | Raw → Prompt Optimizer → Intent → Design Loop 明确；原文与每项约束可追溯 | 原文变更、摘要失配、需求漏项应拒绝 |
| AC-02 | 自动引用精确版本 ADR/doc/当前源码；区分 accepted/proposed/conflict；条件、资源、偏好和未决选择可追溯 | 旧文档冒充当前事实、提议冒充采纳、阻塞问题未答不能交接 |
| AC-03 | 前端变更必须在现有 frontend 工程提供可运行预览；同壳层、Token、语言、权限语义 | 独立 demo.html、仅截图、缺源码/入口/运行证据不能交接 |
| AC-04 | 绑定 b2b-product-ux；考虑安全自动化和文本批量选定、影响与恢复 | 未匹配、重复、歧义、越权、部分失败和结果未知有明确义务 |
| AC-05 | 每轮成套交付 solution、requirements、design、journey、flow、UX 分析、项目 preview 和 Human 审阅入口 | 方案缺失、旧 preview、版本不一致、Human 要求修改不能交接 |
| AC-06 | 工作流止于设计交接；模型在工作流外负责实施、核实和门禁 | 自动 Build/Full/merge、设计批准被当作业务完成应拒绝 |

命令：`python3 doc/ci/check_repository.py`、`python3 doc/ci/check_sdlc_workflow.py --mode structure`、`python3 -m unittest discover -s doc/ci -p 'test_*workflow.py' -v`、现有 Python 回归、`bash doc/ci/check.sh --fast`。可用性与真实结果记入 [验证记录](../evidence/W02-validation.md)。本次没有可见 UI 变更；业务任务的项目预览与浏览器验收仍需分别真实执行。

## Human Full CI 决策与交付

当前为 WAITING_HUMAN_FULL；没有自签 waiver，不触发 Full、不合并。独立复核、分支 SHA、PR 和同版本检查见验证记录与实际 GitHub。设计结构检查不认证 Human 身份、不证明模型语义遵循或业务效果。

## 原始要求（不可由优化器覆盖）

1、强化intent raw 到 Prompt Optimizer 到 intent 到Design Loop。
2、intent 到design Loop 中会自动引用项目历史的ADR、doc、并通过决策树引导Human 输出项目可以具备使用的条件以及偏好。
3、涉及到前端的设计变更，需要在现有前端工程项目上加入Preview demo，让Human来确认对应功能的用户旅程。
4、Preview demo 设计按照`b2b-product-ux` 技能要求，能系统自动完成的自动完成、能批量的操作的要考虑文本导入快速进行快速选定操作，核心要让用户将注意力放在核心工作上。
5、design Loop 产出产物必须包含已经设计好的方案以及基于项目的可视化的demo界面。
6、方案落地、核实、门禁检查是工作流之外大模型要去完成的事项。
