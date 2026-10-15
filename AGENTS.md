# Repository working agreement

## Scope and truth

- The target is `hvritual/cs-biz`. Do not infer code or completion from another repository.
- Read `doc/tasks/S00-repository-design.md`, `doc/roadmap.md`, and the relevant task before changing files.
- Distinguish user requirements, proposed decisions, implemented code, validated behavior, and deployed behavior.
- Existing ADRs marked `proposed` are recommendations, not accepted technology constraints.
- Keep work within the current user-authorized task. Preserve unrelated files and changes.

## Structure

- Application code belongs in `frontend/` or `backend/`.
- Each side owns its `deploy/`, `ci/`, and `doc/`.
- Cross-side architecture, contracts, journeys, task templates, and local orchestration belong in `doc/`.
- GitHub workflow entry points belong in `.github/workflows/` and call repository scripts.
- Do not create another root `docs/` as a competing source of truth.

## Delivery

- Use `doc/templates/task.md` for independently reviewable delivery units.
- Run `python3 doc/ci/check_repository.py` for this skeleton. It does not replace application, authorization, browser, or integration tests.
- Add real runtime gates when runtime code is introduced; never report a missing tool, skipped gate, or mock demonstration as a passing production check.
- Keep API authorization server-side and tenant-scoped. Menu visibility cannot authorize an operation.
- Record upstream source commits, retained licenses, and actual dependency locks when importing a frontend template.
- Repository writes, merge, deployment, and contacting other people are separate actions. Follow the user's actual authorization and the repository's enforced controls.

## Desktop design system

For every future UI task, read and comply with **doc/design/desktop-ui.md**. Use its shared tokens and Desktop browser checks, not page-local visual assumptions. Record screenshots from the exact changed commit.

## No-Stall Gate: mandatory for future tasks

Read **doc/ci/NO-STALL-GATES.md**. Run Fast before any full qualification; UI work runs one targeted Desktop journey before promotion. Do not launch a full browser suite on each push or edit test expectations without runtime evidence. Source-of-truth layout/token rules remain in doc/design/desktop-ui.md. Never describe an unprotected branch as GitHub merge-protected.

## Reusable task and Build workflow

For implementation task start/resume, slice admission, material failure, slice close and handoff, read `.agents/skills/task-progression/SKILL.md` and `doc/workflow/project-profile.md`.
For approved development slices, use `.agents/skills/sdlc-build/SKILL.md` (acceptance-driven short loop). These Skills are methods, not new approval authorities or substitutes for `doc/ci/NO-STALL-GATES.md`.
Reuse the existing task template and actual CI results. Missing Skill, locked acceptance, tool or evidence means not verified; never claim auto-enforced gates from this instruction alone.

## Unified SDLC Skill composition

For any end-to-end intent/design/build/review task, first load `.agents/skills/sdlc-workflow/SKILL.md` and `doc/workflow/project-profile.md`. Delegate to peer Skills, not independent competing orchestrators:
- `prompt-optimizer` recovers IntentSpec, checks uncertainty and human decisions; it never implements.
- `sdlc-design` delivers preview demo/flow/journey for Human confirmation, then controlled revision and approved requirements/design.
- `task-progression` preserves all original/unfinished outcomes and authorized scope.
- `sdlc-build` runs acceptance-driven, risk-appropriate fast loops and project CI.
- `engineering-language` checks prose semantics at handoff without changing user intent.

Read `doc/workflow/SDLC-ADOPTION.md` for stage artifact contracts and verified/unverified boundaries. Use `python3 doc/ci/check_sdlc_workflow.py --mode structure` for read-only structural checks. No Skill or static checker authorizes code change, approves itself, weakens tests, or replaces real GitHub CI and Human review. Treat the approved Design and Acceptance as read-only for the implementer. Do not silently advance from review-ready Prompt to execution.

## Original-SDLC artifact verification (compatibility subset)

Read `doc/workflow/ORIGINAL-RUNTIME-VALIDATION.md` before using v0.4-style `intent-spec.json`, `design-revisions.json` or `build-loop.json`. Run the matching `doc/ci/check_intent_v02.py`, `check_revision_v04.py` and `check_build_v04.py`. The prior `check_sdlc_workflow.py` uses simplified legacy task artifacts; **do not combine the two protocols** or represent static compatibility checks as externally authenticated approvals, CI, or business tests.

## 当前三权与 Yunka 迁移权威（2026-10-15）

- 必须在权限、Access、用户旅程、Go 操作、合同/代码生成或跨端切片前先读 `doc/architecture/adr/0002-yunka-runtime-adoption.md`、`doc/contracts/three-rights-v3.md`、`doc/tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md`、`doc/roadmap.md` 和真实关联 Issue [#10–#17](https://github.com/hvritual/cs-biz/issues/10)。
- **事实与目标分开**：当前 main 仍用 Go V2 `internal/platform/authz` 与 S01 Mock；PR #7/#8 未合并，Yunka 是目标架构、尚未安装/执行；不能因为文档优先级覆盖已存在的 Go 代码事实。
- Console Menu 独立；无后台 Menu、有营销 Function 仍可营销。Menu 不作后端 API 授权；Function 是 Operation 授权，Data 是该 Function 经 Guard 注入且由 Domain 真 SQL 强制的 Scope。
- 新业务的**目标可写操作合同**为 Yunka typed PB，在 F1 导入并通过 Consumer 编译后生效；之前仍维持现有 Go V2 CI，不能同时以两套生产 `HTTPRouter/Gateway` 放行同一 Operation。
- [Feature Onboarding V3](doc/templates/feature-onboarding-v3.yaml) 是任务审阅清单不是运行时 IAM；旧 V2 模板只用于历史切片。Yunka 工具链/真实身份/DB/Scope SQL/发布门禁在对应 Issue 中实际完成后才能标记 PASS。
- 原 `AGENTS.md` 的独立授权、Desktop 规范、Skill/No-Stall 门禁、不可静默合并/部署等所有现有要求继续生效。
