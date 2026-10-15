# 文档 PR 自动交付

2026-10-15 Human 明确授权：文档类型 PR 自动完成，无需 Human 审核。
本规则优先于旧文档中针对所有候选的 WAITING_HUMAN_FULL、人工豁免及独立人工 PR 审核要求。

## 范围

以可信 main 的 `check_docs_only.py` 对完整 base/head diff 分类，不能按 PR 标题、标签或提交类型判断。
仅允许普通非可执行文件：根 README、LICENSE、CHANGELOG，以及 doc、frontend/doc、backend/doc
中的 md/txt/json/yaml/yml/mmd/svg/png/jpg/jpeg/webp。删除和改名也检查原路径；混合 PR 整体走普通门禁。
隐藏路径、AGENTS.md、doc/ci、doc/workflow、doc/templates、所有 Skill、CI、程序、部署、依赖锁、
符号链接、子模块、可执行文件均不适用。未知、空 diff、无法读取或候选未包含最新 main 时拒绝自动资格。

## 执行模型自动闭环

1. 回读开放非 Draft PR、目标 main、最新 base 和完整 head SHA；使用 main 中的分类器，不执行 PR 提供的判定代码。
2. 对精确候选运行结构/链接检查、适用的文档协议和内容核验；保留 Fast 与任何适用 Targeted 的真实证据。
   所有实际触发的必需 CI 必须成功；重复事件明确被策略跳过的 job 不算成功，也不替代实际成功的对应检查。
3. 自动审查事实、来源、链接、范围和原有验收；修复问题。此流程不要求 Human PR review 或 GitHub 人工豁免。
   它不代表 GitHub APPROVED review，不伪造任何 Human 身份。现有设计价值选择与同版方案确认仍需 Human，
   文档合并不自动批准 proposed ADR、不改变批准后的设计、不授予运行实现或部署权限。
4. 记录 PR、base/head、完整路径、分类命令、内容审查和检查结果，状态为 `DOCS_AUTO_QUALIFIED`。
   Full 为 `NOT_REQUIRED_DOCS`，不是 PASS 或 HUMAN_WAIVED。若有失败、未完成或证据不足则阻断。
5. 已授权的执行模型无需再次请求 Human，可创建/更新 PR、合并；合并前重新核验 head/base、资格、
   unresolved blocking review、必需检查与实际 GitHub 保护。base/head 改变则重新分类并重跑受影响检查。
   不绕过服务端 required review/status，不强推 main。回读 main 和合并后检查，满足 Issue 全部验收才关闭 Issue。

这是执行模型的自动交付路径，不是无人值守 GitHub 定时服务；没有 Agent 会话时不会自行启动。
GitHub 分支保护是否配置必须读取实际设置，本文不声称已建立服务端强制门禁。

## 非文档与本次规则迁移

代码、权限、业务状态、CI、Skill、门禁规则等保留现有 Human Full/专门治理审批流程。
本次修改本身属于独立治理变更，依据本轮 Human 明确“变更项目仓库门禁规则”的指令及已有推送/合并授权实施，
不是利用新分类器自我豁免；应单独 PR、通过规则正反例/现有治理检查并回读后生效。
规则生效后可重新评估既有文档 PR；不追认历史 Full PASS，也不复用旧 SHA 的批准。
