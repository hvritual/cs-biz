# r004 完整角色旅程独立复核

- Reviewer：`/root/design_coverage_review`；Implementer：`/root`。
- 初查时间：2026-10-17T10:59:29Z；T08修复复查：2026-10-17T11:00:29Z。
- 最后补充复核：UX06原话溯源、全任务UX06绑定、SAAS01具体只读输入及同源Human/UI脚本。
- 入口窄修订复查：2026-10-17T11:25:36Z，平台零企业登录与首次Owner单企业重登引用；仅写本报告。
- 范围：只读复核此前提出的合同与旅程含义问题，并执行内存结构反例；仅写本报告，未改计划、源码或历史证据，未新增浏览器执行。
- **最终内容绑定**：`review-plan.json` canonical content SHA256 = `08b90f210b510f2b2ee4546a0213b648a1a941ccfefde168479f834e8d8c8d76`。入口修订前的内容hash为`b6ec4a81abdd58a66726c8ab3a0ecadb1114662a5a2e8b8a98d1e6ca8068e23d`，仅作历史导航。
- 算法：仅删除计划根对象的`coverage_review`字段；对其余完整对象执行`json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')`，再计算SHA256。递归排序全部对象键；无BOM、无额外换行。不排除任何需求、角色、任务、路径、动作、输入、来源或交付边界字段。
- 仅回填`coverage_review`的reviewer/decision/record_ref不会改变上述内容绑定，也无需让本报告包含回填后的整文件hash；内容字段发生变化则必须重新复核和绑定。
- 入口窄修订复查时整文件SHA256仅供历史导航：`a6e7f5971e1f1a279622472db6bc9b85d2f74e193da8df16a9a615e7b5a78486`；此前补充版为`131daf386ae959099630976c9d4dbfb6335fcc8bc2c73e63ef778af636d6433d`，T08修复版为`cb7034e9f15a1e6230d9bb5ea32361678fc7846859c61409ecf86bdf7503a8ea`，初查版为`e5f42df782a30cbd335bfa39d5fd0a666945540586f2666ec45c3568fac46ebe`。这些整文件hash不是最终内容通过凭据。
- 当前`request.json` SHA256：`63538dab15f95c4065f18f6b9ab6f3bd881126df00ac1bf4e36e390190556b7e`。

## 分层结论

| 层次 | 结论 | 含义 |
| --- | --- | --- |
| 通用合同结构及本次限定反例 | PASS_STATIC_ONLY | 前述分母、身份交接、原对象绑定、Human逐角色同版声明、退出失效等结构问题已修复；不认证真实身份、浏览器记录或Human批准。 |
| r004新轮UX独立原要求覆盖反查 | PASS_CONTENT_COVERAGE | 复用不可变的v3原要求语义反查，重新核对原32页/233状态、任务/路径分母及保留义务，并完成本次全部角色旅程变化与UX06补充反查。前述实质问题已关闭；足以作为UX新轮的独立原要求覆盖反查。仅绑定上述canonical content hash，不是UI可审阅、实现验收或Human批准。 |
| 当前角色入口及109条连续route运行 | NOT_FULLY_VERIFIED；独立浏览器NOT_RUN | 本报告未新增浏览器执行；已读取执行者SAAS前半段单项通过原始报告，仅支持该局部链。不等于109条全量预演、精确最终候选或最终入口可审阅。旧单任务证据不自动迁移。 |
| Human完整角色旅程审阅 | NOT_REVIEWED | Agent预演、静态收据与本报告均不能替代Human亲自审阅；不授予可审阅或设计批准状态。 |

## 已关闭的既有问题

