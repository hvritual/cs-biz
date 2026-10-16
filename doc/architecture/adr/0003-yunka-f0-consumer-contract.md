# ADR-0003：Yunka Consumer 的 F0 冻结与分阶段准入

- 状态：**accepted（F0 r005 设计范围）**；F1 技术切片随后已交付，F2–F6 不因本状态更新视为已实施。
- 设计日期：2026-10-15；状态核验：2026-10-16，main `29c525d7f90cf61075f00a20efc1465a29b2c6db`。
- 批准来源：[完整 r005 交接/approval](../../tasks/issue-11-f0/handoffs/r005/HANDOFF.md)，[PR #27](https://github.com/hvritual/cs-biz/pull/27) 已合并。原被审快照中的 proposed 状态保留字节；此处仅修正现行 ADR 的交付投影。
- 前置方向：[PR #18 的 ADR-0002 固定草案](https://github.com/hvritual/cs-biz/blob/a5dccbd074236e31d0628a01e01a7dfb534b981e/doc/architecture/adr/0002-yunka-runtime-adoption.md) 未整包合入，不以本 ADR 批准其余候选内容。

## 决定与唯一来源

采用 D1=A：消费经核实的不可变外部模块和 CLI 制品，记录版本、commit、sum/字节摘要、平台、工具根与到期条件；不用浮动 main、本机路径或复制第二 Runtime。实际 F0 固定输入和准入矩阵只在 [r005 versions](../../tasks/issue-11-f0/rounds/r005/versions.md) 与 [设计](../../tasks/issue-11-f0/rounds/r005/design.md) 维护。源码/上游 go.work 可编译不证明外部分发组合合格。

F1 的当前 Consumer 锁、Go/protoc/plugins、生成和运行规则由 [后端 Consumer](../../../backend/doc/YUNKA-CONSUMER.md) 指向真实配置；[PR #31](https://github.com/hvritual/cs-biz/pull/31) 的 main 合并已包含固定工具链和本地技术查询。它仍不提供真实业务 IAM/DB 或生产资格。

## 不可省略的责任

Access 持有真实 Membership/Role/Menu/Function+Scope；typed PB 是目标 Operation 唯一可写合同；Yunka Authorizer/OperationGuard/Executor 各守其执行边界。Domain 强制 Tenant AND Scope、业务状态/回执/恢复；ApplicationAvailability 和 Trace 不产生权限。单一生产 Operation 不得新旧入口同时放行。

不采纳旧注释 DSL 或 legacy 角色表作为新权威，不把 ScopeKey.With/生成文件存在当作授权；旧 group 未确权不映射扩大范围。根幂等抑制不承诺响应重放。完整定义/负例保留在已审设计，不在此另写一套合同。

## 条件与后果

D1 和工具链/安全前置已经解决，不再沿用 r003/r004 的等待叙述；历轮证据按其版本保留。D2 数据库、D3 IdP/Session、邀请/恢复、legacy group、诊断查询/留存和生产权限仍由相应阶段/Owner 决定。F1 本地 Trace 不完成整体可观测性或业务运行。

来源、合同或消费策略变化必须形成有影响分析的新修订和适用审阅，不能反改 r005 批准原件。已交付范围、后续依赖与完成边界从 [当前路线](../../roadmap.md) 和实际 Issue/PR 回读；发布/数据迁移仍须独立授权与目标观察。
