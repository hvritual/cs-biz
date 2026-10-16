# 后端文档与真实边界

| 当前任务 | 读取 | 规范源 |
| --- | --- | --- |
| 修改/接入纯 Go 授权 | [AUTHORIZATION-V2](AUTHORIZATION-V2.md)、[FEATURE-ONBOARDING-V2](FEATURE-ONBOARDING-V2.md) | 实际 internal/platform/authz 源码；原负例保持 |
| 固定外部模块、CLI、生成/装配、只读探针与 Trace | [YUNKA-CONSUMER](YUNKA-CONSUMER.md) | 实际 consumer-lock、typed PB、生成与审计配置 |
| 检查代码/生成/安全与本地技术查询 | [后端 CI](../ci/README.md) | ci/check.sh 及真实固定工具/制品条件 |
| 运行开发/CI Trace 环境 | [部署边界](../deploy/README.md)、[本地遥测](../deploy/observability/README.md) | 固定 Compose/镜像、loopback 与脱敏配置 |
| 设计真实业务 API、身份或持久 Access | [合同源地图](../../doc/contracts/README.md)、[已审 F0](../../doc/architecture/adr/0003-yunka-f0-consumer-contract.md) | 当前 Issue/同版设计；不另造 Runtime/授权源 |

F1 已存在固定 Consumer、生成/装配与 loopback gRPC 技术探针；无业务 REST、真实 IdP/Session/DB、持久 Membership/Grant 或生产发布。模块/生成文件存在不能证明业务资格。当前阶段与资源缺口只在 [路线](../../doc/roadmap.md) 汇总。

修改源码或持久测试前遵守 `backend/AGENTS.md` 与安装的工程治理；生成合同和开发者实现分开。当前 Access 数据权威仍是后续任务要落实的责任，不把测试 Fake、菜单或本地账号选择当真实授权。
