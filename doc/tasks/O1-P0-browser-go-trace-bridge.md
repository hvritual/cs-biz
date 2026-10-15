# O1-P0：Browser → Go → 终端 Trace/Log 最小闭环

> 主需求 [Issue #19](https://github.com/hvritual/cs-biz/issues/19)，当前实施 [Issue #20](https://github.com/hvritual/cs-biz/issues/20)。这是一个独立可评审切片，评审通过前**停止下一阶段**。

## 目标

使用真实 Chromium 浏览器和真实运行的 Go HTTP 探针，证明一次请求的有效 W3C TraceID 从浏览器传到后端，后端生成子 SpanID 并关联到 JSON stdout；出现 HTTP 错误和网络失败时仍保留安全排障编号。

## 允许与禁止

- 允许：`backend/cmd/traceprobe`、`backend/internal/platform/traceprobe`、对应 Go tests/CI；前端 `platform/trace-request` helper 与测试、独立 Chromium Trace smoke、受控 GitHub Targeted workflow、本文档。
- 禁止：修改现有租户/角色/营销业务、绕过 Authz、改变生产路由、创建 SLS 配置或凭据、导入或自造替代 Yunka Runtime、启动非 loopback 服务、添加用户可见的工程 UI。

## 锁定验收

| ID | 可观察行为 | 负例 |
| --- | --- | --- |
| P0-01 | 浏览器 `traceparent` 与 Go 响应 TraceID 相同；响应子 SpanID 不等于请求父 SpanID | 非法/全零/大写/未知版本 Trace Context 不被继承 |
| P0-02 | Go `slog` stdout JSON 带 `trace_id`、`span_id`、`parent_span_id`、`operation_id`、`status`、`error_code` | Secret 不进入日志；错误响应仍携带 TraceID |
| P0-03 | Chromium 真请求走本机 Go 进程，成功 200 与预期失败 500 都可关联 | 非法 Origin、外部监听、未知业务路径拒绝 |
| P0-04 | Backend Go Test/Vet/Race、Frontend Fast 与一个独立 Trace Targeted 测试通过，证据绑定单个 SHA | 缺失工具、失败和跳过不能报 PASS |
| P0-05 | 独立 PR 交 Human 审查，不合并、不进入 Yunka OTel/Collector/SLS 阶段 | AI 不运行 Human-only Full |

## 执行与评审

先修最小失败、通过 Go 与 Vitest/Fast，再验证唯一 Playwright Trace 跨端场景；上传 CI 结果并固定 PR SHA。审阅 `backend/doc/TRACE-PROBE-P0.md`、请求/响应/日志字段、源 diff、异常与隐私负例。

Human 决策：接受 P0 后才可制定/实施 P1 Yunka OTel Provider + 可查询 Trace Backend；若需要修订，继续在此同一切片修改并重新验证；未确认则维持 WAITING_HUMAN_REVIEW。

## 范围事实

当前 main 没有真实生产 IdP/BFF、Yunka Runtime 或数据库。本切片为前后端 Trace 传递实验入口，不应把开发探针、唯一浏览器例或 Go 内存输出当作生产全链路 OTel/TraceAnalyzer/SLS 已完成。
