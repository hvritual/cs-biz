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

## SDLC: three stage Agents and owned workflow Skills

The current entry is `.agents/skills/sdlc-workflow/SKILL.md`. It routes to three Agent-owned workflows:
- Design: `.agents/skills/sdlc-design/SKILL.md`, raw intent/discovery/solution/Preview/frozen acceptance → design-to-build.json.
- Build: `.agents/skills/sdlc-build/SKILL.md`, plan/implementation/verification/independent review/authorized integration → build-to-deploy.json.
- Deploy: `.agents/skills/sdlc-deploy/SKILL.md`, separately authorized target/rollout/observation/recovery → deploy-receipt.json.

Each workflow Skill owns its Agent instructions/native definition, workflow.json, internal single-function skills, contracts, templates, examples, references and generic checkers. Agent is the host LLM with instructions/tools/context/control loop; capability Skills produce one bounded artifact and do not orchestrate successors. agents/openai.yaml is Skill metadata. Native `.codex/agents` files are generated mirrors of definitions inside their owning Skill. Do not infer native runtime activation, authority or model availability from a parsed file.

Read only the selected stage and its next capability; `scripts/check_workflow.py --task <task-dir> --include-skill` returns bound inputs, the selected instruction and resource references. Preserve raw text, original R/AC, exact-version approval, file scope and current source/evidence. Same-version solution/design/requirements/journey/flow and an in-project Preview remain required for UI design. The internal Design UX capability owns its templates/references; actual Preview reuses frontend/apps/console and current design system, with isolated fixture writes and real browser observations. Standalone demo.html/screenshots alone do not qualify.

The Design subworkflow still ends at DESIGN_HANDOFF/auto_execute=false in intent-design-v2. The outer SDLC now includes separate Build and Deploy Agents; those act only under separately existing implementation/merge/deployment authority. Follow doc/ci/RISK-BASED-GATES.md and actual GitHub controls, preserve independent review and exact-SHA receipt/main readback. Routine authorized engineering work does not require repeated Human continuation; material design/value/exception/authority and irreversible/production choices remain Human decisions.

Run `python3 .agents/skills/sdlc-workflow/scripts/check_packages.py` for owned resources, consumer-contract consistency, native mirrors, generic-runtime identity, examples and copied-package portability. Old doc/ci validators are compatibility forwards to implementations inside the owning Skills. Read doc/workflow/SDLC-ADOPTION.md for migration. Static checks never authenticate approval, actual runtime/CI or deployment, and approved Intent/Design/Acceptance are read-only to implementation.

## Original-SDLC artifact verification (compatibility subset)

Read `doc/workflow/ORIGINAL-RUNTIME-VALIDATION.md` before using v0.4-style `intent-spec.json`, `design-revisions.json` or `build-loop.json`. Run the matching `doc/ci/check_intent_v02.py`, `check_revision_v04.py` and `check_build_v04.py`. The prior `check_sdlc_workflow.py` uses simplified legacy task artifacts; **do not combine the two protocols** or represent static compatibility checks as externally authenticated approvals, CI, or business tests.

## Whole-module autonomous delivery

For an approved module's complete issue batch, read `.agents/skills/intent-to-outcome-closure/SKILL.md` and `doc/workflow/MODULE-OUTCOME-CONTRACT.md`. Before autonomous advance, freeze the complete issue inventory, original design/requirement/AC mapping, observable pass/fail plus negative/recovery methods, integrated exit, dependencies/resources, file scope, budget, exact-version review and actual action authority. Independently review semantic completeness; `check_module_workflow.py` checks only deterministic constraints.

The Design Agent ends at its approved handoff; the Build and Deploy Agents own their separately authorized loops. The module coordinator continuously selects one authorized required issue at a time, refreshes main/evidence and advances without repeated routine Human prompts. All required/blocked members remain in the denominator. Human retains material design/value/exception, irreversible and authority decisions. A static closure candidate, all closed issues or green CI is not whole-module completion. No unattended startup service or new approval authority is introduced.

## Legacy Skill entrypoints

Existing invocations of prompt-optimizer, b2b-product-ux and engineering-language route to their Design-owned workflow/capability. `.agents/skills/task-progression/SKILL.md` remains a compatibility method for the Build Agent checkpoints. Read these adapters only when the old name is actually invoked; they are not additional workflow stages or alternate implementation authorities.
