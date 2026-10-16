# 仓库布局与文档所有权

| 路径 | 所有者 / 实际职责 | 阅读入口 |
| --- | --- | --- |
| `frontend/` | 唯一 Console pnpm workspace；实际消费的 Vben 包和构建工具 | [frontend](../../frontend/README.md) |
| `frontend/deploy/ci/doc` | 前端静态部署、检查、端内实现说明 | [CI](../../frontend/ci/README.md)、[deploy](../../frontend/deploy/README.md)、[doc](../../frontend/doc/README.md) |
| `backend/` | 单 Go module，Authz V2、固定 Consumer 与只读技术探针 | [backend](../../backend/README.md) |
| `backend/deploy/ci/doc` | 开发/CI Trace 环境、生成/安全/运行检查与端内合同说明 | [CI](../../backend/ci/README.md)、[deploy](../../backend/deploy/README.md)、[doc](../../backend/doc/README.md) |
| `doc/architecture/` | 跨端边界、目录责任和版本化 ADR；不代替当前源码 | [架构](README.md) |
| `doc/product/`、`doc/journeys/`、`doc/contracts/` | 业务结果、用户状态/恢复、合同源导航和未实施提案 | [文档地图](../README.md) |
| `doc/roadmap.md` | 唯一当前阶段投影，引用真实 Issue/PR 与证据 | [路线](../roadmap.md) |
| `doc/tasks/` | 每个任务的来源、范围、验收、冻结设计与交付记录 | [任务导航](../tasks/README.md) |
| `doc/evidence/` | 版本化观察、来源和验证导航，不提供新的批准权 | [证据导航](../evidence/README.md) |
| `doc/templates/` | 单任务/板块验收与证据的填写格式 | [任务模板](../templates/task.md) |
| `doc/ci/` | 跨端本地入口、当前交付政策与 CI 适配/测试桥 | [CI 地图](../ci/README.md) |
| `doc/workflow/SDLC-ADOPTION.md` | 项目如何使用可复用工作流，不复制其实现 | [接入](../workflow/SDLC-ADOPTION.md) |
| `.agents/skills/` | 5 个有独立职责的公开入口及阶段内部能力；工作流资源归所属包 | [路由](../../.agents/skills/sdlc-workflow/SKILL.md) |
| `.codex/agents/` | 包内权威 Agent TOML 的已检查安装镜像 | [定义依据](../../.agents/skills/sdlc-workflow/references/standards.md) |
| `.github/workflows/` | GitHub Actions 执行入口；quality.yml 是唯一自动质量流程 | [风险门禁](../ci/RISK-BASED-GATES.md) |

根目录统一 `doc/`，不建立竞争的 `docs/` 或第二份任务数据库。运行时合同留在代码的 canonical 源；文档引用其路径/版本和消费者。生成物由生成器维护。

## 文档生命周期

创建前先判断能否补充现有职责文件。现行文档必须有所属入口和可观察用途；一个空 README 或纯转发 Skill 不因占位而保留。相同规则只在一个位置维护，其他入口用带用途的链接。

Task/Issue 仍是工作状态权威；roadmap 是带日期的投影。冻结 rounds/handoffs、批准内容和原始证据不移动、不改写。仅任务顶层交付摘要可根据实际回执更新；旧轮变化通过新版本记录。需要历史文件时按记录 commit 使用 `git show COMMIT:path`，不为保留旧名字再制造活动别名。

第三方模板源码和许可证、真实源/版本快照、协议兼容 CLI、独立回归证据有各自用途；不能仅因文件小、暂时无新任务或内容不在默认路径而删除。
