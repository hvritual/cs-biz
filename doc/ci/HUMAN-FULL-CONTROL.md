# Human-controlled Full CI — decision and one-time migration

**Current policy:** [Risk-based Gates](RISK-BASED-GATES.md) supersedes unconditional Human Full decisions and per-PR waivers. Automatic `quality.yml` may execute final Full after trusted selection and issues its own exact-SHA receipt. This document and its checker now govern only the retained optional manual Full endpoint; they do not prohibit the new automatic quality pipeline. Historical one-time migrations below are not current task instructions.

**Authoritative baseline:** [NO-STALL-GATES.md](NO-STALL-GATES.md). This is an implementation guide, not a second task database or a new authority to approve merges.

## Invariants

1. Automatic `push` / `pull_request` run Fast, scoped tests and governance checks, **never Full**. Even marking Ready and synchronizing a PR must not start Full.
2. An Agent can prepare a candidate, run **Fast** and applicable **Targeted**, collect evidence and recommend a Full run. An Agent must not call a GitHub Full dispatch API, rerun Full, or use local `pnpm check:full` / `doc/ci/check.sh --full` as an alternate unattended Full.
3. Full means Fast + build + **all** required E2E. Its tests remain intact. The Human initiates it explicitly from **Actions → Frontend Full Gate → Run workflow**, selecting `main`, entering **open non-Draft PR number** and **current full 40-character SHA**.
4. The trusted main workflow verifies the PR and tested SHA before work; a separate clean job verifies exact head again after success and issues a receipt bound to `run_id`, `run_attempt`, Human actor and SHA. Old receipt + new commit = **NOT QUALIFIED**.
5. A successful Fast, skipped check, a local `PASS` string, or PR Ready status does not grant Full qualification or merge authority.
6. Environment name is not sufficient to ensure Human approval. GitHub admin must configure `full-ci-human-approval` with **Required Reviewers**, main-only deployment branch, and **Prevent self-review** where available. This cannot be configured by an ordinary repository Skill or this GitHub connection.
7. Main has no active branch protection/ruleset in the observed baseline. Real merge enforcement is **not achieved** until the repository owner configures it. Workflow names and docs do not create server-side protection.

## Human Full decision for each candidate

**Documentation exception:** [Docs Auto Delivery](DOCS-AUTO-DELIVERY.md) applies first. Classified, verified documentation-only PRs need neither Human review nor an authenticated waiver; Full is `NOT_REQUIRED_DOCS`. The Human choices and waiver requirements below apply to non-qualifying changes. No automatic Full dispatch is introduced.

Human retains three explicit choices, bound to one PR HEAD SHA:

| Human choice | Effect | Allowed only when |
| --- | --- | --- |
| **RUN_FULL** | Human dispatches Full using current PR/SHA; merge eligibility requires successful exact run and independent receipt | Default for product/runtime/permissions/security and unclassified changes |
| **WAIVE_FULL** | No Full is launched; merge eligibility is determined by a separate Human-authorized exception + applicable fast/targeted/independent review evidence | Narrow documentation/Skill-only or **one-time CI governance migration** with no product runtime changes and a recorded rationale |
| **DEFER** | Candidate remains `WAITING_HUMAN_FULL`; no Full run and no merge | Anytime Human does not approve proceeding |

**Waiver is not automatic.** It must be recorded by a real authenticated GitHub Human approval or PR decision, naming the exact PR, SHA, scope, evidence and specific exception rationale. An Agent-generated `approved: true` or inferred approval from a task does not count. Do not call an absent Full `PASS`; state `HUMAN_WAIVED` and separately list tests not run. A waiver does not authorize deployment, security weakening, or changes to product Acceptance.

**Fail-closed:** If the waiver scope is wrong, Human record is missing, the candidate changed, or any required targeted/cheap gate failed, remain `NOT_QUALIFIED`. Do not use a waiver for changes to tenant/authorization behavior, billing or persistent business state without separate exceptional authority and risk assessment.

## One-time transition of PR #9 (must be carried out by repository admin)

A circular dependency exists: before #9 merges, `main` still contains `frontend-full.yml` with a `ready_for_review` trigger; after #9 merges, manual `workflow_dispatch` is the only trigger. **Marking #9 Ready before disabling the old workflow would trigger an unwanted automatic Full.** Never solve this by removing unrelated security/tests or treating skipped as success.

Safe sequence:

1. **Human/admin:** In [GitHub Actions for cs-biz](https://github.com/hvritual/cs-biz/actions), open **Frontend Full Gate**, use the workflow menu **Disable workflow**. Confirm it is disabled before marking #9 Ready. This is a temporary administrative pause, not proof of Full pass.
2. **Human/admin:** In **Settings → Environments**, create/configure `full-ci-human-approval`, with Required Reviewers, main-only deployment branch and prevent-self-review as appropriate. Verify effective settings in the GitHub UI.
3. **Human reviewer:** Review PR #9 exact SHA, diff and automatic source-safety evidence; explicitly approve the one-time **governance-only Full waiver** in GitHub if justified. It is an exception to bootstrap the policy, not a reusable way to bypass business Full.
4. **Human/admin:** Mark PR #9 Ready, then merge only after required cheap/targeted checks and review/waiver conditions are met. Do not automate this step or silently push main.
5. **Human/admin:** After merge, re-enable **Frontend Full Gate**. Its main workflow must now show **only `workflow_dispatch`** and no push/PR trigger. Confirm that opening/updating a PR does not start Full.
6. **Human:** When a later candidate warrants Full, use Actions `Run workflow` with its exact PR/SHA, approve the protected environment, verify `frontend-validation` success and independent `frontend-manual-full-receipt-<run_id>-<run_attempt>`.

GitHub permits disable/enable from Actions, and manually dispatched workflows must be on the default branch. See [GitHub documentation for disabling a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows) and [manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## PR merge-gate migration (administrative limitation)

`workflow_dispatch` runs from main, not from the PR head as the old PR-triggered `frontend-validation` job did. **A manual run's green check cannot be assumed to satisfy a required status on the PR head.**

Before enforcing merge protection, configure a trusted, independently verified receipt-to-PR status bridge or a protected Human merge policy. Do not delete an existing required Full check without an equivalent gate (it can lead to unchecked merges), and do not leave it forever required if no job can produce the status (it can deadlock all PRs). This repository's GitHub connector cannot administer repository environments, rulesets or branch protection.

## Project CLI defaults

- `bash doc/ci/check.sh` defaults to **Fast**; `--fast` explicitly does the same.
- `cd frontend && corepack pnpm check` defaults to **Fast**.
- `doc/ci/check.sh --full`, `pnpm check:full` and the GitHub Full workflow retain real Full behavior but are **explicit Human-controlled operations**. Do not use these commands in Agent-run loops.
- Full from CI requires the trusted main workflow, Human action and bound GitHub evidence; a terminal/CLI confirmation flag cannot authenticate a Human.

## Acceptance checks

The cheap CI runs `python3 doc/ci/check_human_full_policy.py`, `python3 -m unittest discover -s doc/ci -p 'test_human_full_policy.py' -v` and `node frontend/ci/check-delivery-policy.mjs`. The negative fixtures detect unexpected PR/push/schedule/workflow_call triggers, automatic Full in other workflows, lost receipt requirements and default-command regressions. These are **static** contract checks, not evidence of configured GitHub environment protection.
