# 2026-10-15 权限设计演化与冲突处理记录（非当前执行合同）

> 本文件保留 V2.1→V2.2→Yunka 条件采纳的变更缘由，不重新声明一套运行时权限目录。

| 历史版本 | 已提出的目标与局限 | 最新处理 |
| --- | --- | --- |
| **V2.1** | Account/Membership/Role/Operation+Scope、Console 动态菜单；原方案易把菜单等同读取 Function | **被 V2.2 三权模型修订**：Menu 是独立后台导航，不是 Function。Go V2 内核仍为 main 已实现旧版本 |
| **V2.2** | 用户明确要求 Menu 可视、Function 可用、Data 可见；普通成员可用营销但不可进后台；业务 API 仅检查 Function+注入当前 Data | 核心原则**保留**；[PR #8](https://github.com/hvritual/cs-biz/pull/8) 提供 Mock/Go 候选；待合并不等于 main |
| **Yunka 条件引入** | 将运行时 Operation/Authorizer/Executor/UoW/Assembly 等机制复用已有 Yunka Go 框架 | **未来目标**由 [ADR-0002](../architecture/adr/0002-yunka-runtime-adoption.md)、[Access V3](../contracts/three-rights-v3.md)、[Yunka SOP](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) 统一；不能使两套生产运行时并行放行 |

在新功能接入发生冲突时：当前代码与真实 CI 决定“已实现事实”；用户新三权约束与目标 ADR 决定“下一阶段要实现什么”；PR #8 原 `DEVELOPER-PERMISSION-FLOW.md` 和旧 `FEATURE-ONBOARDING-V2.md` 只能作为受控迁移/历史参考。PR #7/#8 若后续 rebase/merge，应按 V3 的唯一 typed PB 目标改正授权合同源与开发步骤，不能直接将旧 SOP 恢复为当前长期规范。

对“已接入 Yunka”“真实 IAM 完成”“全链路生产安全”的宣称，必须在 #12–#17 真实完成后逐个以提交、生成和数据库/API/Browser 证据证明。参阅 [状态证据](../evidence/yunka-permission-plan-2026-10-15.md)。
