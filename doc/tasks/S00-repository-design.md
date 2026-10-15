# S00：新仓库结构与 SaaS 设计基线

> **Historical S00 record（2026-10-15 校正）：** 该任务发生于仓库建立阶段，其中 PR #1 未合并/未来目录的文字只对应当时快照；现 PR #1 已合并 main。当前结构、Go V2、三权和 Yunka 条件引入路线以 [Roadmap](../roadmap.md)、[ADR-0002](../architecture/adr/0002-yunka-runtime-adoption.md) 为准。保留原任务背景与证据，不改写历史实测结果。


## 范围与来源

- 目标仓库：[hvritual/cs-biz](https://github.com/hvritual/cs-biz)。
- 核验日期：2026-10-12，Asia/Shanghai。
- 初始状态：GitHub metadata 的默认分支名为 main，`size=0`；branches 返回空数组，contents 返回 `This repository is empty.`；无已有提交 SHA，无开放 Issue。
- 初始化后基线：`9bb04654e258ffec1e043e031d91b35d166c0746`，仅包含初始 README；设计分支 `codex/saas-foundation-design` 从该提交建立。
- 用户明确要求：根 `frontend/backend/doc`；两端 `deploy/ci/doc`；全局跨端 CI、架构、旅程、模板；前端 Vue + 成熟组件库 + 换肤 + 国际化 + 动态菜单/权限。
- 独立交付单元：目录骨架 + GitHub 选型研究 + 架构草案 + 第一条旅程 + 模板 + 真实结构检查。

本仓库不是其他项目的工作副本。本任务没有依据把其他仓库源码、许可、Issue 状态或特殊路径规则自动转移过来。

## 允许和排除

| 字段 | 边界 |
| --- | --- |
| 允许改动 | 当前空仓库的 README、必要配置、三类根目录内的设计/职责文档、`doc/ci` 检查、GitHub 的工作流和 PR 模板 |
| 排除实现 | Vue 依赖导入、后端服务、真实 API、数据库、全部经营模块、生产部署、旧数据迁移 |
| 其他仓库 | 不读取后推断迁移已完成，不改动其他仓库 |
| 技术决定 | Vben/Element Plus、Go 与数据库建议为 proposed；本轮不假装已获最终选型确认 |
| 仓库交付 | 先完成并审阅内容；空仓库以最小 README 建立主线初始提交，设计内容放独立分支和草稿 PR |
| 合并/部署 | 本轮未安排合并设计 PR 或发布应用；后续按实际授权与门禁处理 |

空仓库无法直接从已有 SHA 建分支。因此建立初始 README 属于本次明确新仓库结构任务的必要初始化；必须先回读仍为空的证据，不能覆盖并发出现的主线内容。

## 验收

| 编号 | 可观察结果 | 验证方式 |
| --- | --- | --- |
| A01 | 根目录与两端必要目录被 Git 文件实际保留 | 结构脚本 + GitHub tree 回读 |
| A02 | 全局职责和 GitHub 工作流发现路径一致 | 文档/工作流审阅 |
| A03 | 候选的功能、组件库、版本、源码风险有主源 | 研究报告 + 固定来源记录 |
| A04 | 租户、权益、成员、权限、资源范围有独立语义 | Access Context 与 SAAS-01 交叉评审 |
| A05 | 任务模板和三阶段路线有验收及依赖 | 文档评审 |
| A06 | 结构检查真实执行且能识别缺失文件和失效链接 | `python3 doc/ci/check_repository.py` + 反例验证 |
| A07 | GitHub 分支的实际内容与审阅版本一致 | 固定 tree/commit、逐文件 blob hash 回读 |

通过本验收只完成结构与设计单元。后续运行能力仍为未实现，详见 [路线](../roadmap.md)。

## 证据

[来源快照](../evidence/sources-2026-10-12.json)、[验证记录](../evidence/S00-validation.md) 与实际 PR 的 head/tree/检查记录共同构成交付证据。最终提交号记录在 PR 与交付说明中，避免把预测 SHA 写为事实。
