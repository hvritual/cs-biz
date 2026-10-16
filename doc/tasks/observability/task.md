# Observability O1：业务诊断链

来源：[父 Issue #19](https://github.com/hvritual/cs-biz/issues/19)，贯穿 [Yunka F0–F6](../f-series/task.md)。本页是当前导航与缺口对账，不重新冻结或替代原 Issue；原文另存于 [F 系列来源](../f-series/rounds/r001/sources/issue-19.json)。

## 结果与当前边界

用户的一次业务操作应能从安全的排障编号追踪 Browser → BFF/身份 → Yunka Operation/Guard → Domain/DB，并沿 RPC/Outbox/Worker 的 correlation/causation 找到异步原因。Trace 用于诊断；业务最终效果仍以 receipt/readback 为准。终端结构化 JSON 日志默认可用，SLS 仅可选，遥测故障不能绕过授权或中断业务。

当前 main 已有 [F1 Consumer 与可查询本地技术 Trace](../../../backend/doc/YUNKA-CONSUMER.md)，由 [PR #31](https://github.com/hvritual/cs-biz/pull/31) 交付；这不证明浏览器业务链、真实 IAM/Domain、RPC/Outbox 或 SLS 验收。#19 保持开放。本次只整理文档与历史候选，不开展下一阶段实施。

## 原验收与缺口

| 原 AC | 必需结果 | 当前证明范围 / 缺口 |
| --- | --- | --- |
| TR-01 | 营销 Browser→BFF→Yunka/Guard→Domain 成功/失败同有效 TraceID、合法父子 Span、可查询 | 未证明真实业务纵向链；F1 探针不能替代 |
| TR-02 | 未发 API 的 JS/路由错误有安全诊断 ID/客户端 Span，并关联后续请求 | 尚待真实前端错误链验收 |
| TR-03 | 401/403/404/500、超时、取消可定位 Trace，ID 不成为权限凭证 | 技术探针部分证据；真实业务完整集合待验收 |
| TR-04 | gRPC/Child Operation/Outbox/Worker 重试传播上下文和因果链，不继承不可信身份 | 待 F5 的真实链与负例 |
| LG-01 | 无 SLS 仍 JSON stdout，错误 trace/span/error_code/operation_id 与查询相符 | F1 技术日志局部前提；业务 Operation 集成待证明 |
| LG-02 | SLS 经受控 Collector/LoongCollector 可检索，关闭后终端仍运行 | 未接真实 SLS；不能标完成 |
| LG-03 | 采集故障/限流/超时/凭据到期时授权与业务不受影响，队列/重试有界且终端不中断 | 本地 Collector 故障局部前提；完整部署配置待验收 |
| SEC-01 | 无秘密/PII/敏感参数；查询端环境/租户/人员最小授权 | 保留现有脱敏负例；真实查询端隔离尚待证明 |
| QUAL-01 | 同一候选 Go/Browser/OTLP、SLS 开关、采样/开销有实际环境证据 | 未具备整个 O1 Done Gate，禁止用单项 CI 代替 |

复用 Yunka Provider/TraceAnalyzer，消费者提供实际 TraceSource；不在业务代码复制遥测引擎或同步写 SLS。标准字段、安全约束与分阶段义务继续以 #19 和 F0 同版设计为准。

## 原分期与历史候选

| 分期 | 原入口 | 当前处理 |
| --- | --- | --- |
| P0 | [#20](https://github.com/hvritual/cs-biz/issues/20)、[PR #21](https://github.com/hvritual/cs-biz/pull/21) | 未合入的开发诊断候选，不能当 main 能力；清理分支不等于通过验收 |
| P1 | [#24](https://github.com/hvritual/cs-biz/issues/24)、[PR #25](https://github.com/hvritual/cs-biz/pull/25) | 旧 stacked 候选；固定版本技术证据保留于 PR；与 F1 当前已交付部分先对账，不能整包重合并 |
| P2 | #19 的真实 BFF/营销/Domain/RPC/Outbox | 仍待相应 F 系列实施准入与业务证据 |
| P3 | #19 的可选 SLS、故障、采样/留存/成本/隐私与支持 SOP | 仍待环境资源、决定与发布权限 |

原分期的 Human 业务审核和进入下一阶段的批准仍按真实来源核对；当前工程质量执行只遵循 [风险门禁](../../ci/RISK-BASED-GATES.md)，历史 Human-only Full 不能另立门禁。恢复工作前核对 main、原验收、旧候选差异和当前授权；F 系列 Human stop 继续有效。
