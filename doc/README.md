# 全局文档

跨端知识与可执行检查放在本目录。前端/后端内部细节分别维护在 `frontend/doc`、`backend/doc`，用链接引用全局事实，避免重复维护。

| 目录或文件 | 内容 | 当前状态 |
| --- | --- | --- |
| [architecture](architecture/README.md) | 全局模块及运行边界 | 设计草案 |
| [repository-layout](architecture/repository-layout.md) | 目录责任与 CI 入口 | 用户要求已落实到骨架 |
| [ADR-0001](architecture/adr/0001-frontend.md) | 前端底座推荐与取舍 | proposed |
| [research](research/vue-admin-selection.md) | GitHub 候选、版本与源码风险 | 文档/静态源码核验；未运行候选 |
| [product](product/scope.md) | 产品范围与首个成果 | 规划 |
| [contracts](contracts/README.md) | 跨端接口和访问语义 | 提案；不是已发布 API |
| [journeys](journeys/README.md) | 用户旅程及真实验收 | SAAS-01 已设计，未实现 |
| [templates](templates/task.md) | 独立任务模板 | 可复用 |
| [tasks](tasks/S00-repository-design.md) | 本轮范围、变更边界与验收 | S00 |
| [ci](ci/README.md) | 本地跨端检查及未来运行门禁 | 当前仅仓库结构检查可执行 |
| [evidence](evidence/README.md) | 来源快照与交付验证 | 以具体记录为准 |
| [roadmap](roadmap.md) | MVP / Full Runtime / Production | 后续任务未启动 |

状态词约定：`proposed` 是待评审建议；`implemented` 需要代码；`verified` 需要对应版本的运行证据；`deployed` 需要部署环境与回读证据。文档存在不代表对应业务已经完成。
