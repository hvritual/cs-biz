# 前端应用设计与开发约定

S01 已在固定 Vben Admin `v5.7.0` / Element Plus 底座上实现唯一 console 应用。开发入口见 [Frontend](../README.md)，本地账户与数据见 [Mock 数据说明](mock-data.md)，页面规范与截图比对见 [界面设计](design.md)。验证与交付状态以 [S01 证据](../../doc/evidence/S01-validation.md) 为准。

## 实际分层

| 层 | 源码入口，均相对 `apps/console/src` | 责任 |
| --- | --- | --- |
| 应用启动 | `main.ts`、`bootstrap.ts` | 先恢复偏好与访问上下文，再挂载布局；初始化失败提供业务文案与重试 |
| 壳层 | `layouts/basic.vue`、`components/WorkspaceShellTools.vue` | CoffeeLink DesktopShell，复用 Vben 的路由、权限与偏好系统；企业、账户、语言、外观与导航控制 |
| 工作空间 | `store/workspace.ts`、`platform/` | 有效权限、动态菜单、白名单视图、租户切换与过期请求丢弃 |
| 外观 | `store/appearance.ts`、`styles/business.css`、`app.vue` | Vben preferences、Element Plus token 与业务 CSS 共用状态 |
| 业务页面 | `views/` | 工作台、客户、成员、角色、企业资料、应用、个人偏好、平台企业管理，以及账户/异常状态 |
| 页面数据 | `composables/useResource.ts`、`utils/pending-command.ts` | 加载/空/错/重试、取消与 generation 校验、待确认创建命令 |
| 本地服务 | `api/mock/types.ts`、`seed.ts`、`service.ts` | 显式主体与企业上下文、种子与状态、动作/范围/应用权益校验 |

业务新增按用户任务组织视图，不复制外壳。Element Plus 是主要业务组件库；Vben 的底层组件是壳层依赖，不另外引入一套业务组件主题。

## 动态菜单和权限

本阶段遵循全局 [Access Context](../../doc/contracts/access-context.md) 的主体、企业、成员状态、应用权益与动作/范围语义。数据服务与 UI 控件均使用权限；前端演练不构成真实服务端信任边界。

`platform/navigation.ts` 的固定 registry 将 `viewKey`、路径、路由名、`titleKey` 一起校验。未知组件、重复路由、不合法的本地跳转均拒绝。菜单通过 Vben 的 backend access mode 生成，页面组件由已打包的注册表解析，不执行远程代码或任意导入路径。

切换账户/企业、成员停用、角色或应用权益变化都会推进 generation，清除旧的权限、动态路由、用户信息与页签。异步安装使用串行队列；每次发布还要检查 generation、主体和企业。`useResource` 同时取消旧请求并使旧序号失效。仅 AbortController 不足以证明旧结果不会覆盖新页面。

权限按动作分别绑定 scope。拥有全部客户的查看权限，不会扩大本人客户的编辑/归档范围。资源响应提供 `canUpdate` / `canArchive`，列表按钮据此显示。平台运营身份没有自动获得租户业务权限。

## 换肤与国际化

- 外观支持浅色、深色、跟随系统，六个受控主色，以及舒适/紧凑密度。个人偏好按账户和企业保存；默认值来自企业品牌色。
- 只接收有限枚举和颜色，不接受任意 CSS 或 JavaScript。业务 CSS、Element Plus design token 和 Vben 导航主题同步更新；表格、表单、抽屉和提示需一起验收。
- 应用语言为 `zh-CN` / `en-US`。菜单、校验、错误提示和 Element Plus 语言同步；日期和数量通过 Intl 格式化。日期时区固定为 `Asia/Shanghai`，不是由语言推导时区。
- 数据本身的客户名、成员名和用户输入不自动翻译。增加语言时必须补齐所有应用键与插值变量，通过 `check:copy` 和浏览器验证。

外观写入失败保留先前设置并提示业务错误，不能在保存失败后宣称已保存。启动边界在应用依赖失败时也能显示中英文提示，因此少量恢复文案位于独立 `startup-boundary.ts`，由专门测试和浏览器文案扫描覆盖。

## 业务文案约束

产品界面不出现 Mock、API、未接入、开发中、占位等工程状态，包括页面标题、按钮、菜单、空状态、校验、抽屉和成功/失败提示。错误使用稳定 code 映射为可采取行动的业务文案，不展示异常堆栈或原始服务消息。

例如：无客户显示“还没有客户”；应用未开通显示“可开通”及真实申请入口；访问被停用说明联系企业负责人；读取失败提供重试。添加成员只创建本地账户，不声称发送了邮件；开通应用不声称完成支付。

## 数据与后续服务替换

页面通过当前 `api` 方法读取和修改有状态数据。创建客户/成员前先生成并保存幂等键及原始输入，未知结果时保留同一命令；已知参数错误可清理，冲突、取消与超时保留恢复入口。租户切换不携带另一企业的表单或待确认命令。

后续接真实服务时，保留上下文、错误码、幂等和取消语义，替换适配实现并增加服务端契约与隔离测试。浏览器中的身份选择、本地存储和权限校验只用于 S01 交互验证；真实认证、服务端强制授权、数据库事务、审计、支付和邀请由后续阶段完成。

## 依赖与维护

上游 commit、保留范围和定向修改见 [来源记录](upstream.json) 与 [第三方通知](../THIRD_PARTY_NOTICES.md)。安装必须使用根 `packageManager` 指定的 pnpm 和现有锁文件。禁止把主线 package 中的开发版本号当作本项目已升级到新发布版。

构建入口设置 `TURBO_TELEMETRY_DISABLED=1` 与 `DO_NOT_TRACK=1`，不发送 Turborepo 构建遥测。当前启用的壳层图标随包构建；不要添加运行时依赖外部图标服务的导航按钮。

## Project-wide Desktop UI standard

The single source is **doc/design/desktop-ui.md** (relative link: [desktop contract](../../doc/design/desktop-ui.md)). It governs all future UI tasks and is checked by pnpm check:desktop. The desktop shell uses existing Vben access/router/preferences services with one product-specific layout; its width and visual rules are in styles/desktop.css. No Mobile acceptance in this phase.
