# F1 r001 实现设计

## 模块与合同

拟在 backend/contracts/proto/runtime/v1 定义无客户/租户数据的 runtime.inspect 只读技术探针，用 typed PB 声明操作；它不是未来业务 API 权限模板，不复用示例 catalog 业务。由固定 CLI 生成 backend/contracts/generated 和 backend/internal 内的端口、适配器、plan/assembly；TS Client 仅保存生成产物，不接入 frontend。
.yunka/project.json 与 source-policy.json 位于 backend，module 为 github.com/hvritual/cs-biz/backend、workspace off、linux/amd64；组件精确覆盖现有 Authz 与新增运行模块，不能把旧 producer biz 路径照搬。
只保留 Yunka 唯一执行路径；技术探针通过生成端口/适配器和装配计划连到固定 Provider，不在 HTTP handler 自造第二 Executor。实际 CLI 能力不符时记录最小失败并退回设计，不填空装配冒充完成。

## 可观测性与运行

backend/internal/platform/telemetry 包装固定 framework/observability.Provider 的环境装配和有界生命周期，不复制其 SDK。默认 OTEL_TRACES_EXPORTER=none、OTEL_METRICS_EXPORTER=none；OTLP 模式只发本地 Collector。service/version/instance/environment/operation 从部署配置或显式操作元数据取得。SLS 无默认出口或凭据。
命令放 backend/cmd；只读探针明确 local/dev，用净化后的 method/status/operation 和有效 trace_id/span_id 写 JSON stdout；不记录身份、body、query、cookies 或授权头。无有效上下文不生成假的关联 ID。
backend/deploy/observability 使用仅 loopback 暴露的 Collector/Jaeger，镜像按 digest 固定；采用已候选的 Collector0.153.0 / Jaeger2.20.0 前必须实际核验镜像 digest，不能只写 tag 当不可变锁。配置、超时、endpoint均由环境传入；没有生产配置或部署。

## CI 与时间控制

扩充 backend/ci/check.sh，保持原 Authz unit/race/vet，增加 build、固定工具下载校验、generate/check/二次漂移、source/dependency/assembly、Consumer安全检查与遥测正反例。开发过程只跑局部检查，稳定后才跑一次候选门禁。
现有 quality.yml 的 backend job 有 8 分钟上限且仅 Go setup；工具下载/容器检查必须先测耗时。优先由 backend 脚本纳入既有 job；若需调整 workflow timeout/缓存/额外 job，只能增加本任务必要验证与证据收集，不改选择器/裁判/断言。若超出现有授权或改变门禁语义，单独治理审批，不借 F1 偷降门禁。
本轮代码候选必选 full；docs 设计 PR 的成功不算 F1 Full。现有 frontend Fast/build/tester-army+legacy完整保留。新前端旅程若后续出现，使用 tester-army/e2e。

## 路径与回退

允许实施：backend/**；必要 doc/contracts/**、doc/tasks/issue-12-f1/**；仅确有必要的 quality.yml backend 工具/遥测验证接线及超时，不修改门禁判定。
禁止：F0封存目录/ADR、其他 Skill/治理规则、frontend业务源码、其他任务候选、生产数据/凭据。
实施前再核对 main；若 approved design/AC 改变，建立新轮，不暗改本轮。回退仅撤销 F1 提交与本地临时运行资源，无数据迁移。
