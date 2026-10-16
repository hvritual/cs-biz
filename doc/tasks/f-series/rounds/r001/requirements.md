# r001 要求、验收与原义务映射

状态：候选分母，未冻结、全部运行结果 `NOT_RUN`。原 #10–#17 及 #19 的完整 body 是来源，本表是导航，不删减原文。表中 Given 的开发/测试/用户角色均只在指定环境行动；“失败”包括缺少证据，不仅断言返回错误。

| R / AC / 原 Issue | Given / When / Then（可观察出口） | 反例、恢复与保留项 | 验证方法 / 环境 |
| --- | --- | --- | --- |
| R1 / AC01 / #14 前提 | 开发者持有获准非生产环境；按固定配置启动；MySQL 与 IdP 真实就绪，版本/digest、作用域和命令可重现 | 缺 secret/错误环境/端口/平台拒绝；不默认绑定公网或清理开发卷 | 实际 Compose/SQL/Discovery/JWKS，Docker 非生产；仅文件存在不通过 |
| R1 / AC02 / #14 前提 | 测试使用相互独立的业务/IdP DB账号；读写各自 schema 成功，访问对方 schema 拒绝；重启保持原标记和主体 | root 不是应用账号；中断先查操作 ID/卷状态，禁止不明重复初始化 | 真 MySQL 权限与重启 SQL 读回，Docker；保存退出码/脱敏原始证据 |
| R2 / AC03 / #14 | 用户走标准 code+S256 PKCE；BFF 验证发行者/签名/aud/时间/state/nonce 后取得可信 subject | wrong verifier/state/nonce/issuer/aud、过期、code replay、伪造 Header 拒绝；不写密码到应用；不以 password grant 替代 | 真 IdP + BFF/API/浏览器；签名校验不能只解码 JWT |
| R2 / AC04 / #14 | 供应端配置换到第二个非生产 issuer；同一适配代码通过标准流程，生产配置的必要前提被检查 | 无 Keycloak role/Admin API 依赖；未知 issuer/非白名单出站/HTTP production 拒绝；换 issuer 不隐式继承账号/权限 | 两个真实 issuer 的配置兼容与负例；生产真实接入另证，不能据此写生产通过 |
| R3 / AC05 / #14 | 用户与 Access 真实持久存储；0/1/N 企业正确分流，同账户 A/B 标签独立选择，各 API 强制当前 membership | invited/suspended/removed、跨租户/账户重放拒绝；切换失败不复用旧企业权限；不信客户端 user/tenant | 真 DB/API/现有 Console 三尺寸浏览器，两个租户；UI同版Preview未完成时不可签该交接 |
| R3 / AC06 / #14 | 最后 Owner 与撤权并发、委派和会话操作按获准 P1/P2/P4；结果符合事务顺序和当前授权 | 不能出现无活动Owner、超范围委派、旧会话继续敏感写入或邀请重复接受；超时先查幂等结果 | 真数据库并发与API/浏览器、CSRF/会话撤销/跨账户负例；非Fake |
| R4 / AC07 / #13 | 已开通营销、有 read/execute Function、无 Console Menu 的成员；直接访问营销 API成功，Console深链拒绝 | 无Function、停用成员、模块关闭、本人Scope越界/跨租户均拒绝且数据库/回执无副作用 | 真BFF/Yunka/Marketing/DB/API与浏览器；若暴露REST/gRPC必须同策略 |
| R4 / AC08 / #13 | 营销失败、Domain错、超时/回复丢失；同一原始 operation/key 可回读最终结果 | 相同键不同参数冲突，不盲重放；未知不是失败；读回仍检查当前权限 | 真DB/API、故障注入/重启和结果记录；本次原始请求/回执身份匹配 |
| R5 / AC09 / #15 | CRM/营销真实数据，READ=tenant、UPDATE=self；列表/详情/分页/聚合/统计/导出/批量分别只作用于该动作范围 | tenantID/ID注入、客户端filter、owner竞争、不同动作范围拼接拒绝；SQL先限制不内存后筛 | 真SQL/API/并发与差分基准；保存计划/实际数据范围/观测性能，不虚构生产SLO |
| R5 / AC10 / #15 | 旧group数据仍在；按获准P3策略处理；未显式再授权时真实服务不放行 | 不变成tenant/assigned，不静默丢数据；另定义同部门能力需新轮/实际部门证据 | 真DB/API与迁移预览/回读；规则候选未经确认不能标合格 |
| R6 / AC11 / #16 | 从获准目标和实际source枚举所有受保护route/method；全部走canonical OperationPlan/Executor，已覆盖清单为100% | Audience伪造、root/child、双入口、重复route、旁路和UoW/幂等负例；旧Router退休有覆盖/回退证明 | 实际编译/装配审计、HTTP/gRPC/Worker/Child集成和回滚演练；未测transport不冒认 |
| R6 / AC12 / #16 | Outbox提交、retry/deadletter、跨进程重启；事件有correlation/causation与唯一效果/回执读回 | 不继承不可信Principal，不把TraceID当外部效果；未知先读回，保留event/operation ID | 真DB/进程/API/Worker/Trace后端；重启和至少一次投递正反例 |
| R7 / AC13 / #13–#17/#19 | 浏览器/BFF/Yunka/Guard/Domain/SQL/RPC各阶段成功/拒绝/错/超时可用安全ID关联 | Token/Cookie/PII/SQL参数/邀请不入日志；Trace不授权；未采样明确、不强称永久存储；诊断查询不越租户 | 真实Span+JSON stdout+受控可查询后端，脱敏/跨租户查询负例；浏览器未发HTTP的JS错另覆盖 |
| R7 / AC14 / #17/#19 | 无SLS启动/采集失效仍业务可用；有获准SLS资源时真实查询关联Trace/Log | Collector/SLS宕机、凭据失效、限流、过载有界且丢弃/采样状态明确；不把厂商库当Consumer生产证据 | 关闭/开启配置和真实环境故障；无SLS资源时开启分支BLOCKED而非PASS |
| R8 / AC15 / #17 | 实际固定Consumer/DB/schema/环境；迁移、备份恢复、隔离/并发/容量、幂等/丢回执、审计、安全和发布/回滚证据齐备 | 非生产通过不等于生产；没目标资源/Owner策略/显式人审/部署回读不得关闭F6 | 真API/DB/BFF/前端及获准生产目标直接回读；性能门槛需实际Owner同版批准 |
| R9 / AC16 / #10–#17 | 一个工作分支的每步变更；精确候选独立评审、原风险门禁/receipt、获准合入及main资格成立后继续下一步 | 不改旧HASH、原验收、全量测试/三尺寸/唯一Mobile历史skip；依赖closed但无证据不通过；基线漂移重核 | 完整diff、Git/GitHub/CI真实readback；全部原义务覆盖才关Issue/父任务 |

