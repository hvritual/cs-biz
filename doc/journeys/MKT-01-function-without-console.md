# MKT-01 普通营销成员：有营销功能、无后台菜单

角色：企业营销执行成员；Account 仍有效，Membership 所属 Tenant 活跃。

- **Actor**：营销成员，无任何 `ConsoleMenuKey`。
- **Object**：当前企业营销活动、客户/其他企业受保护资源。
- **Understand**：知道当前企业、本人活动与不能进入企业管理后台的原因。
- **Action**：登录→选择企业→进入营销工作区→读取本人营销活动→执行本人活动→尝试后台深链。
- **Result**：营销 API Function 授权及 own Scope 生效；没有后台菜单不影响营销 API；/members /roles /customers 一律拦截到后台无权限状态。
- **Recovery**：模块关闭时提示不可用；Membership 停用时企业不可进；切账号/切企业后清理权限；丢失活动执行回执用同一 idempotency key 查结果。

验收场景同时必须包含：只有 Menu 没有 Function 的角色可以显示空权限页面，不能从菜单获得读写 API；拥有 Function 但没有 ConsoleMenu 不允许通过深链使用后台 UI；营销 Scope own 不可读取或执行其他负责人活动；模块关闭保留 IAM Grant 却拒绝营销业务操作。

当前浏览器页面仍使用 S01 本地账号和有状态 Mock；后端持久认证、业务 API、SQL 数据过滤不属于已交付事实。
