# Issue #11 优化后的执行指令

在 `hvritual/cs-biz@da5494d03c362ab873465c1793e7aba7e4e3a7cc` 上，完成 F0 的事实冻结与可审阅设计：保留 Issue #11 原文及 #10 路线，不把后续阶段实现或框架自身 CI 当作已完成。读取主线、PR #7/#8/#18 的固定候选和 Yunka 评估提交 `3527488325030fbf86fe52804140c936e9d937a4`；逐文件记录 commit/blob/SHA256/定位，比较工具链、模块、身份与 Menu/Function/Data 权威及可观测性契约。

复用 PR #18 的方向草案，明确其未批准、未合并状态，不重写整个仓库路线。交付同轮 solution/requirements/design/技术 journey/flow、来源清单、兼容和负例矩阵、条件/偏好决策树及 ADR 候选。纯架构文档无业务 UI 变化，项目前端 Preview 不适用，理由须明确。

仅改本任务文档、F0 ADR 和必要 roadmap 状态投影。不改前后端运行代码、依赖、生成物、Full 调度、生产配置或其他仓库。不导入 Yunka，不推断身份/DB/版本组合已获批准。缺失的模块组合资格、IdP/DB/会话/Scope/诊断留存决策，保留 owner、影响阶段及恢复动作。没有真实 Human 本轮确认，不写 accepted / DESIGN_HANDOFF，不开始 F1，不关闭 Issue。

执行结构/链接、来源 blob 与摘要、版本/负例矩阵及适用治理回归；缺 Go/protoc/身份/数据库时分别标 unavailable/missing，不伪造 runtime PASS。按现有 GitHub 交付独立审阅候选；已获批准的其他任务豁免不延用到本候选。
