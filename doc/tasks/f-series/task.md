# F 系列连续交付

当前状态：`STOPPED_BY_HUMAN / S0_RESOURCE_VERIFIED`。Human 已明确“停止运行”，后续工作流重设计与本次 main/文档/分支清理仅授权其各自范围，不恢复 F2–F6 实施。

S0 资源切片已由 [PR #38](https://github.com/hvritual/cs-biz/pull/38) 合入 main `9272114c7e79f3267820f393fcdd4b747b503f89`；Docker MySQL 与非生产 OIDC 的实际 CI 证明见 [S0](S0-resources.md)。这不构成业务 IAM/Session/Domain DB 或生产资格。原连续实施分支 `feat/yunka-f-series-completion` 属本次用户明确要求清理的非 main 分支，恢复时以当前 main 和仍有效的决定重建单一工作分支，不能从旧分支存在推定继续权限。

## 原始目标与已决条件

2026-10-16 Human 要求完成 F 系列剩余事项，所有变更一个分支推进、分步骤合入 main；随后明确“MySQL 使用docker 搭建，OIDC 搭建非生产系统但是保留生产接入能力”。原文在 [r001 原始输入](rounds/r001/raw-user.txt)。

已决：Docker MySQL；真实非生产 OIDC；保留标准生产供应端接入能力；仓库写入、实施与分步合并已获授权。未授权：生产发布、访问生产数据、外部付费服务、改变仓库门禁或把缺少的验收改成通过。

原 r001 基线 `071078f597f8248ac1b282e6039ab02311bb85d8`；当前投影见 [roadmap](../../roadmap.md)。F0 #11 / F1 #12 已交付；剩余 #13–#17，父 #10 保持开放，横向 #19 的适用 Trace/日志义务纳入各步骤；#20/#24 及 PR #7/#8/#18/#21/#25 仅作实际候选核对，不整包导入或推定已入 main。完整原 Issue 保存于 [来源快照](rounds/r001/sources/issues.json)。

## r001 审阅入口

- [方案](rounds/r001/solution.md)：背景、目标、影响、替代路线与阶段出口。
- [实现设计](rounds/r001/design.md)：资源隔离、供应端适配、身份/Access 边界与路径。
- [验收](rounds/r001/requirements.md)：原 Issue 覆盖、正反/恢复方法和未完成项。
- [一次性决策表](rounds/r001/decision-review.md)：已确认条件与本次真正需要审阅的策略。
- [技术操作旅程](rounds/r001/journey.md)、[流程](rounds/r001/flow.mmd)。

当前可审阅出口只覆盖资源/后端责任和策略候选，**不**冒充完整 F3 前端设计或已冻结的整个 F 系列合同。后续登录/邀请/营销 UI 必须在现有 Console 中补同版项目 Preview、UX 与真实浏览器证明；未完成前不签 UI handoff。不得将本方案的拟议 HTTP 路径当已发布 API。

## 工作流与证明边界

调用项目 Design 的 capture/research/intent/solution，非 UI 的 UX/Preview 显式 N/A，acceptance 停在真实 `BLOCKED`：r001 后续业务策略尚未取得同版批准。该门**不阻塞**用户已明确授权且不决定业务策略的 [S0 资源切片](S0-resources.md)，该切片已沿 controlled-issue-delivery 独立资源任务路径实现/审查/验证并合入；后续 F 实施仍受 Human stop 约束。没有完整业务 `design-to-build.json` 或 `module-contract.json`，不填假 approved / 重新计算旧审批摘要；不改 F0/F1 封存原件。

同版审阅后，先锁当前准入切片，再用 Build 和 controlled-issue-delivery 实施/独立评审/现行风险门禁/main 回读；整批合同只有原验收分母、UI 义务、资源和未决项都满足时才冻结。阶段前提未具备的必需项保留，不从批次分母删除。

S0 已在支持 Docker 的现有 GitHub CI 真实启动并验证，精确版本证据见资源任务和 PR #38。它只证明开发/CI 资源；没有生产验收或持久目标部署宣称。r001 后续策略仍未批准，不重签旧封存摘要。

后续每步记录实际 base/head/tree、路径、命令、失败与修复、reviewer、quality run/attempt/receipt 和 main 回读。两次同质失败无新信息暂停受影响步骤；不确定外部副作用先回读再重试。父 #10 和完整 F6 仅在其全部原出口成立后关闭。
