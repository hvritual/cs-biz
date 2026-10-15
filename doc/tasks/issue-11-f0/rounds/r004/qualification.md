# r004：安全工具链条件已批准

Human 原文“批准”明确回应 r003 的独立安全前置建议；[decision.json](decision.json) 保留目标、时间与范围。D1=A 不变，r001–r003 不改字节。原 Go1.25.13 条件由本次批准替换为 Go1.26.9 / x/net v0.60.0。真实依赖 go.mod 要求 go1.26.0，因此五模块和 workspace 的语言声明必须同步；不能声称仍兼容 go1.25.0。protoc 与 RPC plugins 保持原锁。

独立 [Yunka PR #245](https://github.com/hvritual/yunka.io/pull/245) 从原 main 建立，远端候选 bc7c0e1dd6b4e815951130c7acfbf60371445453，tree 4e3ae46845f96f520ef913bc956f6a5f458ff144。本地工具链、依赖策略、架构与 doctor 检查通过；五模块 make vuln 退出 0、无可达漏洞，仍如实保留仅模块依赖层的 advisory 提示。远端完整 CI/Production 和 main 回读尚待完成，不从本地结果推断真实 MySQL 成功。

上游安全前置合格后，模型继续刷新 PR #243 的外部 SDK 版本/sums 与实际 CLI 制品，重新做独立消费资格。旧 Go1.25.13 artifact 不继承安全资格。当前未改 cs-biz runtime，未进入 F1。原 R/AC、D2/D3、其余 Issue、完整方案审阅、独立审阅和当前精确 SHA Human Full 决策继续保留。本次批准不作为完整 Design handoff 或 Full 豁免。

Preview/UX：N/A，无前端或用户旅程改动。下一动作是完成已批准上游安全/分发资格，回读接受后的 main 与制品证据。
