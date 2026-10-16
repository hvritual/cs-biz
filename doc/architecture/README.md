# 架构：当前边界与后续目标

当前状态从 [路线与来源](../roadmap.md) 读取。本文定义责任和事实源，不把 proposed 目标或未合并分支当作现有服务。

## 当前可运行结构

| 边界 | 当前实现 | 不能据此推断 |
| --- | --- | --- |
| Console | Vue 3 + Vben + Element Plus；typed 本地 Mock、菜单/权限投影、标签页上下文 | 真实登录、服务端租户隔离或付费权益 |
| Authz V2 | `backend/internal/platform/authz` 的纯 Go Operation Registry/PEP/HTTP 绑定 | 真实 Membership/Grant 存储或全部业务迁移 |
| Yunka Consumer | 固定外部模块/CLI；`backend/contracts/proto/runtime/v1/runtime.proto` 驱动生成与装配；loopback 只读 gRPC 探针 | 业务 REST、前端已接生成 Client 或第二套授权权威 |
| 遥测 | 本地 JSON stdout、固定 Collector/Jaeger、技术 Trace 查询/故障证据 | 浏览器到业务全链路、阿里云 SLS 已部署或生产诊断权限 |

实现入口和锁/生成所有权见 [后端文档](../../backend/doc/README.md)；实际前端结构见 [前端文档](../../frontend/doc/README.md)。当前没有真实业务 DB/IdP 或生产发布证明。

## 已采纳的决定与合同

- [ADR-0001](adr/0001-frontend.md)：已采纳前端底座；实际版本/许可由端内来源与锁文件维护。
- [ADR-0003](adr/0003-yunka-f0-consumer-contract.md)：r005 已审 F0 设计与分阶段 Consumer 准入；F1 已交付的有限实现不扩大 F2–F6 承诺。
- [合同源地图](../contracts/README.md)：canonical typed PB 与运行实现、未来 SaaS Access 语义提案分开。原 PR #18 中尚未合并的 ADR-0002 / 三权 V3 不作为 main 已发布合同。

## 后续责任边界（以各阶段已审设计落实）

| 所有者 | 责任 | 不产生的权限 |
| --- | --- | --- |
| Identity / Session | 可信 Principal、IdP/BFF、会话/CSRF | 客户端 userId/tenantId 不可信 |
| Access | Membership、Role、MenuGrant、Function+Scope 当前权威 | 菜单不授权业务 API，平台身份不隐含租户 Owner |
| Yunka Authorizer / OperationGuard / Executor | typed Operation、功能授权与受控执行责任 | 不复制 legacy 角色数据库、不以生成物存在证明授权成立 |
| Domain / Repository | Tenant AND Scope、业务状态、事务/回执/结果恢复 | Trace 和请求成功不证明业务完成 |
| Application availability | 已定义的模块/套餐可用性等独立业务条件 | 与 IAM 分离，不把通用 Authz 内核变为商业收费裁判 |
| Console navigation | 受控已构建组件、菜单投影、清理陈旧上下文 | 不执行远程组件代码，不取代服务端检查 |
| Observability / operations | 安全关联、可查询 Trace/Log、显式环境/留存/授权 | TraceID 不产生身份或跨租户查询权 |

操作与数据范围保持绑定，多个动作的范围不能交叉扩大。根幂等抑制不承诺响应重放；真实业务恢复由 Domain 明确定义。同一生产 Operation 不能形成新旧入口双重放行。旧 `group` 未确权时不得映射为更大范围。

## 设计变更如何进入实现

新方案先定位受影响责任、真实消费者和原验收，再形成有来源的设计差异；proposed 决定不得静默当 accepted。D2 数据库和 D3 IdP/Session 等材料性选择保留真实 Owner。不要从依赖中出现某数据库驱动推断业务存储已经采用或数据隔离已验证。

按 [布局](repository-layout.md) 把端内知识留在端内、跨端约定留在 doc、工作流资源留在所属 Skill。通过 [Design / Build / Deploy](../workflow/SDLC-ADOPTION.md) 在独立授权内交付，不改写冻结设计或把运行前提缺失包装成通过。
