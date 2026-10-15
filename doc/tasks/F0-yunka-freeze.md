# F0 / Issue #11：身份三权与 Yunka Consumer 基线冻结

## 状态与来源

- 当前：**DESIGN_REVIEW / NEEDS_DECISION**；Issue [#11](https://github.com/hvritual/cs-biz/issues/11) 保持 open，不宣称 F0 完成。
- 用户本次原文：“启用工作流，开始完成cs-biz仓库里面的issue”。按当前工作流选择依赖链起点，一次一个独立 Issue；其他 11 个开放 Issue 全部保留在 [本轮 intake 快照](issue-11-f0/rounds/r001/intake-snapshot.json)。
- main 基线：`da5494d03c362ab873465c1793e7aba7e4e3a7cc`；分支 `codex/issue-11-f0-design`；2026-10-15 Asia/Shanghai。
- 当前授权：当前 Issue 的检索、设计/文档、验证和可审阅候选；不扩大为 F1 Runtime、其他 PR 合并、Full、生产数据或部署权限。
- 既有工作：PR #18 是路线/方向草案，不重复搬入全库；#7/#8 仅冻结为未合并候选事实。

## 目标、成果和同轮设计包

让 F1/F3 的执行者知道：使用哪个固定输入、谁拥有身份/三权/执行与数据、需要何种真实资源和验证才可继续。可审阅产物为 [solution](issue-11-f0/rounds/r001/solution.md)、[requirements](issue-11-f0/rounds/r001/requirements.md)、[design](issue-11-f0/rounds/r001/design.md)、[journey](issue-11-f0/rounds/r001/journey.md)、[可视化技术流程](issue-11-f0/rounds/r001/flow.mmd)、[版本矩阵](issue-11-f0/rounds/r001/versions.md)、[负例基准](issue-11-f0/rounds/r001/acceptance-matrix.md)、[决策/资源](issue-11-f0/rounds/r001/decisions.md)、[ADR 候选](../architecture/adr/0003-yunka-f0-consumer-contract.md)。原文、优化提示、Intent、知识清单和设计索引同目录封存。

这是真实架构冻结任务，不涉及产品页面/交互变更，前端 Preview 和九维 UX 分析不适用；技术图不能冒充可运行的产品 demo。后续 UI Issue 按 #26 在现有工程做 Preview。

## 范围与依赖

| 字段 | 内容 |
| --- | --- |
| 允许 | `doc/tasks/issue-11-f0/**`、本任务、ADR-0003、roadmap 本次状态补充 |
| 禁止 | frontend/backend 业务/依赖/生成/部署文件、CI、其他仓库、生产数据与凭据 |
| 输入 | 原始 #10/#11、固定 main/#7/#8/#18、Yunka 评估源码和已观察 module tag |
| 输出 | 来源证据、方案/设计/ADR、单权威表、版本/负例、未决条件和准入约定 |
| 前置 | 来源和检索可用；本轮 D1 待 Human；真实 IdP/DB/完整模块资格保留后续阻塞 |
| 回退 | 撤销文档候选，不改变运行数据 |

## 验收与实际证据

R1–R8 / AC-01–AC-08 由 [本轮需求](issue-11-f0/rounds/r001/requirements.md) 和 [Intent 追溯](issue-11-f0/rounds/r001/intent.json) 绑定。每项事实均区分已核实源码、未批准目标、运行 not_run、Human 未审。

实际命令/结果、结构回执、来源 hash、差额和交付 PR 记录在 [validation](issue-11-f0/rounds/r001/validation.md)。本轮 design-loop.json 保持未审，交接 checker 应拒绝提前交接；拒绝是正确的边界，不把推荐答案写为 approved 求绿。

## Human 决策与继续条件

先确认 D1 消费策略和本轮方案；可提供 D2/D3 的既有组织条件，资源缺口有明确 Owner/阶段。完整本轮确认之后再建立 DESIGN_HANDOFF，并由模型在批准边界外接手真实实施与门禁。缺 Human Full 决策、独立审阅或合并权限时保持实际等待，不延用旧豁免。

## 交付记录

本轮首版 r001 的反馈对象为 F0-S01~S06/R1~R8/D1~D3。候选精确 SHA 与 CI 使用实际 GitHub PR 回读，不预测自身提交。Issue 保持 open；下一动作是对精确方案版本给出 D1 与设计反馈。未进入 F1、没有部署/生产完成结论。
