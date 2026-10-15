# cs-biz 持续目标与恢复入口

## 当前边界

本能力是 account-only SDLC 的可运行控制契约 MVP。GitHub Issue、原版 IntentSpec、既有任务/设计审批、PR 与真实 CI 保持权威；Goal/Resume 是它们的引用和恢复视图。

**尚未接通：Issue → Codex Cloud 自动启动、可信审批适配器、后台执行队列、CAS 检查点写入、跨 Run 原子锁与真实业务端到端验收。** 不把本地检查器、事件通知、Artifact 或 JSON 中的 PASS 当作这些能力。

## Human 使用路径

1. 合入本治理候选后，用 GitHub 的 **SDLC IntentSpec** Issue 模板。复制 [完整输入示例](examples/issue-input.json)，保留现有 `intent_spec` 的 v0.2 字段，填写 Goal 与原始 AC。示例是只读任务，不代表任何业务任务已获批准。
2. 创建 Issue 后，编辑 `goal.authority_ref` 为该 Issue URL。Issue 编号无法在创建表单时预知；首次地址不匹配的校验失败是预期拒绝，编辑保存会重检。不要把示例 Issue #1 当作实际授权。
3. `SDLC Issue Intake` 从默认分支读取可信脚本，检查开头为 `[Intent]` 的 Issue，上传 7 天有效的交接 Artifact。**不发评论、不运行模型、不启动 Full、不授予 Build 权限。** 永久来源仍为 Issue 正文及 Git 历史；不能只依赖会过期的 Artifact。
4. 在已连接 cs-biz 的 Codex 任务中提交：`使用 $sdlc-workflow，读取 <Issue URL> 的当前 IntentSpec 与 Goal，核对有效授权后推进；记录尚未完成的全部 AC，遵守 Human Full 门禁。` 当前没有受支持的自动委派接口证据，因此这一跳仍需 Human 发起。无法读取 Issue 时停下，不凭缓存执行。
5. 业务语义不明确回到 Intent；需要设计确认时进入现有 Design Loop；已批准切片才进入 Build。Fast 与适用 Targeted 自动，Full 由 Human 使用精确 PR/SHA 手动启动；合并/部署各有独立权限。
6. 交接时使用现有任务模板中的 Goal/Resume 部分。将已冻结的 Goal 与恢复快照保存到该任务的 Git 分支，并在 Issue/PR 记录引用（具体发布仍遵守当次权限）。新 Codex 会话从这些来源读取，不依赖旧聊天或仅存于容器的 `.sdlc/`。

## 契约与验证

- [Goal Schema](goal-contract.schema.json)：不可静默缩减的目标、AC、约束、路径、预算和唤醒事件。
- [Resume Schema](resume-contract.schema.json)：Goal 摘要、原始覆盖、SHA、设计/授权摘要、环境、累计尝试、等待及已处理事件。
- SHA-256 对 JSON 的 UTF-8、键排序、无空格、保留 Unicode 的规范化编码计算；`check_goal_resume.digest` 是对应入口。
- Python 检查器执行必需安全子集；Schema 是产物结构契约。两者均不认证 Human 身份、不判断文字语义、不检查路径实际修改集、不授权执行。
- `current.json` 只能由最新真实回读产生；示例的重复字母 SHA 和 environment 仅用于离线演示。自报摘要或证据 URL 不可信，真实执行者必须独立检查源文件/Issue、当前 PR、授权、实际 CI 和环境。

```bash
python3 doc/ci/check_goal_resume.py \
  --goal doc/workflow/examples/goal.json \
  --checkpoint doc/workflow/examples/checkpoint.json \
  --current doc/workflow/examples/current.json \
  --event-id demo-1 --event-type new_evidence
python3 -m unittest discover -s doc/ci -p 'test_goal_resume.py' -v
python3 -m unittest discover -s doc/ci -p 'test_sdlc_issue_intake.py' -v
```

`READY_FOR_AUTHORITY_CHECK` 是待核对执行权，不是执行授权。`NEEDS_TRUSTED_VERIFICATION` 是全 AC 有声明的证据引用，仍不代表目标完成。每种返回均 `authorized_to_execute=false`、`business_complete=false`。

| 输入变化或状态 | 行为 |
| --- | --- |
| 丢失/增加原始 AC，Goal 摘要变化 | 拒绝；核对正式变更审批 |
| SHA、设计、授权或环境变化 | STALE_BINDINGS；重新核对受影响证据 |
| 旧 SHA 的证据 | STALE_EVIDENCE |
| 重复已处理事件 | NOOP_DUPLICATE；没有执行副作用 |
| Human / Full 等待 | 保持等待；事件或自填 approved 无法解除 |
| 外部效果未知 | 先对账再重试 |
| 依赖恢复事件 | 先读依赖真实状态，不能仅凭事件解除 |
| 耗尽累计尝试 | 升级 Human；新 run_id 不重置预算 |

本 planner 是只读的，不写 processed_event_ids、累计预算或 CAS 状态。它只展示如何消费已持久化的快照；并不提供多 Worker 去重或 exactly-once 保证。合并冲突必须显式处理；不能用 Git 快照冒充原子运行时锁。

## 外循环

Work 可定时只读核对 cs-biz 目标，并在 PR 更新/评审/评论/合并事件发生后回读当前状态。输出仅含已证实、缺口、失效证据、阻塞和唯一下一动作；无实质变化则不通知。不调用 Full、不自动合并/部署、不以定时任务冒充 Codex 自动执行。

外部自动任务的实际 ID 与验证结果写入本次任务证据；尚未创建时不能仅凭本文宣称已启用。普通 Issue 事件由本仓库 Actions 处理，Work 当前支持的 GitHub webhook 仅为 PR 事件。

## 后续必要切片

Full Runtime 需要受支持的 Codex 委派接口/账号环境、可信 GitHub Evidence Adapter、受控 Revision Store CAS、原子事件认领/检查点与故障恢复。Production 再验证凭据隔离、预算、并发和真实目标闭环。现阶段不新增 Go Server 或第二套业务任务账本。

官方能力核验（2026-10-15）：[Codex GitHub 集成](https://learn.chatgpt.com/docs/third-party/github)描述 PR review 与相关集成；不能推导任意 Issue 自动启动、自动创建 PR 或任意 API 调度权。本次 Work 的 webhook schema 实际返回 PR 事件，不支持非 PR Issue 事件。
