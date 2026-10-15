# 全局文档（当前索引）

此处为跨端架构、权限、用户旅程、实施路线与证据的唯一根目录，**不要新建竞争的根 `docs/`**。本次同步的是 Yunka 目标路线和三权契约，**未导入 Yunka 运行代码**。

## 当前真实事实

`main` 已包含 S01 本地 Vue Mock、Go 1.23 授权 V2 基础库、六 Skill SDLC；真正 IdP/BFF、持久 IAM/业务 API/数据库、部署不存在。[PR #7](https://github.com/hvritual/cs-biz/pull/7)（身份第一切片）、[PR #8](https://github.com/hvritual/cs-biz/pull/8)（三权 V2.2 候选）仍 open/unmerged，不能引用分支作为 main 已实现；[PR #9](https://github.com/hvritual/cs-biz/pull/9) CI 手动 Full 提案未合并。

## 优先阅读（当前目标规范）

| 分区 | 入口 | 权威范围 |
| --- | --- | --- |
| 状态与路线 | [Roadmap](roadmap.md)；[Issue #10](https://github.com/hvritual/cs-biz/issues/10) | MVP、Full Runtime、Production、F0–F6 任务状态 |
| 目标技术决策 | [ADR-0002](architecture/adr/0002-yunka-runtime-adoption.md)；[Yunka 架构](architecture/yunka-access-runtime.md) | 条件采用/受信边界；未运行 |
| 三权 | [Access Contract V3](contracts/three-rights-v3.md) | Console Menu、Function、Data、Scope、产品模块分离 |
| 当前访问上下文 | [Access Context](contracts/access-context.md) | 登录/切租户、版本、失败恢复；旧权限主张按 V3 覆盖 |
| 开发者接入 | [Yunka Developer SOP](tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) | 从 Intent 到 PB/Yunka/Domain/Frontend/CI |
| 分阶段实施 | [F0–F6 任务书](tasks/YUNKA-MIGRATION-F0-F6.md) | Issue #11–#17、输入/输出/风险/验收 |
| 用户旅程 | [SAAS-01](journeys/SAAS-01-tenant-onboarding.md)、[MKT-01](journeys/MKT-01-function-without-console.md) | 租户闭环与纯营销成员 |
| 事实与证据 | [2026-10-15 核验](evidence/yunka-permission-plan-2026-10-15.md)、[S01 历史证据](evidence/S01-validation.md) | 固定 SHA、已实现/未实现严格区分 |
| 现有后端能力 | [Backend V2](../backend/doc/AUTHORIZATION-V2.md) | 仍在 main、尚无生产 IAM |
| 现有前端能力 | [Frontend](../frontend/README.md)、[Mock Data](../frontend/doc/mock-data.md) | 当前 S01 |
| 复用开发流程 | [SDLC Adoption](workflow/SDLC-ADOPTION.md)、[No-Stall](ci/NO-STALL-GATES.md) | Skill + 真实 CI，未来增加 Yunka Gate |
| 历史与任务记录 | [S00](tasks/S00-repository-design.md)、[S01](tasks/S01-frontend-mock.md)、[PR #4 修复记录](tasks/S02-authz-pr4-qualification.md) | 真实历史保留，不再决定未来框架语义 |
| 模板 | [Task](templates/task.md)、[Feature Review V3](templates/feature-onboarding-v3.yaml) | 权限定义输入/Review，不是授权运行时 |

## 证据语义

`DESIGN`（建议）、`ACCEPTED_DIRECTION`（路线/业务目标）、`IMPLEMENTED`（固定 SHA 代码）、`VERIFIED`（固定 SHA 执行通过）、`PRODUCTION_DONE`（真实环境证据）分离。Yunka 的框架历史资格测试与 cs-biz Consumer 是否迁入是不同问题。历史文档与目标三权冲突时遵循 [ADR-0002](architecture/adr/0002-yunka-runtime-adoption.md) + [Access V3](contracts/three-rights-v3.md)，但不改写历史真实版本。
