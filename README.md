# CS Biz

面向多租户业务的 SaaS 系统。当前阶段：**S01 前端应用与有状态 Mock**。

## 当前真实状态

- 仓库根目录为 `frontend`、`backend`、`doc`，两端分别包含 `deploy`、`ci`、`doc`；跨端架构、契约、旅程、任务和检查集中放在 `doc`。
- S01 已导入 **Vue 3 + Vben Admin 5 + Element Plus**，唯一应用位于 `frontend/apps/console`，具有固定上游来源与 pnpm 锁文件。
- 已实现主题切换、中文/英文、账户与企业切换、动态菜单和响应式权限展示。客户、成员、角色与应用状态由浏览器本地 Mock 服务保存。
- S00 的 [PR #1](https://github.com/hvritual/cs-biz/pull/1) 尚未合并；S01 从 `codex/saas-foundation-design` 建立 `codex/s01-frontend-mock`，按增量 PR 交付。当前代码、主线合并和环境部署分别记录。
- S02 后端阶段尚未开始。Go 模块化单体仍是建议方向，具体 Web 框架、数据库和认证提供方尚未锁定；本阶段没有真实认证、后端 API、数据库或线上部署。

本阶段范围见 [S01 任务](doc/tasks/S01-frontend-mock.md)，实际检查结果、PR 和提交信息统一见 [S01 验证记录](doc/evidence/S01-validation.md)。

## 前端现有页面

| 页面 | 当前交互能力 |
| --- | --- |
| 工作台 | 当前企业概览、客户状态统计、最近更新与常用入口 |
| 客户 | 搜索、状态筛选、分页、详情、新建、编辑、归档 |
| 成员 | 添加本地账户、分配角色、暂停与恢复访问 |
| 角色 | 查看、新建、修改、删除角色，维护动作及适用范围 |
| 企业资料 | 查看与更新企业名称、联系人、电话和邮箱 |
| 应用中心 | 查看企业应用状态、提交开通申请、查看申请结果 |
| 平台运营 | 独立运营身份查看企业并开通或暂停客户管理应用 |
| 个人偏好 | 浅色、深色、跟随系统、有限主色、密度、中文/英文 |

账户选择入口用于切换本地身份。初始数据包含青禾咖啡与云岚生活，以及负责人、负责范围成员、只读成员、停用成员和平台运营身份。模拟服务在每次操作时检查当前规则，保留动作与范围的对应关系；新建客户和成员支持预知幂等键与恢复。详细数据和限制见 [Mock 数据说明](frontend/doc/mock-data.md)。

## 本地运行

使用 Node.js 22.18.0 及以上的 22.x 或 24.x，并安装 Corepack。先从仓库根目录进入 `frontend`；后续命令在该目录运行，由 Corepack 使用项目固定的 pnpm 版本：

```sh
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm dev --host 127.0.0.1 --port 5777 --strictPort
```

开发地址为 <http://127.0.0.1:5777>。构建与静态预览：

```sh
corepack pnpm build
corepack pnpm preview --host 127.0.0.1 --port 5778 --strictPort
```

首次运行浏览器门禁前安装 Chromium，然后执行完整前端检查：

```sh
corepack pnpm exec playwright install chromium
corepack pnpm check
```

完整开发、浏览器选择和静态托管说明分别见 [frontend](frontend/README.md)、[前端 CI](frontend/ci/README.md) 与 [前端 deploy](frontend/deploy/README.md)。用户界面使用业务语言；工程状态和模拟数据说明留在开发文档中。

## 阅读入口

| 主题 | 入口 |
| --- | --- |
| 文档总览 | [doc/README.md](doc/README.md) |
| 目录及各端责任 | [仓库布局](doc/architecture/repository-layout.md) |
| GitHub 前端候选与源码证据 | [前端选型研究](doc/research/vue-admin-selection.md) |
| 前端技术决策与接入依据 | [ADR-0001](doc/architecture/adr/0001-frontend.md) |
| 全局架构与模块边界 | [架构设计](doc/architecture/README.md) |
| 产品边界与第一条业务闭环 | [产品范围](doc/product/scope.md) |
| 租户、权益、成员、权限、菜单契约 | [Access Context](doc/contracts/access-context.md) |
| 首条用户旅程及反例 | [SAAS-01](doc/journeys/SAAS-01-tenant-onboarding.md) |
| MVP / Full Runtime / Production 路线 | [路线与状态](doc/roadmap.md) |
| 后续任务模板 | [任务模板](doc/templates/task.md) |
| 结构与设计基线 | [S00](doc/tasks/S00-repository-design.md) |
| 当前前端交付边界 | [S01](doc/tasks/S01-frontend-mock.md) |
| 当前版本的实际验证 | [S01 验证记录](doc/evidence/S01-validation.md) |
| 可执行检查及局限 | [全局检查](doc/ci/README.md) |

## 全局结构检查

需要 Python 3.10 或更新版本，无第三方依赖。在仓库根目录执行：

```sh
python3 doc/ci/check_repository.py
```

Windows 可使用：

```powershell
py -3 doc/ci/check_repository.py
```

此检查验证仓库目录、必备文档和受支持的相对链接。前端运行结果以对应门禁为准；真实 SaaS 授权、数据库隔离及完整业务闭环仍需后续后端与跨端证据。
