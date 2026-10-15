# Backend — 当前 Go V2 基线与 Yunka 迁移路线

## 当前 main 代码

`backend/go.mod` 使用 **Go 1.23.0**，包含纯 Go `internal/platform/authz` V2：稳定 Operation Registry、PermissionCatalog、当前 Membership/Grant 接口、Operation/Scope 授权、net/http Router、测试 Fake。PR #4 已合入 main；此包可运行 Go Test/Vet/Race，但**尚无真实 API Server、IdP、BFF、持久 Access、数据库迁移或部署程序**。

```sh
cd backend
bash ci/check.sh
```

## 下一阶段：有条件 Yunka Consumer（非当前代码）

[Issue #10](https://github.com/hvritual/cs-biz/issues/10) 与 [ADR-0002](../doc/architecture/adr/0002-yunka-runtime-adoption.md) 规划：在 F0/F1 冻结 Yunka Go 1.25.13/protoc 3.21.12 与 module 发布/依赖锁，采用 typed PB Operation 合同，生成 OperationPlan/OpenAPI/TS Client/Assembly；统一通过 Yunka Gateway Authorizer/Executor，借 `GrantResolver` 使用 cs-biz Access 角色/Grant 真相；cs-biz OperationGuard 解释各 Function 数据 Scope，Domain 强制安全 SQL。

不能直接将当前 Go V2 `HTTPRouter` 重命名为 Yunka Adapter；F2 单 Operation 纵向试点、F5 完整 Coverage 过渡后，**同 Operation 最多保留一条生产放行路径**。业务模块可用性仍独立于 IAM。

| 路径 | 当前/目标 |
| --- | --- |
| `go.mod` | Go 1.23 当前；Go 1.25.13 目标待 F1 消费者验证 |
| `internal/platform/authz` | **已实现**旧 Go V2 内核，作为迁移前安全回归基线 |
| `contracts/proto`（目标位置） | F1 定稿 typed PB 权威源；目前目录未建立，不构成已实现 |
| [doc/AUTHORIZATION-V2.md](doc/AUTHORIZATION-V2.md) | Go 当前内核正确行为与适用边界 |
| [doc/FEATURE-ONBOARDING-V2.md](doc/FEATURE-ONBOARDING-V2.md) | 迁移前功能接入规范（历史兼容） |
| [Yunka Developer SOP](../doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) | 目标新功能接入与测试流程 |
| [F0–F6](../doc/tasks/YUNKA-MIGRATION-F0-F6.md) | 从设计到真 Consumer/生产分阶段任务 |
| [ci/check.sh](ci/check.sh) | 当前 Go 测试；新增 Yunka 门禁尚未实现 |
| [deploy](deploy/README.md) | 未来真实服务的部署责任，当前尚无上线包 |

阶段未落地时不将 `yunka generate/check` 写成当前后端可执行验收结果。跨端三权定义：[Access V3](../doc/contracts/three-rights-v3.md)。
