# cs-biz 六 Skill SDLC 接入与阶段协议

## 本次交付的定位

使用 `prompt-optimizer`、`sdlc-design`、`sdlc-workflow`、`sdlc-build`、`task-progression`、`engineering-language` 六个 repository-local Skill，统一由 `$sdlc-workflow` 选择下一阶段。此为基于既有 v0.4.0 方法的 cs-biz 适配实现，并**非之前独立 ZIP 包的逐字节复刻**；受控轮次/语义审查的真实模型验证尚未完成。

项目已有权威始终高于 Skill：
- 仓库：`AGENTS.md`、`doc/roadmap.md`、相关实际 Issue／批准任务。
- 设计：`doc/design/desktop-ui.md` 和当前绑定版本的 Human 反馈。
- CI：`doc/ci/NO-STALL-GATES.md` 和真实 Github Workflow／artifact。
- 状态与交接：既有 `doc/templates/task.md`，不再建立一个平行状态台账。
- 真实服务端授权：不能由 Mock、前端菜单或文件中的 claimed PASS 代替。

## 顺序与责任

```text
Original Request
 → prompt-optimizer: IntentSpec + decision tree (READY / NEEDS_EVIDENCE / NEEDS_DECISION / BLOCKED)
 → Human Intent decision where material
 → sdlc-design: preview demo + journey + Mermaid flow
 → Human reviews exact preview; revision rounds for feedback
 → requirements.md + design.md + acceptance/invariants
 → Human approves final Design + scope
 → approved slice plan
 → task-progression admit_slice
 → sdlc-build: acceptance gap → real RED → GREEN → optional REFACTOR → focused checks
 → cs-biz Fast → targeted Desktop if applicable → frozen candidate Full
 → independent verification, human risk review, separate merge/deployment authority
 → runtime result evidence, new Intent if necessary
```

## Task-local artifacts (recommended; templates not approval authorities)

Keep project status in its original record. Task-local scratch artifacts may go to `.sdlc/tasks/<id>/` (ignored unless independently authorized and reviewed).

| Artifact | Purpose | Version rule |
| --- | --- | --- |
| `intent.json` | Original request, objective, hard constraints, decision, allowed action level | Preserve original raw request; no silent rewrite |
| `design-preview.json` | Intent hash, journey.md/flow.mmd/demo.html digests, revision manifest | Exact SHA256 per asset; do not overwrite old sealed round |
| `rounds/rNNN/` | Immutable-by-contract preview round and protected items | Hash seal plus externally protected history recommended |
| `design-approval.json` | Current preview hash, requirements/design hashes and Human approval *reference* | Must reread authentic approval via trusted external system |
| `build-manifest.json` | Design approval hash, selected slices, acceptance IDs, candidate SHA and evidence references | Never substitute an author-written PASS for real CI |
| Current task record | Task completion, PR, main verification, owner and remaining outcomes | Existing task template remains authority |

Read-only example: `python3 doc/ci/check_sdlc_workflow.py --mode structure`. For an actual task with documents: `--mode intent|design|build --task .sdlc/tasks/<id>`. This checks file/link/digest shape, **not** meaningful Design correctness, human identity or CI trust. Exit 0 means `PASS_STATIC_ONLY`, not a release or feature approval.

## Approval and revising behavior

A Design preview must be reviewed before detailed Design. Each feedback item references exact revision, stable UI object, intended delta, preserved features and verification. If old feedback cannot be safely rebased: stop with NEEDS_REBASE, do not guess. New business rule/tenant authority requires a new Intent decision. Partial approval is not overall Design approval. Already approved Design requirements/acceptance must not be rewritten inside Build to make tests green.

## Build modes

Use `tdd` for new behavior/bug fixes with valid RED; `preserve` for behavior-neutral refactor, `static` for documentation, `existing_verified` if already met, and `harness_required` if validation is impossible. Each slice must account for every original R/AC and protect already verified behavior. One failed check is not proof of a defect until classified by ownership, environment, spec and execution evidence.

## cs-biz fast feedback and CI

- `python3 doc/ci/check_repository.py`
- `python3 doc/ci/check_build_workflow.py`
- `python3 doc/ci/check_sdlc_workflow.py --mode structure`
- `python3 -m unittest discover -s doc/ci -p 'test_*workflow.py'`
- Real UI/Backend implementation: `bash doc/ci/check.sh --fast`; Desktop visible changes then `cd frontend && corepack pnpm check:desktop:runtime`; only one frozen candidate to appropriate Full qualification.
- PR and main receipt are different evidence. Draft PR/CI skipped is NOT qualified.

## Scope boundaries for this integration

This change installs *method and structural checks only*. No change to real auth, tenant data, billing, backend API, Desktop UI, CI skip rules, production configuration or deployed system. Real pilot must be separately tied to a task and approved Design; it should verify one truly missing and observable behavior, not fabricate test failures.

## Validation boundaries and missing assurance

File hash can detect a changed copy but not attest a Human decision or prevent a fully privileged process rewriting both file and digest. Structural checks cannot guarantee semantically correct intent, screenshots or interaction. Remote CI and reviewer evidence must be read independently. Do not claim the original complete v0.4.0 engine's exhaustive revision store and historical eval suite was copied into this repository.

## Yunka 目标开发流程接入（路线方向，非当前运行能力）

[Issue #10](https://github.com/hvritual/cs-biz/issues/10) 和 [ADR-0002](../architecture/adr/0002-yunka-runtime-adoption.md) 决定有条件使用 Yunka Operation/Executor，保留三权独立：Console Menu 只在前端，Function 由 typed PB/Gateway 授权，Data Scope 由 cs-biz OperationGuard/Domain 过滤。Skill 的 Intent/Design/Build 不变，但自 F1 **真实引入后**，Build 切片需加 `yunka generate/check` 零漂移和安全/DB/跨端负例，并保留 Fast→Targeted→Full/审批的现行 No-Stall 纪律。具体操作步骤：[Yunka Developer SOP](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)，历史 V2 步骤：[backend 功能接入说明](../../backend/doc/FEATURE-ONBOARDING-V2.md)。F0 文档与 Issue 建档不产生新的编译/生产 PASS。
