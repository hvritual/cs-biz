# Backend

当前包含 **V2 通用权限基础库**（`internal/platform/authz/`）和 F1 固定 Yunka Consumer / loopback gRPC 只读技术探针。工具链为Go1.26.9；生成、运行、遥测与验收入口见 [Yunka Consumer](doc/YUNKA-CONSUMER.md)。没有业务API、真实认证/持久化、数据库迁移或生产服务。

Authz V2 是早期独立权限前置；F1 已随后加入固定 Consumer 和技术运行验证，两者不等于完整真实身份/租户或 SaaS 业务闭环。框架不依赖 Commercial Guard、Entitlement Resolver、PlanVersion 或商业 ModuleCatalog。已有 SaaS“租户应用开通”需求仍是将来独立业务域的条件，不可因此跳过。

| 路径 | 职责 |
| --- | --- |
| `go.mod` | 独立模块 `github.com/hvritual/cs-biz/backend`，语言1.26.0 / 工具链1.26.9与四个固定外部模块 |
| `internal/platform/authz/` | 当前已实现的纯 Go 授权基础库和单元负例 |
| [doc/AUTHORIZATION-V2.md](doc/AUTHORIZATION-V2.md) | 真实实现与未实现边界 |
| [doc/FEATURE-ONBOARDING-V2.md](doc/FEATURE-ONBOARDING-V2.md) | 现有 Authz V2 扩展/维护与回归适用范围 |
| [ci/check.sh](ci/check.sh) | 固定工具、生成/依赖/源码/装配、build/unit/vet/race/security、真实本地Trace查询 |
| [deploy](deploy/README.md) | 开发/CI Collector/Jaeger 资产与独立生产部署边界 |

运行真实代码检查：

```bash
cd backend
bash ci/check.sh
```

后续 F2–F6 复用 F0 已审的 typed PB / Consumer 执行方向；真实 DB、IdP/Session、Membership/Grant 存储及具体业务合同仍需相应 Owner、资源与验收，不能默认新增另一份 OpenAPI 权威或另一条放行链。不把前端 Mock 当作真实权限。当前阶段见 [路线](../doc/roadmap.md)，源/消费者关系见 [合同地图](../doc/contracts/README.md)。
