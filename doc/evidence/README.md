# 证据：版本与证明边界

只按当前业务问题读取原件。导航、静态 PASS、文件存在或 Agent 总结不能替代实际审批、运行和外部回读。

| 业务问题 | 原件入口 | 证明边界 |
| --- | --- | --- |
| main / Issue / 候选状态 | [2026-10-16 快照](repository-state-2026-10-16.json) | 固定观察时刻，执行前刷新 live state |
| 当前前端选型来源 | [来源与版本](sources-2026-10-12.json) | 当时观察及来源/许可，不声称当前 latest |
| Console / Mock / 布局 | [S01](S01-validation.md) | 该版本浏览器范围，不证明真实 IAM/DB |
| F0 已审设计 | [F0](../tasks/F0-yunka-freeze.md) → r005 / approval / 交付 | 同版设计及文档集成，不证明后续业务实现 |
| F1 Consumer / 技术 Trace | [F1](../tasks/issue-12-f1/task.md) → PR #31 / CI | 固定工具链、生成装配与本地查询，非业务全链路 |
| Docker MySQL / 非生产 OIDC | [S0 资源](../tasks/f-series/S0-resources.md) → PR #38 / CI | 真实资源启动和只读发现资格，非业务 IAM/DB 或生产发布 |
| Observability 全部缺口 | [O1](../tasks/observability/task.md) → #19 / 原 AC | 当前局部前提与完整未完成分母 |

业务冻结 rounds/handoffs、批准内容与原始证据保持不变。已完成治理建设和一次性日志从 main 清退，在其记录的 Git commit 恢复；可用 `git show COMMIT:path` 查询，禁止用当前工具重签旧确认。

完成结论绑定仓库、完整 SHA/tree、目标环境、实际方法、原始结果与观察时间。CI 读取 run/attempt/jobs/独立 receipt；部署直接读回目标。失败、过期、未知、跳过分别记录，跨版本不自动继承 PASS。
