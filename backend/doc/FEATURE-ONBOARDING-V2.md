> **历史规范 / LEGACY V2（2026-10-15）：** 本文适用于 main 已实现的旧 Go Registry/HTTPRouter 单元内核，历史操作步骤保持以便安全对照；**不再是引入 Yunka 后新 Operation 的目标开发流程**。新功能从现在起按 [Yunka Developer SOP](../../doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) 定义三权，F1 实际引入 typed PB/生成、F2–F5 受控迁移；不把未来技术计划误写成已实现。审核模板改用 [V3](../../doc/templates/feature-onboarding-v3.yaml)；旧 [V2](../../doc/templates/feature-onboarding-v2.yaml) 仅供旧任务记录。

# 新业务功能接入流程 V2.0（无 Commercial Guard）

状态：**项目开发规范**；当前只完成 authz 基础库与测试，并没有真实业务 API/DB。

每个受保护功能按 `doc/templates/feature-onboarding-v2.yaml` 保存任务级**非授权**复核记录，禁止在模板里配置实时 `allowed: true`、角色授权或第二份 Permission Catalog。

| 阶段 | 最小输入 | 必须交付/门禁 |
| --- | --- | --- |
| S0 Intent/分类 | 谁使用、什么结果、T0–T4、风险 | 确认目标/不做什么和人审边界 |
| S1 Authority Discovery | 现有 Operation、权限码、Domain、Schema | Reuse/Delta Map，不造第二份 IAM |
| S2 Design | 对象、数据范围、错误、幂等和恢复 | Operation/资源/状态/失败设计与验收 |
| S3 Acceptance Lock | 成功+直接 API 负例 | 跨租户、撤权、越界、无副作用验收定义 |
| S4 Registry & Backend | 唯一源码中的 Operation + permission + HTTP/Worker binding | 领域复用+可信 PEP，业务写入不变量 |
| S5 RED→GREEN→REFACTOR | 锁定验收 | Go 单测/受控集成的增量循环 |
| S6 Security Gate | 真实服务和对应测试资源 | Operation coverage、Authz、Domain Scope、安全反例 |
| S7 Independent Review | 基线/候选 SHA/测试结果 | 独立检查，不修改被验收的规则 |
| S8 Release/Readback | 获授权的真实发布环境 | 精确代码版本、权威结果和恢复证据 |

**接入分支：**旧业务 Domain 扩展、全新业务 Domain、平台/Worker/Service 专用操作。均不要求创建 Commercial Module、PlanVersion 或 Entitlement。现有 SaaS 的模块开通为独立业务条件，不属于 RBAC 授权。

### 新 Operation 的编码规则

1. 使用稳定 `domain.resource.verb` 风格的 Operation ID 和 Permission（例如 Operation `customer.get` → Permission `customer.read`），二者允许多对一，不能按路由路径动态拼权限。
2. 新 HTTP 路由必须出现在 `Operation.HTTP` 中，通过 `HTTPRouter.HandleOperation` 绑定；启动先运行 `CheckCoverage`，未知/未绑定的 Operation 直接拒绝。
3. 租户入口使用可信 `Principal.TenantID`，业务请求里的 tenant ID 仅作一致性检查、不能授予访问。
4. Domain 自己对资源归属、SELF/ASSIGNED/EXPLICIT 等 Scope 做过滤；在角色、动作、资源间不能交叉合并扩大范围。
5. 列表、详情、写入、批量、导出、异步任务分别提供真实 Scope/状态执行证据；HTTP 403 不是“无写入”的证明。
6. 当前 `CurrentAuthority` 属于尚未实现的生产适配，不能使用任何测试 Fake 或前端 Mock 作为真实后端身份/Grant 来源。
7. 新增 public route 必须有显式 `PublicReason` 与独立的安全评审；新 Worker/Service 必须独立说明凭证来源、可操作范围及安全重验点。

### 最小交付差量

```text
业务 Intent/Acceptance
  → canonical Operation/Permission（代码唯一权威）
  → 授权实现/Domain Resource Scope
  → API/DB 正反例 + 并发/恢复（适用时）
  → backend/ci/check.sh + 系统真实集成门禁
  → 独立复核 + 精确 commit 回读
```

**现有门禁的限制：**`backend/ci/check.sh` 当前验证纯 Go 权限内核，不能证明某个未来业务仓库的 SQL、事务、字段或外部 Worker 都受保护。实际第一个业务 API/DB 出现时，必须补充与其入口和资源查询绑定的合同/集成验收；否则该业务功能保持 `NOT_VERIFIED`。
