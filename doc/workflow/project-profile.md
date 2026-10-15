# cs-biz workflow binding (project profile)

This file binds shared task-progression and sdlc-build methods to **hvritual/cs-biz**. It is not a new source of task state, authorization or CI truth.

## Authoritative sources
- Highest repository guidance: `AGENTS.md`.
- Actual task/Issue: its approved source and existing `doc/templates/task.md`-based task record.
- Roadmap: `doc/roadmap.md`, re-check against live source/PR and evidence; stale status is not authority.
- UI design: `doc/design/desktop-ui.md`.
- Delivery and retry: `doc/ci/NO-STALL-GATES.md` and actual workflows.
- Actual implementation: `frontend/`, `backend/`; Mock does not certify persistent authorization.
- Do not create a competing `docs/`, task-status store, acceptance authority or CI engine.

## Existing commands: only run when relevant and available
- Repository skeleton: `python3 doc/ci/check_repository.py`
- Default and Fast, after applicable focused tests: `bash doc/ci/check.sh` or `bash doc/ci/check.sh --fast`; `cd frontend && corepack pnpm check` also defaults to Fast.
- Changed Desktop visuals/interaction: `cd frontend && corepack pnpm check:desktop:runtime`
- E2E framework: tester-army/e2e; read `frontend/doc/e2e.md`. New journeys use `*.e2e.ts`. `test:e2e` must retain both the new runner and legacy Playwright regressions during migration; targeted `test:e2e:journey` runs after Fast/build. No implicit provider or Full permission.
- Final CI: `Risk-based Quality` automatically selects docs/backend/full; read its exact-SHA quality-gate/receipt. The retained `Frontend Full Gate` is optional Human-dispatched diagnostics, not the normal qualification requirement.
- Optional complete local diagnostic commands remain `bash doc/ci/check.sh --full` / `pnpm check:full`; use only for a stabilized final candidate, never every edit. They do not replace GitHub exact-SHA qualification.
- Frontend focused tests: choose an existing Vitest spec via `corepack pnpm exec vitest run <existing-spec>` from `frontend/`; verify actual spec.
- Backend: use `backend/ci/check.sh` and real Go tests appropriate to affected packages; do not invent a missing test command.
- Real CI qualification: read the workflow run, exact candidate and artifacts; never infer a pass from a local text report.
- Desktop scope only: 1366x768, 1440x900, 1536x1024; don't add Mobile requirements.

## Project-specific protections
Current delivery authority is `doc/ci/RISK-BASED-GATES.md`: automatic trusted-base docs/backend/full selection, exact-SHA CI and independent receipt replace the blanket Human Full/PR-review waits below. Use local focused/Fast during edits and final-candidate automatic Full only when selected. Keep design/value/irreversible decisions and actual GitHub controls. Legacy manual Full commands remain optional diagnostics.
Documentation-only PRs retain `doc/ci/DOCS-AUTO-DELIVERY.md` and qualify through the unified docs tier. All other candidates use the risk policy above; no blanket Human Full wait remains. Automated checks and actual merge protection still apply.
- Do not rewrite existing Vben/Element Plus frontend or authorization kernel just to demonstrate workflow.
- Platform auth and tenant data scope are server-enforced. Frontend Mock role switches are not production authentication.
- Do not edit CI expectations or lower gates without a separate approved governance change.
- Fast before focused UI during development; final candidate follows trusted risk selection and independent receipt. Missing required jobs/receipt stays NOT_QUALIFIED; stale, failed or skipped required tests are never PASS. Manual waivers cannot replace failed automatic gates.
- Branch/pull request, review, merge and deploy each require their own actual authorization.
- Preserve existing user changes; separate test failures from environment/tool unavailability.

## Pilot acceptance
First pilot is one **existing approved and genuinely unverified** slice. Audit before selection. If the candidate outcome is already verified, record it and select the next missing AC. Do not create a fake defect. No business code edits under this workflow-only integration change.

## Intent / Design v2 binding
Read [Intent/Design workflow](INTENT-DESIGN-WORKFLOW.md) and [handoff contract](DESIGN-HANDOFF-CONTRACT.md). Historical knowledge starts at `doc/architecture/adr/` and task-relevant doc/source; inspect actual status and supersession, not a stale roadmap status. The current frontend is `frontend/apps/console` with Vben/Element Plus; Preview reuses it rather than creating another app. Use the cs-biz binding in `.agents/skills/b2b-product-ux/PROJECT-INTEGRATION.md`.

The workflow stops at the full design/Preview handoff. The executing model continues planning/implementation/verification/gates under existing task authority outside that workflow; no automatic Build/Full/merge authority is added. Preserve existing task/Goal/Resume refs if present. New handoffs use `python3 doc/ci/check_design_workflow.py --task <task-dir> --repo-root .`; earlier artifact protocols remain historical compatibility only.
