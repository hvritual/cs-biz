# 业务任务导航

只保留有实际业务消费者的任务来源、冻结设计和验收记录。当前状态统一见 [roadmap](../roadmap.md)；Issue/task 的原验收不因清理而删减。新独立业务单元使用 [任务模板](../templates/task.md)。

| 业务用途 | 阅读入口 | 继续时核对 |
| --- | --- | --- |
| Yunka F 系列 | [F 系列](f-series/task.md)、[r004完整任务与UI](f-series/rounds/r004/solution.md)、[F0 已审基线](F0-yunka-freeze.md)、[F1 Consumer](issue-12-f1/task.md) | r004设计与项目预览验证中；保留原32页/233声明状态及15旅程；P1/P2/P4/P7待同版审阅。r003及旧轮原件保留，真实F业务与生产仍未完成 |
| Observability O1 | [Trace、日志与可选 SLS](observability/task.md) | #19 全部正反例；F1 技术 Trace 只构成局部前提；旧 P0/P1 PR 不等于当前业务全链路 |
| 当前 Console / Mock 与布局 | [S01](S01-frontend-mock.md)、[侧栏](UI-rail-zero-offset.md) | 当前 UI/Mock 合同仍引用这些来源；不证明真实 IAM/DB；现行全局规范见 [Desktop](../design/desktop-ui.md) |

业务 `rounds/`、`handoffs/`、批准内容和原始验证保持字节与摘要。已完成的工作流建设、一次性诊断日志和退休协议从 main 清退，通过 Git 历史恢复；当前方法只有 [工作流接入](../workflow/SDLC-ADOPTION.md) 和所属 Skill 维护。清理不关闭未完成的业务 Issue，后续实施按当前同版准入推进。

F系列当前完整交互设计：[r003](f-series/rounds/r003/solution.md)，范围与异常义务见该轮页面清单；此前r002为历史片段审阅。

F系列r003交互审阅及验证入口：[review-summary](f-series/rounds/r003/review-summary.md)，状态 DESIGN_CONTENT_COMPLETE / REVIEW_DELIVERY_UNVERIFIED，未授予业务完成或Build资格。

当前[Design审阅交付修订](f-series/workflow-review-delivery.md)仅维护流程与纠正现行投影，未恢复业务实施。

当前F系列Design审阅规则变更见[f-series/review-role-journeys.md](f-series/review-role-journeys.md)，Human按完整旅程逐角色模拟。
