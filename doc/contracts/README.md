# 跨端契约

当前为语义提案，没有已发布 API 或 OpenAPI 文件。接口路径示例仅用于设计。

首个规范是 [Access Context](access-context.md)，定义身份、租户、模块权益、成员权限、数据范围、菜单及失效恢复之间的关系。

S02 应在 `doc/contracts/openapi/` 建立唯一的 OpenAPI 结构源，并生成前端类型。前端或后端内部文档可引用、解释该结构，但不能复制一份独立维护的同名契约。

契约变化需要明确：兼容版本、消费者、错误码、权限码、幂等语义、数据范围与受影响旅程。后端数据对象不直接等同于前端导航数据结构；通过边界适配避免绑死某个后台模板。

## S02 身份与登录旅程

[身份与登录逻辑契约候选（YAML）](identity-journey-v1.yaml) 明确 Account、Membership、企业选择、会话隔离、状态迁移、安全负例与验收集合；对应 [ID-01](../journeys/ID-01-member-lifecycle.md) 和 [ID-02](../journeys/ID-02-login-workspace.md)。此 YAML 是**设计/验收定义，不是发布 API**；后续唯一 OpenAPI 源依然放在 `doc/contracts/openapi/`，由其生成前后端类型，禁止以本文件冒充运行授权。
