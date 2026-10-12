# Backend

当前只有后端目录边界与契约设计，没有 Go module、可执行服务、数据库迁移或运行测试。

建议选择 Go 模块化单体，以 `identity`、`tenancy`、`access`、`entitlements`、`audit` 和实际业务模块划分责任。具体 Web 框架与数据库在 S02 的技术决定中落实；不因为前端模板的示例后端而绑定 Java、Node 或其他语言。

| 目录 | 责任 |
| --- | --- |
| [deploy](deploy/README.md) | 服务容器、配置示例、健康探测、迁移及运维说明 |
| [ci](ci/README.md) | Go 检查、授权矩阵、存储集成与隔离测试 |
| [doc](doc/README.md) | 后端模块、存储、事件和事务设计 |

实现后的目标目录为 `cmd/api`、`internal/<module>`、`migrations`，按实际需要创建。所有对外契约以 [全局 contracts](../doc/contracts/README.md) 为准。