原 F0/F1 已交付，仍是约束/兼容证明来源，不重复实施、不冒写其旧 PASS 为本轮运行。所有 Trace、真实DB、身份、三权、租户隔离、生成所有权和丢回复恢复保持。镜像资格、r001策略批准、UI Preview、真实目标资源和部署授权是各自的门，不合并成一个虚假的 READY。

## 精确继承与横向原义务

本表补充导航而非取代原文；来源为 `sources/issue-19.json` 的完整 TR/LG/SEC/QUAL 矩阵以及已审 F0 acceptance-matrix。S0独立资源不是这些业务义务已完成的证明。

| 原义务 | r001 对应 / 后续阶段 | 不可遗漏的具体出口 |
| --- | --- | --- |
| CON-01 | AC05/07，S2/S3 | 只有客户 Menu、无 read 时直调 API 拒绝，不泄漏数据；页面入口不授权 |
| TEN-01 | AC05，S3 | A/B 标签页上下文独立，旧在途/异步结果必须失效，失败不回用旧企业权限 |
| MOD-01 | AC07，S2/S3 | 模块关闭拒绝业务但不修改既有 IAM Function/Grant 事实 |
| F4 版本切换 | AC09/10，S4 | 当前/旧授权版本与资源归属切换有真实SQL正反例，不混用缓存扩大范围 |
| F5 装配/重复仪表 | AC11–13，S5 | AssemblyPlan全部封闭；无双顶层采样器、重复日志/授权；TraceAnalyzer真实TraceSource按trace聚合span/log/operation/event并保留缺失/来源状态 |
| TR-01 | AC07/13，S2 | 营销Browser→BFF→Yunka/Guard→Domain同TraceID、正确父子关系且成功/失败可查询 |
| TR-02 | AC05/13，S3 | JS/路由错即使未发API也有客户端Span/安全ID，与后续HTTP可关联 |
| TR-03 | AC03/07/13，S2/S3 | 401/403/404/500、超时、取消能由错误/响应头定位；Trace不越权 |
| TR-04 | AC11–13，S5 | RPC/Child/Outbox/Worker重试的W3C和correlation/causation贯通，不继承不可信Principal |
| LG-01 | AC13/14，S2–S6 | 不配SLS仍有JSON stdout，错误trace/span/code/operation与真实Trace匹配 |
| LG-02 | AC14，S6 | 有获准SLS时经受控Collector/LoongCollector实际检索并回到Trace；关掉后终端继续 |
| LG-03 | AC14，S6 | 故障/限流/超时/凭据过期有界队列/重试/降级/丢弃指标；业务授权与stdout不受影响 |
| SEC-01 | AC13–15，S3/S6 | 日志/Span/Baggage无秘密/PII/原始敏感参数；跨租户/环境/人员查询最小授权 |
| QUAL-01 | AC13–16，S6 | 同候选Go/Browser/OTLP、SLS关/开、采样与开销的原始环境/CI证据；未接采集服务不冒认O1完成 |
