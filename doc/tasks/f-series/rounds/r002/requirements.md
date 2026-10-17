# r002 验收与准入对账

候选分母，未冻结、未签 module-contract、未签 Build handoff。原完整要求仍在 [r001要求](../r001/requirements.md)、[F0冻结矩阵](../../../issue-11-f0/rounds/r005/acceptance-matrix.md) 与 sources.json 绑定的 GitHub 原文。本表增加切片/观测定位，不替换或减少原验收。

## 完整成员

父#10；已交付#11/#12；待完成#13–#17；横向#19及其历史技术候选#20/#24全部保留。#20/#24与main F1先差异对账，不能因分支删除而关闭或重合并。治理#22/#35不在业务交付分母；其排除依据是原目标F2–F6，不删除任务。PR7/8/18/21/25已归档未合并，仅作为来源；完整原要求与当前main有冲突时列出并回审，不暗选其一。

## R/AC → 单元 → 可证伪结果

每项包括原义务、Given/When/Then、拒绝/恢复与真实方法；实现前将本表各行细化成可运行测试及精确路径，并保持原ID。

| R/原 AC | 交付单元 | Given → When → Then / 失败条件 | 真实证据与当前状态 |
| --- | --- | --- | --- |
| R1 AC01/02 | S0已交付；S1复核适用性 | Docker启动、各自schema账号读写/互拒，重启保留同一标记/主体；root应用账号、卷覆盖或越schema即失败 | 原PR38实际资源CI，非本轮重跑；不抵扣业务义务 |
| R2 AC03/04 | S1/#14 | 已签真实IdP→code+PKCE、BFF核签及状态→可信Account；错签名/aud/issuer/nonce/state/verifier/过期/replay拒绝；双issuer同适配且不隐式合并 | 真IdP+BFF/API/Browser；业务NOT_RUN；第二issuer非生产兼容不证明生产 |
| R3 AC05 | S1+S3/#14 | 已认证0/1/N企业→分流/选择/切换→每标签页独立且当前membership；旧在途晚到失效、切换失败无旧权限回用、跨账户/tenant重放拒绝 | 真MySQL/API/三尺寸Browser；TEN-01/ID-SEC；NOT_RUN |
| R3 AC06 | S3/#14 | 有当前管理权→邀请/状态/委派/Owner/撤权→按P1/P2/P4生效；最后Owner并发不会归零，超授/重复接受/CSRF/旧会话敏感写拒绝 | 真DB竞争/重启/API/Browser；REV-01；P1/P2/P4待审 |
| R4 AC07 | S2/#13 | 已开通营销且read/execute+self无Menu→真实营销入口/API→成功仅本人；有Menu无Function、模块关、无会话/停用/越Scope/跨tenant均拒绝且无DB/receipt副作用 | Browser/BFF/Yunka/SQL差分；MKT-01/CON-01/MOD-01；NOT_RUN |
| R4 AC08 | S2/#13 | 写提交回复丢失→原key/operation查询→展示同一事实；同key异参冲突；未知不盲重放；撤权后回读仍受当前权限 | 真DB/API/故障注入/进程重启；REC-01；NOT_RUN |
| R5 AC09/10 | S4/#15 | READ=tenant UPDATE=self→列表/详情/写/分页/统计/导出/批量→SQL前置Tenant AND该动作Scope；ID/filter注入、owner竞争、授权版本切换拒绝不扩权 | 真SQL/API/并发/EXPLAIN和实测数据；CON-02/DB-01/SCP-01；legacy group保持拒绝；NOT_RUN |
| R6 AC11 | S5/#16 | 枚举原承诺+实际source全部受保护路由/方法→映射Plan/Executor→100%且无双入口；Audience、root/child、UoW/幂等、重复route/assembly负例；回退可验证 | 编译/装配审计/HTTP/gRPC/Worker/Child与回滚；OP-01；未有transport仍保留原义务待适用性审查；NOT_RUN |
| R6 AC12 | S5/#16 | 事务Outbox提交→重试/deadletter/重启→event/correlation/causation及幂等效果/回执可查；不可信Principal不可继承，未知外部效果不能仅凭Trace断言成功 | 真DB/进程/Worker/TraceSource；NOT_RUN |
| R7 AC13 | S1–S5最终归#19 | 同一同步业务行为→Browser/BFF/Yunka/Guard/SQL/RPC→正确Trace与安全错误码；401/403/404/500/超时/取消/Domain错/JS未HTTP均可定位；无Token/Cookie/PII | TR-01/02/03/04、LG-01、SEC-01；真Browser/API/Collector查询+跨租户查询拒绝；NOT_RUN |
| R7 AC14 | S6A/S6B/#17+#19 | 无SLS/采集故障→业务及授权正常、stdout持续；开启获准SLS→实际trace/log查询；有限队列/重试/降级/丢弃指标、采样与检索权限明确 | LG-02/03/SEC-01/QUAL-01全矩阵；未有SLS/生产条件部分BLOCKED，其余NOT_RUN |
| R8 AC15 | S6A+S6B/#17 | 固定consumer/schema/环境→迁移/备份恢复/隔离并发/容量/安全/丢回执/审计/灰度回滚→按获准SLO与目标实际读回 | 真跨端及部署证据；P6资源和实际发布待到位；不能以S6A关闭#17 |
| R9 AC16 | 全部/父#10 | 同一分支逐切片→审查/门禁/合并/main回读→全部原分母有当前充分证据 | 逐AC证据、exact SHA/CI receipt；保留全部旧断言/三尺寸/唯一Mobile skip；父任务保持开放 |

## 准入图与关闭条件

D先交同版设计并取得真实审阅。S0是既有前提；S1分别前置S2/S3；S2+S3前置S4→S5→S6A→S6B；S3的管理细则在S1读取权威后可设计，S2可按已授grants推进，P2/P4不扩大阻塞到所有营销验证。P1影响S1 Session及依赖；P7影响S2的领域效果及共同后继，不阻塞已具备P2/P4的S3；P6只阻塞对应生产资格。每个Build单元必须有实际approved intake；整模块尚有未决项时不伪造完整冻结。

S2全部原#13出口包括Trace/恢复均通过后才关闭#13；S1不能关闭#14，S3完成原#14全部出口后才关闭；#15/#16逐完整出口关闭；#17和父#10需包括S6B在内的全部验收。#19各子义务由分期补齐，不能把F1探针或预览当完整O1。

## 当前设计本身的检查

D-01：完整来源与继承/新增决定对账，无原件变化。D-02：R/AC、Issue、单元、依赖、阻塞与关闭条件双向覆盖且无循环。D-03：现有Console内隔离预览，本轮关键交互场景/三尺寸/双语/主题有实际浏览器记录，生产构建无预览。D-04：独立语义审查+Human同版审阅后才发handoff。

本轮浏览器通过只证明D-03中实际演练的交互，不能把上表业务NOT_RUN改PASS。真人理解/耗时未测；没有生产性能数值、发送结果、真实库或真实身份成功宣称。
