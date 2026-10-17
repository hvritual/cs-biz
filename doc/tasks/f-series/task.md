# F 系列连续交付

当前状态：`DESIGN_CONTENT_COMPLETE / REVIEW_DELIVERY_UNVERIFIED / S0_RESOURCE_VERIFIED`。2026-10-17 Human 要求先完成完整页面、异常流程及可交互审阅界面；当前版本转为 [r003完整设计](rounds/r003/solution.md)，覆盖 [页面清单](rounds/r003/screen-inventory.md) 与 [跨页义务](rounds/r003/cross-screen-obligations.md)。r002保留为历史片段版本，不能代表当前完整交互验收。所有F业务Issue及生产资格仍未完成。

2026-10-16 22:49 Human 明确要求恢复 F2–F6，22:54 要求开始第一步，即同版业务设计与准入对账；来源见 [r002原文](rounds/r002/raw-user.txt)。此前 Human stop 保留为历史，不再被当成本次设计阻塞。后续正式 Build 仍需每个切片真实设计准入；生产发布未获授权。

当前单一工作分支 `feat/yunka-f-series-delivery` 从 main `191189ba63ffcbda8f62be1981ae3b892172a9c9` 建立。[r003方案](rounds/r003/solution.md)、[技术分析](rounds/r003/architecture.md)、[实现设计](rounds/r003/design.md)、[完整验收/准入图](rounds/r003/requirements.md)、[旅程](rounds/r003/journey.md) 与 [集中决策包](rounds/r003/decision-review.md) 是本轮审阅入口。尚未签发 Build handoff 或完整模块锁，未关闭任何 F Issue。 本步总入口见 [集中审阅](rounds/r003/review-summary.md)，实际验证与失败保留见 [验证](rounds/r003/validation.md)。

S0 资源切片已由 [PR #38](https://github.com/hvritual/cs-biz/pull/38) 合入 main `9272114c7e79f3267820f393fcdd4b747b503f89`；真实资源资格见 [S0](S0-resources.md)，不是业务 IAM/Session/Domain DB 或生产资格。


## 原始目标与已决条件

2026-10-16 Human 要求完成 F 系列剩余事项，所有变更一个分支推进、分步骤合入 main；随后明确“MySQL 使用docker 搭建，OIDC 搭建非生产系统但是保留生产接入能力”。原文在 [r001 原始输入](rounds/r001/raw-user.txt)。

已决：Docker MySQL；真实非生产 OIDC；保留标准生产供应端接入能力；仓库写入、实施与分步合并已获授权。未授权：生产发布、访问生产数据、外部付费服务、改变仓库门禁或把缺少的验收改成通过。

原 r001 基线 `071078f597f8248ac1b282e6039ab02311bb85d8`；当前投影见 [roadmap](../../roadmap.md)。F0 #11 / F1 #12 已交付；剩余 #13–#17，父 #10 保持开放，横向 #19 的适用 Trace/日志义务纳入各步骤；#20/#24 及 PR #7/#8/#18/#21/#25 仅作实际候选核对，不整包导入或推定已入 main。完整原 Issue 保存于 [来源快照](rounds/r001/sources/issues.json)。

## r001 历史候选入口（不覆盖 r002）

- [方案](rounds/r001/solution.md)：背景、目标、影响、替代路线与阶段出口。
- [实现设计](rounds/r001/design.md)：资源隔离、供应端适配、身份/Access 边界与路径。
- [验收](rounds/r001/requirements.md)：原 Issue 覆盖、正反/恢复方法和未完成项。
- [一次性决策表](rounds/r001/decision-review.md)：已确认条件与本次真正需要审阅的策略。
- [技术操作旅程](rounds/r001/journey.md)、[流程](rounds/r001/flow.mmd)。

r001 当时的可审阅出口只覆盖资源/后端责任和策略候选，**不**冒充完整 F3 前端设计或已冻结的整个 F 系列合同。后续登录/邀请/营销 UI 必须在现有 Console 中补同版项目 Preview、UX 与真实浏览器证明；未完成前不签 UI handoff。不得将本方案的拟议 HTTP 路径当已发布 API。

## 工作流与证明边界

r001 调用项目 Design 的 capture/research/intent/solution，非 UI 的 UX/Preview 显式 N/A，acceptance 停在真实 `BLOCKED`：r001 后续业务策略尚未取得同版批准。该门**不阻塞**用户已明确授权且不决定业务策略的 [S0 资源切片](S0-resources.md)，该切片已沿 controlled-issue-delivery 独立资源任务路径实现/审查/验证并合入；后续 F 实施按 r003 的当前真实准入决定；旧 stop 已由本次明确恢复请求更新。没有完整业务 `design-to-build.json` 或 `module-contract.json`，不填假 approved / 重新计算旧审批摘要；不改 F0/F1 封存原件。

当前 r003 为 UI 适用设计，UX/项目 Preview 与浏览器证明均必须完成，不能继承 r001 的 N/A。P1/P2/P4/P7 待同版决策；当前未签发体验批准或 Build handoff。

同版审阅后，先锁当前准入切片，再用 Build 和 controlled-issue-delivery 实施/独立评审/现行风险门禁/main 回读；整批合同只有原验收分母、UI 义务、资源和未决项都满足时才冻结。阶段前提未具备的必需项保留，不从批次分母删除。

S0 已在支持 Docker 的现有 GitHub CI 真实启动并验证，精确版本证据见资源任务和 PR #38。它只证明开发/CI 资源；没有生产验收或持久目标部署宣称。r001 后续策略仍未批准，不重签旧封存摘要。

后续每步记录实际 base/head/tree、路径、命令、失败与修复、reviewer、quality run/attempt/receipt 和 main 回读。两次同质失败无新信息暂停受影响步骤；不确定外部副作用先回读再重试。父 #10 和完整 F6 仅在其全部原出口成立后关闭。

本轮完整页面与异常恢复已作为r003审阅候选完成，见[r003总入口](rounds/r003/review-summary.md)。源码候选 1ef0e792e09e7d999071707574d3ac63fd339d9b 的现行Full及独立receipt已通过；该历史候选尚缺正式审阅交付核验，不签Build handoff，不关闭F业务Issue。Goal负责在收到该版反馈后只重开受影响范围，或按获准切片继续Build；生产P6不扩大为非生产设计的全局阻塞。

2026-10-17审阅交付归因及本次[工作流修订](workflow-review-delivery.md)：r003保留历史内容/源码验证，最终交付入口尚未实际浏览器验证，新增任务效率与批量/结果要求也未作为该轮完成事实。当前正式交互交付未核实，不将其转为Human排障或恢复业务Build。后续设计需新修订，旧轮原件不重签。
