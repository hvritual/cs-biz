# 在 cs-biz 中使用

来源固定于 `hvritual/biz@a8a2368f03d8f8ce53d6adcb431fb3ba55df1184`；逐文件 Git blob 见 [来源记录](../../../../../doc/workflow/b2b-product-ux-source.json)。本适配替换项目绑定和检查入口，保留八维、九维及 UX 分析模板。上游 Issue 编号、web 路径、API/组件示例都不是本仓库已实现能力。

先读 [AGENTS](../../../../../AGENTS.md)、[frontend/AGENTS](../../../../../frontend/AGENTS.md)、[Desktop 规范](../../../../../doc/design/desktop-ui.md)、[Intent/Design 协议](../../../../../doc/workflow/INTENT-DESIGN-WORKFLOW.md) 和实际任务来源。

| 职责 | 本仓库事实源 |
| --- | --- |
| 技术底座 | `doc/architecture/adr/0001-frontend.md`；Vue + Vben + Element Plus，不引入第二个主题/页面 Renderer |
| 视觉 | `doc/design/desktop-ui.md` 与 `frontend/apps/console/src/styles/coffeelink-tokens.css` |
| 页面/组件 | `frontend/apps/console/src/views/`、`components/` 与实际消费者；不存在上游的 Page Contract/源码索引命令时用 rg 检索，不假定已安装 |
| 导航/权限/数据 | 当前 `frontend/apps/console/src/platform/`、router 与真实服务；前端 Mock 不证明后端鉴权 |
| 预览 | 当前应用内任务限定的设计入口；隔离 fixture、生产不暴露；见 Intent/Design 协议 |
| 执行/证据 | 模型在工作流外按 `doc/ci/RISK-BASED-GATES.md` 执行 Fast/适用 Targeted、最终自动风险门禁、回读与独立审查；Human 保留方案/价值/不可逆事项决策 |

在九维 interaction_cost / decision_load / error_recoverability 下，评估系统自动完成可确定工作；适用批量选择时设计文本粘贴/导入、去重、权限内匹配、未匹配/歧义处理、最终选定范围、影响预览和逐项恢复。选定不执行；危险确认不因减少点击而删除。优先让用户判断核心业务，避免重复录入和反复跳页。

纯工作流治理任务不制造业务 demo 或截图。业务 Design Loop 必须交付同轮方案与项目预览。结构检查、浏览器、真实 API、真人测量与 Human 设计批准分别记录；未验证不填 pass。
