# 业务任务导航

只保留有实际业务消费者的任务来源、冻结设计和验收记录。当前状态统一见 [roadmap](../roadmap.md)；Issue/task 的原验收不因清理而删减。新独立业务单元使用 [任务模板](../templates/task.md)。

| 业务用途 | 阅读入口 | 继续时核对 |
| --- | --- | --- |
| Yunka F 系列 | [F 系列](f-series/task.md)、[F0 已审基线](F0-yunka-freeze.md)、[F1 Consumer](issue-12-f1/task.md) | F2–F6 已明确恢复 r002 设计，P1/P2/P4/P7 待审；Docker MySQL / 非生产 OIDC 仅资源资格通过；原始 R/AC、同版批准和生产边界继续保留 |
| Observability O1 | [Trace、日志与可选 SLS](observability/task.md) | #19 全部正反例；F1 技术 Trace 只构成局部前提；旧 P0/P1 PR 不等于当前业务全链路 |
| 当前 Console / Mock 与布局 | [S01](S01-frontend-mock.md)、[侧栏](UI-rail-zero-offset.md) | 当前 UI/Mock 合同仍引用这些来源；不证明真实 IAM/DB；现行全局规范见 [Desktop](../design/desktop-ui.md) |

业务 `rounds/`、`handoffs/`、批准内容和原始验证保持字节与摘要。已完成的工作流建设、一次性诊断日志和退休协议从 main 清退，通过 Git 历史恢复；当前方法只有 [工作流接入](../workflow/SDLC-ADOPTION.md) 和所属 Skill 维护。清理不关闭未完成的业务 Issue，后续实施按当前同版准入推进。
