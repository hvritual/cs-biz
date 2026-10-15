# F0 设计 r001：源身份、权责与准入

状态：proposed。设计引用 [sources.json](sources.json) 中的精确版本，不声明仓库已接 Yunka。方案职责见 [solution](solution.md)，本文件只定义组织和接口边界。

## 当前基线与继承规则

| 来源 | 精确提交 | 状态及允许用途 |
| --- | --- | --- |
| cs-biz main | da5494d03c362ab873465c1793e7aba7e4e3a7cc | 当前源码；含 #26 工作流、Go Authz V2 和 Vue Mock |
| PR #7 | d257fa8c57e35f3d972b5f2d281dafe94f0f32a0 | 未合并；身份决策/0-1-N 旅程候选，不是 IdP |
| PR #8 | 6d391604d8f07204a310201b3e7941f8c55cf15c | 未合并且基于 #7；三权/TrustedScope 候选 |
| PR #18 | a5dccbd074236e31d0628a01e01a7dfb534b981e | proposed integration；继承方向和目标，不升级为已接受事实 |
| Yunka 评估源码 | 3527488325030fbf86fe52804140c936e9d937a4 | 固定源码事实，不是已合格 Consumer 版本 |

保留现有 Desktop、Vue/Vben/Element Plus、每标签页独立工作区和 #26 工作流。旧 roadmap、PR #18 对“Full 手动未生效”等描述已经过时；实际 main YAML 和当前协议优先。ADR-0001 已 accepted；Yunka 的集成 ADR 仍须本轮决策。

## 单一权威表（迁移目标）

| 事实/执行 | 唯一权威 | 适配边界与禁止 |
| --- | --- | --- |
| 账号、Session、当前工作区 | cs-biz 的可信 IdP/BFF/Access | 服务端验证；客户端 user/tenant/trace headers 不能产生身份 |
| 角色实际分配、Menu、Permission+Scope | cs-biz 当前 Access Store | GrantResolver 每请求读取当前有效事实；不复制 Yunka legacy 角色表 |
| Operation/Permission/transport 定义 | canonical typed PB | OperationPlan/OpenAPI/TS/Adapter/Assembly 为只读派生物，不维护第二个 Registry 真相 |
| Function 判定 | Yunka Authorizer + cs-biz GrantResolver | 业务 API 不查 Console Menu；平台/服务/Worker 明确信任边界 |
| Scope 注入 | 授权后的 OperationGuard | 绑定同一 Permission/资源/租户；ScopeKey.With 不是授权凭证 |
| SQL/分页/写入/导出/统计 | Domain/Repository | 强制 Tenant AND 当前 Scope；客户端条件只能缩小 |
| 模块是否可用 | cs-biz 业务域 | 不授予/删除 IAM 权限 |
| UoW/事务/重复抑制 | 唯一 Yunka Executor/ExecutionScope | 不创建第二执行器；legacy Router 只能受控对照，不能同操作两路放行 |
| 业务状态、审计、回执和恢复 | 相应 Domain/持久查询 | 不将重复抑制、HTTP 200、Trace 或 Outbox published 当最终完成 |
| 导航/按钮展示 | 可信投影 + 本地 view registry | 不执行任意服务端组件路径，不替代每次服务端授权 |

当前 V2 的 CurrentAuthority seam、Operation Registry 和 HTTP Router 仍是已实现基线；上表是受控迁移目标。F0 不删除它们，F2/F5 要有单操作切换、负例和回退证据。

## 版本与生成边界

详细 [版本矩阵](versions.md)。F1 先固定所选 Consumer/CLI、PB options、Go/protoc/plugins/source policy，再在隔离工作区跑下载/编译和生成。必须同时记录 version、commit、module path、sum/制品摘要，不按“同名版本”推定同源。

固定源码公开入口已读：`yunka generate --root`、`yunka check --root`，以及 `yunka assembly generate/check`。它们当前尚未在 cs-biz 安装或执行。F1 冻结实际 project profile 和全部 flags 后再公布可直接运行的消费者命令；不在这里给不存在的 `.yunka/project.json` 造可执行成功记录。

源码策略必须适配当前 `backend` 根和实际 module 路径。上游 `tools/source-policy/biz.json` 中的 project/yunka.io 路径及旧 testSupport import 不能直接套用到 cs-biz。

## Trace / Log 合同候选

| 边界 | 本轮冻结的目标义务 | 运行证据出口 |
| --- | --- | --- |
| 浏览器→BFF | 合法 W3C traceparent/tracestate；HTTP helper 传递；CORS 限定 Origin/头，暴露实际 x-trace-id；非法输入不建立身份 | P0/P2/P3 的真实浏览器/API 负例；不能复用旧 SHA PASS |
| 服务端 | 入口 Span、server child parent、operation/authz/domain；错误响应保留安全排障号和稳定错误码 | stdout 与当前 TraceID/Span 可对照；不暴露内部堆栈/PII |
| 日志字段 | trace_id/span_id/operation_id/error_code/status、service.name/version、deployment.environment.name、route 模板、duration_ms；身份字段默认禁用 | 当前 Consumer 的 JSON stdout / 脱敏与错误负例 |
| RPC/异步 | RPC W3C 传播；Outbox 固定 event/correlation/causation；新 Worker 重新验证身份；跨长时业务可跨 Trace | F5 真实传播、重试/因果链；published 不是业务成功 |
| 查询存储 | 开发/CI 推荐受控 Collector→Jaeger；TraceSource 为部署适配；默认终端日志，SLS 选配且不可阻塞业务 | O1-P1 的当前 Consumer 查询与 collector 断开负例；未合并的 #25 不当主线能力 |
| 查询权限 | 默认 loopback；远端显式受控认证，环境/租户/人员最小权限和审计 | F3/F6 部署级隔离、安全查询和留存/删除验收 |
| 留存与缺样本 | 采样/TTL/销毁策略由运维/安全 Owner 确认；未采样只说日志关联可用性，不承诺一定有 Span | F6 实测队列、成本、故障降级和留存回读 |

上游部署文档偏好生产 SLS，与本项目 Issue #19 的“SLS 可选”并列记录；本项目选择为后者。没有真实生产配置时不填保留天数，不声称 TraceAnalyzer 自带 SLS 查询端。

## 文件与阶段边界

本轮允许 `doc/tasks/issue-11-f0/**`、任务主记录、ADR-0003、roadmap 的当前状态补充。禁止业务 `frontend/**`/`backend/**`、生成物、依赖锁、CI 调度、其他仓库和生产数据。

同轮原文、Intent、知识证据、决策、方案、R/AC、技术 journey/flow 封存在 rounds/r001。反馈用 F0-S01~S06 和 R/AC ID 定位；新反馈开 r002，不覆盖本轮。前端 Preview 为有理由的 not_applicable：没有界面/业务交互变更，技术流程图不冒充可操作 UI。

## 交接与退回

只有 Human 对本轮精确版本作出完整确认且设计阻塞项解决后，才能形成 DESIGN_HANDOFF。未验证模块组合在 F1 资格入口保持阻塞；IdP/DB/会话等在 F3 之前解决。实施模型按批准范围接手验证/门禁；Full/合并/部署分别授权，PR #26 的豁免不延用。
