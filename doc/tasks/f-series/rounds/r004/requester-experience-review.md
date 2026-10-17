# 需求发起人体验修订：独立内容与行为复核

- 审查者：`/root/design_coverage_review`，独立于实现者 `/root`。
- 日期：2026-10-17。
- 结论：**PASS_CONTENT**，仅限本次用户纠正的工作流语义、当前计划与独立操作流程内容，以及下述实际执行的合同反例。
- 交付状态：**未据此判定 REVIEW_AVAILABLE / DESIGN_APPROVED**；完整连续运行未证明，需求发起人尚未体验批准。
- 修改权限：本次只新增本报告；未修改计划、源码、旧报告或原始证据；未自行运行浏览器。

## 绑定与范围

原话来源为 `requester-experience-20261017.txt`：Human 是需求发起人；前端审阅是其用户旅程体验，界面和操作应与正式产品一致，不附加无关描述；Design loop 完善需求、规划旅程、设计前端并输出独立体验操作流程。

本次内容绑定如下：

| 对象 | SHA256 |
| --- | --- |
| review-plan.json canonical content | `1a58f6781b32f0e77931a55dad17d615c21096c108f843912adf270c91629927` |
| human-review.md 最终文件字节 | `efa1408b617ca68005141506755c84c5f22100c2f52ae57f8d4e4a373c0f617e` |

Canonical 算法：解析 JSON，仅移除根 `coverage_review`，用 `ensure_ascii=False, sort_keys=True, separators=(',', ':')` 序列化后对 UTF-8 字节计算 SHA256。并非整个文件字节摘要；独立报告回填不会形成循环。最终报告文件字节摘要在交付消息中记录，不在文件内自引用。

实际核对了 Skill 入口、Agent 职责、method、review-delivery、UX/Preview/Acceptance 能力、review_checks/create_review_examples/role_journey_checks、test_role_journeys，以及 ReviewWorkbench、IdentityPages、state、操作流程生成器和实际生成文件。复用此前 v3 与 role-journey-review 的原始需求反查，本次复查用户纠正及其改变的入口、恢复、文案、累计动作和体验交付边界；没有将静态声明当成全量实际浏览器证明。

当前原分母保持：R1–R9 与原 AC01–16；26 任务、38 正常路径、80 恢复路径；32 页、233 声明状态；J01–15 加 SAAS01 共 16 个旅程、109 条展开路线；X01–12 与 SAAS01 十四步映射仍在。未通过删减旧要求换取本次结论。原真实 IAM、API Tenant AND Scope、数据库、投递及环境操作证明义务继续保留。

## 内容结论

1. 工作流四项产出与反馈闭环已在入口、职责、方法及相关能力中一致表达。Human 明确是需求发起人；独立审查者、测试者和 Agent 不能代替其体验与确认。
2. `experience` 绑定 `requirement_originator / released_product / outside_product` 和有摘要的 `guide_ref`。产品体验与内部执行记录分开：Agent 准备账号、数据和故障并记录版本、覆盖与反馈收据，需求发起人按业务步骤操作、自然反馈，不承担技术 QA 或填技术坐标表。
3. ReviewWorkbench 在 journey 入口不渲染审阅横幅、场景/角色/页面选择工具、TaskGuide 和技术说明。相关业务导航、拒绝、确认、结果及恢复保留。独立操作流程在产品外提供账号、入口、角色动作、业务输入、交接和可见预期；生成器的内存输出与最终 human-review.md 完全一致。
4. 完整旅程累计动作与原任务效率继续分开。登录、导航、输入、跨角色交接和结果访问没有从完整旅程中删除；单个原任务及必要恢复仍按自己的实际动作核验，不把完整旅程统称四步。
5. Human 批准另需 `reviewer_role=requirement_originator`、真实 Human 声明和同版逐路线/角色收据。字段检查不会认证真实身份、浏览器或批准；相关文档明确 Agent 预演不能替代需求发起人体验。

## 已提出并复核关闭的问题