1. **原分母及角色配对**：当前仍为26任务、38正常路径、80恢复路径；保留J01–J15，增加SAAS01串联。计划的journey IDs、role IDs、task/path tuples与role×journey pairs均与独立`request.contract.review_scope`一致。`stage_checks.py`在UX检查时从intake传入该分母；后续交付继续绑定UX计划hash。此一致性不替代对原要求含义的独立反查。
2. **J04 Owner保护**：入口及相关分支已改为真实Owner上下文，避免把此前用Owner观察的“指定另一负责人”恢复迁移给无转交权的委派管理员。
3. **J06同对象链**：T10产生`configured-role`；T11明确使用刚创建的实际角色并产生`managed-member`；T26消费同角色及成员，输入说明要求沿用同一成员和实际资源编号。相较原来三个独立默认操作，必要关联已写入计划。
4. **J12支持与业务权限**：支持仅接收安全编号和排障信息；之后显式交回business，经正常登录再由business执行T24。未要求支持读取其他主体的私有业务ACT。
5. **SAAS01主要顺序与后半程**：首次Owner为独立`onboarding-owner`；先接受刚创建的邀请并观察无权益，再交平台开通；随后同企业成员邀请、接受、角色与资源指派、只读使用、切企业、停用、恢复和原接受记录查询均进入同一主线。`new-a`预先仅属另一基准企业、创建后提供独立`C-SAAS-1`的隔离数据工厂均明确作为执行者准备，不冒称真实持久化/API隔离证明。`source_step_ids`包含S01-01–14，所列主线含义已涵盖此前遗漏阶段。原SAAS真实API/数据库与其他矩阵义务仍由原范围约束，未在此升级为已证明。
6. **提交前拒绝**：T04、T05、T10、T11、T15、T26等改从正常入口后的操作位置执行明确被拒尝试；无ACT阶段不再消费假造ACT，合法恢复才产生新ACT。未知、已受理失败或部分结果仍引用触发的实际原记录。T08最后两项也已按下述记录关闭。
7. **完整累计动作与单任务效率**：完整正常路线和前缀加分支均累计登录、导航、交接及task_path展开动作；原任务和恢复仍独立保留≤4动作约束。累计动作字段不是实测动作数；恢复没有因此变成完整旅程≤4的声明。
8. **退出失效**：T03当前设备和全部设备路径为`session_after=signed_out`。内存负例在退出后追加未重登的business:T15，已被拒绝为“role must authenticate before this task path”。
9. **身份、对象及Human同版声明**：交接清除验证状态；原恢复对象换成预置替身被拒绝；Human逐(route,role)收据的候选、计划、URL、版本和实际step受约束。内存负例中的错误候选、Agent actor、遗漏角色、遗漏step均被拒绝。生成示例按UTF-8读取成功；合成Human收据仅用于结构反例，未用于本轮实际批准。

## UX06补充与原要求覆盖结论

本报告与不可变的[coverage-review-v3.md](coverage-review-v3.md)共同构成本轮独立内容反查依据。不是把旧v3的整文件hash换成新hash：v3提供原R1–R9/AC01–16及其业务含义、SAAS-01 A–I、X01–12、真实环境义务的既有反查；本报告逐项审查新增完整角色旅程及其恢复、对象、身份、输入、累计动作与Human边界，并重新做以下保留项对比。

- 当前32个page/Screen ID、各页AC与233个状态逐项等于r003不可变`screen-inventory.json`；与角色改版前保存的`evidence/review-plan-before-role-journeys.json`相比，原页面/状态映射、X01–12、non_ui_proof、J01–15任务映射、S01-01–14任务映射及26/38/80 path tuples均保持。
- 原需求集合全部保留，仅增加UX06；当前15项需求与独立intake一致，26个任务均显式绑定UX06。原R/AC及非UI真实证明未被新角色脚本或Mock抵扣。
- UX06逐字来源为`review-change-20261017.txt`：Human要求“Human 在进行前端审阅的用户旅程需要和真实体验一致，审核途径是按照梳理出来的用户旅程完整进行用户角色模拟。”来源SHA256为`2c008e77e74d275999cbbad742c18a91a7992f5e529a7f67cf4438737c2416db`，计划`change_ref`、`intent.json`及`sources.json`均与实际文件一致。该次“确认”授权工作流与r004同步调整，不是对UI成品的Human批准。
- UX06在需求、方案、设计、任务及完整角色脚本中表达为正常产品入口、存储授权、真实同对象交接、必要条件恢复、全程累计动作与原单任务≤4、执行者准备与Human亲自审阅分开；符合原话，不以局部任务代跑代替Human完整旅程。
- SAAS01明确首次负责人为`first-owner@example.test`，后续受邀人为同一`new-a@example.test`成员；T11只保留本轮创建的角色，不保留默认reader扩大读取；T26明确同一成员及`C-SAAS-1`。只读配置文件位于`frontend/apps/console/src/design/f-series/full/assets/saas-readonly-role.tsv`，恰为13列表头加13列配置：允许后台入口，仅客户读取为explicit且仅含`C-SAAS-1`，修改/导出/营销/成员管理均不允许，其他对象列为空。此配置与本轮只读使用的预期一致。
- `human-review.md`已按当前源重生，包含新增首次Owner账号、T01实际邮箱输入及SAAS输入约束；UI `journey-guide.generated.ts`与计划的主线/分支动作ID顺序、分支触发节点及累计动作逐项一致。本次不再沿用初查时“Human脚本尚未重生”的待办。

