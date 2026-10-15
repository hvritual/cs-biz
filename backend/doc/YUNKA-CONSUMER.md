# 固定 Consumer 与本地技术探针

F1只提供固定外部Consumer、生成链和loopback gRPC只读runtime.inspect。没有业务API、真实IAM/DB、第二Runtime或生产部署。原Authz V2断言全部保留。

## 工具与生成

.yunka/consumer-lock.json记录F0 r005 SDK/CLI来源、四模块版本/sums、制品摘要/到期与安装根；go.mod/go.sum记录实际依赖图。linux/amd64，Go1.26.9 / language1.26.0，安装根 /opt/hostedtoolcache/go/1.26.9/x64，PATH首位，GOROOT unset；protoc3.21.12、go插件1.36.11、grpc插件1.6.2、govulncheck1.7.0。
固定artifact11971414833于2026-11-14T12:26:20Z到期；到期/缺失/摘要不同即阻断，不静默重建或换浮动版本。GitHub下载需要对hvritual/yunka.io具有Actions read的YUNKA_ARTIFACT_TOKEN；CI优先同名Secret，否则尝试job token，权限不足会失败。Token不得入Issue/日志/源码。

```bash
# 仓库根；TOOLS是外部临时目录
python3 backend/ci/consumer.py install --tools "$TOOLS"
# 已有固定tar可离线安装，仍检查全部摘要、过期和工具根
python3 backend/ci/consumer.py install --tools "$TOOLS" --archive /path/to/yunka-linux-amd64.tar.gz
"$TOOLS/bin/yunka" generate --root backend --proto-path "$TOOLS/include" --full --format json
"$TOOLS/bin/yunka" check --root backend --proto-path "$TOOLS/include" --full --format json
python3 backend/ci/consumer.py check --tools "$TOOLS" --evidence /tmp/cs-biz-evidence
```

唯一可写操作合同为contracts/proto/runtime/v1/runtime.proto。输出protobuf、OperationPlan/OpenAPI/TS Client、Application Port、RPC适配器与AssemblyPlan；没有REST绑定，REST生成空包壳不代表HTTP路由。TS Client未接前端。只能通过生成器修复生成文件；check与审计只读。
source-policy绑定实际backend module、workspace off及linux/amd64；生产组件根覆盖全部本项目Go源码。外部模块图、Origin及sums独立核对，不复制上游SDK源码或使用replace。

## 运行与查询

```bash
cd backend
# 按deploy/observability/local.env.example导出环境，默认exporter=none
go run ./cmd/runtime-probe
# 另一终端：实际生成的gRPC客户端返回本次trace_id/span_id
go run ./cmd/runtime-probe inspect
# 需要Docker Compose；真正Consumer经Collector到Jaeger精确查询及故障验收
python3 ci/trace_query.py /tmp/cs-biz-trace-evidence
```

环境控制service/version/instance/environment、endpoint、采样和shutdown timeout（大于0、最多10秒，默认2秒）。本地资格查询使用OTEL_TRACES_SAMPLER=always_on，不继承宿主低采样率后把空查询判PASS。只允许loopback监听/出口，无SLS默认目的地，拒绝凭据和任意资源属性。
JSON stdout保留有效trace_id/span_id与固定操作/服务资源，不记录身份、body、URL/query、Cookie/授权头/Baggage。后台导出失败输出telemetry.export_failed，Flush/Shutdown共用有上限context，失败输出telemetry.flush_failed。Collector失效不阻断探针/stdout，不宣称查询成功。固定Provider的cloud.provider=alibaba_cloud是上游现状，不证明SLS或阿里云部署。

## 验证与边界

默认完整入口为bash backend/ci/check.sh：锁/工具、两次生成/只读/篡改拒绝、依赖/source/assembly、build/unit/race/vet/govulncheck、真实Trace查询与故障。证据输出RUNNER_TEMP/cs-biz-backend-evidence。缺权限/工具/容器/样本均不是通过。
当前Go在此云端git worktree中将.git文件忽略并尝试/workspace VCS，本地诊断可用-buildvcs=false编译；正式CI正常checkout保留真实VCS构建，不降低要求。真实DB/IdP仍BLOCKED_F3，前端Mock回归不能证明业务端到端。
