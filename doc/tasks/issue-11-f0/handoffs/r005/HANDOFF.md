# r005 同版设计交接

当前状态：**DESIGN_HANDOFF / WAITING_HUMAN_FULL**，不是 F0 已交付或 F1 已启动。

Human 于 2026-10-15 21:14:54 +08:00 回复“确认”，回应 PR #27、提交
`caf3b8a4d52259838bb970525d5631b47a646ce2` 的完整 r005 方案确认请求。
[approval.json](approval.json) 保存原文、目标与权限边界；设计内容摘要为
`b3b802d7f40c623870df24d94bbafb3e28537345675495e46bc9c1a3c9d828ab`。

此目录是封存 [r005](../../rounds/r005/solution.md) 的自包含交接副本，供现有
相对路径校验器验证。所有被批准设计资产和索引的非 review 内容保持原字节/摘要；
仅 review 附加本次真实 Human 确认，manifest 记录交接封装，不产生新设计轮。
原 rounds/r001–r005 不改。副本中“未审”“pending”等叙述是被审时的历史检查点，
当前批准事实以 approval.json / 索引 review 为准，不是重新要求确认同一设计。

复现静态交接检查：

```sh
python3 doc/ci/check_design_workflow.py --task doc/tasks/issue-11-f0/handoffs/r005 --repo-root .
```

PASS_STATIC_ONLY 只证明引用与批准内容绑定，不认证 GitHub 身份、不证明业务运行或 Full。
设计资产不可由实施者暗改；目标/条件/权限语义变化必须另开设计反馈。

模型继续承担工作流外的核实和交付准备。本轮只允许 F0 文档/证据，仍不授权 F1、
生产部署、自动 Full 或新的规则例外。ADR-0003 在被审源中的 proposed 状态是历史；
本交接记录其设计获确认，未改写被绑定的 ADR 源字节或宣称 Runtime 已落实。

下一条件：冻结最终 PR SHA，取得其适用检查与独立审阅，以及真实 Human 在 GitHub
作出的 Full 决定。可由 Human 手动启动 Full；文档范围的豁免须明确 PR、最终 SHA、
范围、证据及理由并独立核验，不能从此次“确认”推定。取得条件前不合并、不关闭 #11。
