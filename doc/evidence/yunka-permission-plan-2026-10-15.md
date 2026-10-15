# 2026-10-15｜Yunka 三权路线源证据与状态回读

> 文档状态：**仓库源事实核查 + 路线/Issue 建档**，不表示消费者迁移测试通过。

## 源头固定

| 来源 | 本次核对的真实状态 | 禁止推论 |
| --- | --- | --- |
| `cs-biz main` | `f088a90fd5a0305cc00a5679e368306dce62167f`；S01 Mock 与独立 Go V2 Authz 基础库，Go 1.23；PR #6 六 Skill 已合并 | S02 真 IAM/API/DB、Yunka Runtime 均未实现 |
| [PR #7](https://github.com/hvritual/cs-biz/pull/7) | `d257fa8c57e35f3d972b5f2d281dafe94f0f32a0`，open/unmerged；身份、企业选择第一切片 | 非真实 IdP；未出现于 main |
| [PR #8](https://github.com/hvritual/cs-biz/pull/8) | `6d391604d8f07204a310201b3e7941f8c55cf15c`，open/unmerged，依赖 #7；Full [38684708487](https://github.com/hvritual/cs-biz/actions/runs/38684708487) 20 passed、1 skipped | 非真实 DB/SQL/营销服务 |
| [PR #9](https://github.com/hvritual/cs-biz/pull/9) | Full CI 改 Human 手动触发的提案，open/unmerged | 不能将“Full 手动”写成 main 当前规则 |
| [Yunka main](https://github.com/hvritual/yunka.io/tree/3527488325030fbf86fe52804140c936e9d937a4) | `3527488325030fbf86fe52804140c936e9d937a4`；C8.5 Gateway OperationGuard、C9 Operation Executor、C9.7 UoW/幂等、C10 Assembly、C11 Dev；Go 1.25.13/protoc 3.21.12 | 源码存在/框架自测不等于 `cs-biz` Consumer 已接通 |

## 已记录的行动

- Roadmap [#10](https://github.com/hvritual/cs-biz/issues/10) 与 #11–#17：F0/F1/F2/F3/F4/F5/F6 为规划实施与各自验收责任。状态 `PLANNED`。
- 采用方向和拒绝双授权体系：[ADR-0002](../architecture/adr/0002-yunka-runtime-adoption.md)。
- 规范源边界：[Access V3](../contracts/three-rights-v3.md)；流程：[Yunka Developer Flow](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)。
- 本次文档 PR 仅建立路线/契约与索引、纠正陈旧文字；没有安装 Yunka、升级 Go/protoc、写真实数据、合并先前 PR 或部署任何服务。

## 冲突调解及保留原则

当前有效文档优先级：`main 的真实代码/可回读 CI`（已实现与测试事实）＞`已批准业务三权与当前目标 ADR`（未来架构）＞`历史阶段草案/早期候选`。旧 S00/S01 任务与 PR #4 交付证据不改写历史，只更正其 README/索引的过时状态、标记 Legacy 标准。所有暂未发生的迁移、SQL 语义、工具链 Consumer 资格都标记待实施。

## 后续真实实施入口

F0 #11 做完整消费者版本资格与安全协议冻结；F1 #12 引入实际编译；F2 #13 验证营销无后台真 Operation；F3 #14 真实 IAM；F4 #15 SQL Scope；F5 #16 单执行链路；F6 #17 发布资格。生产结论必须独立附 SHA/Go+Yunka 依赖锁/DB 迁移版本/执行日志/负例/main 与环境回读。
