# W05 验证记录

验收对象：[W05 任务](W05-agent-docs.md)。基线 main `29c525d7f90cf61075f00a20efc1465a29b2c6db`。本文件记录候选的本地与独立检查；最终精确候选、合并和 main Full 回执保存在对应 PR，不能用本文替代。

| 验收 | 当前证据 | 证明边界 |
| --- | --- | --- |
| AC1 导航与所有权 | [文档检查原始输出](W05-evidence/local-checks.json)：102/102 现行文档可达，5 个公共 Skill、22 个内部能力 | 静态可达性；语义由独立内容审查和来源对账补充 |
| AC2 实质保留/去重 | [13 项退休地址、原因、替代与历史版本](../../.agents/skills/sdlc-workflow/references/project-docs.json)；[字节保留检查](W05-evidence/preservation.json) | 删除 4 个纯转发/重复入口，UX 实质资料留在 Design 所属能力；分发所需副本不作为无意义重复删除 |
| AC3 当前事实 | [来源快照](../evidence/repository-state-2026-10-16.json)、[独立内容审查](W05-evidence/content-review.json) | 有日期的 main/Issue/PR/源码投影；恢复工作须重读 live 状态，快照不授予实施权限 |
| AC4 兼容与历史 | [196 项测试观察结果](W05-evidence/governance-tests.json)、[保留检查](W05-evidence/preservation.json)、单包复制检查 | 原 181 项保留，新增 15 项文档反例；182 个历史任务文件、5 个原始证据、1086 个应用/依赖文件和 6 个旧 validator 实现逐字节不变；历史结果在原版本复现 |
| AC5 故障可检测 | [文档反例实现](../../.agents/skills/sdlc-workflow/tests/test_docs.py)、[40 个本地检查](W05-evidence/local-checks.json) | 断链、孤岛/循环、空入口、退休入口复活/引用、无主能力、缺资源、风险分级缺失/削弱、命令漂移；不自动认证语义/审批/运行 |
| AC6 Agent 使用与交付 | [内容审查](W05-evidence/content-review.json)、[恢复导航轨迹](W05-evidence/resume-navigation.json)、[UI 导航轨迹](W05-evidence/ui-navigation.json)；对应 PR 的候选/main Full | 两次只读冷启动核查没有读取测试、W05 结论或彼此结果，没有启动产品设计/实现/部署；实际远端 Full、合并与 main 回读须另取真实结果 |

## 独立验证发现与处理

内容审查指出清理旧 Build 综合方法时，T0–T4 完整分类和高风险最低等级未完整迁入；现已将原文字节保留在 Build admission，增加“分级缺失”和“风险底线削弱”反例。审查还指出后端落地页残留先选择 Go HTTP/OpenAPI 的陈旧指引；现已按 F0/F1 固定 Consumer、canonical typed PB 与当前开发观测边界更新。复核无剩余阻塞。

两次冷启动能够找到工作流所有者、按需能力、现行验收和后续缺口；恢复检查明确 F0/F1 已交付而 F2/F3 仍需 Design 准入/资源对账。UI 检查明确多租户批量操作的权限、部分成功、未知结果读回与恢复要求，并保持 Mock、设计和实现证据边界。读取发生在未提交工作树且存在并发文档修改，因此这些轨迹是实际找路观察，不是整个候选的原子快照，也不是原生 Agent runtime 激活或业务闭环证明。最终静态检查与 Full 绑定冻结后的树。

本次不改变业务代码、依赖、生成物、部署配置、原产品断言或已封存批准；不启动剩余产品 Issue。当前历史需求/方法仍有效的内容保留，旧状态只在现行投影中更正，不改写原证据。

候选 `0ae37aa6d75f731c9a0a97b193026493fcc1ead7` 的首次 Full（run `38853226376`）中，治理与后端通过；前端既有 `check:desktop` 发现任务模板缺少字面 canonical 路径，报 `Missing global UI contract reference`，后续浏览器步骤未执行。已恢复模板中的 `doc/design/desktop-ui.md` 路径与相对链接，保留原检查和全部断言；该失败不得作为合格回执，修正后候选须重新 Full。
