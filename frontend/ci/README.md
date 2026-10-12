# 前端检查

当前状态：`not-implemented`。没有 `package.json`、锁文件或前端测试，因此不能宣称前端 build / E2E 已通过。

S01 必须提供从仓库根目录可调用的真实命令入口，建议将已选上游实际命令映射为：

| 入口契约，尚未实现 | 检查责任 |
| --- | --- |
| `pnpm --dir frontend install --frozen-lockfile` | 可复现安装 |
| `pnpm --dir frontend run check:types` | 类型检查 |
| `pnpm --dir frontend run lint` | 静态规范 |
| `pnpm --dir frontend run test:unit` | 访问适配、路由映射等有行为价值的单测 |
| `pnpm --dir frontend run build` | 唯一选定应用的生产构建 |
| `pnpm --dir frontend run test:e2e` | 已实现用户旅程的浏览器验收 |

这些是未来接口约定，不是已存在的上游脚本名。引入时需核对真实 scripts 并实现映射。

前端关键用例：语言切换时菜单和组件一起更新；明暗主题覆盖表格、浮层及错误状态；深链接刷新可恢复；未知组件键被拒绝；切租户后旧请求不能回写新租户页面；撤权后按钮、路由、页签和缓存同步失效。
