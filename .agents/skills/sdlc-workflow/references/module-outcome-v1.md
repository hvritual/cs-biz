# 板块级成果契约与连续交付

本协议把一个已确认板块的全部必需 Issue 变成有边界的连续交付队列。单 Issue 的设计交接仍使用 intent-design-v2，实施仍由工作流外执行模型调用 task-progression / sdlc-build；板块协调由 intent-to-outcome-closure 承担。不新增任务数据库、常驻 Agent、自动触发服务或审批权。

## 先冻结，再推进

按流程设计的输入、出口、责任、异常和反馈五项检查整个板块。先从权威 Epic、设计、旅程、当前源码和全部分页 Issue/子 Issue 回读，核对显式要求以及必要但未写出的依赖。确定 **一个完成边界**；“全部 Issue 关闭”不能替代成果验收。

1. 固定完整成员清单：包含已关闭、阻塞和待建的必要任务。必要但尚无 Issue 的工作先补任务，在现有授权内创建后再冻结。排除项须逐条说明理由和真实决定引用；不能靠标签或只取 open 列表漏掉工作。
2. 建立 R → AC → 设计定位 / Screen / State → Issue → 验证方法 → 证据的双向映射。单元出口和板块集成出口分别明确。每项必需设计义务必须进入分母；语义覆盖由独立 reviewer 从原始设计反向核实。
3. 每个 AC 写清角色/条件、动作、可观察结果、真实观测方法/环境、明确通过/失败条件、反例、恢复和保留约束。适用的权限、租户隔离、失败、部分/未知结果、刷新恢复、幂等、撤权、兼容与 UI 状态不能省略；确实不适用须写原因。`功能正常`、`符合设计`、TBD 或仅 `CI 绿`不能作为验收。
4. 核对资源、外部依赖、账号/接口/设备、验证入口、文件边界、交付权限和已有预算。不可检查的商业规则、架构价值选择或验收含义交还 Human；可查的事实自行核实。
5. 独立审阅完整性、可测性、无歧义和依赖可行性。已有确认可复用；新增/改变设计和验收须取得 **同版本真实批准**。批准记录引用 Git 中契约及全部源文件的准确版本，不以本地 digest 代替身份认证。
6. 封存为现有 `doc/tasks/<module>/` 下 `module-contract.json`，执行静态检查，并保存实际批准的 locked commit。封存记录是设计交付索引；Issue 与任务记录仍为权威状态。禁止实施者通过改清单、重算摘要或扩大授权消除失败。

## contract 字段（module-outcome-v1）

JSON 的必需字段如下；可运行示例由 `doc/ci/test_module_workflow.py` 的合成 fixture 构造，不是项目的产品批准记录。

