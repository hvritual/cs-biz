# 后端运行资产与部署边界

本目录已有开发/CI 的 [Collector/Jaeger 环境](observability/README.md)，用于 F1 本地技术探针查询及故障验收。它不代表真实业务服务、数据库迁移或生产部署已经交付。Consumer 的实际运行与锁见 [Yunka Consumer](../doc/YUNKA-CONSUMER.md)。

[非生产 MySQL/OIDC](identity/README.md) 提供隔离 Docker 资源、私有随机凭据、真实资源探针和安全停止/CI清理；不是应用 BFF/IAM 或生产部署。其实际运行结果以当前 PR/CI 为准。

后续生产任务须明确固定产物、目标环境、启动/就绪条件、必需配置、兼容与迁移锁、备份恢复、优雅退出、观察/停止/回滚出口及实际授权。凭据和生产数据不入仓库。端内资产在本目录，跨端检查由 [CI](../../doc/ci/README.md) 调用；部署结果必须直接读回目标环境。
