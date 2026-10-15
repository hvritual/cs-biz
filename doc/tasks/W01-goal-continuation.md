# W01：SDLC 持续目标与恢复契约 MVP

## 状态与来源

- 状态：in-progress；尚未合并/部署，自动 Issue→Codex 启动 BLOCKED。
- 来源：[Issue #22](https://github.com/hvritual/cs-biz/issues/22) 和用户“搭建上述流程并应用在 cs-biz”请求。
- 基线：`hvritual/cs-biz main`，`25f5b96748545066abe428e3e3749db06a6e00b5`，2026-10-15。
- 当前授权：实现本治理候选、分支/PR；只读日常目标核对与 PR 事件观察。未授权合并、部署或自动 Full。

## 目标与成果

Human 能提交现有协议的 IntentSpec 与 Goal；Codex 新会话能读取持久 Goal/恢复引用，保留原始 AC 并识别失效证据、等待与下一步。自动观察仅只读；没有支持的 Codex dispatch 能力时必须明确停在交接。

## 依赖与边界

| 字段 | 内容 |
| --- | --- |
| 输入 | main 的既有六 Skill、任务模板、原版 IntentSpec 兼容子集、Human Full 规则 |
| 输出 | Goal/Resume schema、只读计划器、Issue form/intake、反例、现有 Skill 与模板接入、外循环配置 |
| 允许改动 | `.agents/skills/sdlc-workflow/SKILL.md`、`task-progression/SKILL.md`、本任务相关 `doc/ci` / `doc/workflow` / `doc/tasks` / `doc/evidence`、任务模板、AGENTS、SDLC workflows 和 Issue form |
| 禁止改动 | 业务代码、Full CI 实现/测试期望、生产凭据/数据、其他仓库 |
| 排除范围 | 运行队列、CAS 写入/原子认领、无人值守 Issue→Codex 自动启动、生产业务验收 |
| 回退 | 回退本 PR；外部两个只读观察任务可单独暂停；无业务数据迁移 |

## 用户旅程与状态

Issue 输入 → 固定默认分支脚本校验 → 交接 Artifact → Human 发起 Codex → 现有 SDLC 授权核对 → 实施/等待 → Git 中恢复引用。输入不合法拒绝；新 Issue 地址未知先创建再编辑；无授权停下；未知外部效果先对账。模板/Actions 需合入默认分支才启用。

## 契约与验收

[使用与能力边界](../workflow/CONTINUATION.md) 为本增量说明；旧版 Intent/Design/Build 产物协议不混用。Goal/Resume 不代替权威 Issue 或审批。

| AC | 可观察结果及反例 | 实际入口 | 证据 |
| --- | --- | --- | --- |
| AC-01 | 读取独立 Git JSON 恢复全部 AC；丢失 AC 拒绝 | `test_goal_resume.py` | [验证记录](../evidence/W01-validation.md) |
| AC-02 | SHA/设计/授权/环境漂移、旧证据、重复事件、耗尽预算、等待和未知效果不越权 | `test_goal_resume.py` | 同上 |
| AC-03 | 原版 IntentSpec intake、不执行 Issue 文本、不授予 Build、不派发 Codex | `test_sdlc_issue_intake.py` | 同上；真实默认分支事件尚待合入后验证 |
| AC-04 | 定时/PR 只读任务创建成功；事件触发实际执行不能由创建回执推定 | Work 创建回执 | 同上；首轮执行待观察 |
| AC-05 | 结构/既有回归/Fast、独立评审及 PR 精确 SHA | `python3 -m unittest discover -s doc/ci -p 'test_*.py' -q`、`bash doc/ci/check.sh --fast`、真实 CI | 同上；缺失工具不得记通过 |

## Human Full CI 决策

WAITING_HUMAN_FULL。需要 Human 对最终 PR/SHA 手动 Full，或按既有政策给本治理变更的精确 SHA 例外并独立评审；目前均未取得。不会自动启动 Full 或将未运行写为 PASS。

## 交付与自检

实际结果、独立评审与剩余阻塞统一记录 [W01 validation](../evidence/W01-validation.md)。Goal/Resume 仅为声明检查，不能认证审批或证明业务完成。整套自动交付仍未完成；需要可用的官方 Codex 委派入口并真实回读后才能关闭这一缺口。
