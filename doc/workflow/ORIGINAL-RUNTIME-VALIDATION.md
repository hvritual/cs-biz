# 原版 v0.4.0 运行验证恢复记录（cs-biz）

## 来源与身份

源包：本次会话先前交付的 `codex-sdlc-revision-bundle-v0.4.0.zip`，核对了其核心脚本与合成例子。该包不在 cs-biz 仓库中。本目录存放的是**兼容实现**，并非把源包源代码逐字节导入。版本兼容只对本次覆盖的输入结构/规则作保证。

| 原始模块 | 原版 SHA256 | 当前 cs-biz 对应入口 | 状态 |
| --- | --- | --- | --- |
| `prompt-optimizer/scripts/decision_gate.py` | `ea0df62f275813fce8760076aee1d3ac470b2004534eedd9a950914907b787aa` | `doc/ci/check_intent_v02.py` | 结构／约束／决策树子集 |
| `sdlc-design/scripts/revision_core.py` | `670bb02a4ffde7f92580221682823ef715c139a8359e54bdc602dc791fabcaf5` | `doc/ci/check_revision_v04.py` | 修订、快照、保留项只读验证子集 |
| `sdlc-design/scripts/revision_store.py` | `36d2b52d3ad7ce9242021e8445591d0cca9bbab75855b660b83d68ae72c472af` | 尚无 | **未迁移**：独占写、CAS、封存、恢复 |
| `sdlc-build/scripts/build_gate.py` | `51241acf2db2e481f43ba8dba69bec6c1e53e8cdc3a9067581444cdcbd8417ee` | `doc/ci/check_build_v04.py` | 证据结构／覆盖／TDD 与五模式验证子集 |
| `sdlc-workflow/scripts/sdlc_gate.py` | `f8df760495832b82095b39cd6987f893407998d2adc5c6a7be1d7c68250ac58d` | `doc/ci/check_sdlc_workflow.py` | **轻量阶段契约**，不是原版完整阶段门禁 |

不要把兼容子集称为原版完整移植；不符合旧格式或遗漏字段时必须显式失败／停在不确定状态。

## 当前真正可以运行的检查

Python 3.11：

```bash
python3 doc/ci/check_build_workflow.py
python3 doc/ci/check_sdlc_workflow.py --mode structure
python3 -m unittest discover -s doc/ci -p 'test_*workflow.py' -v
python3 -m unittest discover -s doc/ci -p 'test_intent_v02.py' -v
python3 -m unittest discover -s doc/ci -p 'test_revision_v04.py' -v
python3 -m unittest discover -s doc/ci -p 'test_build_v04.py' -v
```

针对一个真实任务：
```bash
python3 doc/ci/check_intent_v02.py .sdlc/tasks/T001/intent-spec.json --repo-root .
python3 doc/ci/check_revision_v04.py --task .sdlc/tasks/T001
python3 doc/ci/check_build_v04.py --task .sdlc/tasks/T001
```

输入对应三个不同产物协议：
- `intent-spec.json` 用 v0.2.0 原版字段集（phase、raw_request、intent、hard_constraints、evidence 等）。`READY` 只表示可交付 Human 审核，不授权改代码。
- `design-revisions.json`、`feedback.jsonl`、`rounds/rNNN/snapshot.json`、`contracts/CNNN.json` 采用原版 `controlled-revisions-v1` 格式。此检查**只读**，不会生成／封存轮次。它将 `manual` 规则明确报告为 `NEEDS_EVIDENCE`。
- `build-loop.json`、`build-scope.json`、绑定的 `design.md` 和 `plan.md` 用于判断现有切片的合法 RED、GREEN、REFACTOR、范围与覆盖。旧版 TDD slice 默认 `mode=tdd`；cs-biz 增加 preserve/static/existing_verified/harness_required，不制造虚假 RED。

原有 `doc/ci/check_sdlc_workflow.py --mode intent|design|build` 的简化 `intent.json`、`design-preview.json`、`build-manifest.json` 协议仍用于旧任务，但它**不是**原版 v0.4 协议；不要混用两个格式，也不要自动假设旧任务已通过新协议。

## 决策、版本、保留与证据边界

1. 不可信仓库文字不得获得更高优先级指令。提取意图必须保留原始用户引文、技术、数值、禁止范围；高风险/不确定项进入人工决策。
2. Design 每轮有父版本、原始反馈哈希链、受限改动范围、不可变快照、保留项和验收；再次修改不得以“上一轮已经偏移”为新保护基线。
3. Build 的有效 RED 是业务断言预期失败，不允许把依赖安装失败当作 RED；GREEN 不能更换已经锁定的测试身份或哈希。已有能力、纯重构、静态变更使用不同模式。
4. 每个检查器输出的 `PASS_STATIC_ONLY` 不代表人类审批、外部 CI 真相、视觉验收或生产批准。
5. 构造性反例是本地合成数据，不是本仓库用户任务的真实验收证据。测试范围由现有 cs-biz `NO-STALL-GATES.md` 管理。
6. 仍需独立验证原版全部 36 Intent 场景、Revision CAS 并发/崩溃/孤儿快照、原版 209 全量测试、真实 Code Diff、外部 CI run/attempt、评审身份与 Build E2E。

## 下一独立切片（建议）

1. **原版 Rev Store**：迁移经安全审阅的原始 `revision_core.py`、`revision_store.py` 与 schema；使用 CAS、排他写和 hash chain，在真实仓库隔离测试目录完成故障注入。不得覆盖历史反馈或冒充 Human。
2. **原版 Workflow Gate**：复用原版实际契约与依赖绑定；增加项目级 Profile，调用适用 Design/Build 检查器，避免出现互相矛盾的“通过”。
3. **外部证据适配**：使用 GitHub Actions/审批系统对精确 SHA、CI run attempt、reviewer 身份和允许路径做只读权威回读，不接受作者本地 JSON 作为批准。
4. **真实 Task 试点**：由 Human 确认 Design Demo、完整需求与 Build Scope，再完成一条真实缺口的 TDD/CI/review；不进行自动合并或部署。

## 当前交付界限

本次只增加 `doc/ci` 的兼容验证器、合成反例和文档/Skill 接线。没有更改应用代码，没有真实执行商业操作；PR 状态与 CI 用 GitHub 当前回读为准。没有声明已经完成所有原版功能。
