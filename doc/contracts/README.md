# 跨端契约

当前为语义提案，没有已发布 API 或 OpenAPI 文件。接口路径示例仅用于设计。

首个规范是 [Access Context](access-context.md)，定义身份、租户、模块权益、成员权限、数据范围、菜单及失效恢复之间的关系。

S02 应在 `doc/contracts/openapi/` 建立唯一的 OpenAPI 结构源，并生成前端类型。前端或后端内部文档可引用、解释该结构，但不能复制一份独立维护的同名契约。

契约变化需要明确：兼容版本、消费者、错误码、权限码、幂等语义、数据范围与受影响旅程。后端数据对象不直接等同于前端导航数据结构；通过边界适配避免绑死某个后台模板。

## S02 身份与登录旅程

[身份与登录逻辑契约候选（YAML）](identity-journey-v1.yaml) 明确 Account、Membership、企业选择、会话隔离、状态迁移、安全负例与验收集合；对应 [ID-01](../journeys/ID-01-member-lifecycle.md) 和 [ID-02](../journeys/ID-02-login-workspace.md)。此 YAML 是**设计/验收定义，不是发布 API**；后续唯一 OpenAPI 源依然放在 `doc/contracts/openapi/`，由其生成前后端类型，禁止以本文件冒充运行授权。

## V2.2 三权分离开发合同

[菜单、功能、数据三权分离](three-rights-v2.2.md) 明确三权授权语义、角色数据模型、前端投影、Go Operation 与可信数据范围注入、营销无后台菜单准入。完整的 [开发权限定义与实施流程](../tasks/DEVELOPER-PERMISSION-FLOW.md) 包含新增业务权限的输入、代码入口、验证矩阵及退回规则。

当前前端本地权限目录是 S01 模拟适配，后续真实运行时必须从 `backend/internal/platform/authz.Registry.PermissionCatalog()` 的唯一 OpenAPI 源生成，不能维护两份独立的 Permission Authority。
