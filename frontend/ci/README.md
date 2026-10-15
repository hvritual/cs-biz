# Frontend validation — Fast/Full gates

Authoritative process: [No-Stall Delivery Gates](../../doc/ci/NO-STALL-GATES.md).
Pinned toolchain: Node 22.18+ or 24.x, pnpm 10.33.4 from Corepack.

## Local run (from frontend/)

```sh
corepack enable && corepack install
corepack pnpm install --frozen-lockfile       # once per lockfile version
corepack pnpm check:fast                      # every iteration and default 'pnpm check'
corepack pnpm exec playwright install chromium  # once, only when UI browser work requires it
corepack pnpm check:desktop:runtime           # UI-only: one build, targeted Desktop E2E
corepack pnpm check:full                      # explicit Human-only; not for Agent iteration
```

Do not reinstall Chromium or rerun all customer/tenant journeys after every CSS
edit. Fast includes typecheck, oxlint, bilingual product-copy checks, Desktop
semantic Token checks, self-tested pipeline/collapse checks, and unit tests.
Full adds the actual production build and all Playwright journeys.

## GitHub workflows

- `.github/workflows/frontend.yml`: **Frontend Fast Gate**, automatic on
  internal branch push and external PR, no browser installation. A duplicate
  PR hook for an internal push is skipped.
- `.github/workflows/frontend-full.yml`: **Frontend Full Gate** is **Human-only manual workflow_dispatch**, never PR/Push-triggered. Human chooses Actions → Frontend Full Gate → Run workflow, selects **main** and provides the open non-Draft `pr_number` and exact 40-character `candidate_sha`. A trusted preflight checks PR head; independent receipt signer checks it again after successful tests. Configure required reviewers and main-only branch restriction on the `full-ci-human-approval` environment in repository Settings; this cannot be done by the Skill text. The Full run receipt is an artifact, not a PR-head required status; read it independently before merge. Without a trusted attestation bridge, GitHub required-check rules for the previous PR-triggered `frontend-validation` job need admin reconciliation; do not weaken merge safety.
- `.github/workflows/repository.yml`: cheap structure validation; duplicate
  internal PR job skipped; external fork PRs are checked.

Run `bash doc/ci/check.sh --fast` from the root for a structural preflight
plus Fast; default `bash doc/ci/check.sh` is **Fast**. Full is only an explicit Human decision; see [Human Full Control](../../doc/ci/HUMAN-FULL-CONTROL.md).

## Stop conditions

Do not mark a result PASS if its command failed, was skipped, or references an
older SHA. If one targeted UI assertion fails, repair its cause before promotion.
S01 Mock authorization is not production server authority.
The branch protection required-check controls need repository admin rights.
