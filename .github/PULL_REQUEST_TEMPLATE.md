## Problem and outcome

State the user task this change makes possible and link its canonical task/journey.

## Changes

Describe the resulting behavior and the files or modules that own it.

## Validation

Record the exact head/tree, commands, results and independent review findings. Separate structural checks, mocked UI, real API/integration evidence and deployment results.

## Boundaries and follow-up

Record proposed decisions, remaining risks, external dependencies and actual merge/deployment authorization. Use `doc/templates/task.md` as the full task format.

## Human Full CI decision (separate from Fast)

Current normal delivery follows [Risk-based Gates](../doc/ci/RISK-BASED-GATES.md). Record trusted base/head/tier, real required jobs, quality-gate/receipt, review and main readback; no routine Human Full/waiver required. The historical fields below apply only to optional manual diagnostics or actual exceptions.

First apply [Docs Auto Delivery](../doc/ci/DOCS-AUTO-DELIVERY.md). Eligible docs-only PRs record base/head, trusted classification, content review and applicable checks as DOCS_AUTO_QUALIFIED / NOT_REQUIRED_DOCS; no Human review/waiver is required. The Human decision fields below apply only to other candidates.

Full is **not** automatically started by PR Ready/push. Refer to [Human Full Control](../doc/ci/HUMAN-FULL-CONTROL.md).

- Current PR HEAD SHA (full 40 characters):
- Human decision: RUN_FULL / WAIVE_FULL (governance/docs/Skills only) / DEFER
- Human GitHub reviewer/approval reference and exact SHA:
- If RUN_FULL: workflow run/attempt, result and independent receipt artifact:
- If WAIVE_FULL: explicit reason, verified change classification, applicable fast/targeted tests and remaining risk (NOT Full PASS):
- If DEFER/no decision: WAITING_HUMAN_FULL; do not merge.
