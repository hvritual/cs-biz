# TASK-ID：一个可观察成果

## 来源、版本与权限

- 原始用户意图 / Issue / 旅程；原文引用与准确来源：
- 仓库、当前 main、分支、完整 base/head SHA、观察时间：
- 完成边界：reviewed_design / integrated_main / deployed / physical / operational；目标环境：
- 实施、repository_write、merge、deploy、外部副作用各自的实际授权：
- 已有决定 / 未决材料性事项与 Owner（复用有效确认，不重复提问）：

## 目标、责任和边界

哪个角色、在什么条件下、完成什么动作、看到什么结果？WHY / WHAT / BOUNDARY / PROOF：

| 输入与依赖 | 交付物/所有者 | 允许/禁止路径 | 排除范围 | 资源/预算/恢复 |
| --- | --- | --- | --- | --- |
| 实际任务/源码/同版设计、真实环境或外部依赖 | 单一 canonical 源和消费者 | 精确、可检查 | 邻近未承诺成果 | 可用/缺失/未知、Owner、恢复条件 |

引用唯一产品/ADR/typed PB/API/权限来源，区分 proposed/accepted/implemented。描述兼容、生成/开发者所有权、租户/Scope 与副作用边界。UI 读 [Desktop](../design/desktop-ui.md)，实际项目 Preview/三尺寸/负例证据按 Design 要求填写，不制造独立假 demo。

## 先定义验收，再自动推进

| AC / 来源 R 与设计定位 | Given / When / Then | 明确 pass/fail | 反例/恢复/保留项 | 真实方法/命令/环境 | 证据与状态 |
| --- | --- | --- | --- | --- | --- |
| 稳定 ID；双向可追溯 | 角色、前提、操作、可观察结果/阈值 | 不能只写“正常/符合设计/CI绿” | 适用的权限/租户/未知结果/刷新/幂等/撤权等；不适用须说明 | 已存在入口；缺资源不伪造 | PROVEN/UNPROVEN/FAILED/BLOCKED/OUTSIDE_AUTHORITY |

完整 AC、范围、依赖、资源、预算与同版本审阅先冻结；实现者不能重算批准摘要或降低标准求通过。材料性语义改变回 Design/Human；测试错误须独立原始证据。

## 选择工作流与交接

从 [项目接入](../workflow/SDLC-ADOPTION.md) 选择本目标需要的阶段，不默认每任务都部署。Agent 串联/核实，当前能力只产出单一结果：

| 需要的阶段/格式 | 引用的原件、版本和结果 |
| --- | --- |
| Design | 原文/Intent/知识/条件/决定、同版 solution/requirements/design/journey/flow、实际 Preview 或非 UI 理由、原 R/AC/范围/批准；详细 [v2](../../.agents/skills/sdlc-design/references/intent-design-v2.md) / [handoff](../../.agents/skills/sdlc-design/references/design-handoff-v2.md) |
| Build | 原冻结设计、模式/风险、实际 candidate/main/tree、测试/独立 review/质量回执、不可变 package；build-to-deploy.json |
| Deploy（仅有独立授权时） | 环境/精确产物、部署/回滚权限、执行前持久 operation_id、权威观察/恢复；deploy-receipt.json，保留 failed/unknown/rolled_back 原义 |

新 envelope 记录 task/stage/step、definition/input SHA256、冻结 contract、hashed assets 与 blocker。旧记录按 [兼容协议](../../.agents/skills/sdlc-workflow/references/legacy-protocols.md) 选择检测器，格式不混用。静态 candidate 和示例不认证批准或运行。

## 整个板块 / 全部 Issue（仅批次适用）

按 [板块成果协议](../../.agents/skills/sdlc-workflow/references/module-outcome-v1.md) 冻结完整成员（含 closed/blocked/必要待建任务）、排除决定、R/AC/设计/状态映射、单元和整体集成出口、依赖/资源、范围/预算和分别获准动作。独立语义审阅后保存真实 locked commit，不复制第二套任务状态。

每轮回读实际 main/Issue/PR/资源/证据，保持固定分母，一个 active 候选；已授权可行工作连续推进。阻塞记录 Owner/证据/恢复动作。所有必需 AC 和整体出口有当前充分证据后才关闭父任务，Issue closed 或单项 merge 不代替验收。

## 验证、交付与续跑

按 [风险门禁](../ci/RISK-BASED-GATES.md)：局部/Fast → 稳定候选 → trusted base/head/tier → 全部所选 job → 独立 receipt/review → 授权合并 → main 与合并后资格回读。使用 [命令地图](../ci/README.md) 的实际前提与成本。普通已授权交付不等待重复 Human Full；设计/价值/例外/不可逆或生产事项仍按真实授权。

记录实际文件、精确版本/环境、命令与原始结果、run/attempt/artifact、发现/修复/失效重跑、合并/部署与证明边界。失败、未知、缺工具和跳过不写 PASS。续跑保留原失败与操作 ID，先读回未知副作用；两次同质无新信息或更严格预算耗尽时暂停受影响分支。

最终自检：原目标与每个必需 AC 都有当前证据或明确非完成状态？是否遗漏依赖/成员或放宽标准？是否误把静态/Mock/CI/main 当生产？本次完成边界、剩余条件、Owner 和一个下一动作是什么？
