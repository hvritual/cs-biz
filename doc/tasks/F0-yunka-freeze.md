# F0 / Issue #11：身份三权与 Yunka Consumer 基线冻结

## 状态与来源

- 当前：**DESIGN_HANDOFF / READY_FOR_DELIVERY**；r005 完整设计已确认，本轮按已生效风险门禁完成 PR #27 文档交付收口。Issue [#11](https://github.com/hvritual/cs-biz/issues/11) 仅在精确候选门禁、合并、main 回读及合并后检查通过后关闭；最终状态见 PR/Issue 实际回执。
- 用户本次原文：“启用工作流，开始完成cs-biz仓库里面的issue”。按当前工作流选择依赖链起点，一次一个独立 Issue；其他 11 个开放 Issue 全部保留在 [本轮 intake 快照](issue-11-f0/rounds/r001/intake-snapshot.json)。
- 本轮交付 main 基线：`f1d06cffa998824c5e393253aa79ee3e46fd35ca`；既有设计/交接源 `c5ff66bd817380000fc14b4253bf03273171c7f7`，原设计研究基线 `da5494d03c362ab873465c1793e7aba7e4e3a7cc` 保留其历史身份；继续使用 PR #27 / `codex/issue-11-f0-design`。
- 当前授权：用户再次要求启用工作流推进 Issue，结合既有推送/合并授权和现行风险门禁，执行本 F0 的文档核验、合并、main 回读与满足验收后的 Issue 关闭；不扩大为 F1 Runtime、其他功能 PR、生产数据或部署权限。
- 既有工作：PR #18 是路线/方向草案，不重复搬入全库；#7/#8 仅冻结为未合并候选事实。

## 目标、成果和同轮设计包

让 F1/F3 的执行者知道：使用哪个固定输入、谁拥有身份/三权/执行与数据、需要何种真实资源和验证才可继续。可审阅产物为 [solution](issue-11-f0/rounds/r005/solution.md)、[requirements](issue-11-f0/rounds/r005/requirements.md)、[design](issue-11-f0/rounds/r005/design.md)、[journey](issue-11-f0/rounds/r005/journey.md)、[可视化技术流程](issue-11-f0/rounds/r005/flow.mmd)、[版本矩阵](issue-11-f0/rounds/r005/versions.md)、[负例基准](issue-11-f0/rounds/r005/acceptance-matrix.md)、[决策/资源](issue-11-f0/rounds/r005/decisions.md)、[ADR 候选](../architecture/adr/0003-yunka-f0-consumer-contract.md)。原文、优化提示、Intent、知识清单和设计索引同目录封存。

这是真实架构冻结任务，不涉及产品页面/交互变更，前端 Preview 和九维 UX 分析不适用；技术图不能冒充可运行的产品 demo。后续 UI Issue 按 #26 在现有工程做 Preview。

## 范围与依赖

| 字段 | 内容 |
| --- | --- |
| 允许 | `doc/tasks/issue-11-f0/**`、本任务、ADR-0003、roadmap 本次状态补充 |
| 禁止 | frontend/backend 业务/依赖/生成/部署文件、CI、其他仓库、生产数据与凭据 |
| 输入 | 原始 #10/#11、固定 main/#7/#8/#18、Yunka 评估源码和已观察 module tag |
| 输出 | 来源证据、方案/设计/ADR、单权威表、版本/负例、未决条件和准入约定 |
| 前置 | 来源和检索可用；D1 已选 A；上游限定模块/CLI资格已通过；本项目F1、真实IdP/DB与完整业务资格保留对应阶段阻塞 |
| 回退 | 撤销文档候选，不改变运行数据 |

## 验收与实际证据

R1–R8 / AC-01–AC-08 由 [本轮需求](issue-11-f0/rounds/r005/requirements.md) 和 [Intent 追溯](issue-11-f0/rounds/r005/intent.json) 绑定。每项事实均区分已核实源码、未批准目标、运行 not_run、Human 未审。

