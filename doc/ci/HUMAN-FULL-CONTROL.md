# 可选手动 Full 诊断端点

正常 PR/main 资格遵循 [风险门禁](RISK-BASED-GATES.md) 的自动 quality.yml；没有逐 PR Human Full/豁免等待。本文件只解释保留的 `.github/workflows/frontend-full.yml` 手动工具。原 PR #9 的一次性迁移已是历史，不再作为新任务步骤。

## 使用与证据

Human 需要额外前端诊断时，从 Actions → Frontend Full Gate → Run workflow 选择 main，填写开放非 Draft PR 号和精确 40 字符 candidate_sha。实际流程先运行 main 的 `manual_full_dispatch.py preflight`，测试对应候选，再由独立干净 job 复核当前 head，产生 `frontend-manual-full-receipt-<run_id>-<run_attempt>`。

手动工作流仍限 workflow_dispatch/User/main，并保留 `full-ci-human-approval` environment。配置 Required Reviewers、main-only 分支及防止自审属于管理员操作；环境名字或文件存在不能证明已配置。Agent 不冒充 Human 派发/批准这个端点。

手动结果绑定实际 run/attempt/actor/head；新 head 不能复用旧 receipt。这个从 main 派发的检查不能被假定自动满足 PR head 的 required status，也不代替当前自动 quality receipt。缺失、失败、跳过或过期均不能记 PASS；规则例外必须有独立真实授权，不能替代失败的正常必需门禁。

## 本地与源检查

`frontend` 的 check 默认 Fast；本地 check:full 和根 --full 是完整诊断命令，按实际任务授权和资源使用，不认证 Human 身份或远端资格。根 --fast 仍包含完整后端检查，范围见 [命令地图](README.md)。

`check_human_full_policy.py` 和对应反例仅验证手动入口/默认命令的源安全；`check_quality_policy.py` 验证自动入口。它们都不能认证 GitHub Environment、ruleset、审批或生产运行。
