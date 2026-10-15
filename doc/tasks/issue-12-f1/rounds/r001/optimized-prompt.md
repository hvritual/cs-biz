# F1 优化指令

在 cs-biz 当前 main 上完成 Issue #12，不改 F0 已批准版本/权责。采用 r005 的四个外部模块锁和 CLI 制品，升级 backend 工具链；在真正 backend module 中建立 typed PB → OperationPlan/OpenAPI/TS Client/Adapter/AssemblyPlan、二次生成零漂移与源码/依赖/装配检查，保留 Authz V2 兼容。

复用固定 framework/observability.Provider，提供默认无敏感信息的 JSON stdout、环境配置、默认关闭 exporter/SLS、受控本地 Collector 与可查询 Trace Backend，以及故障与有界 Shutdown/Flush 证明。只作本地基础设施探针，不新增业务 API、IAM、DB 或第二 Runtime。先审本轮同版设计，再在既有执行权限内实施并完成真实质量门禁、main 回读；未验证项如实保留，不用上游夹具或 Mock 抵扣。
