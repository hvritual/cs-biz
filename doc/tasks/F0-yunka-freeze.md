# F0 / Issue #11：身份三权与 Yunka Consumer 基线冻结

## 状态与来源

- 当前：**DESIGN_REVIEW / BLOCKED_SECURITY_BASELINE**；Issue [#11](https://github.com/hvritual/cs-biz/issues/11) 保持 open，不宣称 F0 完成。
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
| 前置 | 来源和检索可用；D1 已选 A；上游完整发布资格未齐；真实 IdP/DB/完整模块资格保留后续阻塞 |
| 回退 | 撤销文档候选，不改变运行数据 |

## 验收与实际证据

R1–R8 / AC-01–AC-08 由 [本轮需求](issue-11-f0/rounds/r001/requirements.md) 和 [Intent 追溯](issue-11-f0/rounds/r001/intent.json) 绑定。每项事实均区分已核实源码、未批准目标、运行 not_run、Human 未审。

实际命令/结果、结构回执、来源 hash、差额和交付 PR 记录在 [validation](issue-11-f0/rounds/r001/validation.md)。本轮 design-loop.json 保持未审，交接 checker 应拒绝提前交接；拒绝是正确的边界，不把推荐答案写为 approved 求绿。

## Human 决策与继续条件

D1 已由 Human 选择 A，详见 [r002 决策与资格核实](issue-11-f0/rounds/r002/qualification.md)。当前不重复征询 D1；完整方案审阅状态与发布缺口分别保留。可提供 D2/D3 的既有组织条件，资源缺口有明确 Owner/阶段。完整本轮确认之后再建立 DESIGN_HANDOFF，并由模型在已批准范围内、工作流之外接手真实实施与门禁。缺 Human Full 决策、独立审阅或合并权限时保持实际等待，不延用旧豁免。

## 交付记录

本轮首版 r001 的反馈对象为 F0-S01~S06/R1~R8/D1~D3。候选精确 SHA 与 CI 使用实际 GitHub PR 回读，不预测自身提交。Issue 保持 open；下一动作是由上游发布负责人按 [修复请求](issue-11-f0/rounds/r002/producer-request.md) 补齐完整模块/CLI 发行锁与资格回执。未进入 F1、没有部署/生产完成结论。

## r002 决策反馈与发布核实

Human 原文“按照推荐A进行推进”绑定首轮 PR #27 `8065dade6348743eec5212ece5b9f1e275a4a2fc` 的 D1=A；记录于 [decision.json](issue-11-f0/rounds/r002/decision.json)。r001 保持原字节，仅表示当时状态。新证据证明 infras/v0.1.0 缺失，CLI 发行锁尚无充分证据；A 不回退为源码快照。见 [qualification](issue-11-f0/rounds/r002/qualification.md)、[来源](issue-11-f0/rounds/r002/publication-evidence.json) 和 [验证](issue-11-f0/rounds/r002/validation.md)。这是决策/资格补充，尚无完整设计批准、独立评审或当前候选 Full 决策，不宣称交接/合并/关闭。

## r003 上游执行回读

跨仓库修复已获 Human 授权。[当前补充](issue-11-f0/rounds/r003/qualification.md) 记录四模块外部分发锁、真实 CLI 编译修复和打包资格。上游 PR #243 当前 5/7 通过，CI/Production 因 Go1.25.13 的可达漏洞失败；[安全前置 #244](https://github.com/hvritual/yunka.io/issues/244) 等待 Human 对原 Go 目标变更作决定。下一动作更新为该工具链决定；不再误报“没有可下载 infras 版本”，也不将功能候选当安全合格发行。原始 R/AC、D1=A、D2/D3、完整设计/Full/交付条件保持。
