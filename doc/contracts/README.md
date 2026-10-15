# 跨端合同与访问语义（当前索引）

## 当前事实

`cs-biz main` 尚无生产 OpenAPI/typed PB/Yunka Consumer。当前有 [Access Context 早期设计](access-context.md)、Go V2 纯内核与 S01 Mock；三权分离只存在于未合并的 [PR #8](https://github.com/hvritual/cs-biz/pull/8) 候选。任何下方“目标结构源”均属于 F1 之后的迁移设计，**不是已发布接口**。

## 当前目标权威及冲突优先级

1. [Access Contract V3：Menu/Function/Data](three-rights-v3.md)：菜单可视只决定 Console，Function 是后端业务 Operation 权限，Data 是每 Function 的资源范围与 Domain 谓词，模块可用性独立。
2. [Yunka 运行边界 ADR](../architecture/adr/0002-yunka-runtime-adoption.md) 与 [完整 SOP](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)：目标 **typed Protobuf Operation 是唯一可写操作/API 合同源**；Yunka 生成 OpenAPI、TS Client、OperationPlan、REST/gRPC/Assembly，禁止生成物手改。
3. [Access Context 旧版](access-context.md)：继续用于 Account/标签租户上下文、访问快照、缓存/撤权、错误、幂等与恢复的场景提案；遇到三权角色映射或“独立 OpenAPI 可写源”的冲突，以 V3/ADR 为准。
4. 现有 `backend/internal/platform/authz.Registry` 是 Go V2 **已实现旧内核**，在 F2–F5 的真实迁移过程中需保留可比较的基线，但单个生产 Operation 不允许两个并行授权入口。

**注意：** MenuGrant 的目录/Role Grant 持久事实由 cs-biz Access 拥有，不写进 Yunka PB 的 SQL/按钮关系；PB 不定义 SQL/GORM 或数据范围查询谓词。API 契约变更必须列出 Consumer、Operation ID、Permission、Audience、数据 Scope、错误、事务与幂等兼容，以及所有正反验收证据。

任务入口：[F0–F6](../tasks/YUNKA-MIGRATION-F0-F6.md)、[主线 #10](https://github.com/hvritual/cs-biz/issues/10)。
