> **2026-10-15 最新定位：** 本文件中的目录清单是 S00 历史布局说明，当前 `frontend/apps/console` 与 `backend/internal/platform/authz` 已存在。未来 Yunka Consumer 的 canonical typed PB 预计置于 `backend/contracts/proto/**`（最终以 F1 project profile 冻结），`contracts/generated` 的 OpenAPI/TS/OperationPlan/Assembly 为生成产物而非第二个独立可写接口真相。来源：[ADR-0002](adr/0002-yunka-runtime-adoption.md)、[Roadmap](../roadmap.md)。

# 仓库布局

## 已明确的目录要求

根目录至少包含 `frontend`、`backend`、`doc`；前后端分别至少包含 `deploy`、`ci`、`doc`。Git 以文件跟踪目录，所以每个当前目录都放置有职责说明的 README。

| 路径 | 单一责任 | 是否本轮已创建 |
| --- | --- | --- |
| `frontend/` | Vue 应用的工作区根 | 是，目录骨架 |
| `frontend/deploy/` | 前端构建部署配置 | 是，责任说明 |
| `frontend/ci/` | 前端自身检查入口 | 是，未来命令契约 |
| `frontend/doc/` | 前端开发、组件与状态设计 | 是 |
| `backend/` | 后端服务工作区根 | 是，目录骨架 |
| `backend/deploy/` | 后端服务、配置及迁移部署 | 是，责任说明 |
| `backend/ci/` | 后端自身检查入口 | 是，未来命令契约 |
| `backend/doc/` | 后端模块与存储设计 | 是 |
| `doc/ci/` | 全局本地检查、跨端契约/E2E 编排 | 是，当前实现结构检查 |
| `doc/architecture/` | 架构图、目录责任、ADR | 是 |
| `doc/contracts/` | 跨端 API 与访问上下文的规范源 | 是，文本提案 |
| `doc/product/` | PRD、范围和业务结果 | 是 |
| `doc/journeys/` | 角色任务、操作状态、结果与失败恢复 | 是 |
| `doc/templates/` | 任务、验收与交付的统一模板 | 是 |
| `doc/tasks/` | 当前已授权任务及证据入口 | 是 |
| `doc/research/` | 选型理由、反例、源链接 | 是 |
| `doc/evidence/` | 来源快照和验证记录 | 是 |
| `.github/workflows/` | GitHub Actions 的发现入口 | 是 |

GitHub 规定工作流文件必须位于 `.github/workflows`。将工作流 YAML 仅放在 `frontend/ci`、`backend/ci` 或 `doc/ci` 不会触发自动发现。采用薄入口调用脚本，能够同时满足目录责任与 GitHub 执行要求。来源：[GitHub 官方工作流语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)。

## 后续代码目录的建议

若选择 Vben，`frontend/` 自身就是一个 pnpm workspace，根仓库不再引入另一套 Node workspace：

| 未来路径，当前未创建 | 用途 |
| --- | --- |
| `frontend/apps/console/src/platform/` | 认证、租户上下文、主题、国际化、访问适配 |
| `frontend/apps/console/src/modules/` | 按业务任务组织 views、组件与查询 |
| `frontend/apps/console/src/api/` | 全局 API 契约的生成类型与 HTTP 适配 |
| `frontend/packages/` | 被唯一应用实际使用的上游或共享包 |
| `frontend/internal/` | 被上游构建实际依赖的配置；不是后端 internal |
| `backend/cmd/api/` | 进程入口与依赖装配 |
| `backend/internal/<module>/` | 领域模块；按真实复杂度拆应用、领域、存储 |
| `backend/migrations/` | 版本化数据库迁移 |
| `backend/contracts/proto/`（F1 目标，未建立） | Yunka typed PB 为目标 Operation / API 可写规范源，OpenAPI/TS/OperationPlan 为其派生生成物 |

以上目录不是预先建立的大型框架清单。S01、S02 引入可运行代码时，基于依赖与用户旅程逐步建立。整个仓库统一使用根 `doc`，不新建竞争的根 `docs`。

## 变更如何关联检查

| 变化 | 应执行的检查 |
| --- | --- |
| 目录、文档、模板 | 当前仓库结构与相对链接检查 |
| Vue 页面、主题、语言或访问适配 | 前端类型、行为与构建检查；对应旅程的浏览器回归 |
| 服务或数据访问 | 后端测试、授权矩阵、数据库集成 |
| OpenAPI、权限码、菜单语义 | 跨端契约检查、生成差异、前后端消费者检查 |
| 部署、认证、租户隔离 | 集成验收及相应运行场景检查 |

运行门禁尚未实现时应明确显示缺失状态；不能让单一结构绿灯代表整套系统通过。

## F1 之后的目标工作目录（当前并非已创建）

- `backend/contracts/proto/**`：受保护业务 Operation/Request/Response/Transport/ExecutionPolicy；
- `backend/contracts/generated/**`：Yunka 生成的 OpenAPI/TypeScript/OperationPlan 等，不直接手工编辑；
- `backend/internal/{access,marketing,crm}/**`：真实业务数据模型与 Owner，`OperationGuard` 与 SQL Scope 解释在业务边界；
- `backend/internal/assembly/**`：Yunka 生成的静态 Assembly（以实际 F1 工具生成结果为准）；
- `doc/contracts/**`：跨端**语义合同**与版本/迁移/用例，不是另一份 runnable Protobuf/OpenAPI 权威。

需要从 `backend/go.mod` Go 1.23 升至 Yunka 当前 1.25.13/protoc 3.21.12，且**当前尚未实施**。
