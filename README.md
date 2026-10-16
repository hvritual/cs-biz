# CS Biz

多租户 SaaS 项目：Vue 3 / Vben Admin / Element Plus Console，Go 权限基础库与固定 Yunka Consumer。当前业务 UI 使用本地 Mock；后端已有 loopback 只读技术探针、生成/装配和本地 Trace 查询，尚未完成真实 IAM、数据库业务或生产部署。

这是一份项目入口。阶段状态与下一任务只在 [路线](doc/roadmap.md) 汇总，任务原验收与证据各自保留。最近核验基线及 GitHub 来源见 [状态快照](doc/evidence/repository-state-2026-10-16.json)，继续执行前须回读 main/Issue/PR。

## 从目标开始阅读

| 目标 | 入口 |
| --- | --- |
| Agent 接受/恢复一个任务 | [AGENTS](AGENTS.md) → [文档地图](doc/README.md) → 具体 Issue/task |
| 确认项目已具备什么、下一阶段缺什么 | [当前路线与证据](doc/roadmap.md) |
| 理解系统边界与契约所有者 | [架构](doc/architecture/README.md)、[契约](doc/contracts/README.md) |
| 明确用户目标、交互和验收 | [产品](doc/product/scope.md)、[旅程](doc/journeys/README.md) |
| 实施或验证 | [前端](frontend/README.md)、[后端](backend/README.md)、[门禁](doc/ci/README.md) |
| 使用三阶段 Agent / 板块闭环 | [工作流接入](doc/workflow/SDLC-ADOPTION.md) |
| 找到既有设计和原始验证 | [任务导航](doc/tasks/README.md)、[证据导航](doc/evidence/README.md) |

## 启动和检查

前端使用 [package.json](frontend/package.json) 固定的 Node 范围与 pnpm 版本；从仓库根执行：

```sh
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm dev --host 127.0.0.1 --port 5777 --strictPort
```

开发地址 <http://127.0.0.1:5777>。构建/浏览器和各自 engine 的安装见 [前端 CI](frontend/ci/README.md)；`corepack pnpm check` 仅 Fast，不含构建与 E2E。后端的固定工具、私有制品读取权限与 Docker 前提见 [Consumer](backend/doc/YUNKA-CONSUMER.md)。

仓库结构/普通相对链接：`python3 doc/ci/check_repository.py`。该检查不证明应用、真实授权、数据库或生产结果。完整命令范围以 [CI 地图](doc/ci/README.md) 和脚本为准。
