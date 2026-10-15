# F0 锁定的正反例基准

本表是应实现/运行的验收约定，不是执行结果。当前所有真实 API/DB/Consumer 集成项均 **not_run**；前端 Mock/框架既有测试不可替代。

| ID | 准备条件与动作 | 必须观察的结果/反例 | 真实证据阶段 |
| --- | --- | --- | --- |
| MKT-01 | 当前成员有营销 read/execute + self，无 Console Menu | 营销 API 合法；后台深链拒绝；仅本人资源；不为 Menu 缺失拒绝合法 API | F2/F3 API+Browser+DB |
| CON-01 | 只有客户 Menu，无 read | 页面入口与 API 权限分开；直调读接口拒绝且不泄漏数据 | F2/F3 |
| CON-02 | read=tenant，update=self；同时发读与他人资源更新 | 读取按 tenant；不能把读取范围拼接到写授权；拒绝无副作用 | F4 真 SQL/并发 |
| TEN-01 | 同账户在 A/B，两个标签页选不同企业 | A 状态变化只影响对应上下文；任何 ID/API 不能跨租户；旧异步结果失效 | F3 API+DB+Browser |
| REV-01 | 读到旧 UI/Grant 之后撤权或停用，再请求 | 每次使用当前 Access 权威拒绝；不能依赖旧投影/缓存授权 | F3/F4 |
| REC-01 | 一次业务写已提交但响应丢失，使用原操作标识恢复 | 副作用受实际持久幂等规则约束；查询原状态/回执；结果未知不盲重放；无自动响应重放承诺 | F2/F3/F6 故障注入 |
| SCP-01 | 旧 group 未获领域语义批准 | 不转换为 tenant/assigned/self；有界拒绝，不扩权 | F4 |
| MOD-01 | IAM Function 仍在但模块关闭 | 业务可用性拒绝；不删除或新增 IAM 事实 | F2/F3 |
| ID-SEC | 伪造 X-User-ID/X-Tenant-ID、traceparent 或空 Tenant、假平台/Worker | 不建立可信主体；缺权拒绝、无敏感存在性泄露 | F2/F3/F5 |
| OP-01 | 同一 Operation 经 REST/gRPC/child/worker（适用时） | 唯一受保护执行路径；子操作不能跳过当前权限；生产旧 Router 无旁路 | F2/F5 |
| DB-01 | 分页/聚合/导出/批量、owner 并发变化 | 数据库前置 Tenant AND Scope，不全量拉取后内存过滤；写入重验 | F4 真 DB |
| VER-01 | GOWORK=off，固定 Consumer/CLI/模块来源 | 模块可下载/编译，source/dependency 资格与二次生成零漂移；缺工具/源码不报 pass | F1 |
| OBS-01 | 合法/非法 W3C、成功/错误、JS 未发 HTTP | 正确 parent/child、响应安全 trace id、stdout 对应；不携带 Token/Cookie/PII | O1 P0/P1 与 F2/F3 |
| OBS-02 | Collector/SLS 关闭、不可达或失采样 | 授权和业务语义不变，stdout 持续；只说明实际可查记录，不虚称完整 Span | O1/F6 |
| OBS-SEC | 未授权人/其他环境或租户查询 Trace | 按实际部署授权拒绝并审计；TraceID 不是读取权限；保留/销毁按批准策略 | F3/F6 |

F0 只验证：每条约定都有依据和 owner/阶段、无缩减原始 AC、来源精确、版本差异与未决条件诚实记录。实际命令由各阶段随真实代码建立，本轮不编造不存在的服务或数据库入口。
