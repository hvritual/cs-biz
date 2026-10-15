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
