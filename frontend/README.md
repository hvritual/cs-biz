# Frontend

S01 提供一个 Vue 3 + Vben Admin 5 + Element Plus 的企业工作空间。应用位于 `apps/console`，由有状态的浏览器本地 Mock 服务支持客户、成员、角色、企业资料和应用开通交互；支持主题切换、中文/英文、动态菜单和响应式权限展示。

来源为 Vben `v5.7.0` 的 `apps/web-ele`，固定提交 `63a38dce49ba109f61607994e21ba921d8e970e9`。上游许可保留于 [LICENSE.vben](LICENSE.vben)。目录保留实际使用的 Vben workspace 包与构建工具；应用代码统一放入 `apps/console`。

## 开发环境与启动

使用 Node.js **22.18.0 及以上的 22.x**，或 **24.x**，并安装 Corepack。项目的 [package.json](package.json) 固定包管理器为 `pnpm@10.33.4`，依赖以 [pnpm-lock.yaml](pnpm-lock.yaml) 为准。

先从仓库根目录进入 `frontend`；本文件后续所有命令均以该目录为工作目录。

```sh
cd frontend
corepack enable
corepack install
pnpm --version
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5777 --strictPort
```

`pnpm --version` 应为 `10.33.4`。开发地址为 <http://127.0.0.1:5777>。如果环境不能创建 Corepack shim，可以用 `corepack pnpm` 替代上述及下述命令中的 `pnpm`，保持项目指定的版本。

## 构建与预览

```sh
pnpm build
pnpm preview --host 127.0.0.1 --port 5778 --strictPort
```

生产静态资源输出到 `apps/console/dist`，本地预览地址为 <http://127.0.0.1:5778>。预览用于检查构建产物；静态站点部署要求见 [deploy](deploy/README.md)。本阶段没有发布线上环境。

## 开发与检查入口

| 命令 | 责任 |
| --- | --- |
| `pnpm typecheck` | Console 的 Vue 与 TypeScript 类型检查 |
| `pnpm lint` | 应用源码静态检查 |
| `pnpm check:copy` | 用户可见文案约束检查 |
| `pnpm test:unit` | 本地服务、导航注册与请求隔离等行为测试 |
| `pnpm build` | 唯一 Console 应用的生产构建 |
| `pnpm test:e2e` | 使用构建产物执行 Playwright 浏览器检查 |
| `pnpm check` | 顺序执行 typecheck、lint、copy、unit、build、E2E；遇到失败停止 |

首次运行浏览器检查前安装 Chromium：

```sh
pnpm exec playwright install chromium
pnpm check
```

`test:e2e` 的配置会管理端口 `5778` 上的预览进程。已有兼容浏览器二进制的受限环境可以指定 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，具体流程见 [前端检查说明](ci/README.md)。命令的存在不代表本次检查已通过；实际结果记录在任务与验证证据中。

## 目录职责

| 路径 | 内容 |
| --- | --- |
| `apps/console/src/views` | 工作台、客户、成员、角色、企业资料、应用中心、平台运营和账户选择页面 |
| `apps/console/src/api/mock` | 类型、固定种子、本地状态服务和有行为意义的测试 |
| `apps/console/src/store`、`platform` | 会话与企业上下文、主题偏好、请求失效、受控动态路由 |
| `apps/console/src/locales` | 中文和英文业务文案；稳定错误码的用户语言映射 |
| `packages` | 被 Console 使用的 Vben 组件、布局、状态、主题、语言及基础能力 |
| `internal`、`scripts` | workspace 所需构建配置、样式配置和开发脚本 |
| [ci](ci/README.md) | 文案与浏览器检查配置、前端门禁运行说明 |
| [deploy](deploy/README.md) | 静态资源运行条件、SPA 深链接与部署边界 |
| [doc](doc/README.md) | 前端实现、设计约定与本地数据说明 |

## 本地数据与交付范围

初始工作空间为青禾咖啡与云岚生活。数据保留在当前浏览器来源下，当前账户与企业选择按标签页保存。账户选择用于体验不同工作权限；成员创建只新增本地账户记录。种子、重置方式、保存恢复和模拟服务边界见 [Mock 数据说明](doc/mock-data.md)。

S01 的本地检查用于验证前端交互。真实身份认证、数据库、服务端租户授权与生产部署属于后续任务。产品界面使用业务语言；Mock、API、未接入、开发中等工程说明放在开发文档中。

相关设计与交付依据：[S01 任务](../doc/tasks/S01-frontend-mock.md)、[Access Context 契约](../doc/contracts/access-context.md)、[前端选型研究](../doc/research/vue-admin-selection.md)、[ADR-0001](../doc/architecture/adr/0001-frontend.md)。
