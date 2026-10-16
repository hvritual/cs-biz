# 证据：版本与证明边界

只在当前任务需要核实某结论时读取相关原件，不把全部历史报告预加载给 Agent。路线/导航不签署批准；文件存在、静态 PASS 和另一 Agent 的总结不能替代独立检查。

| 问题 | 原件入口 | 能证明什么 |
| --- | --- | --- |
| 整理时实际 main / Issue / PR 是什么 | [2026-10-16 状态快照](repository-state-2026-10-16.json) | 该观察时刻、固定 baseline 的事实；执行前回读 live state |
| 初始选型及空仓库来源 | [2026-10-12 来源](sources-2026-10-12.json)、[S00](S00-validation.md) | 当时观察与设计过程，不声称当前 latest |
| S01 及其 UI 运行 | [S01](S01-validation.md) | 该版本 Mock / 浏览器范围，不证明真实 IAM/DB |
| Intent/Design 与模块机制 | [W02](W02-validation.md)、[W03](W03-validation.md) | 所记协议、反例和边界 |
| F0 完整已审设计 | [F0 任务](../tasks/F0-yunka-freeze.md) → 原 r005 / approval / 交付 | 同版本设计和 main 文档交付，不证明后续实现 |
| F1 实际 Consumer 与查询 | [F1 任务](../tasks/issue-12-f1/task.md) → 实施与 PR #31 | 技术探针/本地查询等有限实现，真实运行看对应 CI 原件 |
| Agent 工作流交付 | [W04 验证](../tasks/W04-validation.md) → 原始前向/命令记录 | 该版本的指令驱动 Agent 应用和静态检测；不是原生 CLI 启动或部署 |
| 本次整理 | [W05](../tasks/W05-agent-docs.md) | 本轮范围、标准及交付 PR 的精确版本验证 |

旧任务中的等待状态、旧命令与旧路径表示当时环境。重现时检出记录 commit，必要时 `git show COMMIT:path`；不能用今天的工具/源码重签旧确认。当前方法、环境或合同变动会使相关证据失效；只能重新观察或独立证明影响范围，不能把旧执行改称新执行。

任何完成结论至少绑定仓库、完整 SHA/tree、目标环境、真实方法/命令、原始结果和观察时间。审批另须实际身份/来源；CI 须读取真实 run/attempt/jobs/独立 receipt；部署须直接读回目标。过期/失败/未知/跳过分别记录。跨版本不自动继承 PASS。
