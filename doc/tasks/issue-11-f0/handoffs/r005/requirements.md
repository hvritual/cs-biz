# F0 需求与验收 r005

源：raw-user.txt、raw-issue-11.md、父任务 raw-issue-10.md；逐项追溯见 intent.json。状态为 design draft，未批准。

| R/AC | 要求与可观察出口 | 相关反例/验证 | 当前状态 |
| --- | --- | --- | --- |
| R1 / AC-01 | 固定 current main、#7/#8/#18、Yunka 两仓源码并有路径/commit/blob/hash/定位 | 漂移或摘要不一致拒绝；历史 PR 不充当 main | 46 个来源记录已核实；候选 CI/合并另行回读 |
| R2 / AC-02 | 明确 Menu/Function/Data、身份、Executor、Scope、Domain 唯一权威 | MKT-01、CON-01/02、TEN、REV、MOD、Worker/伪造头见负例矩阵 | 设计已形成；目标 Runtime 未实现 |
| R3 / AC-03 | Go/protoc/plugins/五模块与 CLI 消费身份、兼容差额、生成零漂移准入 | tag≠评估提交、workspace掩盖、缺 CLI/infras 方案不能放行 | D1=A 与新工具链已批准；上游资格单独取证，cs-biz F1 运行仍未开始 |
| R4 / AC-04 | 保留现有前端/标签页语义/新工作流；不新增 IAM 或运行代码 | diff 仅本轮文档；不把旧 OpenAPI 草案作第二可写源 | 本轮设计范围明确 |
| R5 / AC-05 | 锁定 MKT/CON/TEN/REV/REC 和数据范围正反例 | 各项有准备条件、预期、实现阶段和应取证据；不能用源码存在作通过 | 矩阵已形成，业务运行 not_run |
| R6 / AC-06 | 已发现未决项均有条件、owner、影响阶段和选项/代价 | 未批准身份/DB/工具链不能偷偷默认；阻塞与不适用分开 | D1=A、工具链决定已解决；D2/D3 及后续资源保持 owner/阶段条件 |
| R7 / AC-07 | Trace/W3C/CORS/Log/Span/异步、受控本地查询、可选 SLS/最小权限/留存原则 | PII/trace当身份/collector故障/无样本假PASS拒绝 | 合同已设计，真实集成仍属 O1/F1–F6 |
| R8 / AC-08 | 无生产凭据/业务改动、无框架旧 CI 代替新消费、实证交付 | 结构/来源验证与实际候选检查；未批准不标 F0 done | 上游验证与本地 Fast 分层保留；本轮候选/完整设计/Full独立回读，不关闭 #11 |

## 不变量

原始要求不缩减；模型不批准自己；与已接受的原始语义冲突则回 Intent。Menu 不授权业务、Function 和对应 Scope 不拼接扩权、平台身份不隐含 Owner、商业可用性不授予权限、group 不默认映射、trace 不作凭据、幂等不承诺响应重放、Mock 不作真 API/DB。保留任务外全部未完 Issue。

## 验证分层

1. 本 F0 文档：来源 Git blob/SHA256/定位、当前/候选区分、结构/链接、范围 diff、原文→R/AC 追溯及决策状态。
2. DESIGN_HANDOFF：新设计 checker 检查绑定；有未决项或缺 Human 审阅时应非零退出，不能制造 approved 字段求绿。
3. F1：实际 module download/build/test/vet、合同/assembly generate/check、二次生成零漂移、source/dependency 审计。
4. F2–F6：API、真实 DB、浏览器、身份/租户/Scope、异步/回执/恢复、生产安全与运维。命令随各真实实现提交；本轮没有可运行 API/DB，因此不伪造命令或 PASS。
5. 交付：当前候选真实 CI、独立评审、Human 本轮设计/Full 决策、合并后主线。缺一项就保留其实际状态。
