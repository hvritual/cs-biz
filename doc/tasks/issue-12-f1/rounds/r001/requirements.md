# F1 r001 需求与验收

原始 #12 全文保留 raw-issue-12.md；下列不因环境阻塞移除分母。所有运行结果当前 NOT_RUN。

| R / AC | 可观察出口 | 必需正反例与证据 |
| --- | --- | --- |
| R1 / AC01 | backend 是固定四外部模块的实际 Consumer，精确工具链可重现 | module download Origin/Sum/GoModSum、实际 graph、go mod verify；replace/go.work/浮动版本/坏摘要/过期不可下载制品拒绝；空根许可证清单不伪造许可 |
| R2 / AC02 | typed PB 唯一可写，生成五类产物并可装配 | 同一 backend root generate/check；第一次/第二次全生成文件集合+字节一致，check 只读；改 generated 后 check 必须拒绝且不自修；不手改生成物 |
| R3 / AC03 | source/dependency/assembly 与真实编译通过 | 实际 source policy 绑定 backend module，workspace off；source audit、依赖图、assembly check、build/test/vet/race/govulncheck；未装配/越界路径反例拒绝，不能只测框架 |
| R4 / AC04 | 固定 Provider + slog JSON stdout，资源/操作一致 | exporter none 与 otlp，合法/缺失 trace context；有效时日志 trace_id 对应 span；不泄漏 Token/Session/PII；SLS 默认关闭、无凭据仍启动 |
| R5 / AC05 | 本地 Collector→Trace Backend 真实可查询 | 可用时由 cs-biz 探针发起，按其 TraceID 读回并断言 service/operation/span ID；不可用时探针/stdout仍可用且导出失败明确；不能空查询判 PASS |
| R6 / AC06 | 配置与生命周期受控 | 环境提供配置；错误 exporter/非法 timeout 拒绝；Flush/Shutdown 有界、重复 Shutdown 安全；不使用 Background 无限等候；监听仅 loopback |
| R7 / AC07 | 受控兼容、不扩范围 | 原 Authz V2 全部 unit/race/vet、前端既有断言与三尺寸、新旧 E2E 完整保留；无新业务/双 Runtime；真实 DB/IdP 保留 BLOCKED_F3 |
| R8 / AC08 | 独立 PR 与精确候选/main 证据闭环 | 真实选档、所有所选 checks、独立内容审阅、quality receipt、合并后 main 回读通过才关闭 #12；无部署宣称 |

AC07 的浏览器回归证明旧前端未回归，不证明 Consumer 业务链路；本次没有新前端旅程。F1 不持久化，真实 DB 正反例继续是 F3 阻塞项；若要求 F1 必须具备真实 DB，须回 Intent 补齐 D2/D3，不能自行降验收。

不变量：F0 r001–r005/handoff/ADR 字节不动；旧 Authz 不删断言；Menu/Trace 不作身份；只读探针不暴露业务对象/执行权限；不合并 #7/#8/#18/#21/#25；不下调门禁。

