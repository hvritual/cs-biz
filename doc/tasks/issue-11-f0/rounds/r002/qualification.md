# F0 r002：A 路线发布资格核实

Human 对首轮 `8065dade6348743eec5212ece5b9f1e275a4a2fc` 的 D1 选择 **A**，原文与来源见 [decision.json](decision.json)。D1 已解决，不重复征询。r001 是封存的首轮方案；本目录是决策反馈和资格补充，不冒充新的完整设计批准或 DESIGN_HANDOFF。

## 核实结果

核实时刻：2026-10-15 18:42 +08。cs-biz main 仍为 `da5494d03c362ab873465c1793e7aba7e4e3a7cc`；Yunka main 仍为固定评估提交 `3527488325030fbf86fe52804140c936e9d937a4`。完整正文、blob/SHA256、接口观察在 [publication-evidence.json](publication-evidence.json)。

| 检查 | 已核事实 | 对 A 的影响 |
| --- | --- | --- |
| 所有远端 tag | `git ls-remote --tags` 成功，仅返回 framework/gateway/pkg 的 v0.1.0 与 c41rc7，共六项 | 现有 tag 身份可锁定；尚未证明 API/组合兼容 |
| infras 发布 | 精确 `infras/v0.1.0` ref GET 返回 404；当前 STATUS.md L327–357 明确尚未声明该发布 | 当前四运行模块 v0.1.0 发布组合不完整；不能放行 F1 |
| 发布策略 | module-release.env 明确四个 github module 路径与 v0.1.0；release-check.sh 对四模块运行 GOWORK=off 并在临时消费者 go get | 复用现有发布检查，不能只做 workspace build；脚本存在不等于当前运行通过 |
| GitHub Releases | releases 列表成功返回空数组 | 当前未在该渠道找到 CLI 发布制品；不据此宣称所有其他分发渠道均不存在 |
| CLI 历史资格 | C11.7-C workflow 以源码 checkout、工作区和 `go build -buildvcs=true ... ./cmd` 构建 CLI；C10.5 证明的 Consumer 是 hvritual/biz | 证明历史源码资格方式，不是本次发布制品锁，也不是 cs-biz 资格 |
| CLI 制品完整性 | app module 为 yunka.io/app；尚未取得发行版本、目标平台、下载位置、SHA256、构建来源和模块清单 | 不猜 go install github 路径、不伪造 binary hash；由发布方补齐 |
| Actions artifact 发现 | 连接器拒绝集合端点 INVALID_ARGUMENT | 属于查询能力限制，不能说 artifact 不存在，也不能将短期 CI artifact 默认视作发行制品 |
| 上游现有任务 | [Yunka #234](https://github.com/hvritual/yunka.io/issues/234) open，覆盖 GOWORK=off/typed capability 资格；明确发布须另行授权 | 关联已有任务，避免另建同职责资格系统；其资格范围不自动授权发布 |

**结论：A 已选，发布资格仍阻塞。** 目前可证明缺 infras/v0.1.0；CLI 发行锁证据不足。没有执行 go mod download/build、CLI 或 Consumer 生成，不把未运行写成失败或通过。正式版与候选版的完整兼容性仍未知；不因为 tag 与 main 不同就判不兼容。

## 条件与后续动作

1. 框架维护者先完成 [发布修复请求](producer-request.md)，提供完整发布组合与 CLI 制品锁，并给出实际独立消费资格回执。
2. cs-biz 执行模型核对回执、许可、来源及模块图，再完成 F0 版本冻结/完整设计审阅和交付门禁。发布组合变更必须新轮记录，不能改写 r001。
3. 满足 F0/F1 准入后，在独立 F1 任务中锁定实际 sum、工具链/合同输入，进行真实 generate/check 两次零漂移、build/test/vet 与源码治理。不能用上游旧 CI、其他 Consumer 或临时 replace 抵扣。

D2 DB、D3 IdP 及其余未来条件保持原 owner 和阶段；本次不改变。当前允许的 cs-biz 文档范围已完成补充；上游发布、其他仓库修改和业务 Runtime 不属于 #11 文档范围。无前端变化，Preview 不适用；技术方案仍见 [r001 solution](../r001/solution.md) / [design](../r001/design.md)。