| 字段 | 内容与机械约束 |
| --- | --- |
| protocol / module_ref / revision / boundary / boundary_environment | `module-outcome-v1`、权威模块引用、r001 等；boundary 为 reviewed_design / integrated_main / deployed / physical / operational，boundary_environment 明确目标环境；整体出口至少有一项方法/环境精确匹配此边界的直接观测 |
| inventory_ref / inventory_numbers / exclusions | 完整分页/父子任务回读来源、全部 Issue 正整数清单、排除数组（可空），各项含 number/reason/decision_ref；清单恰等于纳入和排除之和 |
| sources | 非空数组：仓库相对 path、完整 commit SHA、sha256；必须是已提交文件且当前内容相同；收纳原始意图、设计、requirements/旅程、验证规程等唯一权威源，不能复制另一套业务定义 |
| requirements | 非空数组：稳定 id、source_ref、acceptance_ids；source_ref 是 sources 中 `path#定位`，所有 AC 均有来源 |
| criteria | 非空数组：id/source_ref/given/when/then/negative/recovery/invariants（非空字符串数组）；verification 含 kind/environment/procedure_ref/expected；kind 为 static/runtime/integration/deployment/physical/operational；角色写入 given，阈值写入 then/expected，无需虚构数值 |
| issues | 非空数组：number/task_ref/body_sha256/acceptance_ids/depends_on/prerequisites/allowed_paths/forbidden_paths；body_sha256 绑定实际 GitHub Issue body 的 UTF-8 原文（null body 按空字符串）；每个 AC 有交付 Issue，依赖有向无环、不得指向清单外 |
| resources | 显式数组（可空）：id/owner/recovery_action/source_ref；包括外部依赖，Issue prerequisites 引用其 id；不是通过声明 available 代替实际检查 |
| integration_acceptance_ids | 非空 AC 子集；除 reviewed_design 外要求 integration/deployment/physical/operational 方法。覆盖各 Issue 联动的最终旅程/结果；五种 boundary 分别要求 static/integration/deployment/physical/operational 直接方法及目标环境，不能用若干单元通过替代 |
| authority | record_ref、issue_numbers（实际已获准的子集）、actions（implement/repository_write/merge/deploy/physical/operate）；设计批准与实施/合并/部署授权分别回读。未获准的必需项保留为 OUTSIDE_AUTHORITY |
| unresolved_decisions / budget | 未决材料性决定必须为空后才能冻结；budget 含 policy_ref 和 max_attempts_without_progress（1 或 2，须服从现有更严格预算，不重置已有计数） |
| review | decision=approved / record_ref / content_sha256；摘要算法与 `check_design_workflow.content_digest` 相同，仅排除顶层 review；引用须外部验证，摘要不是签名 |

只读检查器不执行 JSON 中的命令、外部 URL 或任何写操作；拒绝越界/符号链接、重复 JSON 键、重复 ID、漏映射、循环依赖和缺失/漂移源。静态存在性不能证明定位语义、AC 完整性或批准真伪。

issues.acceptance_ids 是该 Issue 完整交付时必须成立的出口。需要后续任务共同实现的集成 AC 应归于最后的集成交付单元，避免前置任务等待尚未实现的后续结果；可独立观察的共享约束可以复用。语义/可行性审查须检查这种隐含的验收依赖，单纯 DAG 无环不能代替该审查。`unknown` 单独作为占位会拒绝，完整的未知结果/恢复验收必须保留。

## 连续推进与恢复

协调器每轮执行以下步骤，默认 **一次一个独立候选**；未请求并行时不启动多个实现 Agent。

1. 从实际 GitHub 回读当前 main、完整成员、Issue body/状态、PR head、检查/receipt、独立评审和资源。按原已批准 locked commit 核对契约；不能拿新的 HEAD 自封为批准版。冻结 sources 在当前 main 也必须保持同样内容，旧分支工作树不能掩盖主线设计漂移。恢复时先查上轮 PR/合并/副作用，避免重复创建和重复提交。
2. 用当前观察计算下一项，先恢复已有候选，否则选依赖已满足的必需 Issue。依赖成立意味着代码已进入当前 main，且对应验收有当前充分证据；closed 标签或 agent 自报不够。独立分支可绕过另一个资源阻塞，但不得减少验收分母。若已有 active 候选被阻塞，先执行 SUSPEND_ISSUE，将现有候选引用和恢复条件保存为 suspended，再重新选择，禁止直接开第二个 active。集成后的必需依赖/资源仍阻塞时，不得通过整体出口。
3. 对选中 Issue 做 `admit_slice`：验证原始设计与交接、授权、资源/验证能力、路径和风险；调用 sdlc-build 完成小循环、独立审查、真实风险门禁、获准合并和 main 回读。需要单 Issue 完整交付时使用已有 controlled-issue-delivery；其权限不因批处理而扩大。当前治理任务的明确规则修改授权不外推给后续产品任务。
4. 收集逐 AC 结果，更新既有 Issue/task 的证据投影，再重新回读并选择下一项。不得每完成一个 Issue 就等待 Human 再说“继续”；仅在真实价值/设计/规则例外、权限、不可逆风险、外部依赖或无进展边界交还决定。
5. 失败先分类为实现、测试、环境、契约冲突或未知。保留失败原件，修复后重跑受影响检查，稳定候选只运行策略要求的最终全套。两次同质失败无新信息或更严格预算耗尽则暂停该分支，记录 owner/证据/最小恢复动作；不能盲重试。超时结果未知先回读。
6. 设计/验收/成员变化：停受影响节点，回 Design/Intent，建立新 revision、变更原因、影响集合、审批及新 lock，重验失效证据；不能编辑封存轮次。main 普通推进：重新做影响分析和精确版本核验；仅重跑失效检查，未受影响证据通过独立差异核验关联到当前版本，禁止把旧报告冒写为新执行。

