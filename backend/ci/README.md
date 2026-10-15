# Backend CI

入口为 bash backend/ci/check.sh，自动调度统一使用根 quality.yml；旧 backend.yml 仅手工诊断。固定Go1.26.9与实际Consumer锁，详见 [Consumer说明](../doc/YUNKA-CONSUMER.md)。

顺序：制品/安装根 → 固定protoc/plugins/scanner → 两次生成零漂移/check只读/篡改拒绝 → 依赖Origin/sums与source/assembly → build、全部unit/race/vet/security → 真正Consumer经Collector/Jaeger的Trace查询和故障。缺工具/权限/容器/样本均不是通过。
保留原Authz V2全部正反例；新增覆盖Trace/隐私、错误环境/远程监听拒绝、exporter开关、Collector不可达与有界退出。Fake Authority不证明真实IAM/DB。
下载上游固定Actions制品可能需要配置只读YUNKA_ARTIFACT_TOKEN Secret，不能换浮动源或关闭检查求绿。日志/报告保存在backend证据artifact；未合格不合并。
