# CS Biz

面向多租户运营与经营的 SaaS 系统。**当前 main 的真实实现**是 Vue 3/Vben Admin 5/Element Plus 桌面端及有状态 S01 本地 Mock、Go 1.23 授权内核 V2 和六个 SDLC Skills；真实身份、租户持久 IAM、正式业务 API/DB/部署仍未完成。**Yunka.io 是已建立 Issue 路线的有条件采用目标，尚未导入运行时。**

## 当前进展：代码、候选和目标严格分开

| 层次 | 当前事实 |
| --- | --- |
| 当前 main | S00/S01 基础已合并；纯 Go `backend/internal/platform/authz` V2 已合入；六 Skill SDLC 已合并。Go 模块尚为 1.23，Yunka Consumer、真实认证、真实业务持久化不存在 |
| [PR #7](https://github.com/hvritual/cs-biz/pull/7) | 身份/成员生命周期与 0/1/N 企业选择的第一切片，**尚未合并**，不是真实 IdP |
| [PR #8](https://github.com/hvritual/cs-biz/pull/8) | **尚未合并**的三权 V2.2 候选：独立菜单授权/功能+数据范围、营销无后台入口、Go Scope 注入；候选 [Full 20 passed/1 skipped](https://github.com/hvritual/cs-biz/actions/runs/38684708487)，仅证明 Mock+Go 内核测试 |
| [PR #9](https://github.com/hvritual/cs-biz/pull/9) | Full CI 手动触发调整尚未合并；当前门禁遵守仓库实际工作流 |
| [Issue #10](https://github.com/hvritual/cs-biz/issues/10) | **PLANNED**：F0–F6 有条件导入 Yunka，落实真实 Access/Scope/统一运行并最终生产资格；并非框架代码已接入 |

> 文档状态使用：`PLANNED` = 路线；`IMPLEMENTED` = 特定 SHA 上实现；`VERIFIED` = 特定 SHA 检查通过；`PRODUCTION_DONE` = 真环境发布与恢复、安全和数据证据。未来架构与已实现状态不可互换。固定核查依据见 [路线证据](doc/evidence/yunka-permission-plan-2026-10-15.md)。

## 长期权限原则（三权分离）

1. **MenuGrant** 决定 Console 导航、后台页面及路由可视性；没有后台菜单**不能进入 Console**，但只拥有营销 Function 的成员仍可使用独立营销入口。
2. **Function Permission** 决定按钮与受保护业务 Operation；后端每个请求依据可信 Principal/Membership + 当前 Function 授权，不以 Menu 放行或拒绝 API。
3. **Data Scope** 对**每一 Function** 单独约束；后端注入当前授权的范围，由 Domain 强制 `Tenant AND Scope`，在真实 DB 分页/写入/导出/统计之前执行。READ=tenant、UPDATE=self 不互相扩大。
4. 商业应用开通与 IAM 权限独立；平台用户不自动拥有租户数据；同账号各浏览器标签的企业上下文独立。

**当前 main 的 Go V2 Registry 是已存在的测试内核；迁移后 typed Protobuf Operation/Yunka Gateway-Executor 成为唯一未来服务端执行链**。禁止两套生产授权内核并行放行。架构见 [ADR-0002](doc/architecture/adr/0002-yunka-runtime-adoption.md) 与 [三权合同 V3](doc/contracts/three-rights-v3.md)。

## 目录与应用

```text
frontend/      Vue/Vben Desktop Console、各端 deploy/ci/doc
backend/       现有 Go V2 Authz，后续 Yunka Consumer 与 Access/Domain 真链
doc/           根级架构、目标合同、用户旅程、任务、证据、SDLC、CI
.github/       GitHub Workflow 入口
```

当前前端已有工作台、客户、成员、权限集、企业设置、应用中心、平台运营与个人偏好等页面；S01 浏览器本地 Mock 承载当前数据，测试账号选择**不是生产认证**。PR #8 的营销独立入口仅存在于候选分支，不属于当前 main。

## 本地检查

前端需要支持的 Node.js 22.x 或 24.x 与 Corepack，使用仓库 `frontend/pnpm-lock.yaml`：

```sh
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm dev --host 127.0.0.1 --port 5777 --strictPort
corepack pnpm check:fast
```

后端当前 Go V2 内核：

```sh
cd backend
bash ci/check.sh
```

仓库结构与文档相对链接：

```sh
python3 doc/ci/check_repository.py
```

Desktop 变更另跑 Targeted；Full 的触发依据当前 GitHub Actions 工作流而非未合并提案。Yunka `generate/check` 只是 [F1/#12](https://github.com/hvritual/cs-biz/issues/12) 之后应成为正式门禁的**目标命令**，当前 cs-biz 不能声称它已运行或通过。查阅 [No-Stall](doc/ci/NO-STALL-GATES.md)。

## 最新权威阅读入口

| 想解决的问题 | 阅读 |
| --- | --- |
| 当前进展、阶段与 Issue 依赖 | [Roadmap](doc/roadmap.md)、[F0–F6 任务书](doc/tasks/YUNKA-MIGRATION-F0-F6.md)、[Issue #10](https://github.com/hvritual/cs-biz/issues/10) |
| Yunka 采纳原因/保留边界 | [ADR-0002](doc/architecture/adr/0002-yunka-runtime-adoption.md)、[执行架构](doc/architecture/yunka-access-runtime.md) |
| 菜单/功能/数据权限定义 | [Access V3](doc/contracts/three-rights-v3.md)、[Access Context](doc/contracts/access-context.md) |
| 新增业务应如何定义权限 | [完整 Developer Permission Flow](doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) |
| 普通成员可营销但不能进后台 | [MKT-01 旅程](doc/journeys/MKT-01-function-without-console.md) |
| 当前真实 Go 内核 | [Authz V2](backend/doc/AUTHORIZATION-V2.md) |
| 实际来源及冲突处理 | [Source Evidence](doc/evidence/yunka-permission-plan-2026-10-15.md) |
| 开发与组织流程 | [Global Docs](doc/README.md)、[SDLC](doc/workflow/SDLC-ADOPTION.md)、[前端 CI](frontend/ci/README.md) |

注意：后端尚无真实 Yunka Runtime 或生产认证；后续实现必须独立任务、独立 PR、真实测试和明确发布审批。