## observation 与下一动作

观察文件是一次运行的可丢弃输入快照，不是第二套状态数据库。`module-observation-v1` 含 contract_sha256、main_sha、observed_at（有时区且不超过 15 分钟）、inventory_ref/inventory_numbers、issues、resources 和 proofs。

- issues 覆盖所有纳入成员：number/body_sha256/state(open/closed)/delivery(pending/active/suspended/integrated)/attempts_without_progress/blocker（null 或 owner/next_action/evidence_ref）。最多一项 active。suspended 另须 candidate_ref 保留既有候选；阻塞解除后 RESUME_ISSUE，不能重建重复 PR。integrated 另须 merge_sha/pr_ref/quality_ref/independent_review_ref/main_readback_ref，且合并提交必须为当前 main 的祖先。closed 但无交付证据仍为阻塞，不能算完成。
- resources 覆盖契约所有资源：id/state(available/blocked/unknown)/evidence_ref。不可用时使用契约的 owner/recovery_action 恢复。
- proofs 含 acceptance_id/result(PROVEN/UNPROVEN/FAILED/BLOCKED)；PROVEN 另须 commit（当前 main）、kind/environment（精确匹配方法）、method_ref、independent_review_ref、artifact（仓库相对 path/sha256）。失败和未知保留原状。文件哈希只核对原件存在，实际断言、真实执行、版本、隔离和副作用须独立核实。

```bash
python3 doc/ci/check_module_workflow.py --all
python3 doc/ci/check_module_workflow.py --contract doc/tasks/MODULE/module-contract.json
python3 doc/ci/check_module_workflow.py --contract doc/tasks/MODULE/module-contract.json --observations /tmp/module-observation.json --locked-commit APPROVED_COMMIT_SHA --main-sha LIVE_MAIN_SHA
```

占位路径/参数须替换为实际已存在记录。调用者先用 GitHub 工具取得可信的 main 和源记录，确保对应 commit 在本地可读取；检查器不联网认证快照。`--all` 在统一质量入口扫描持久契约；零契约是零检查，不表示已有产品板块获准。

输出是 `PASS_STATIC_ONLY` 和 READY_STATIC / EVIDENCE_REQUIRED / BLOCKED / CLOSURE_CANDIDATE_STATIC，以及下一动作、阻塞和固定分母。**所有结果均含 authentic_approval=NOT_VERIFIED、runtime=NOT_VERIFIED、execution_granted=false**。即使输入填满 PROVEN，也不能从该输出宣布真实完成或绕过 GitHub 门禁。

## 整体完成出口

独立 reviewer 从原始设计反查：所有必需要求/界面/状态/约束均有同版本证据，所有成员及必要依赖实际交付，板块集成旅程通过，反例/恢复成立，没有相互矛盾的结果，所有审批和交付门禁真实有效。PR/Issue 关闭逐个回读；已部署、上板、经营指标分别要求对应环境的直接观察。

只有满足这些条件才报告“在约定边界 verified complete”。否则报告已交付/待证明/失败/阻塞/越权的逐项覆盖，保持父板块未完成。Issue 全闭、CI 全绿、Preview 和 Mock 都不能单独证明整个板块按设计完成。当前实现提供模型驱动的有界连续流程和确定性检查；不会在没有 Agent 会话时自行运行，也不是抗恶意篡改的服务端调度器。