**结论：足以作为UX新轮独立原要求覆盖反查，通过范围是计划内容与原要求覆盖。当前不存在该内容范围内尚未核查而阻断本结论的具体项目。** 浏览器真实连续执行、全部必要条件分支、实际动作与最终入口、截图和Human理解/审阅均仍是后续证明义务，不因本次通过被标为已完成。通用源码冻结，本次没有提出无实质缺陷的源码修改，也没有以尚在运行的测试替代结果。

## 平台与首次Owner入口窄修订

J03及SAAS01中的平台登录现引用T01 `zero-organizations`。平台身份验证成功、没有企业成员关系，与显式平台管理授权是两件独立事实；当前零企业路径明确保留账号管理及已授予的平台管理，同时不自动加入企业。此引用更准确，不改变原三权或平台/企业边界。

SAAS01中`onboarding-owner`重登引用T01 `one-organization`，与该账号接受本轮首次Owner邀请后仅有一个有效企业、正常验证后自动进入一致。登录任务仍包含实际邮箱输入；唯一企业自动进入不另计一次不存在的企业选择。相应累计主线为J03 13动作、SAAS01 99动作；26任务、38正常、80恢复分母未增减，当前结构展开仍为16旅程/109条route。该窄修订不改变前述UX内容覆盖通过结论。

读取执行者`frontend/.e2e/r004-edge/report.json`，SHA256 `df16ccd2d67927e91f3b9681c005f7d46e9ddd0cc816ac2ed19dc8600404dd59`：run `01a14998-9ce5-7ce4-b398-57ab80c25c29`，2026-10-17T11:21:42.836Z–11:22:05.820Z，单项“r004 role journey: new organization and first owner remain continuous across empty access and module grant”为passed，其余95项为筛选跳过。结合该项实际测试动作与断言，它支持平台正常登录创建企业、同INV首次Owner接受、无权益首入、唯一企业重登、同企业开通、Owner重登回读及本企业`C-SAAS-1`可见、`C-1001`不出现的局部隔离Preview链。运行使用本地测试目标5778、dirty工作区；本报告没有独立重跑，不能升级为最终5790入口、109条完整路线、真实IAM/DB或Human批准。

此轮`create_review_examples.py`补充ASCII样例文本的UTF-8/LF确定性，未发现改变角色旅程合同含义；本报告不重开已冻结通用源码。测试临时Git清理适配不是本次内容覆盖结论的依据，也不把仍在运行的测试记为通过。

窄修订复查时，Human脚本与UI投影尚显示J03=14、SAAS01=105及平台选择企业，落后于本轮13/99和零/单企业引用。执行者需按既有同源生成器重生这些投影；本报告仅写该待办，不修改他人负责文件。此项属于当前候选的交付一致性义务，不能凭内容通过跳过，也不授予可审阅状态。

## J05/T08最后两项的修复复查

### RJ-01：身份冲突触发要求不存在的成功入口——已关闭

位置：`J05.branches[T08-failed]`。

初查版本先执行完整正常验证、确认和“进入该企业”，然后才进入身份冲突恢复；确认被拒后不存在成功进入按钮，因此该前缀不可执行。

