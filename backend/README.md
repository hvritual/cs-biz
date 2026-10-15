# Backend

当前已经引入 Go 1.23 标准库实现的 **V2 通用权限基础库**：`internal/platform/authz/`。它包括 Operation Registry、衍生 Permission Catalog、当前成员/Grant 抽象、Operation 授权、对象范围辅助检查及受保护的 `net/http` Router。**没有真实 API 服务器、认证、持久化、数据库迁移或生产服务。** S02-ID 候选新增纯 Go `internal/access/identity` 规则层与单测，仍不承担实际凭据验证或 Session 发行。

本阶段实现为独立可回退的 S02 权限前置切片；不等于完成 S02 身份/租户服务或 S03 SaaS 业务闭环。框架不依赖 Commercial Guard、Entitlement Resolver、PlanVersion 或商业 ModuleCatalog。已有 SaaS“租户应用开通”需求仍是将来独立业务域的条件，不可因此跳过。

| 路径 | 职责 |
| --- | --- |
| `go.mod` | 独立 Go 模块 `github.com/hvritual/cs-biz/backend`（Go 1.23） |
| `internal/access/identity/` | S02-ID 候选：0/1/N 企业选择、四态成员转换、会话安全判定（无存储） |
| `internal/platform/authz/` | 当前已实现的纯 Go 授权基础库和单元负例 |
| [doc/AUTHORIZATION-V2.md](doc/AUTHORIZATION-V2.md) | 真实实现与未实现边界 |
| [doc/FEATURE-ONBOARDING-V2.md](doc/FEATURE-ONBOARDING-V2.md) | 新增业务功能接入流程 |
| [ci/check.sh](ci/check.sh) | Go Test / Vet / Race |
| [deploy](deploy/README.md) | 未来部署与凭证边界（尚无可部署服务） |

运行真实代码检查：

```bash
cd backend
bash ci/check.sh
```

之后仍需在 S02 独立确认认证方式、Go HTTP 框架、数据库、真实 Membership/Grant 存储与 OpenAPI 源，才能开始可运行 API 和 DB 证据；不把前端 Mock 当作后端权限权威。跨端结构与未来接口责任见 [全局契约](../doc/contracts/README.md)。
