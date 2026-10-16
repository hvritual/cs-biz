# r002 技术分析：复用、适配与缺口

分析起点 main 191189ba63ffcbda8f62be1981ae3b892172a9c9。Architecture 角色在当前会话执行，不假装启动另一进程。实际输入引用 [sources](sources.json)，技术结论服务原 F 目标，不增加独立框架重构。

| 能力 | 当前实际来源 | 复用 / 适配 / 缺口 |
| --- | --- | --- |
| Yunka | consumer-lock/go.mod，bc7c0e1dd6b4 系列模块、Go1.26.9，runtime.inspect 与生成物 | 复用 compiler/Operation/Executor/OTel；新增业务 canonical PB；不追浮动 main |
| Authz | internal/platform/authz 当前 Go PEP/HTTP 与负例 | 保留既有保护；适配当前 Access GrantResolver/opaque scope；真实持久权威缺失 |
| Identity / DB | S0 Docker 资源已验证 | 复用隔离/生命周期；BFF、Session、Access schema/API 尚缺；资源探针不代替 |
| Console | 现有 BasicLayout/Workspace/RequestEpoch/ElementPlus/i18n | 复用布局/失效语义，新增真实 typed client 时逐页切换；Mock all/group/own 不自动成为真实 Scope |
| Domain / Outbox | 无真实 CRM/营销存储与 Worker 业务链 | 必需新实现，按业务职责包；不得用现有列表画面证明 DB 或补无用途抽象 |
| Trace | F1 技术 Provider+Collector/Jaeger | 复用仪表；浏览器 SDK/BFF/业务 TraceSource/检索授权与异步关联缺口明确留在 F2–F6 |

## 成熟模式与局限

1. OAuth Security BCP RFC9700 §2.1.1：code flow 配合绑定登录事务的 PKCE，支持 S256，防 code injection/mix-up。用于继承本项目标准 OIDC 路线；不决定本产品的 Session 时长。
2. OWASP Session Management：server-side idle/absolute expiry、风险事件重新认证及会话轮换；期限取决于用途。r001 的 12 小时尚未批准，本轮建议 8 小时办公日上限与 30 分钟空闲，保留 12 小时为可选项，不声称数值由标准强制。
3. MySQL8.4 Locking Reads：读后写需要锁定/事务保护，普通 SELECT 不够。最后 Owner 使用每租户 guard 行减少计数竞争；业务正确性仍由真实 interleaving/rollback 测试决定，不借 SELECT FOR UPDATE 字样宣称安全。

三者仅引用官方说明的约束/模式，不复制实现，无新增第三方源码/许可证导入。本轮不预选尚未核对安全版本的 OIDC Go 库；S1 接入时只评估成熟标准库、固定依赖并验证 Consumer 兼容，不自写签名校验。

## 可行性与反证

F2 先于可信主体会产生 Fake/临时权威，因此拆 S1→S2→S3。一次性完成全 IAM 再验证会延迟业务反馈，改为各单元完整正反例+main回读。设计范围可一次准备，完整 F2–F6 交付不能承诺一次模型调用完成；F6 真生产另需实际 Owner 资源。

具体责任/事务/API 见 design.md；依赖和禁止提前关闭规则见 requirements.md；资源问题的最小 Owner 动作见 decision-review.md。