被审时的命令、来源和验证记录封存在 [r005 validation](issue-11-f0/rounds/r005/validation.md)。2026-10-15 21:14:54 +08 Human 已确认同版完整设计；[同版交接](issue-11-f0/handoffs/r005/HANDOFF.md) 绑定原文、精确提交和原内容摘要，不改旧轮、不把设计确认写为 Full 豁免。

## Human 决策与继续条件

D1 已由 Human 选择 A，详见 [r002 决策与资格核实](issue-11-f0/rounds/r002/qualification.md)，无需重复决定。完整同版本确认与交接已经记录；D2/D3 的组织资源缺口保留 Owner/阶段。模型在批准范围内、工作流之外核实并交付；按 [现行风险门禁](../ci/RISK-BASED-GATES.md) 分类、核验实际结果和独立精确回执，本轮纯文档无需 Human Full 决定或旧豁免。材料性设计选择、实际保护及失败/缺失证据仍阻断。

## 交付记录

以下保留r001初版检查点，当前状态以r005为准。

本轮首版 r001 的反馈对象为 F0-S01~S06/R1~R8/D1~D3。候选精确 SHA 与 CI 使用实际 GitHub PR 回读，不预测自身提交。Issue 保持 open；下一动作是由上游发布负责人按 [修复请求](issue-11-f0/rounds/r002/producer-request.md) 补齐完整模块/CLI 发行锁与资格回执。未进入 F1、没有部署/生产完成结论。

## r002 决策反馈与发布核实

Human 原文“按照推荐A进行推进”绑定首轮 PR #27 `8065dade6348743eec5212ece5b9f1e275a4a2fc` 的 D1=A；记录于 [decision.json](issue-11-f0/rounds/r002/decision.json)。r001 保持原字节，仅表示当时状态。新证据证明 infras/v0.1.0 缺失，CLI 发行锁尚无充分证据；A 不回退为源码快照。见 [qualification](issue-11-f0/rounds/r002/qualification.md)、[来源](issue-11-f0/rounds/r002/publication-evidence.json) 和 [验证](issue-11-f0/rounds/r002/validation.md)。这是决策/资格补充，尚无完整设计批准、独立评审或当前候选 Full 决策，不宣称交接/合并/关闭。

## r003 上游执行回读

跨仓库修复已获 Human 授权。[当前补充](issue-11-f0/rounds/r003/qualification.md) 记录四模块外部分发锁、真实 CLI 编译修复和打包资格。上游 PR #243 当前 5/7 通过，CI/Production 因 Go1.25.13 的可达漏洞失败；[安全前置 #244](https://github.com/hvritual/yunka.io/issues/244) 等待 Human 对原 Go 目标变更作决定。下一动作更新为该工具链决定；不再误报“没有可下载 infras 版本”，也不将功能候选当安全合格发行。原始 R/AC、D1=A、D2/D3、完整设计/Full/交付条件保持。

## r004 工具链条件决定

[本次 Human 批准](issue-11-f0/rounds/r004/qualification.md) 已解决 Go 目标变更：Go1.26.9 / x/net v0.60.0；依赖实际要求 go1.26.0。r003 的“等待决定”是历史状态，不再重复询问。独立 Yunka #245 已实现候选，完整资格/main/CLI 刷新仍待完成；下一动作是模型继续完成这些已授权前置。当前仍为 DESIGN_REVIEW / BLOCKED_SECURITY_QUALIFICATION，完整设计/Full 决定、D2/D3 与全部原始验收保持。

## r005 当前完整审阅包

[当前资格与下一动作](issue-11-f0/rounds/r005/qualification.md) 已记录Yunka #245/#243整合与候选/独立main全门禁通过、#244完成关闭、实际制品摘要/平台/安装根/到期条件。r003/r004的待决或待资格措辞是历史检查点，当前不再阻塞于Go决定或上游资格。

完整方案、设计、需求、技术旅程/图、46条来源与全部R/AC已整合为r005。Human 已确认该完整版本，原r001–r005及同版交接不改。原“等待 Human Full”已被后续风险门禁取代；当前交付条件与逐项验收见 [交付核验](issue-11-f0/delivery/closure.md)。跨仓库前置修复来自单独授权，其完成不扩大本F0的消费仓代码范围；未进入 F1。
