# W01 验证记录

核验日期 2026-10-15。基线 main `25f5b96748545066abe428e3e3749db06a6e00b5`；交付候选以关联 PR 的最终 SHA 为准。纯治理/恢复契约，未改业务代码。

## 实际结果

- 仓库结构与相对链接：PASS。
- SDLC / Build 结构检查、既有 Python 回归及新增 Goal/Intake 反例：PASS；最终数量以 PR CI 同版本日志为准。
- 两个修改过的 Skill 通过 skill-creator `quick_validate.py`。修正了原 workflow description 使用 `->` 导致的既有 metadata 校验错误。
- Human Full 静态政策与 Node delivery-policy 检查：PASS_STATIC_ONLY；不证明 GitHub 管理配置或 Human 审批。
- 本地 `bash doc/ci/check.sh --fast`：UNAVAILABLE，backend 入口找不到 `go`，尚未执行后续前端 Fast。不得称本地 Fast 全部通过；远端 CI 单独回读。
- 真实命令行 Goal/Resume 示例：输出 READY_FOR_AUTHORITY_CHECK、authorized_to_execute=false、business_complete=false。示例是合成的只读输入，不证明真实审批/业务运行。

## 独立评审

独立只读 reviewer 检查了实际变更与测试。发现公开 intake 对 `risks=[null]` 等旧协议非对象列表可能抛出 AttributeError。已在适配入口验证列表元素类型及事件容器，增加拒绝反例；不改旧协议检查器或放宽断言。修复后需同版本回归与 reviewer 回读。

## 外循环实际配置

GitHub connector 已真实成功读取开放 PR；实际 webhook schema 仅支持 PR 事件、不支持普通 Issue 事件。两个 Work 创建调用均确认 success、is_enabled=true：

- `cs-biz Goal 核对`：北京时间每天 09:00，从 2026-10-16 开始；只读，且无实质变化不通知。
- `cs-biz PR 进展核对`：PR 打开/Ready/提交更新/评论/评审/关闭及合并事件；只读。

创建成功不代表执行完成或通知已送达。首轮执行、事件投递和无变化抑制尚无运行证据，状态 UNPROVEN。不会发送消息到 GitHub/Slack/邮件，不修改代码或调度 Codex。

## 尚未完成

- 本 PR 未合入 main；Issue form/intake 只有在默认分支生效后才能做真实 Issue 事件验收。
- 自动 Issue→Codex Cloud 派发无可用受支持入口证据：BLOCKED。现阶段 Human 使用 Issue URL 发起 Codex。
- CAS、原子认领/预算计数、可信审批/CI adapter、真实业务 Goal 闭环未实现。
- Human Full 决策、独立 Human 审批、合并与部署未完成；保持 WAITING_HUMAN_FULL。
