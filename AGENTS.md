# cs-biz working agreement

## Start with the current task

Target only `hvritual/cs-biz`. Read this file, [documentation map](doc/README.md), [current roadmap](doc/roadmap.md) and the actual Issue/task. Verify current main, existing PRs, accepted design, completion boundary and action authority before changing files. A dated roadmap/snapshot is a navigation aid; refresh live state before execution. Read only the relevant branch of the map.

Requirements and accepted same-version design define the promised result. Source and tests describe implementation; exact-version observations prove only their tested environment. `proposed`, implemented, verified, merged and deployed are distinct. Missing evidence stays unproven. A closed Issue, Mock, another repository or a Skill does not establish a stronger result or permission.

## Ownership

- `frontend/` and `backend/` own application code and their `deploy/ci/doc`; read [frontend instructions](frontend/AGENTS.md) or [backend instructions](backend/AGENTS.md) before work there.
- `doc/` owns cross-side architecture, product/contract/journey definitions, current roadmap, task records and evidence navigation. Do not create a competing root `docs/`.
- `.agents/skills/` owns reusable workflow implementation: instructions, capability Skills, contracts, templates, examples and checkers. `.codex/agents/` contains checked registration mirrors.
- `.github/workflows/quality.yml` is the single automatic quality entry. It calls repository scripts; configuration files do not prove GitHub protection is enabled.
- Preserve unrelated changes, approved criteria, source provenance/licenses and generated ownership. Repair generated files through their canonical generator.

## Select the workflow

| Need | Read next | Output boundary |
| --- | --- | --- |
| Qualify a whole business outcome / complete module batch | [intent-to-outcome-closure](.agents/skills/intent-to-outcome-closure/SKILL.md) | Fixed full denominator and observable integration proof |
| Start/resume one task or choose its stage | [sdlc-workflow](.agents/skills/sdlc-workflow/SKILL.md) | Route within existing task authority |
| Discover facts, design solution/journey and freeze acceptance | [sdlc-design](.agents/skills/sdlc-design/SKILL.md) | design-to-build.json |
| Implement, verify, independently review and integrate | [sdlc-build](.agents/skills/sdlc-build/SKILL.md) | build-to-deploy.json |
| Release/read back/recover an explicitly authorized target | [sdlc-deploy](.agents/skills/sdlc-deploy/SKILL.md) | deploy-receipt.json |

Each stage Agent owns sequencing, bounded repair and handoff. Its checker returns only the next capability, bound inputs and resource paths; capability Skills produce one result and never dispatch successors. Inherit host model/tools/budgets/permissions. Agent TOML and agents/openai.yaml do not prove runtime activation or grant authority. No unattended Issue-to-Agent service is installed.

Use [task template](doc/templates/task.md) and [project workflow binding](doc/workflow/SDLC-ADOPTION.md). Freeze observable AC, pass/fail, negative/recovery/protected behavior, exact source/scope, dependencies, resources, budget and actual authorization before autonomous implementation. Reuse valid confirmations. Advance already-authorized work without routine continuation prompts; return changed design/value, exceptions, authority, irreversible risk or exhausted progress to the appropriate Human owner. Unknown side effects require readback before retry. After two materially identical failures without new information, stop the affected branch unless a stricter existing budget applies.

## Quality and delivery

Read [Risk-based Gates](doc/ci/RISK-BASED-GATES.md), the sole normal delivery policy. Trusted-base complete-diff selection chooses docs/backend/full; required jobs and an independent repo/base/head/tier/run/attempt receipt must actually pass. Independently review content and original acceptance, recheck current head/main and actual GitHub controls, merge only within authorization, then verify main and post-merge gates. Do not fabricate GitHub approval or label skipped/missing/stale evidence PASS. Deployment has separate target/authority and proof requirements.

During edits use relevant focused checks, then Fast. Local `frontend` check defaults to Fast. Root `bash doc/ci/check.sh --fast` includes the **complete backend check** plus frontend Fast; it is not a cheap docs-only command. Final stabilized candidates use automatic risk selection once. [Recovery rules](doc/ci/NO-STALL-GATES.md) govern diagnosis/resume. [Optional manual Full](doc/ci/HUMAN-FULL-CONTROL.md) does not replace required automatic qualification.

Repository checks: `python3 doc/ci/check_repository.py`, `python3 doc/ci/check_sdlc_workflow.py --mode structure`, and `python3 .agents/skills/sdlc-workflow/scripts/check_packages.py`. See [CI command map](doc/ci/README.md) for dependencies and scope. All static outputs have limited proof boundaries.

## UI and authorization

For UI work read [Desktop contract](doc/design/desktop-ui.md), `frontend/AGENTS.md`, and only the selected Design UX/Preview capability. Reuse the existing Console, tokens, i18n and components. Cover 1366×768, 1440×900 and 1536×1024; preserve existing assertions and the retained legacy Mobile skip. New journeys use tester-army/e2e alongside retained Playwright regressions. No engineering placeholders or unsupported success claims in product UI. Design Preview is task-scoped, isolated and bound to actual browser evidence; standalone screenshots do not qualify.

Menu visibility is not API authority. Function permission and data scope remain paired; server-side Tenant AND Scope checks are required. Mock/local identity is not real IAM or database isolation.

## Historical artifacts

Prior rounds, handoffs, approvals, acceptance and raw evidence remain immutable. [Legacy protocol routing](.agents/skills/sdlc-workflow/references/legacy-protocols.md) selects the matching existing CLI; do not mix protocols or rewrite old hashes to pass. Reproduce historical claims at their recorded commit. [Ownership/retired paths](.agents/skills/sdlc-workflow/references/migration.md) explains removed aliases and Git-based historical lookup. Old instruction text does not override current policy or authorize new work.
