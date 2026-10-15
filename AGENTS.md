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

E2E framework: use `tester-army/e2e` for new journeys; project configuration and migration boundary are in `frontend/doc/e2e.md`. Existing Playwright regressions remain required during migration. Do not confuse the framework's Playwright-based web engine with removal of existing coverage or changes to Human-only Full control.

For every future UI task, read and comply with **doc/design/desktop-ui.md**. Use its shared tokens and Desktop browser checks, not page-local visual assumptions. Record screenshots from the exact changed commit.

## No-Stall Gate: mandatory for future tasks

**Current authority (2026-10-15):** Read `doc/ci/RISK-BASED-GATES.md`. The single automatic `quality.yml` selects docs/backend/full using trusted-base complete diff and collects an independent exact-SHA receipt. It supersedes blanket Human Full waiting/waiver and repeated Human PR-review requirements below or in legacy task records/Skills. Authorized agents may run final-candidate Full and merge after real required results, content review and current main/head readback. Keep Human decisions for changed design/value, exceptions and irreversible/production actions. Actual GitHub protection still applies. Historical manual Full tooling remains manual; it is optional, not the normal delivery path.

**Documentation exception (2026-10-15):** Read `doc/ci/DOCS-AUTO-DELIVERY.md` first. Eligible documentation-only PRs use trusted-main `doc/ci/check_docs_only.py` and automatic content/check verification, then may be created, merged and closed by the authorized executing model without Human PR review or Human Full waiver. Record `DOCS_AUTO_QUALIFIED` / `NOT_REQUIRED_DOCS`, never Full PASS. This exception takes precedence over blanket Human-wait rules below and in repository Skills/templates. Mixed changes, governance/CI/Skills, unknown scope and failed/missing evidence do not qualify. Product/design choices still require their own existing approval. Respect actual GitHub protection.

Default commands `bash doc/ci/check.sh` and `cd frontend && corepack pnpm check` stay Fast. Run focused probes while editing and the selected full candidate gate once after stabilization. Preserve every existing product assertion and Desktop size. Use real exact-SHA results/receipt, repair failures rather than edit expectations without runtime evidence, and never describe an unprotected branch as GitHub merge-protected. `doc/ci/HUMAN-FULL-CONTROL.md` now covers optional manual diagnostics only.

## Reusable task and Build workflow

For implementation task start/resume, slice admission, material failure, slice close and handoff, read `.agents/skills/task-progression/SKILL.md` and `doc/workflow/project-profile.md`.
For approved development slices, use `.agents/skills/sdlc-build/SKILL.md` (acceptance-driven short loop). These Skills are methods, not new approval authorities or substitutes for `doc/ci/NO-STALL-GATES.md`.
Reuse the existing task template and actual CI results. Missing Skill, locked acceptance, tool or evidence means not verified; never claim auto-enforced gates from this instruction alone.

## Intent / Design workflow and executing model

For raw intent, discovery and design, first load `.agents/skills/sdlc-workflow/SKILL.md`, `doc/workflow/project-profile.md` and `doc/workflow/INTENT-DESIGN-WORKFLOW.md`.
- `prompt-optimizer` preserves raw intent, automatically cites bounded relevant ADR/doc/current source, guides Human decisions on usable conditions/resources/preferences, and produces traceable IntentSpec.
- `sdlc-design` delivers a designed solution and navigable project-based Preview demo together in every review round, with requirements/design/journey/flow, versioned feedback and exact-version Human confirmation.
- UI designs must read `.agents/skills/b2b-product-ux/SKILL.md` and its cs-biz binding. Prefer authorized deterministic automation; evaluate pasted text/bulk selection with matching, ambiguity, effects and recovery. Preview must use the existing `frontend/apps/console` application and current design system, with isolated fixtures and no production preview exposure. Standalone demo.html or screenshots alone do not qualify.
- `engineering-language` checks expression without changing intent or approving anything.

The workflow ends at design handoff. **The executing model owns planning, implementation, actual verification and delivery gates outside that workflow**, using `task-progression` and `sdlc-build` within existing authority. Do not require Human to perform ordinary implementation steps. Design approval does not grant execution, Full, merge or deployment rights. Preserve all repository controls and return to Design/Intent when meaning changes.

Read `doc/workflow/SDLC-ADOPTION.md` for current/legacy contracts. `python3 doc/ci/check_sdlc_workflow.py --mode structure` checks wiring; `python3 doc/ci/check_design_workflow.py --task <task-dir> --repo-root .` checks v2 handoff bindings. Static checks never authenticate approvals or prove runtime/business results. Approved solution/Design/Acceptance are read-only for the implementer.

## Original-SDLC artifact verification (compatibility subset)

Read `doc/workflow/ORIGINAL-RUNTIME-VALIDATION.md` before using v0.4-style `intent-spec.json`, `design-revisions.json` or `build-loop.json`. Run the matching `doc/ci/check_intent_v02.py`, `check_revision_v04.py` and `check_build_v04.py`. The prior `check_sdlc_workflow.py` uses simplified legacy task artifacts; **do not combine the two protocols** or represent static compatibility checks as externally authenticated approvals, CI, or business tests.
