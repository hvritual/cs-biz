> 父任务：https://github.com/hvritual/cs-biz/issues/10。状态：**PLANNED / NOT IMPLEMENTED**。该 Issue 仅授权分阶段规划与审查，不代表功能已开发/集成或可生产部署。

## 依赖
主线 #10；PR #7/#8 当前分支（均未合并）

## 目标与交付物
固定 current main/候选/源码证据及差异矩阵；形成 Yunka ADR、框架与 cs-biz 单一执行权威表；锁定 MKT-01/CON-01/CON-02/TEN/REV/REC 验收；明确 Go 1.23→1.25.13、protoc 3.21.12、Yunka framework/gateway/infras/app 的版本选择及保留前端规则。

## 明确不做
不接生产凭据、不新建一套 IAM、不改现有登录演示语义、不拿旧框架 CI 给新 Consumer 盖章。

## 必须通过的验收
具有可审阅的升级 ADR；发现全部未知决策，Owner/Human 判定；两个 repo 的确切 SHA、PR 依赖、版本矩阵与反例基准可回读；文档链接结构检查通过。

## 修改范围与治理
建议修改路径：doc/architecture/adr/**, doc/contracts/**, doc/tasks/**, doc/roadmap.md（仅规划阶段）。以独立冻结切片 + 独立 PR 实施；所有真实代码按仓库 `AGENTS.md`、`doc/ci/NO-STALL-GATES.md`、`doc/workflow/SDLC-ADOPTION.md` 控制。

## 证据与 Done
提交确切 Consumer/Yunka SHA、所有生成校验命令、Go/浏览器/真实 DB 正反例、CI 跑次、独立审阅、main 回读。不得把 source/Mock/旧 PR 测试当生产资格。未批准的身份/DB/工具链决策必须标注 BLOCKED 而不是猜默认。

## O1 可观测性新增要求（[Issue #19](https://github.com/hvritual/cs-biz/issues/19)）

**F0 合同冻结出口：** 明确 W3C `traceparent/tracestate`、浏览器/BFF 跨域头与响应 `x-trace-id` 的行为；标准日志字段/等级、服务版本/环境归属、span 命名/parent 关系、异步 correlation/causation、采样/敏感信息脱敏；定义可查询的本地 Trace Backend、SLS 作为选配，不把 TraceID 当身份凭证。

在 ADR 中批准 Trace 搜索最小权限、保留/销毁原则和“无法采样时用日志关联”的诊断边界。**不**在 F0 自动安装采集或报运行通过。
