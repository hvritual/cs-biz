# r002 设计：职责、契约、状态与验证落点

状态 proposed；[方案](solution.md) 定义结果和路线，本文件定义组织方式。参考 [技术分析](architecture.md)。本轮入口 contract 是 reviewed_design，只允许文档与设计模式预览；以下正式源码路径是各后续切片的预期落点，须同版准入。

## 权威与数据

| 对象 | 唯一职责与约束 | 拟议所有者/源码 |
| --- | --- | --- |
| ExternalIdentity / Account | 外部唯一键 (issuer,subject)，禁止按相同 email/sub 静默合并；账号禁用与 IdP 恢复区分 | backend/internal/identity/** |
| LoginTransaction / Session | code+S256、state/nonce、issuer/aud/signature/time 校验；一次性登录事务；Session 只存摘要与 server-side 到期/撤销；HttpOnly cookie，不把 Token 发给 Vue | identity BFF；期限与退出按 P1 |
| Tenant / Membership / Role / Grants | active/invited/suspended/removed，Menu 仅导航；Function 与该动作 Scope 成对保存；当前版本由服务端决定 | backend/internal/access/** + DB migration；不复制 IdP role 表 |
| Workspace | 当前标签页目标 tenant + 本地 generation；认证 Session 共享，企业上下文不放共享 Cookie | frontend store/request-epoch 复用；每次服务端查 membership |
| Marketing / CRM | typed Scope 解码、SQL 前置 Tenant AND Scope、资源状态与 owner 竞争；Action 不做笛卡尔积 | backend/internal/marketing/**、crm/** |
| OperationReceipt / Audit / Outbox | key+request digest+tenant+subject+operation 绑定；domain effect、receipt/audit/outbox 同受控事务提交；效果查询按当前权限 | 对应 Domain 持久事务；固定 Yunka UoW/Executor |

这是责任/约束设计，不是已发布的 SQL/API。Account/Access 与 IdP schema 使用 S0 独立数据库身份。新增表必须有 tenant-leading/身份唯一索引、FK/唯一约束及迁移前后校验；测试 root 不作为业务 DSN。

## 拟议接口与所有权

| 面 | 拟议行为 | 关键负例与生成边界 |
| --- | --- | --- |
| BFF login/callback/logout/session | 标准 OIDC、只接受服务端配置 issuer/redirect、有界发现/JWKS/出站；登录轮换 Session；安全 local return URL | 错 verifier/state/nonce/issuer/aud/签名/过期/code replay、CSRF/开放重定向；不用 password grant 代替应用登录 |
| Access Context / workspace target | 返回可信主体、tenant、当前 membership 与 accessVersion、Menu 和逐动作能力投影 | 客户端 ID/trace 不能造身份；旧在途结果丢弃；失败不复用旧企业权限 |
| canonical marketing.campaign.read / execute | Yunka typed PB → OperationPlan/REST/TS/assembly，真实 grants+Guard+Domain，API 不看 Menu | 未登录/停用/无 Function/模块关/越 Scope/跨租户无副作用；存在性敏感资源统一隐藏 |
| receipt readback | 原 operation ID/key 获取进行中/成功/失败/未知；未知不显示失败或可重新执行 | 参数变更同 key 冲突、跨主体/tenant 拒绝、回读重验当前读权；不是自动响应重放 |
| member/invitation/role | 文本预选与发送分开；P2/P4 后定义精确 PB/REST/TS；只经唯一 Access Store | invited 非 active；过期/重复/停用邀请拒绝；最后 Owner 与委派上限真 SQL 并发 |
| diagnostics | 安全 trace_id、稳定 code、默认 JSON stdout，查询端单独授权 | 诊断 ID 不授权；不记录秘密/PII/SQL 参数；查不到/丢弃/采样明确 |

现有 runtime.inspect 是公开 loopback 只读技术探针，不变成业务服务。旧 PR7/8 可回看旅程/测试思路，按 main 对账后重用具体成果，不恢复整包历史代码。版本固定沿 backend/.yunka/consumer-lock.json 与工具/制品资格，升级另论证。

## 并发与恢复

最后 Owner：同租户稳定 guard 行串行化 membership/role/owner 相关事务，读取当前活动 Owner 与目标版本，再校验、修改和写审计；不能分别锁不同成员后各自判断 count。跨入口必须同锁顺序；死锁/冲突保留原操作 ID、有界重试前先判定提交结果。MySQL 文档说明普通 SELECT 不足以保护读后写，锁方案仍需真实并发反例证明。

敏感写入：当前 Access/Session/资源版本按事务顺序重验；定义撤权先提交则拒绝，业务先提交则保留唯一已发生效果和可审计回执。不能将仅缓存失效通知当保证。

Outbox：提交后至少一次投递，消费者验证服务/Worker Audience，按 event_id 幂等处理并记录结果；retry/deadletter/重启用 correlation/causation 衔接。无下游查询协议不能承诺 exactly-once 外部效果，未知状态保留。

## 预览与正式客户端隔离

只在 Vite mode=design 且独立 loopback 端口 5790 安装 /__design/f-series；复用现有 layouts/basic.vue、Vben/Element Plus、语言/主题/Token、PageHeader。现有 Mock 仅作为该独立 origin 下的壳层夹具，合成journal通过Web Locks进行跨标签页读合并写，并订阅storage同步；这不代替后续真实DB幂等或权限事务。会话/租户/待确认记录由单一设计状态协调，顶栏与内容共享该状态。合成结果 journal 存在5790 origin的localStorage（按用户+tenant分隔），租户选择只存每标签页sessionStorage；退出跨标签清会话而保留原操作供重登同租户查询。全部是可清除的样例数据，不是真实业务结果；与 5777/5778 的存储 origin 分离。不得把此入口作为生产身份旁路。

预览只模拟拟议业务行为，不访问 BFF/营销/客户真实写 API，不发送邀请；外层审阅工具栏明确设计边界，产品内容只用业务语言。mode=production 分支不导入预览模块；生产构建后独立检查 dist 无预览路径、源码标记或 fixture，正常旅程仍回归。

## 变更与门禁

本轮只改 request.json allowlist。以后 S1–S6 各自确定允许/禁止路径、typed PB/API/迁移/生成差异，后端遵守 .yunka/ENGINEERING_QUALITY.md。不得把本文件的预计路径当全目录修改许可。

真实 API 接入 authz 后，当前 backend 快档“未被 API 消费”的隔离假设失效。先准备集成测试与可信分类调整的独立治理审查，不降低 Full 或绕过新 API 影响。此轮不修改门禁；它是 S1/S2 准入中的明确前提，不冒称现有 Mock 浏览器能证明后端授权。

营销效果的精确业务含义见 P7：推荐 draft→active，包含真实活动状态与唯一回执；不将旧 Mock executions++ 当作领域完成。当前预览还提供持续未知、终态失败、查询权限撤销，保留原操作编号；这些仍是合成状态。CRM/F6 的完整屏幕在对应切片准入前继续补齐，当前仅整体设计提案，不宣称全模块 UI 冻结。

无后台菜单场景由design-only路由约束覆盖所有Console路径（包含嵌套地址），并跨刷新保存该样例身份。它仅用于审阅拟议拒绝行为；当前生产Mock guard未覆盖所有嵌套路径，S2真实BFF/PEP必须重新证明全入口拒绝，不能据预览关闭该义务。
