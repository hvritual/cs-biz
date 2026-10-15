# F0 r001 验证与未完成项

基线 `cs-biz@da5494d03c362ab873465c1793e7aba7e4e3a7cc`；2026-10-15。当前为 **DESIGN_REVIEW / NEEDS_DECISION**，不是 F0 已完成。精确候选以实际 PR head 为准。

| 检查 | 实际结果 |
| --- | --- |
| 来源内容 / Git 身份 | 38 条来源的 UTF-8 内容重算 Git blob SHA1 与 API/Git 对象一致，并保存 SHA256/commit/路径/定位；其中 13 条 cs-biz 主线/候选，20 条固定 Yunka 源码，5 条 module tag 源文件 |
| 原文追溯 | 8 条 raw quote 均真实出现在冻结 Issue 原文；逐项绑定 R/AC、Intent 和设计 |
| 设计交接边界 | check_design_workflow.py 真实执行，退出 2，拒绝 blocking condition/preference unresolved；这是待 Human 决策时应有的拒绝，不记录为 DESIGN_HANDOFF 或检查通过 |
| 资产封存/源码复核 | 12 个设计资产 + raw/Intent/优化提示/ADR 摘要逐一一致；38 个来源内容/blob/SHA256/全部定位再次核实；没有 approved/reviewer 伪造 |
| 结构/链接 | check_repository.py：18 目录、28 必需文件、246 相对链接通过；git diff --check 通过 |
| SDLC / 既有 Python 回归 | SDLC structure PASS_STATIC_ONLY；104 项 Python 回归通过，未新增/弱化运行测试 |
| Go / protoc / Consumer 运行 | 实际工具预检 go=None / protoc=None；root Fast 无可用 Go 工具链，未执行 Consumer。未执行真实 API/DB/浏览器，不宣称运行通过 |
| 独立审阅 / Human 设计确认 | 未取得。当前仅作者核实和结构验证，不冒称独立批准 |
| 当前候选远端 CI / PR | 待创建及回读 |
| Human Full / 合并 / Issue 关闭 | 均未执行；旧 #26 的豁免不继承 |

## 发现的差额

- PR #7/#8/#18 未合并，#18 对 main/Full 的旧状态不再是当前事实；保留固定草案来源，不整批导入。
- Yunka 评估提交与各 module tag 是不同身份，go.work 内构建不能替代独立 Consumer 下载/编译。尚未选择/验证完整 app/infras/CLI 组合。
- docs/authz.md 中旧 @yunka 与 legacy DB 说明，不能覆盖新 typed PB 与 cs-biz 当前 Access 设计；source-policy/biz.json 的路径/import 需适配。
- 真 IdP/DB/Session/邀请与 group/留存等条件均有 Owner 和阻塞阶段；本轮不猜默认值、凭据或响应重放能力。

## 继续条件

Human 对本轮候选确认 D1、反馈方案；可补 D2/D3 既有组织约束。完整同版本确认后才能形成设计交接，#11 仍需独立审阅、适用门禁及 main 回读才能关闭。后续 F1/F3 实施不由这份文档自动授权。

## 作者差额复核

1. 核对所有改动仅在本任务/ADR/roadmap，没有前后端、CI、依赖或生成物 diff。
2. 原始要求、全部 8 个 R/AC、其他 11 个开放 Issue 均保留，未把 blocked 项从总目标移除。
3. ADR-0003、来源/版本和设计均标 proposed；未把 PR #18 ADR 或 module tag 升格为 Consumer 资格。
4. D1 当前阻塞与 D2/D3 后续资源阻塞分开；草稿封存摘要不等于人工审阅。完整交接校验的退出 2 作为真实等待保留。
5. 没有独立 reviewer/Human 记录，不能关闭 Issue 或进入 F1；不会将纯文档检查升级为运行完成。
