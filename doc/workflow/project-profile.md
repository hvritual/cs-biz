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
- Full CI: **Human manually triggers** GitHub Actions `Frontend Full Gate` on main with PR number and exact SHA. Do not call `bash doc/ci/check.sh --full`, `pnpm check:full` or GitHub dispatch from an Agent without Human's explicit action.
- Frontend focused tests: choose an existing Vitest spec via `corepack pnpm exec vitest run <existing-spec>` from `frontend/`; verify actual spec.
- Backend: use `backend/ci/check.sh` and real Go tests appropriate to affected packages; do not invent a missing test command.
- Real CI qualification: read the workflow run, exact candidate and artifacts; never infer a pass from a local text report.
- Desktop scope only: 1366x768, 1440x900, 1536x1024; don't add Mobile requirements.

## Project-specific protections
- Do not rewrite existing Vben/Element Plus frontend or authorization kernel just to demonstrate workflow.
- Platform auth and tenant data scope are server-enforced. Frontend Mock role switches are not production authentication.
- Do not edit CI expectations or lower gates without a separate approved governance change.
- Fast before targeted UI; then await Human Full dispatch and independent receipt. No automatic Full on PR Ready, push, retries or debug loops. Missing a Human Full decision remains WAITING_HUMAN_FULL. A specifically approved narrow governance waiver is HUMAN_WAIVED, not a Full PASS. See `doc/ci/HUMAN-FULL-CONTROL.md`.
- Branch/pull request, review, merge and deploy each require their own actual authorization.
- Preserve existing user changes; separate test failures from environment/tool unavailability.

## Pilot acceptance
First pilot is one **existing approved and genuinely unverified** slice. Audit before selection. If the candidate outcome is already verified, record it and select the next missing AC. Do not create a fake defect. No business code edits under this workflow-only integration change.
