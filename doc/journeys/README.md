# 用户旅程（最新索引）

每条旅程包括 Actor、Object、Understand、Action、Result、Recovery，以及直调 API、资源边界、并发和恢复的**正反**验收。

| 旅程 | 目标 | 实现层次 |
| --- | --- | --- |
| [SAAS-01：租户开通与成员业务使用](SAAS-01-tenant-onboarding.md) | 真实租户→模块→成员→角色→业务结果与撤权 | 旅程目标已定义；S01 仅 Mock/UI，真实后端闭环尚无 |
| [MKT-01：没有后台菜单的营销用户](MKT-01-function-without-console.md) | 有营销 Function+own，无 Console Menu，正常营销 API、拒绝 Console | 业务目标已明确；PR #8 的 Mock/Go 候选演示通过但未合并；真 API/DB 未实现 |

PR #7 包含身份/成员四态及 0/1/N 选择的候选旅程，当前尚未合并；实施需参考 [F3/#14](https://github.com/hvritual/cs-biz/issues/14)。后续任何功能旅程都须依照 [三权 Access V3](../contracts/three-rights-v3.md) 和 [Yunka Developer SOP](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md) 定义 Menu/Function/Data 的预期结果、失败恢复和确切目标接口。

每个用户操作或状态仍应保留独立 Screen ID；实现 Desktop 页面时遵循 [UI 规范](../design/desktop-ui.md)；Mock 测试不能证明真实认证、数据库隔离或服务端消费 Yunka。
