# W06 验证与交付边界

验收对象：[已批准目标与冻结 AC](W06-goal-coordination.md)，Issue [#35](https://github.com/hvritual/cs-biz/issues/35)。实现源码候选 `aec53bddd7818e8a554c01902342593f894c4dc9`；GitHub main 观察基线为 `4d5dd75500de601cbadd41ade18c2459c72c23b5`。最终 PR 的候选/合并精确 SHA、实际 Full、独立 quality receipt 与 main 回读保存在 PR，本文不代替它们。

## 本次交付

保留 5 个公共 Skill、22 个阶段内部能力和原 Design/Build/Deploy 协议。Goal 负责不完整意图、多源候选、准备充分的 Human 决定、资源与软件/操作路线；Architecture 是 Design 所有的专业角色。原生注册镜像接受静态检查，未由此宣称原生 Codex CLI 激活。

探索不要求预先编造全部验收；实施前仍冻结当前承诺和完整必需分母。软件交回既有路由恢复实际阶段；已有业务能力走完整对象清单、变更预览、先审核生效、逐对象和逐标准回读。未知效果、源/反馈/基线漂移、无进展和真实授权边界保留。

## 验收到证据

| 验收 | 原始证据与实际观察 | 限制 |
| --- | --- | --- |
| AC1 多源探索及候选 | [SaaS 业务方案](W06-evidence/saas-business-proposal.md.txt)、[完整原始记录](W06-evidence/forward-saas.zip)：实际本地/GitHub/官方调查，34 项来源；最终 37 个绑定引用回读 | 方案待审，不证明真实 SaaS；检索结果未自动成为必需功能 |
| AC2 准备 Human 决定 | [SaaS 决策包](W06-evidence/saas-decision-requests.md.txt)、[操作决策包](W06-evidence/operation-decisions.json) | 全部待答，无冒造接受/权限；Human 通道为当前会话，未安装通知服务 |
| AC3 技术现状和路线 | [单独技术分析](W06-evidence/saas-technical-analysis.md.txt)：真实消费者、固定锁、成熟模式反证、复用/适配/缺口、有依赖和观察出口的路线 | 未构建/运行 SaaS、真 DB/API 或新 Preview；原有 UI Preview 能力仅接线复用 |
| AC4 业务操作 | [操作交接](W06-evidence/operation-handoff.md.txt)、[原始记录](W06-evidence/forward-operation.zip)：模拟 4 家全部保留，1 不变 + 3 拟新增，无默示排除，无实际调用 | 模拟准备；真实组织、生命周期政策、资源/权限和生效均未证明 |
| AC5 反馈/漂移/恢复 | 两个前向案例的失败轮次和原件；[34 项目标反例](W06-evidence/goal-tests.log)，包括原操作 ID 的有界只读恢复提示 | 摘要只验证本地绑定，不能认证外部批准、持久执行或恶意篡改防护 |
| AC6 兼容与交付 | [本地检查及83项源码摘要](W06-evidence/local-validation.json)、[230项治理回归](W06-evidence/governance-tests.log)、[独立审查](W06-evidence/independent-review.md) | 实际远端 Full/main 结果另读 PR；应用/CI/旧任务封存记录未改 |

## 独立审查与修复

审查复现旧 checker `6470c441…` 在顶层 failed、对象 unknown 时错误建议 repair；当前 `c7833e39…` 优先回读，未知或缺失对象均不能直接重试。另修复非对象 JSON 的非结构化错误，并在源/main 漂移拒绝准入时保留匹配原始记录的只读回读线索。软件后续改为交回 SDLC 路由，避免重开 Design。

独立 reviewer 回放原反例，并增加未知/缺失、预算、完整已知失败、身份/计划篡改等控制；未发现剩余阻断。[审查报告](W06-evidence/independent-review.md)、[操作证据复核](W06-evidence/independent-evidence-review.md)、[完整复现与两个版本](W06-evidence/independent-review.zip)。根执行方也读回原件并复现两个最终 HUMAN_DECISION 输出；不以 reviewer 自报代替原始结果。

## 前向使用和原始失败

两个新会话只获得任务、所属 Skill、源码/指定隔离输入和独立输出目录，无预期答案，不提供本轮实现结论。它们通过宿主工具实际工作，不是调用静态样例产生的结果，也不是无人值守服务或原生 CLI 启动证明。

SaaS r001 遇到本地基线漂移；实际源逐字节对账后形成 r002。首次制品回读又发现一份外部响应保存不完整；保留原文件/失败后补存已经取得的完整响应，形成 r003；未新增调查或改变验收。最终 checker exit 0、HUMAN_DECISION，37 个引用回读通过。业务、技术和8项决定分别保留；全部真实接受/运行仍未验证。[交接](W06-evidence/saas-handoff.md.txt)。

软件证据复核另发现非阻断的提问质量问题：P2 把既有 F2 路线再次列为确认项；P1 的新方案审阅也不应暗示既有基础平台范围未知。已在 Goal 指令/方法明确先对账已决事项、沿用现有路线，只询问缺失动作/Owner/资源或有新依据的变更。原前向记录保留，不冒写为改进后重新执行；该倾向仍需后续真实使用校准。[软件证据复核](W06-evidence/independent-software-evidence-review.md)。

操作 r001 的验收环境与计划目标不一致被拒；r002 又遇到本地 HEAD 变化，被拒后核对相关源字节，r003 通过绑定检查，保留2项政策/资源决定和缺失生产服务。试验披露一次 rg 意外显示产品 `*.test.ts` 匹配行；未继续打开/运行或引用，但不能据此宣称完全盲测或证明绝无影响。原始披露、失败和修订均保留；[独立复核](W06-evidence/independent-evidence-review.md)确认模拟准备表述与原件一致。

## 保存与复现

原始源码快照中的相对链接属于被观察材料，不能作为当前仓库文档导航。为保留原名/原字节且不污染现行链接检查，原件保存在 ZIP 证据容器；可读 sidecar 使用 `.md.txt`，内容逐字节相同。没有修改链接检查器或豁免原断言。[SaaS逐文件索引](W06-evidence/saas-archive.json)、[操作逐文件索引](W06-evidence/operation-archive.json)、[审查逐文件索引](W06-evidence/review-archive.json)绑定容器及每个成员的 SHA256。

解压任一前向容器到独立临时目录后，使用当前 checker 和当时观察基线 `aec53bddd7818e8a554c01902342593f894c4dc9` 可回放该历史观察。此 SHA 不代表未来 live main；继续真实目标必须重新读取当前源、资源、设计和授权。历史失败不得覆写、重签为批准或当作当前通过。

## 未交付的边界

本次交付可在已启动且获权的 Agent 宿主会话中执行的方法、路由检查与使用证据。未安装常驻调度/无人值守唤醒，未接管 #22/PR #23；没有创建真实 SaaS、激活经销商、发送外部通知或发布应用。真实业务目标仍必须经历实际资源、设计/权限、执行、独立核验及发布后的回读。
