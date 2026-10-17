# Current workflow contracts

Select by the actual current input, not a historical task's command list. Each checker is read-only; parse its state. File presence/hashes and PASS_STATIC_ONLY do not authenticate review, runtime, permissions or business completion.

| Actual input | Current owner / entry | Purpose |
| --- | --- | --- |
| goal.json / goal-progress-v1 with optional coordination/control | intent-to-outcome-closure/scripts/check_goal.py | Original intent, scoped decisions, unit admission, parent reconciliation and stop control |
| request.json / sdlc-artifact-v1 | Selected Design/Build/Deploy scripts/check_workflow.py | Current capability, input/definition hashes and terminal return to Goal |
| design-loop.json / intent-design-v2 | sdlc-design/scripts/check_design_workflow.py; doc/ci/check_design_workflow.py | F0/F1 frozen designs and Build admission consume this contract; preserve actual packets/approvals |
| module-contract.json / module-outcome-v1 | sdlc-workflow/scripts/check_module_workflow.py; doc/ci/check_module_workflow.py | Whole-module denominator, original lock, dependencies and integration proof obligations |
| Repository structure | doc/ci/check_sdlc_workflow.py --mode structure | Current entrypoints and project authority only; no task-stage admission |

Resolve script paths from their owning package. Actual sources/authority/resources and required quality gates remain independently checked by the host. Integrated main, deployment and business effect are distinct exits.

Retired formats have no current task-entry adapter. Reproduce their original files and tools at the recorded Git commit; do not relabel them as current artifacts, regenerate historical approvals or recreate discovery aliases. The retirement boundary and Git recovery are in [migration](migration.md). Current task navigation contains business delivery records; workflow methods and portable examples stay in their owning Skills.

Current UI Design review assets are design-review-plan-v2 and design-review-delivery-v2, consumed by Design UX/Preview/acceptance through review_checks.py and role_journey_checks.py. They preserve task/path coverage and add complete role walkthroughs, same-object handoffs and actual Human journey review. Sealed v1 UI rounds are historical artifacts interpreted at their recorded commit; do not rewrite them into v2 approval.