当前修复从`invite-handoff`的同一INV开始；触发只有“核对并尝试接受”“确认本次尝试”，到错误账号的明确拒绝即停止，不产生ACT或进入按钮。两个动作标为`public_entry`且不授予验证状态；之后由failed恢复执行正确验证→核对接受→确认→进入企业，产生新的接受ACT。完整分支重算为17动作，恢复保留4动作。在内存中将触发后续接到受保护T12，检查器明确拒绝“role must authenticate before this task path”，说明public_entry没有提升验证状态。内容问题关闭；实际预演仍须确保触发时确有已登录的不匹配账号、接受尝试控件可用，并记录该实际账号与受邀账号，不能用匿名禁用按钮假装已完成拒绝。

### RJ-02：不可用邀请以已成功接受为共同前缀——已关闭

位置：`J05.branches[T08-invite-unusable]`。

初查版本从完整`accept-created-invite`之后开始，并消费接受ACT，不能覆盖接受前已过期或被撤回的必要条件。

当前改从`invite-handoff`开始，直接携带`invite-a`至不可用反馈；恢复path为public、authenticates=false、object_mode=none，不消费接受ACT，也不要求先加入企业。完整分支重算为12动作。内容问题关闭。执行者仍须在独立重放前为同一实际INV建立过期、撤回、已使用、停用等适用条件，并分别观察原必要安全终点；列在同一path中不等于某一条件的实测可以替代其他条件。

## 本次实际验证及后续义务

在内存中调用当前`journey_plan`：16旅程、109条完整正常/前缀分支展开被结构检查接受；原分母四项集合对比一致。分别变造退出后的受保护写入、未知原对象替身、Human错误候选、Agent actor、遗漏角色及遗漏step，均被拒绝；最后T08修复后又确认public_entry不会授予受保护业务路径所需验证。没有运行浏览器，没有生成或冒用实际Human收据，也未运行整套仓库交付门禁。

Human脚本及UI指引同源重生的内容一致性已核对；仍需在交付时绑定最终候选与原始浏览器证据。仅回填coverage_review后，指引中的整文件计划hash可依现有生成源更新，其实际内容未变时不触发本canonical内容结论的自引用循环；其余计划内容变化须复查受影响范围。

浏览器义务包括：用真实新入口与存储授权连续走同一INV/ACT/成员/资源；实际验证新建只读角色配置与指派结果；核对新企业及另一企业切换；逐正常及必要条件恢复记录动作、对象身份、可见结果与配图；保持无场景工具、无中途重置、无替身记录。功能或入口改动影响的旧局部证据必须明确失效/等价范围。只有完成该阶段并独立复核，才可讨论REVIEW_AVAILABLE；Human仍须另行完成同版角色旅程审阅。

## 通用规则源码快照

| 文件 | SHA256 |
| --- | --- |
| `.agents/skills/sdlc-design/scripts/role_journey_checks.py` | `549a9e5e6950a509cac5aa11b14b0956ae99efa7284f6e0c1887d8603c6b5cce` |
| `.agents/skills/sdlc-design/scripts/review_checks.py` | `3b27ed27dda3c4ecbbf792851a9dd8d3fe2f8b076be10a096ed399bb0dce89d2` |
| `.agents/skills/sdlc-design/scripts/stage_checks.py` | `18046d8830acbc0500d529d02d4d787a1acc1dd3c832a17bc082574304261cd1` |
| `.agents/skills/sdlc-design/scripts/create_review_examples.py` | `b8d537e30f628b17fbe7ae4ec4283623e3dd6661e8e2126b9e8b2df17c00d6a4` |
| `.agents/skills/sdlc-design/references/review-delivery.md` | `79b7b02010500a9a1d43b699db6974561dd154f1a8cdc11423cb7456d9f2a59b` |

补充资产快照：`saas-readonly-role.tsv` SHA256 `ada7b63419bc04a5e9fe2c934f0af96e8c38569948024ee4ae6375111aeee991`；补充时Human脚本SHA256 `9cbbc61612736d59eeea481de0da83e48d25f77792e8a65020b503c55018c434`，UI指引SHA256 `a3500a36ca2c378e3ad7f743e565c7fa42b8a73d8e47e228f85e950c23201f40`。此处资产hash用于内容追溯，不是运行证据。
