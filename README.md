# CS Biz

面向多租户业务的 SaaS 系统。当前阶段：**S00 目录骨架与架构设计草案**。

## 当前真实状态

- 2026-10-12 核验时，`hvritual/cs-biz` 是空仓库：没有分支、提交、应用代码或 Issue。
- 本次建立 `frontend`、`backend`、`doc`，两端分别包含 `deploy`、`ci`、`doc`。
- 前端明确要求：Vue、成熟组件库、动态换肤、国际化、动态菜单和权限管理。
- 推荐候选为 **Vben Admin 5 + Ant Design Vue**；技术决策状态为 `proposed`，尚未导入前端依赖。
- 后端建议使用 Go 模块化单体；具体 Web 框架、数据库和认证提供方尚未锁定。
- 当前可执行的是仓库结构与文档一致性检查。没有可运行的 SaaS 应用、真实 API、数据库或部署包。

## 阅读入口

| 主题 | 入口 |
| --- | --- |
| 文档总览 | [doc/README.md](doc/README.md) |
| 目录及各端责任 | [仓库布局](doc/architecture/repository-layout.md) |
| GitHub 前端候选与源码证据 | [前端选型研究](doc/research/vue-admin-selection.md) |
| 前端技术决策草案 | [ADR-0001](doc/architecture/adr/0001-frontend.md) |
| 全局架构与模块边界 | [架构设计](doc/architecture/README.md) |
| 产品边界与第一条业务闭环 | [产品范围](doc/product/scope.md) |
| 租户、权益、成员、权限、菜单契约 | [Access Context](doc/contracts/access-context.md) |
| 首条用户旅程及反例 | [SAAS-01](doc/journeys/SAAS-01-tenant-onboarding.md) |
| MVP / Full Runtime / Production 路线 | [路线与状态](doc/roadmap.md) |
| 后续任务模板 | [任务模板](doc/templates/task.md) |
| 本轮交付边界 | [S00](doc/tasks/S00-repository-design.md) |
| 可执行检查及局限 | [全局检查](doc/ci/README.md) |

## 本地检查

需要 Python 3.10 或更新版本，无第三方依赖。在仓库根目录执行：

```sh
python3 doc/ci/check_repository.py
```

Windows 可使用：

```powershell
py -3 doc/ci/check_repository.py
```

检查通过仅证明目录、必备文档和受支持的相对文档链接存在。业务完成必须另有真实运行证据。
