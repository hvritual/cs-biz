# W04：Design / Build / Deploy Agent 工作流重构

## 目标与授权

来源：2026-10-16 Human 要求把 cs-biz SDLC 重构为 design、build、deploy 三个环节 Agent；各自工作流、单一职能 Skill、交接文件契约、样例与通用检测脚本全部随工作流 Skill 维护，Agent 串联产物且按需引用。
基线 main `0085c7426cd972babe38b3703a4dbb4ee25229a0`。延续本会话的技能/工作流实施、GitHub 提交及合并 main 授权；本次不发布应用、不更改产品设计或封存验收。

## 设计决策

- `sdlc-workflow` 为薄路由，三个工作流包分别为 `sdlc-design`、`sdlc-build`、`sdlc-deploy`。
- Agent = 模型 + 指令 + 工具/上下文 + 控制循环。Skill = 可复用单项能力。openai.yaml 为技能 UI 元数据，不充当 Agent 实现。
- 每包内含 Agent 定义、workflow.json、skills、contracts、templates、examples、scripts；Skill 只产出当前能力的结果，Agent 选择/验证/串联与交接。
- 通用只读检查器一份维护源，按相同字节随各阶段包分发，自动检查一致性及单包复制后的独立运行。原协议检查器移入所属包，旧 doc/ci 路径仅兼容转发。
- 标准 Codex 自定义角色注册为生成入口，权威定义保留在工作流 Skill 内；继承会话模型、权限、工具与提供商。当前环境无 Codex CLI，不声称完成原生发现/加载运行证明。
- 生产部署必须另外验证环境、明确发布授权、精确产物和回滚/观察能力；缺失时阻塞，不以角色注册扩权。

## 验收

| ID | 出口 | 验证 |
| --- | --- | --- |
| W04-AC1 | 三个明确 Agent 定义及不同职责/输入/输出/工具边界/循环/停止与退回规则 | TOML/manifest 结构与独立内容审查；openai.yaml 不冒充 Agent |
| W04-AC2 | 各包内聚所需 workflow、内部 Skill、交接契约/模板/样例/检测入口 | 路径/所有权/一致性检查，逐包复制到临时目录后运行 |
| W04-AC3 | 内部 Skill 单一职能，Agent 串联；仅加载当前步骤所需指令/文件引用 | 选择性上下文测试、依赖/引用清单、前向 Agent 试用 |
| W04-AC4 | request → design-to-build.json → build-to-deploy.json → deploy-receipt.json 有版本/任务/来源摘要及验收边界连续性 | 正例链、错阶段/旧摘要/漏 AC/范围扩大/坏引用/假跳过/部署失败等反例 |
| W04-AC5 | 通用只读脚本能检查包/步骤/交接并建议下一动作，部署未知结果有回读/恢复分支 | 流转与错误分支测试；静态结果恒不认证审批/运行或授予权限 |
| W04-AC6 | 原 136 项治理回归及封存文件保留，旧入口可用，无两份活动协议/判断器 | 全量回归、链接/迁移检查、封存路径 diff |
| W04-AC7 | 独立审查/修复、三阶段前向试用、真实 CI 与 main 回读 | PR 中精确版本、run/receipt 与合并证据 |

允许改动：`.agents/skills/**`、必要 `.codex/agents/**` 注册镜像、`doc/ci` 兼容接线及测试桥、`doc/workflow` 迁移指针、AGENTS/任务模板、当前任务/验证记录、统一 CI 一行接线。禁止业务 frontend/backend 代码、既有封存轮次、产品验收、生产环境、凭据与本地私有路径。
