# F0 r003：上游修复候选与安全前置阻塞

Human 已授权跨仓库开展先前准备的模块/CLI 资格修复，原文见 [raw-feedback.txt](raw-feedback.txt)。D1 仍为 A，不重选；r001/r002 保留原字节。本目录记录执行结果和新前置条件，不冒充完整设计批准。

## 已完成的安全范围内工作

[Yunka PR #243](https://github.com/hvritual/yunka.io/pull/243) 的候选为 `28ec46df6b649edb8e724e126ad8968a10bd79ad`，tree `dcd0ae8d537d08c1732b5409fe76d1fb1308269f`。

- 复现当前 CLI 在 GOWORK=off 下使用旧 pkg v0.1.0 时缺少 Contract/Diagnostic API 的真实编译失败；候选修正独立依赖图，没有修改 Runtime/Executor/Authz/UoW。
- 四模块从 Go 模块渠道实际下载，Origin 指向固定评估提交；pkg/framework/gateway 为 `v0.1.1-0.20261008054254-352748832503`，infras 为 `v0.0.0-20261008054254-352748832503`。实际 zip/go.mod sums 在 [producer-record.json](producer-record.json)。这是外部版本分发，不是仓库内源码快照回退。
- 修正先前过宽的可用性推断：缺少 infras/v0.1.0 只证明旧标签组合缺项，不能证明不存在可下载版本。实际独立模块/CLI 运行证据优于只列 tag。
- 候选 CLI 两次构建一致；打包后在独立消费者执行真实 generate 两次零漂移、只读 check/audit、build/test/vet、能力导出与 App 生命周期、重复/缺失导出反例、Outbox 单权威和生成漂移拒绝。
- 已读取当前候选远端制品，重新核验 ZIP、内部 tar、manifest、10 个文件摘要和 35 条命令回执。该结果只证明限定夹具功能，不替代 cs-biz 业务资格或 #234/#188 完整验收。

## 当前提交的门禁

| 门禁 | 结果 / run |
| --- | --- |
| 外部模块 + 打包 CLI 资格 | PASS / 38726530134 |
| 分支基线 | PASS / 38726530130 |
| 类型资格 | PASS / 38726530160 |
| 源码完整性 | PASS / 38726530131 |
| 模板资格 | PASS / 38726530165 |
| CI | FAIL at make vuln / 38726530372 |
| Production | FAIL at make vuln / 38726530297；实际 MySQL integration 未到达，不记 PASS |

先前候选的源码归属失败也已保留：独立夹具未登记导致 AG-SRC-001/002，候选仅补精确 fixture 归属，没有放松生产覆盖。额外实测发现 trimpath 会抹去既有审计所信任的 GOROOT；修复保留原安全约束，并在 artifact manifest 明确 Go 安装条件，而不是接受环境覆写。

## 真实使用条件与剩余阻塞

CLI candidate artifact：run 38726530134 / artifact 11968548246；tar SHA256 `8f2d9130e9826ae6a07fe0f4d5d6801b84bec120d2f598202e85c46fbe42f96e`。这是有到期日的 CI 候选，**没有正式发布或安全资格**。目标 linux/amd64；manifest 要求 Go 位于 `/opt/hostedtoolcache/go/1.25.13/x64`，其 bin 在 PATH 首位且 GOROOT 未设置；不承诺任意安装路径可用。根许可证文件清单为空，未编造授权条款。

当前漏洞数据库实际报告 Go1.25.13 的 9 项可达标准库漏洞，部分同时涉及 x/net v0.58.0。扫描显示修复基线 Go1.26.9 / x/net v0.60.0；官方 [Go 记录](https://go.dev/doc/devel/release#go1.26.9) 和 [GO-2026-6617](https://pkg.go.dev/vuln/GO-2026-6617) 支持版本定位。未改主线 pkg 子树与候选完全相同，对该子树的独立 JSON 扫描复现同样 call-level findings；不能将本轮分发修改误判为唯一引入原因。

**下一动作：Human 决定是否批准 [Yunka #244 安全前置](https://github.com/hvritual/yunka.io/issues/244) 的 Go1.26.9 / x/net0.60.0 升级范围。** 因 #11/r001 明确 Go1.25.13，不能为取得绿灯静默改验收。推荐批准独立安全修复，保留 go1.25.0 语言声明仅在实际兼容时，保持 protoc/plugins，重新做全部资格与 main 回读；不建议豁免扫描。

Yunka main 仍为 `3527488325030fbf86fe52804140c936e9d937a4`，cs-biz main 仍为 `da5494d03c362ab873465c1793e7aba7e4e3a7cc`。当前不合并上游、不发布候选、不关闭 #11、不进入 F1。D2/D3 及其余阶段条件不变；完整设计审阅、cs-biz 自身准入与 Full 决策继续分别保留。
