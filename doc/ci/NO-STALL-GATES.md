# No-Stall Delivery Gates — cs-biz

**Superseded delivery policy:** Follow [Risk-based Gates](RISK-BASED-GATES.md) for all new/resumed tasks. Its single automatic docs/backend/full pipeline replaces the unconditional Human wait and duplicate scheduling below. The following text is historical context for retained manual diagnostics, not a requirement for normal merge qualification.

## Non-negotiable objective
One change, one small feedback loop, one qualified candidate. Do not make GitHub Full CI
the developer's debugger. Fix the smallest demonstrated cause; do not weaken a passing
assertion, turn off security checks, or claim a skipped check passed.

### Execution order
0. First apply [Docs Auto Delivery](DOCS-AUTO-DELIVERY.md). A verified `DOCS_ONLY` candidate may finish automatically without Human PR review, Full dispatch or waiver. Its state is `DOCS_AUTO_QUALIFIED`, Full `NOT_REQUIRED_DOCS`; the Human-wait/waiver requirements below apply only to other candidates. All applicable checks, current-SHA evidence, actual GitHub protection and post-merge readback remain required.
1. Freeze exact base/head, owner, visible user outcome and changed-file scope.
2. Run `bash doc/ci/check.sh --fast`: repository structure plus typecheck,
   lint, copy scan, Desktop token/collapse contract, workflow-policy negative fixtures
   and unit tests. **No build, browser install, browser E2E or screenshots.**
3. If a layout/CSS/runtime interaction changed, run one **targeted desktop probe**
   after Fast: `cd frontend && corepack pnpm check:desktop:runtime`.
   This builds once and runs `desktop-ui.spec.ts` only. Keep browser installed
   across local iterations; never reinstall per screenshot.
4. Resolve ALL Fast/targeted failures in one root-cause batch. Avoid serial
   one-line pushes and CI-wait loops. Once clean, freeze the candidate SHA.
5. Promote the PR from Draft to **Ready for review** to obtain review readiness, **not** to start Full. Human alone chooses when to run `Frontend Full Gate` via GitHub Actions `Run workflow` on **main**, entering exact `pr_number` and `candidate_sha`. Do not dispatch Full from Agent, bot, automatic PR workflow or a push. Configure `full-ci-human-approval` environment with required Human reviewers and allow main as the only deployment branch. This is an admin setting; the environment name by itself does NOT enforce human identity.
   Full checks the current PR head before test and again on an isolated receipt signer after the tests; the Full run must succeed and emit `frontend-manual-full-receipt-<run_id>-<run_attempt>`. Any new head invalidates the old receipt. No automatic repeat or cancellation of prior Human-started Full runs.
6. Before stating "done" or requesting merge, independently read the exact PR/head and **Human Full decision**: either (a) a Human-dispatched Full run and authenticated exact-SHA receipt, or (b) an independently reviewed Human waiver **only for an authorized narrow governance/doc/Skill change**, bound to this exact SHA, with applicable Fast/Targeted evidence. Without either, stay WAITING_HUMAN_FULL. A Draft/Ready transition or successful Fast never makes Full pass. This manual workflow runs from main and does **not automatically create a required PR check on the candidate SHA**; do not infer merge protection. Merge and deployment remain separately authorized.

### Gate map
| Phase | Trigger | Executed | Excluded | Evidence |
| --- | --- | --- | --- | --- |
| Fast | internal push; fork PR | check:fast (static/units/policy) | Playwright install, build, full E2E | frontend-fast |
| Targeted Desktop | local on visible UI changes | build + one desktop-ui spec | unrelated E2E | screenshots, exact workspace revision |
| Full | **Human `workflow_dispatch` on main only**, explicit open PR number + matching 40-character candidate SHA; environment approval required by admin | check:full (Fast + build + all E2E) | no push/PR auto Full; stale candidates rejected | frontend-validation + independent Human receipt + browser artifacts |
| Repo | internal push, external PR | structure/docs | frontend/runtime | repository-structure |

Human manual dispatch becomes available once the revised workflow is merged into default branch. A PR must be non-Draft for this process, but merely marking Ready does not start Full. The `workflow_dispatch` event and Human event sender check are insufficient to prevent an automation from using a Human account token; enable environment required reviewers, restrict allowed branches and protect settings. Only the real GitHub run/artifact/approval evidence supports qualification.

### Human decision authority

Read [Human Full Control](HUMAN-FULL-CONTROL.md). Human may RUN_FULL, explicitly WAIVE_FULL in the narrowly authorized governance/doc/Skill case, or DEFER. The waiver is NOT an automatic skip, not equivalent to Full success, and never covers unreviewed product/runtime changes. Any candidate change invalidates both decisions. Agent cannot initiate Full or approve a waiver. Project-level GitHub protection must be configured by an administrator; process checks alone do not prevent a direct unprotected merge.

## Time and scope budget
- Before editing, name the **one failing assertion** and source owner.
- If only CSS changed, do not modify API, auth or tenant data.
- Use one batched candidate for all identified failures; no multiple concurrent
  candidates. Prefer targeted checks over Full until passing.
- CI failures must be classified: real behavior defect, contract drift,
  infrastructure, or assertion bug. Tests are not changed without evidence.
- Preserve 1366x768 / 1440x900 / 1536x1024 Desktop regression and Mock
  authorization; mobile remains out of scope.
- Every check is bound to SHA; artifacts or logs from another SHA are background,
  never completion evidence.

### GitHub merge gate limitation
Workflow checks alone do **not** block merges without repository protection.
As observed during this task, the GitHub connection cannot modify branch
protection (403) and there are no accessible repository rulesets.
Repository admins must require appropriate automatic checks and enforce the separate Human Full receipt before merge. **Warning:** a main-dispatched Full run does not automatically attach `frontend-validation` status to the PR's head. Requiring the old PR-context `frontend-validation` check without a trusted receipt/status bridge can leave a PR permanently pending; deleting that required check without a replacement can allow an unchecked merge. An independently verified receipt bridge or controlled Human merge policy must be configured. Until then, this is an enforced *process* policy, not proof of GitHub-side merge protection.

### Fail-closed rule
- Fast red: stop, repair Fast; do not run Full.
- Targeted red: repair UI cause; do not run Full.
- Full red: not qualified; fix grouped root cause, run Fast again, then request a **new Human decision** for another Full on the new SHA. Never auto-dispatch or reuse an earlier green head.
- Human has neither issued an exact-SHA waiver nor triggered Full: `WAITING_HUMAN_FULL`; do not claim qualified or auto-trigger it.
- Missing tool/infrastructure: record **unavailable** rather than pass.
