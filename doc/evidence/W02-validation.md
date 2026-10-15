# W02 验证记录

- 日期：2026-10-15；基线 `main@25f5b96748545066abe428e3e3749db06a6e00b5`。
- 分支 `codex/intent-design-workflow`；精确候选和 CI 使用实际 GitHub PR 的 head，不在提交内预测自身 SHA。
- 范围：Intent/Design 契约、b2b-product-ux 项目适配、只读交接检查和反例；未修改业务 UI/后端或 Full 触发规则。
- 状态：本地治理检查与独立代码复核已完成；2026-10-15 17:48 Human 已追加远端推送与合并授权。正在交付当前候选；实际 PR/同 SHA CI、Human Full 决策和合并状态以 GitHub 回读为准。

| 项目 | 实际结果 |
| --- | --- |
| 仓库/Skill/引用结构 | check_repository.py：18 目录、28 必需文件、221 相对引用通过；check_build_workflow.py / check_sdlc_workflow.py --mode structure 通过；5 个改动 Skill 的 quick_validate.py 通过；git diff --check 通过 |
| intent-design-v2 合成正反例 | 新增 40 项通过；含原文/AC 丢失、未接受 ADR、历史事实、条件/偏好阻塞、独立 HTML、整个 frontend 漂移、场景变化、旧审阅、路径逃逸、tree 冒充 commit、缺引用、额外设计资产失配、工作流自动实施；合成 browser/Human 引用不是真实验收 |
| Python 回归 | `python3 -m unittest discover -s doc/ci -p test_*.py -v`：104 项通过（64 项既有 + 40 项新增）；旧测试未弱化。Human Full Python/Node 策略检查通过 |
| 项目 Fast | `bash doc/ci/check.sh --fast`：结构通过，随后因 go: command not found 退出 127；本地整体 Fast 为 unavailable，frontend Fast 未在本地运行。未用 Full 替代 |
| Skill 前向演练与独立复核 | 两个独立只读验证：成员多行邮箱选定场景正确识别既有原子整批 Mock/真实 API 缺口，没有虚构部分成功或提前实施；代码复核发现的路径分类、Git 对象类型、依赖/场景绑定、额外设计资产遗漏均修复并加反例，复核结论无剩余阻断问题。这不等于 GitHub Human Review |
| 业务 Preview / 浏览器 / API | 本治理任务无业务 UI 变更；未运行，不宣称业务闭环 |
| Human Full / Review / 合并 | WAITING_HUMAN_FULL / 未批准 / 未合并 |

## 证据边界

离线检查只验证引用、摘要和明确的状态矛盾，不认证 Human 身份、不核实运行日志真假、不证明九维语义与实际用户理解。引入的是固定来源的 b2b 方法/模板，不含其完整 YAML checker 或业务运行能力。原 v0.2/v0.4 兼容协议仍独立保留。本候选不合入 PR #23 / #25，也不证明 Issue 自动触发 Codex、CAS 或可信审批适配已完成。

## 独立复核与限制

- 前向演练根据当前成员页、Mock service、后端 README 和 ADR 得出：已有批量停用，缺口是文本快速选定；现有批量为最多 100 个唯一 ID 的原子整批更新，只有 updatedCount。UX 必须尊重真实契约，不能因模板需要就宣称逐项部分成功、幂等或回滚已存在。
- 代码复核后，交接路径必须规范化；Git 引用必须是 commit；整个 frontend 快照与运行候选一致；场景/隔离说明与运行证据绑定；所有设计资产都校验摘要；Intent JSON Pointer 与设计文件目标可解析。全部修复经新反例和第二次独立核对。
- 本次没有生成任意业务 Preview，也没有用户体验效果测量。真正业务任务的方案适用性、Human 选择、九维分析、生产隔离、浏览器、API 及实际结果仍需模型逐项执行与核实。
- 只有真实 GitHub 当前候选的自动检查通过后才能声称相应远端检查通过；缺 Human Full 决策仍 WAITING_HUMAN_FULL。

## 远端交付授权历史

自动审批审查拒绝 `git push -u origin codex/intent-design-workflow`，理由为当前请求未明确授权将可能私有的内容发布到该 GitHub 目的地，远端分支变更也需要明确授权。没有使用 API 或其他方式绕过。初次仅保留本地提交。2026-10-15 17:48（Asia/Shanghai）Human 明确“授权推送，并合并到最新的main分支”，该发布授权缺口已解除，可以继续正常推送与 PR 交付；此追加授权不自签 Human Full 决策。最初拒绝不是 CI 失败，也不表示内容已推送。
