# 合同源与消费者

| 合同/语义 | 当前唯一来源 | 实际消费边界 |
| --- | --- | --- |
| Yunka 技术 Operation | [runtime.proto](../../backend/contracts/proto/runtime/v1/runtime.proto) | F1 只读 gRPC 探针；生成 OperationPlan/OpenAPI/TS 等不代表已有业务 REST 或前端集成 |
| Consumer、工具与来源资格 | [Consumer 说明](../../backend/doc/YUNKA-CONSUMER.md) 指向实际锁与生成规则 | 不手改生成物，不以源码可编译替代外部分发资格 |
| 现有纯 Go 授权 | [Authz V2](../../backend/doc/AUTHORIZATION-V2.md) 与实际代码 | 不依赖商业 Guard；真实 Access 存储仍待 F3 |
| 已审跨端目标 | [F0 r005 design](../tasks/issue-11-f0/rounds/r005/design.md) | Function/Menu/Data 与执行/恢复边界；后续逐阶段实施 |
| SaaS 有效访问上下文 | [Access Context](access-context.md) | S00 语义提案，部分用于 Mock；不是已发布 HTTP schema，也不取代 F0 已审边界 |

新增 HTTP、错误码、权限、幂等和数据范围合同，先确认具体任务的 canonical 源、版本、消费者、兼容和反例；不要默认另建 `doc/contracts/openapi/` 与 typed PB/生成规则争权。文档可以解释代码合同，不能再维护同名第二份结构。

设计示例、生成产物、实际运行、真实业务与生产发布分别验收。当前状态及未合并候选见 [路线](../roadmap.md)。
