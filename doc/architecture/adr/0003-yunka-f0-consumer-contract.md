# ADR-0003：Yunka Consumer 的 F0 冻结与分阶段准入

- 状态：**proposed / DESIGN_REVIEW，未批准，未实施 Runtime**。
- 日期：2026-10-15；当前消费仓库 main `da5494d03c362ab873465c1793e7aba7e4e3a7cc`。
- 来源：[Issue #11](https://github.com/hvritual/cs-biz/issues/11)、父 [#10](https://github.com/hvritual/cs-biz/issues/10)，本轮 [方案/设计包](../../tasks/issue-11-f0/rounds/r001/solution.md)。
- 继承：[PR #18 ADR-0002 固定草案](https://github.com/hvritual/cs-biz/blob/a5dccbd074236e31d0628a01e01a7dfb534b981e/doc/architecture/adr/0002-yunka-runtime-adoption.md)。它仍 proposed；本 ADR 不假装它已合入或批准。

## 需要决策的问题

评估源码 `3527488325030fbf86fe52804140c936e9d937a4`、各 module tag 与实际 CLI/Consumer 输入不是同一件事。上游 go.work 能找到本地模块，不能证明外部消费组合可下载、编译或通过生成检查。现有事实不足以宣布任何完整组合已获资格。

## 消费策略（D1 已选 A；完整 ADR 仍待审阅）

Human 已在首轮候选上明确选择 A，原文与范围见 [r002 决策](../../tasks/issue-11-f0/rounds/r002/decision.json)。优先经核实的发布模块/CLI 制品锁，记录 module path、version、commit、sum/制品摘要；若缺合格发布则保持 F1 的资格阻塞，先修上游或明确消费方式。只有 Human 接受维护与供应链成本时，才改为仓库内固定源码快照和可重建 CLI；禁止宿主机路径、浮动 main 和复制第二 Runtime。具体选项见 [D1](../../tasks/issue-11-f0/rounds/r001/decisions.md)。

目标工具链为 Go 1.25.13（最低语言版本 go 1.25.0）、protoc 3.21.12、上游锁定 plugins；F0 不改当前 Go 1.23.0 或依赖。F1 必须在真正 Consumer 上验证旧 Authz 兼容、生成/装配二次零漂移与依赖/源码治理。

## 不可省略的权威与安全边界

完整表只在 [design.md](../../tasks/issue-11-f0/rounds/r001/design.md) 维护：Access 持有真实成员/Role/Menu/Permission+Scope；typed PB 是目标 Operation 合同唯一可写源；Yunka Authorizer/OperationGuard/Executor 持有其执行职责；Domain 强制 Tenant AND Scope、业务状态/回执/恢复；商业可用性和 Trace 不产生权限。原 Router 保留受控对照，切换前不得形成同操作双授权生产入口。

不采纳旧 @yunka 注释 DSL 及 legacy 角色表为新 Consumer 权威；不将 ScopeKey.With 或生成物存在当作授权。根幂等抑制不承诺响应重放。`group` 的领域含义尚未确权，当前不能转换扩大范围。

Trace/Log 目标由 [本轮合同](../../tasks/issue-11-f0/rounds/r001/design.md) 冻结：W3C 传播、受控 CORS/x-trace-id、默认 JSON stdout、无敏感身份字段、RPC/异步因果链、开发/CI 可查询 Collector/Jaeger、SLS 选配。查询默认最小暴露，生产环境/租户/人员权限、采样/留存/删除策略须 F3/F6 有组织 Owner 和真实审批；没有 Span 不能伪造查询成功。

## 未决条件与阶段出口

D1 已解决为 A；[发布资格核实](../../tasks/issue-11-f0/rounds/r002/qualification.md) 证明 infras/v0.1.0 缺失、CLI 发行锁证据不足，F1 保持阻塞；D2 数据库和 D3 IdP 的组织条件、Session/邀请/恢复政策、legacy group、诊断留存等分别记录 owner 与阻塞阶段。F0 可以冻结“尚未具备”的事实，不能借此宣称 F1/F3 已可实施。

F0 关闭需精确版本设计确认、来源/兼容/负例/条件完整、结构与真实候选检查、独立评审及 main 回读。Go/API/DB/Browser/生产证据由真正实施阶段提供，不用框架 CI 或 Mock 抵扣。Full、合并与部署按当前规则分别控制；#26 豁免只属于 #26。

## 后果与回退

此方案减少未来版本/授权语义混用，但可能暴露框架发布、CLI 安装或测试资源前置缺口；暴露缺口比假定全部可消费更符合目标。未采纳时本轮文档可撤销，不改现有用户数据。任何后续源版本、合同或消费策略变更都要新轮差异审查，不能回写本轮批准。

## 当前前置条件补充（r003，未改变已冻结版本目标）

[上游实际资格回读](../../tasks/issue-11-f0/rounds/r003/qualification.md) 已取得四模块不可变 Go 伪版本与校验和，以及 CLI 功能候选；缺少旧 infras 标签不再泛化为所有版本不可用。当前 CI/Production 被 Go1.25.13 的可达安全漏洞阻断，尚未合并/正式发布。推荐 Go1.26.9 / x/net0.60.0 的 [独立安全前置](https://github.com/hvritual/yunka.io/issues/244) 会改变本任务明确的工具链目标，须 Human 决定后新轮修订，不静默改验收或绕过扫描。