| 问题与反例 | 本版最小修复及复核结果 |
| --- | --- |
| review_questions 曾要求需求发起人提供版本、旅程、分支和步骤坐标 | 改为自然业务反馈；内部收据仍由 Agent 绑定，原覆盖要求未删。 |
| J01 failed/expired 原指南先完成成功登录、选企业，再要求仅登录页可用的恢复按钮 | 分支从正常未登录入口开始，显式输入邮箱、触发失败，再执行恢复；不再要求工程师中途跳页。 |
| 通用分支直接展示成功任务末步预期，再接失败恢复 | 生成器对声明了 trigger_result 的触发点展示该分支实际结果，同时保留原前缀动作。内容不再承诺先成功再失败；运行仍须观察真实触发点。 |
| IdP 按钮声称前往账号服务，实际只展开本地说明；返回时还曾直接发起身份并进入企业选择 | journey 模式直接提供业务恢复帮助，移除伪导航按钮；finishRecovery 经 logout 回正常登录，不执行 beginSignIn。重新使用组织账号是独立动作，不因查看帮助授予身份。真实供应端恢复仍未宣称实现。 |
| IdP 分支全新环境邮箱为空，省略输入将产生第五个必要恢复动作 | 分支实际写入帮助前输入邮箱的动作并保留邮箱；完整展开累计为 6 动作（入口、输入、四步恢复），未藏入 fixture。四步仅对应该已输入邮箱上下文下的恢复任务，不代表任意空登录上下文都只需四步。 |
| 指南仍有 context、跨端证明、ACT 等内部表述 | 业务投影保留实际操作编号与授权含义，移除技术证明说明及内部简称；当前指南扫描未发现已报出的审阅/模拟/工程/context/跨端证明措辞。 |
| 仅隐藏组件外框仍会在登录拒绝、存储异常、导出成功、原计划失效和新企业客户备注中暴露审阅说明 | 已只读核对 state.ts 对应反馈与资料改为业务用语；诊断模式的内部边界仍可独立保留。此项源码核对不能替代各错误分支运行。 |

以上关闭结论针对已指出的实质问题及最终绑定内容；不表示遍历了所有产品文本或所有动态状态。

## 实际执行与原始报告

本审查者使用独立临时目录运行 `.agents/skills/sdlc-workflow/tests/test_role_journeys.py`：**22 tests，OK**。另外实际构造四个临时反例并调用当前检查器：

| 反例 | 实际检查结果 |
| --- | --- |
| interface 改为 engineering_review | 拒绝：产品体验必须使用产品界面并把指南置于界面外。 |
| guidance_location 改为 inside_product | 拒绝：同上。 |
| observation.experience_ui.engineering_copy_visible=true | 拒绝：体验中存在无关工程说明。 |
| 完整合成批准中 actor_kind=agent | 拒绝：需要实际 Human 审阅声明。 |

这些反例检查验证合同的实际拒绝行为，不是浏览器观察，也不是合成批准获得真实授权。最终 r004 另外实际调用 journey_plan：结构检查通过；没有为了通过而伪填 coverage_review 或 Human 收据。当前 guide_ref 与实际字节一致，生成器输出一致。

只读检查了实现者提供的两份原始浏览器报告：

| 原始报告 | 实际结果与边界 | SHA256 |
| --- | --- | --- |
| evidence/requester-browser-initial.json | run `01a149f8-36a9-78b0-ad32-7270a1e02939`；选中 6 项，5 passed、1 failed。通过项含只读正常入口、业务流程三个尺寸、实际邀请交接；首次企业链被 Vite error overlay 拦截登录。失败记录保留。 | `3844b5297d6865d51c8c375850f0beec5f7a124f535b261b4cdd0f1ae0b24e70` |
| evidence/requester-browser-recovery-onboarding.json | run `01a149fe-70ec-757c-afc8-b20b3415ea3a`；选中 2 项，2 passed：恢复帮助返回后无授权、再正常登录；首次企业与首次负责人前半链补跑。 | `17bd8a0a7daf15c60f6fea622660bfbb3755be53eb1d86c16b9ea12b1732ba10` |

两次报告是不同时间的有范围观察；不能合并为当前全部 109 路线、全部 118 任务路径或完整 SAAS01 已通过。报告中的 dirty Git commit 也不能替代最终源码摘要和实际服务版本绑定。该两份报告由实现者执行，本审查者只读核对，未冒充独立浏览器代跑。

## 仍须保留的交付义务

