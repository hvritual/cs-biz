# Frontend

当前只有前端目录边界与接入设计，尚未导入 Vue 应用或 npm 依赖。

明确需求为 Vue + 成熟组件库 + 动态换肤 + 国际化 + 动态菜单与权限管理。推荐采用 Vben Admin 5 的 Element Plus 应用 `apps/web-ele` 作为来源，详见 [选型研究](../doc/research/vue-admin-selection.md) 和 [ADR-0001](../doc/architecture/adr/0001-frontend.md)。

| 目录 | 责任 |
| --- | --- |
| [deploy](deploy/README.md) | 前端镜像、静态资源、代理、运行环境注入 |
| [ci](ci/README.md) | 前端安装、类型、lint、组件、构建与浏览器检查 |
| [doc](doc/README.md) | 前端开发规范及主题、语言、访问适配 |

采用 Vben 后，计划在此目录内部保留其 pnpm workspace：`apps/console`、实际使用的 `packages` 和构建所需的 `internal`。首次导入应先保持可构建，再有证据地删去演示和未使用的应用；不要凭目录名称删除传递依赖。

前端只消费后端提供的有效访问上下文。平台与租户可以先使用一个前端应用、不同路由域和不同布局，安全边界必须由后端落实。
