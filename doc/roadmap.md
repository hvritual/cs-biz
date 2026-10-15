# cs-biz 最新路线与真实进展（2026-10-15）

本文件是 **current roadmap / status projection**。任务执行权威为 [Yunka 引入主线 #10](https://github.com/hvritual/cs-biz/issues/10) 及子任务 #11–#17。详细 scope、依赖、不得修改文件、检查与 Human 决策见 [F0–F6 任务书](tasks/YUNKA-MIGRATION-F0-F6.md)。

## 当前 main 与候选事实

| 能力 | 本次核对结果 |
| --- | --- |
| S00/S01 | 仓库结构和 Vue 3/Vben Admin 5/Element Plus Desktop、本地有状态 Mock 在 main；历史 PR #1、#3 已合并（过往快照不能再说 PR #1 未合并） |
| Go Authz V2 | `backend/internal/platform/authz` 纯 Go 内核已由 PR #4 合并 main；仅 Fake Authority/测试，非真实 API/IdP/DB |
| SDLC | 六 Skills 由 PR #6 已合并；遵循工作流/意图/设计/Build/任务推进分层 |
| 登录和成员 | [PR #7](https://github.com/hvritual/cs-biz/pull/7) 开放未合并；含登录后企业选择、Go 纯生命周期决策，仍非真实身份 |
| 三权分离 | [PR #8](https://github.com/hvritual/cs-biz/pull/8) 开放未合并并依赖 #7；含权限三列、独立营销和 Go TrustedScope；Full [20 passed/1 skipped](https://github.com/hvritual/cs-biz/actions/runs/38684708487) 仅证明该候选 |
| Yunka | 本次仅完成**评估/路线/Issue/文档同步**，尚未在 cs-biz 引入依赖、typed PB 或 Runtime |
| CI | 当前仓库实际工作流有效；[PR #9](https://github.com/hvritual/cs-biz/pull/9) “Full 手动”未合并前不得认为已生效 |

固定 baseline `cs-biz main@f088a90fd5a0305cc00a5679e368306dce62167f`；Yunka 评估 `main@3527488325030fbf86fe52804140c936e9d937a4`。这两个 SHA 是**本次评估快照**，不是永不变化的最新 HEAD；实施每轮都须重新核查。详见 [源证据](evidence/yunka-permission-plan-2026-10-15.md)。

## 一、MVP Roadmap（实现一条真实安全业务纵向链）

目标：真实账户验证、有效租户/成员、Menu/Function/Data 三权；营销成员无后台菜单仍能执行受 Scope 约束的营销操作，全部请求经唯一 Yunka Operation Gateway、真实存储过滤与结果回读。不能以 Mock 为终点。

| 顺序/Issue | 最小用户/技术结果 | 当前状态 |
| --- | --- | --- |
| **F0 [#11](https://github.com/hvritual/cs-biz/issues/11)** | 冻结 PR #7/#8、三权契约、Yunka ADR、API/数据/身份负例与工具链兼容决策 | Issue 已建立；实际阶段未完成 |
| **F1 [#12](https://github.com/hvritual/cs-biz/issues/12)** | 锁定 Go 1.25.13/protoc 3.21.12 与 Yunka modules；PB/OperationPlan/OpenAPI/TS/Assembly 的 Consumer 生成/零漂移 | NOT_IMPLEMENTED |
| **F2 [#13](https://github.com/hvritual/cs-biz/issues/13)** | Function-only 营销真实 Operation，经 Yunka Gateway + Access GrantResolver + cs-biz Scope Guard | NOT_IMPLEMENTED |
| **F3 [#14](https://github.com/hvritual/cs-biz/issues/14)** | 真实 IdP/BFF/Session/CSRF、Account、Membership、Menu/Function+Scope 持久授权、两个标签页独立企业与撤权 | NOT_IMPLEMENTED |

MVP 与现有客户/成员/权限管理的交付仍相关，不能为进入新框架而重头制作替代 Demo。MVP 验收需要真 REST/gRPC（适用时）、持久数据库、浏览器以及租户隔离和无副作用拒绝证据。

**MVP 交付字段：** 目标 = 可真实使用的权限闭环；不做 = 真实支付与多业务大批量建设；输入 = 已批准的 IdP/DB/工具链/数据归属/成员生命周期；输出 = 真经授权的营销或 CRM 操作、可解释权限与回读；允许改动 = 各 Issue 精确定义的 `backend/**`/`frontend/**`/`doc/**`；禁止 = 生产数据、其他仓库、绕过 CI、改生成文件和两套生产授权；风险 = 工具链升级、数据隔离、可信身份、跨标签会话；能否 Codex 一次 = **按 F0–F3 的独立子切片，不一次性整阶段**。

## 二、Full Runtime Roadmap

| 顺序/Issue | 输出 | 准入 |
| --- | --- | --- |
| **F4 [#15](https://github.com/hvritual/cs-biz/issues/15)** | CRM/Marketing 真 Domain SQL Data Scope：列表/详情/写入/分页/导出/统计/批量，支持 `read=tenant/update=self` | F2/F3 真链 |
| **F5 [#16](https://github.com/hvritual/cs-biz/issues/16)** | REST/gRPC/Worker/内部子 Operation 统一唯一执行路径，下线旧 HTTPRouter 的生产入口并可回滚 | F4 覆盖证据 |

完成 F5 后再扩大到客户—点位—设备、租赁合同、服务工单、财务流转、运营报表、实际营销、通知及 IoT 集成；这些业务模块使用同一 Operation/Grant/Scope、UoW/审计/回执开发流程。新业务须先有用户旅程、资源归属、模块可用性、正反例，不能把批量代码生成等同产品交付。

**Full Runtime 字段：** 目标 = 多领域可复用与安全读写；不做 = 无场景的大型框架改造；输入 = MVP 真链、真实业务数据/职责；输出 = 多领域一致的 Scope/Action/API；允许 = 当前领域与必要生成/策略；禁止 = 第二 IAM/无界 SQL；验收 = 真 DB+跨租户+并发+数据核验；风险 = 数据范围语义偏移与迁移破坏；Codex = 单 Domain 独立切片可实现，阶段不可一次完成。

## 三、Production Roadmap

| 顺序/Issue | 输出与验收 |
| --- | --- |
| **F6 [#17](https://github.com/hvritual/cs-biz/issues/17)** | 固定 Yunka/Consumer/DB/IdP版本，真实 MySQL 安全与并发、CSRF/身份、撤权、操作幂等与 lost-reply readback、Outbox、审计、压测、备份/回滚、可观测性、明确上线审核与生产结果回读 |

**Production 字段：** 目标 = 真实客户可信运行；不做 = 无授权部署/无证据承诺；输入 = Full Runtime、目标环境、SLO/业务审批；输出 = 真资格/回滚/运行手册；允许 = 受控部署/CI/环境配置与修复；禁止 = 秘钥入仓/未经批准写生产数据或合并；验收 = 真实 API/DB/Browser 与独立安全复核、精确 SHA、发布回读；风险 = 不可逆迁移、外部渠道与数据泄露；Codex = 需要分环境人审，不能一次全自动完成。

## 已锁定的三权核心不变量

**Menu** 只控制 Console 页面；**Function** 是业务 Operation 的唯一授权；**Data** 是该 Function 的强制 Domain Scope。不因无菜单拒绝合法营销 API，不因有菜单授予读/写功能，不因读取全部给更新全部，不因商业模块开通而自动创建权限。旧 `group` 没有已批准的业务 SQL 等价，不能自动变 `assigned/tenant`。

目标合同：[Access V3](contracts/three-rights-v3.md)，统一执行：[ADR-0002](architecture/adr/0002-yunka-runtime-adoption.md)，完整开发流程：[Yunka SOP](tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)。

## 自检

- Scope：Issue 是规划、文档为目标，未修改实际 YAML/Go/数据库；
- Dependency：F0→F1→F2/F3→F4→F5→F6，PR #8 需保留 #7 依赖；
- Consistency：将早期“OpenAPI 独立结构源”“S02 尚未开始”“PR #1 未合并”等过期主张更正；
- Evidence：任何 `VERIFIED` 都要在精确 SHA 上回读相应 CI，前端 Mock 与 Yunka 自身资格都不能代替 cs-biz 生产。
