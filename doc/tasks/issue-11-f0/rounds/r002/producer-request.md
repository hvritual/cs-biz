# A 路线的上游发布修复请求（待发布负责人执行）

关联：cs-biz [#11](https://github.com/hvritual/cs-biz/issues/11)、[#12](https://github.com/hvritual/cs-biz/issues/12)；Yunka [#234](https://github.com/hvritual/yunka.io/issues/234)。这是可审阅的工作请求，未向上游写入 Issue/评论、未改其他仓库、未发 tag/release。A 的选择不替代上游发布授权。

## 输入与保护边界

评估源 `hvritual/yunka.io@3527488325030fbf86fe52804140c936e9d937a4`；现有六个 tag 见 qualification.md。复用 tools/toolchain.env、module-release.env、module-release-check.sh、已有 typed ModuleCatalog 与 #234。保留旧 tag 不变，不发明版本号；具体发行组合由发布负责人在兼容证据后确定。

不新增第二 Runtime/Authz/UoW/DSL，不强行复制上游进 cs-biz，不用宿主路径/local replace/go.work 掩盖缺依赖。`infras` 是可选扩展的架构事实不等于可从本次已选完整发布组合中静默删除它。

## 最小交付与验收

| 交付 | 负责人 | 必须提供的证据 |
| --- | --- | --- |
| 完整运行模块发布组合 | Yunka 发布维护者 | pkg/framework/gateway/infras 各 module path、version、不可变 commit/tag、go.mod/go.sum；说明与评估源码所需能力差异。先通过资格再做获准发布，不移动既有 tag |
| CLI 发行制品 | Yunka 发布维护者 | `yunka.io/app` 精确源码/构建版本；至少本次 linux/amd64 目标、下载位置、SHA256、Go/build flags、VCS/依赖构建信息、许可；不采用消费者内固定源码快照替代 |
| 独立消费资格 | #234 执行者 / 发布维护者 | 锁定 Go1.25.13、protoc3.21.12/plugins；全新外部目录 GOWORK=off，无 replace/宿主源码；四模块真实 download/verify/list/build；受支持组合和明确不支持组合 |
| CLI/SDK 一致性 | 发布维护者 | 发行二进制生成的 typed PB/OperationPlan/Assembly 与 SDK 兼容；generate 两次字节相同、check 只读、所需工件完整；失败保留最小反例，先修产生者缺陷 |
| cs-biz 消费回验 | cs-biz F1 执行模型 | 独立的本项目 exact SHA、合同和生成物摘要、实际 module sums、Authz 回归、build/test/vet/源码治理、零漂移；不继承 Biz/Yunka 的旧回执 |

运行模块检查可复用上游 `make module-release-check`；该脚本只解析模块，不能替代 build、生成与业务兼容验证。CLI 的可下载/校验/生成检查须作用于真正发行制品。尚未存在的命令或 CI 不写成已执行。

## 关闭阻塞的回执

一个回执绑定 producer commit + 四模块版本/commit/sum + CLI 平台/hash + 工具链/hash + 实际命令/exit code + 输出制品/hash + CI run/job + Consumer commit。任何组合变化重新核实；下载/权限/环境失败保持 unavailable/blocked。发行发布是独立外部动作，需要上游发布负责人授权；本请求不自动触发。
