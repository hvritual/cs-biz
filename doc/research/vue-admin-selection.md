# Vue SaaS 前端底座选型

- 核验日期：2026-10-12，Asia/Shanghai。
- 方法：GitHub 插件搜索与仓库/分支/发布/固定提交文件读取；官方文档补充。
- 实证层级：官方功能说明 + 静态源码核验。**本轮没有安装或运行候选，没有浏览器兼容性、可访问性或性能实测。**
- 需求：Vue + 成熟组件库 + 动态换肤 + 国际化 + 动态菜单/权限。

## 结论

默认推荐 **Vben Admin 5 + Element Plus**，从 `apps/web-ele` 引入。只选一个主要组件库和一个 console 应用，适配本项目的租户/权益/成员/数据范围契约。选型仍为 [ADR-0001 提案](../architecture/adr/0001-frontend.md)，引入时必须选定固定版本并验证关键场景。

这项推荐基于已存在的组件适配与访问能力、可承受的集成路线、组件库自己的正式发布记录，以及两个备选当前的维护差异。不能从 README、star 数或最近提交推导长期稳定性。

## 候选比较

| 候选 | Vue / 组件库 | 换肤与国际化 | 菜单/权限机制 | 维护事实与取舍 |
| --- | --- | --- | --- | --- |
| [Vben Admin](https://github.com/vbenjs/vue-vben-admin) | Vue 3；有 Ant Design Vue、Element Plus、Naive UI 等应用 | 主题偏好、Token 适配、动态语言加载 | frontend/backend/mixed；接口菜单、权限码、组件/API/指令 | 当前推荐。pnpm monorepo 有额外理解成本；SaaS 授权需自有接入层 |
| [Pure Admin](https://github.com/pure-admin/vue-pure-admin) | Vue 3 + Element Plus | 主题色、明暗、vue-i18n | 后端动态路由、角色/按钮权限 | Element Plus 候选。官方推荐精简版，但 i18n 分支与完整版版本不同 |
| [Soybean Admin](https://github.com/soybeanjs/soybean-admin) | 本次核验主仓是 Vue 3 + Naive UI；另有官方 Ant Design Vue/Element Plus 仓库 | 主题与 UnoCSS/Naive Token 协同、语言包 | 静态/动态路由、Elegant Router、按钮权限 | 2.3 维护线与未来 3.0 重构要分开评估，本次降为备选 |

三个主仓均有 MIT 许可文件。正式采用时保留相应声明并盘点实际复制的依赖与资源；这不自动决定本项目自身的发布许可。

## 组件库自己的维护观察

脚手架活跃并不代表其选用的每个组件库都有相同发布节奏。本次补查 GitHub release API 后修正早期 Ant Design Vue 推荐：

| 组件库 | GitHub latest release | 发布时间 | 决策意义 |
| --- | --- | --- | --- |
| [Element Plus](https://github.com/element-plus/element-plus/releases/tag/2.14.7) | 2.14.7 | 2026-09-30 | 有近期正式发布，Vben 5.7 已有完整适配，作为当前默认候选 |
| [Ant Design Vue](https://github.com/vueComponent/ant-design-vue/releases/tag/4.2.6) | 4.2.6 | 2024-11-11 | 有成熟组件与既有适配，但稳定发布间隔需要纳入新项目维护评估 |

这不是“Ant Design Vue 已停止维护”或“Element Plus 全面优于其他库”的结论，证据不足以支持这些断言。Naive UI 的 releases/latest 本次返回 404，不能据此推断其维护状态；若最终选择该路线，应另查 tag、包发布和实际兼容证据。

Element Plus 官方说明支持基于 CSS variables 的动态定制与暗色模式，来源：[主题](https://element-plus.org/en-US/guide/theming)、[暗色模式](https://element-plus.org/en-US/guide/dark-mode)。组件库最新 release 与 Vben 的依赖声明/锁文件是不同观察，正式引入以固定来源锁文件和安装结果为准。

## 固定观察点

| 项目/分支 | 已核验提交 | 发布观察 |
| --- | --- | --- |
| Vben main | `4634655c621338abd97386350e5dc3d9119dab2c` | GitHub latest release 为 [v5.7.0](https://github.com/vbenjs/vue-vben-admin/releases/tag/v5.7.0)，2026-05-21 |
| Soybean main | `341f4ee4e590207cd1176441763247568a3e8f8d` | GitHub latest release 为 [v2.3.0](https://github.com/soybeanjs/soybean-admin/releases/tag/v2.3.0)，2026-10-09 |
| Pure main | `fae75ad1cd52d11a7279931ef5bba2b80e363c7b` | GitHub latest release 为 [v7.0.0](https://github.com/pure-admin/vue-pure-admin/releases/tag/v7.0.0)，2026-04-07 |
| Pure thin i18n | `2395bb11b51b45c3e9ae78ee23f88e3f3510b606` | 分支提交日期 2025-10-30，提交说明为 6.2.0；不能称为完整版 7.0 |

以上 main SHA 用于源码证据，不等于已经选定的导入 SHA。Vben `v5.7.0` tag 直接指向 `63a38dce49ba109f61607994e21ba921d8e970e9`；release 与 main 不是同一份内容，工具链也必须以选定版本的清单与锁文件为准。完整来源记录见 [JSON 快照](../evidence/sources-2026-10-12.json)。

## Vben：为什么推荐，以及需要补什么

### 可核实能力

- [官方组件库说明](https://doc.vben.pro/guide/in-depth/ui-framework.html) 列出独立的 UI 应用与必要适配工作。选择 Element Plus 后不应同时保留所有 UI 演示作为业务依赖。
- main 与 v5.7.0 中都存在真实的 Element Plus 应用。发布版 [app.vue](https://github.com/vbenjs/vue-vben-admin/blob/63a38dce49ba109f61607994e21ba921d8e970e9/apps/web-ele/src/app.vue) 调用 `useElementPlusDesignTokens()`，由[共享 hook](https://github.com/vbenjs/vue-vben-admin/blob/63a38dce49ba109f61607994e21ba921d8e970e9/packages/effects/hooks/src/use-design-tokens.ts) 将品牌色、背景、边框、圆角、文字及状态色映射为 `--el-*` CSS 变量。`ElConfigProvider` 在该应用中接收 locale；主题不是 Antd 的 algorithm 机制。
- [权限文档](https://doc.vben.pro/guide/in-depth/access.html) 定义后端菜单生成路由、权限码和访问组件等机制；可用作本项目访问投影的渲染层。
- [国际化文档](https://doc.vben.pro/en/guide/in-depth/locale.html) 描述偏好更新与语言包动态加载。仍须验证业务文案和选定组件库的语言覆盖。

Element Plus 应用的 [locales/index.ts](https://github.com/vbenjs/vue-vben-admin/blob/63a38dce49ba109f61607994e21ba921d8e970e9/apps/web-ele/src/locales/index.ts) 当前明确适配中文/英文的组件库和日期语言；更多语言需要补齐，不能把核心已有某语言文件解释为整个应用已完成该语言。[router/access.ts](https://github.com/vbenjs/vue-vben-admin/blob/63a38dce49ba109f61607994e21ba921d8e970e9/apps/web-ele/src/router/access.ts) 使用与其他应用相同的访问层和本地页面映射。

### 影响 SaaS 的静态源码发现

| 发现 | 具体证据 | 对本项目的含义 |
| --- | --- | --- |
| 指令只有 mounted 检查，拒绝时移除元素 | [directive.ts](https://github.com/vbenjs/vue-vben-admin/blob/4634655c621338abd97386350e5dc3d9119dab2c/packages/effects/access/src/directive.ts) | 不能据此证明租户切换/在线撤权会更新已挂载按钮；使用响应式组件/表达式并清理旧状态 |
| 多权限码、多角色判断采用命中任一项 | [use-access.ts](https://github.com/vbenjs/vue-vben-admin/blob/4634655c621338abd97386350e5dc3d9119dab2c/packages/effects/access/src/use-access.ts) | 这是 OR，业务若要求全部满足需显式 `all`；更不能替代服务端权益/权限/范围交集 |
| mixed 模式合并前后端路由 | [官方权限文档](https://doc.vben.pro/guide/in-depth/access.html) | 不能把 mixed 名称理解成租户权益和所有路由权限的强制交集 |
| 上游主分支内部版本和正式发布不同 | [root package](https://github.com/vbenjs/vue-vben-admin/blob/4634655c621338abd97386350e5dc3d9119dab2c/package.json) 与 [Antd app package](https://github.com/vbenjs/vue-vben-admin/blob/4634655c621338abd97386350e5dc3d9119dab2c/apps/web-antd/package.json) | root 为 5.7.0，部分包标为 5.8.0；不能称最新正式版本为 5.8.0 |

这些是对所列源码的机制判断，不是已复现的线上漏洞或安装验证。模板默认角色、Mock 数据、访问模式和刷新策略都需要用真实后端契约替换。

### 导入策略

在固定来源上先证明唯一 Element Plus 应用可安装和构建，再做有记录的裁剪。保留真实依赖的内部包与许可证；把业务组件放在自己的模块，尽量通过 API/主题/访问适配扩展。每次上游升级先在单独分支重跑主题、语言、权限变化、租户切换和深链接测试。

## Pure：简洁路线需要先解决版本差异

[完整版 README](https://github.com/pure-admin/vue-pure-admin/blob/fae75ad1cd52d11a7279931ef5bba2b80e363c7b/README.md) 推荐实际项目使用精简版，并区分国际化与非国际化来源。当前 [pure-admin-thin i18n 分支](https://github.com/pure-admin/pure-admin-thin/tree/2395bb11b51b45c3e9ae78ee23f88e3f3510b606) 的 head 在 2025-10-30，不能把完整版 2026 年的发布与修复状态直接转述为该分支的状态。

如团队熟悉 Element Plus，Pure 仍是合理候选。采用前先核对 thin i18n 的依赖、访问逻辑和必须补齐的 upstream 变更；也可在固定完整版上有记录地裁剪。不能仅因为“thin”就断言总维护成本更低。

授权投影仍需后端定义。前端的角色、路由和按钮可见性不提供租户存储隔离；清理退出/切租户缓存和在线权限变化必须列为应用接入验收。

静态核验入口：[主题逻辑](https://github.com/pure-admin/vue-pure-admin/blob/fae75ad1cd52d11a7279931ef5bba2b80e363c7b/src/layout/hooks/useDataThemeChange.ts)、[国际化](https://github.com/pure-admin/vue-pure-admin/blob/fae75ad1cd52d11a7279931ef5bba2b80e363c7b/src/plugins/i18n.ts)、[路由处理](https://github.com/pure-admin/vue-pure-admin/blob/fae75ad1cd52d11a7279931ef5bba2b80e363c7b/src/router/utils.ts)、[权限辅助](https://github.com/pure-admin/vue-pure-admin/blob/fae75ad1cd52d11a7279931ef5bba2b80e363c7b/src/utils/auth.ts)。这些是完整版固定提交，不应视作 thin 的相同实现。

## Soybean：功能齐全，但路线正在转换

固定提交的 [README](https://github.com/soybeanjs/soybean-admin/blob/341f4ee4e590207cd1176441763247568a3e8f8d/README.md) 已说明：3.0 正在基于 ubean 与 VeanUI 重构，2.3 是 2.x 最后一个维护大版本，新功能集中于 3.0。该信息对长期 SaaS 底座选择的影响大于“支持多语言/动态菜单”本身。

选择 2.3 需要接受固定维护线及后续迁移判断；选择未来 3.0 则需要新的成熟度和兼容性验证。不能预判其成功或失败，也不把正在开发的 3.0 当成本次可用稳定版本。主仓当前仍为 Naive UI 路线，官方的 Ant Design Vue、Element Plus 派生仓库需要分别核验，不能把它们的实现状态混在一张主仓能力表中。

静态核验入口：[主题 store](https://github.com/soybeanjs/soybean-admin/blob/341f4ee4e590207cd1176441763247568a3e8f8d/src/store/modules/theme/index.ts)、[国际化](https://github.com/soybeanjs/soybean-admin/blob/341f4ee4e590207cd1176441763247568a3e8f8d/src/locales/index.ts)、[权限辅助](https://github.com/soybeanjs/soybean-admin/blob/341f4ee4e590207cd1176441763247568a3e8f8d/src/hooks/business/auth.ts)。

## 三个候选都不能替代的 SaaS 工作

租户生命周期、模块生效权益、成员身份、角色权限、资源数据范围、真实 API 鉴权、审计、幂等和结果恢复，都属于业务系统契约。未运行真实两租户场景前，证据不足以宣称任何候选已经解决本项目的 SaaS 权限。

具体补齐范围见 [Access Context](../contracts/access-context.md) 与 [SAAS-01](../journeys/SAAS-01-tenant-onboarding.md)。