- **全量连续体验运行**：109 条展开路线、各适用角色及全部原正常/恢复路径的同版连续证据未由本次报告证明。旧单页扫描、旧任务模式截图和局部任务结果不能代替。
- **UX05 图示**：原任务仍声明 task-guide 配图，journey 模式已隐藏该组件，当前外置操作流程为文字。尚未证明新入口或独立流程内相关替代图示的可达性、caption、alt 和实际观察；须补齐对应交付，不能沿用被隐藏 SVG 的旧观察宣称本体验已满足配图要求。原要求保持，当前未获得可审阅交付结论。
- **同版最终入口**：源码及计划更新后需完成最终 manifest、当前服务版本与受影响路径绑定；保留早期失败记录，只对实际观察范围升级结论。
- **需求发起人体验与确认**：未发生本版全范围实际体验与批准。Agent 的测试、独立内容反查或收据示例均不能替代。
- **外部集成**：账号恢复帮助不是外部身份供应端恢复；本地授权样例不是服务端 IAM/API/数据库隔离证明。真实发送、部署及备份也没有因业务文案变化而获得完成证明。

本报告可作为本轮用户纠正的独立内容反查结果，与既有原分母反查共同使用；不能独立升级为可审阅交付、Human 批准、Build/合并或部署授权。

## 已读源码字节绑定

| 文件 | SHA256 |
| --- | --- |
| `.agents/skills/sdlc-design/SKILL.md` | `5ebfc9be6cd90d8726f0b4b20ee60c7f708291d2568ce645edc47632ceb74400` |
| `.agents/skills/sdlc-design/agents/agent.md` | `9582471a60a0eeea5f2d9e66ece8ffefc6923fa52a3190da94be94ffae647331` |
| `.agents/skills/sdlc-design/references/method.md` | `d8d4cba73b902e46201a90dfd090c9d15d014c1cfff49b3a5a9ab14769088360` |
| `.agents/skills/sdlc-design/references/review-delivery.md` | `52268a9a772d3f0e4ba7f4b6db9506d07a8ae7c7aac6f4fbb3723923dbe2dfd0` |
| `.agents/skills/sdlc-design/skills/design-ux/SKILL.md` | `98de7419cae7674c7f638c9e4807279ab6b7d009b9b00b6067758418857dee06` |
| `.agents/skills/sdlc-design/skills/design-preview/SKILL.md` | `68a273ad44a828d18e15e85cf4f6dfc2db31db0affa3af26b11ebb43fb3ce999` |
| `.agents/skills/sdlc-design/skills/design-acceptance/SKILL.md` | `477eb790f3dc2ffd1e9b94a37ec9a951a0e1fe60ad4c040dfaf3480a69643a16` |
| `.agents/skills/sdlc-design/scripts/review_checks.py` | `83da18040eed19059681144dd5fd7081407c8ba79b9c0cb9a53f06f8785801fe` |
| `.agents/skills/sdlc-design/scripts/create_review_examples.py` | `07b4b9fb65fcfcf11aa089181d1200959016df4e3d059dfa4fc154a1c23cb7ba` |
| `.agents/skills/sdlc-design/scripts/role_journey_checks.py` | `549a9e5e6950a509cac5aa11b14b0956ae99efa7284f6e0c1887d8603c6b5cce` |
| `.agents/skills/sdlc-workflow/tests/test_role_journeys.py` | `6da2756f10547bad1e747f40063bca33d12a43a1ffc2535f0f7eb65f98417dac` |
| `frontend/apps/console/src/design/f-series/full/ReviewWorkbench.vue` | `18d713acefb4c2ba4fa0a094d3e42da22656fa51490fe70920eb6d36b1e3d6a5` |
| `frontend/apps/console/src/design/f-series/full/IdentityPages.vue` | `6f0ead90c21861ac0b38abf3fb21e2e5f261a0181752cdc092ec165e6a58d054` |
| `frontend/apps/console/src/design/f-series/full/state.ts` | `46fb6ac795461a9e7a6e49b246b00c26169f166688322934cf3ce913ab8a1f8a` |
| `frontend/apps/console/src/design/f-series/full/create_journey_guide.py` | `d5b476cf9886160f70be2c3e0fe4cb46a3b5aca30789650e1da0d461fa2fba4b` |
