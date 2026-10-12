# 全局文档

跨端知识与可执行检查放在本目录。前端/后端内部细节分别维护在 `frontend/doc`、`backend/doc`，用链接引用全局事实，避免重复维护。

当前实现阶段是 [S01 前端应用与有状态 Mock](tasks/S01-frontend-mock.md)。S00 设计基线的 PR #1 尚未合并；S01 在其分支上形成增量交付。前端代码已实现，最新运行结果、PR 和提交信息以 [S01 验证记录](evidence/S01-validation.md) 为准；S02 后端、完整跨端闭环及部署尚未开始。

| 目录或文件 | 内容 | 当前状态 |
| --- | --- | --- |
| [architecture](architecture/README.md) | 全局模块及运行边界 | 设计草案 |
| [repository-layout](architecture/repository-layout.md) | 目录责任与 CI 入口 | 目录已落实；前端包含唯一 Console workspace |
| [ADR-0001](architecture/adr/0001-frontend.md) | 前端底座选择与取舍 | S01 已采用 Vue、Vben 与 Element Plus |
| [research](research/vue-admin-selection.md) | GitHub 候选、版本与源码风险 | S00 研究记录；S01 运行证据单独记录 |
| [product](product/scope.md) | 产品范围与首个完整成果 | S01 本地前端已实现，真实 MVP 仍待后端与跨端交付 |
| [contracts](contracts/README.md) | 跨端接口和访问语义 | 提案；不是已发布 API |
| [journeys](journeys/README.md) | 用户旅程及真实验收 | SAAS-01 已设计；S01 实现部分前端操作，完整真实链路尚未完成 |
| [templates](templates/task.md) | 独立任务模板 | 可复用 |
| [S00](tasks/S00-repository-design.md) | 结构与设计基线 | 草稿 PR 待合并 |
| [S01](tasks/S01-frontend-mock.md) | 前端、Mock、变更边界与验收 | 当前独立交付单元 |
| [ci](ci/README.md) | 本地跨端检查和门禁入口 | 结构检查与前端检查分别执行；后端门禁待实现 |
| [evidence](evidence/README.md) | 来源快照与交付验证 | 以具体记录为准 |
| [roadmap](roadmap.md) | MVP / Full Runtime / Production | S01 已实施，S02 及后续阶段未启动 |

前端使用方法见 [frontend/README.md](../frontend/README.md)，本地数据与恢复边界见 [Mock 数据说明](../frontend/doc/mock-data.md)，类型、文案、单元测试与浏览器检查入口见 [前端 CI](../frontend/ci/README.md)。

状态词约定：`proposed` 是待评审建议；`implemented` 需要代码；`verified` 需要对应版本的运行证据；`deployed` 需要部署环境与回读证据。文档存在不代表对应业务已经完成。
