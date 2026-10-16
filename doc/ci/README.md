# 检查与交付命令地图

正常交付的唯一政策是 [Risk-based Gates](RISK-BASED-GATES.md)，唯一自动入口是 `.github/workflows/quality.yml`：非 Draft PR 的精确 head 和合并后的 main 自动按 trusted-base diff 选择 docs/backend/full，独立 quality-gate 回读并出具回执。旧 workflow 只用于手动诊断。

## 按任务选择检查

| 当前需要 | 从仓库根执行 | 前提与实际范围 |
| --- | --- | --- |
| 目录/普通相对文件链接 | `python3 doc/ci/check_repository.py` | Python 3.10+；不验证远端/锚点、应用或审批 |
| Skill/文档所有权与当前导航 | `python3 .agents/skills/sdlc-workflow/scripts/check_docs.py` | Python 3.11+；静态引用/可达性/退休路径，不自动证明文档语义真实 |
| 工作流包/样例/分发副本 | `python3 .agents/skills/sdlc-workflow/scripts/check_packages.py` | Python 3.11+；三包分别复制运行，EXAMPLE_ONLY 不认证真实结果 |
| 当前目标的探索/决定/操作路由 | `python3 .agents/skills/intent-to-outcome-closure/scripts/check_goal.py --task TASK --live-baseline LIVE_SHA` | 替换真实目录和独立回读的基线；离线只读路由与摘要检查，不执行工具、不认证 Human 或业务结果 |
| 全部 Python 治理反例 | `python3 -m unittest discover -s doc/ci -p 'test_*.py' -v` | 先按 `doc/ci/requirements.txt` 安装固定解析器；包括兼容协议、文档与 Agent 工作流测试 |
| 前端迭代 Fast | `cd frontend && corepack pnpm check:fast` | Node/pnpm 按 package.json；类型/lint/copy/Desktop/policy/E2E类型/单测，不含 build/E2E |
| 前端 UI 受影响部分 | `cd frontend && corepack pnpm check:desktop:runtime` | 按 [前端 CI](../../frontend/ci/README.md) 安装实际 engine；构建+Desktop probe，不代替全部浏览器门禁 |
| 后端完整资格 | `bash backend/ci/check.sh` | [Consumer 工具/制品权限](../../backend/doc/YUNKA-CONSUMER.md) 与 Docker；实际生成/审计/build/unit/race/vet/security/Trace |
| 本地跨端 Fast 默认 | `bash doc/ci/check.sh` 或 `--fast` | **结构 + 完整后端检查 + 前端 Fast**；“Fast”只选择前端模式，不是轻量 docs 检查 |
| 本地完整诊断 | `bash doc/ci/check.sh --full` | 完整后端 + 前端 Fast/build/全部 E2E；稳定候选诊断，不替代远端精确回执 |
| 当前候选最终资格 | non-Draft PR / main push 的 quality run | 所有被选 job 必须通过，读取 repo/base/head/tier/run/attempt；代码/Skill/规则等选 Full |

编辑中先用受影响的局部检查；稳定后才冻结候选，执行实际所选门禁。缺依赖/权限/环境不等于通过。[恢复规则](NO-STALL-GATES.md) 说明失败分类与续跑边界。Windows 可用 `py -3` 做 Python 检查；不能用 PowerShell 直接假定 bash/Docker/Node 环境已存在。

## 解释结果

本地结构、Mock、真实本地 Consumer/Trace、跨端业务和生产是不同环境。根 check.sh 成功不证明真实 IAM/DB 或 SAAS-01 业务闭环。静态检查 exit 0 也可能返回 BLOCKED，必须读 state 和证明边界。

[文档资格](DOCS-AUTO-DELIVERY.md) 只用于可信分类器允许的普通文档资产；本次治理/Skill 整理属于 Full。可选 [手动 Full](HUMAN-FULL-CONTROL.md) 的身份/回执规则仅约束该手动端点，不是每个 PR 的等待条件。实际 GitHub branch/ruleset 保护须回读，不能由文字推断。

旧任务先读 [兼容协议表](../../.agents/skills/sdlc-workflow/references/legacy-protocols.md)，再用匹配的 doc/ci CLI；不能因旧文件路径或历史 Human 等待要求重新批准当前普通工程任务。

提交时使用 [PR 证据模板](../../.github/PULL_REQUEST_TEMPLATE.md)，按具体任务保留原始输出与外部回执。
