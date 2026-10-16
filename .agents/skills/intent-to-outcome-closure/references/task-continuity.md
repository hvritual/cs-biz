# Parent goal ownership and bounded continuation

Read this for software tasks after discovery/architecture and whenever a stage returns, a candidate merges, feedback arrives or a session resumes. Use the existing goal/task/Issue sources; this record is a checked projection, not a second task database or approval source.

## Responsibilities and return loop

| Concern | Accountable role | Boundary |
| --- | --- | --- |
| Original goal and full required denominator | Goal | Preserve raw intent, accepted decisions and completion environment; only actual Human decisions may change promised meaning/scope/authority |
| Decomposition | Design proposes; Goal admits; independent reviewer checks necessity and original coverage | Every unit names original R/AC, omission impact, result, dependencies and canonical stage task; implementation cannot redefine the parent goal |
| Business progress | Independent outcome reviewer evaluates raw behavior against original AC; Goal reconciles | Report business proof, satisfied prerequisites and pending decisions separately; CI/merge/artifact counts are not business completion |
| Blocker impact | Stage reports facts; Goal computes descendants and checks independence | Human resolves material decisions/authority; only affected work pauses; missing impact mapping is a validation failure |
| Continued execution | Goal in the authorized host session | On every stage return/merge/feedback/resume, read back, reconcile original gaps, then select one next admitted unit; no routine continuation question |

Stage format consumer (`build`, `deploy`, `closure`) does not dispatch another stage. A completed/blocked Design/Build/Deploy checker returns `coordinator_return.next_action=RECONCILE_GOAL`. Load the parent goal and authenticate the actual stage result. Do not force Deploy when the accepted boundary is integrated main. No role file installs a runner, wakeup or external write permission.

Maintain the complete discovered requirement inventory even when some material definitions remain unresolved. Freeze only the current unit's actual approved design/intake before consequential implementation; other units stay pending and cannot gain authority from that admission. Unknown acceptance remains a Design obligation, never invented values or a weaker denominator. A fully approved module continues to use [module-outcome-v1](../../sdlc-workflow/references/module-outcome-v1.md), its immutable lock and integration exit. This projection cannot override it; a final whole-module claim still requires its complete approved contract.

## Records and command

Extend `goal-progress-v1.records` with optional hashed `coordination` and `control` references. Existing discovery/operation packets remain readable. Software packets without coordination now return `PREPARE_COORDINATION`, not implementation admission. Run the same entry point:

```sh
python3 .agents/skills/intent-to-outcome-closure/scripts/check_goal.py --task TASK --live-baseline LIVE_SHA
```

Replace placeholders with actual sources. Use [the synthetic continuity example](../examples/continuity/goal.json) for structure only. All input paths use the existing task-relative, non-symlink, exact-byte hash rules. Preserve old rounds; changes require a new bound revision and reconciliation. Never rewrite old approvals or outputs to obtain PASS.

`coordination` is a JSON object with these fields:

| Field | Contract |
| --- | --- |
| protocol / basis_sha256 / goal_id / assessment_sha256 | `goal-coordination-v1`; current goal basis, same goal ID and exact assessment ref hash |
| work_items | Complete required work; every nonoptional assessment R covered and every known AC has outcome work. Each: graph `id`, canonical stage `task_id`, `kind` (`outcome/prerequisite`), `requirement_ids`, `criterion_ids`, `depends_on`, `stage` (`design/build/deploy`), `task_ref`, `outcome`, `omission_impact`, `admission_ref` (null until admitted). task_id matches the actual intake; different stage units may share it while retaining distinct graph IDs. Graph must be acyclic. Unresolved Design may have empty criterion_ids, never executable Build/Deploy |
| decision_scopes | Exact mapping for all assessment/architecture decisions: `decision_id`, nonempty `work_ids`, `reason`. For an actually global decision list all affected roots explicitly. Blocking propagates through dependencies, not unrelated units |
| observations | Exactly one per work ID: `work_id`, `state` (`pending/active/suspended/completed/returned/unknown`), `candidate_ref`, `return_ref`, `readback_ref`, `blocker`, `attempts_without_progress`. References nullable until applicable; active/suspended/results retain existing candidate identity. Optional `recovery_ref` preserves a bound recovery record. At most one active implementation; active candidates with unfinished dependencies are suspended. Completed dependencies, admission, result, review and readback required |
| blocker | Null or `owner/recovery_action/evidence_ref`. Stall budget is inherited, cumulative and attributed to affected work; splitting tasks cannot reset it |
| business_proofs | Proven entries only: `criterion_id/work_id/result=PROVEN/baseline_sha/environment/evidence_ref/review_ref`. Unlisted AC remain explicitly unproven in output. Only completed outcome work in the exact AC environment/current baseline can supply business proof; prerequisites cannot |
| last_event | Null only before execution; otherwise `kind` (`stage_return/merge/feedback/resume`) and hashed `record_ref` identifying the actual event |
| reconciliation_ref | Null before reconciliation, otherwise hashed JSON containing `goal_id/event_sha256/observation_sha256/definition_sha256/readback_ref`. Stale/missing reconciliation returns `RECONCILE_GOAL` |

Definition digest per unit is the existing canonical `digest()` of that work item excluding only `admission_ref`. Admission JSON binds `goal_id/basis_sha256/work_id/definition_sha256/decision=approved/stage_intake_ref/authority_ref/review_ref`. Each ref is hashed; stage intake task_id must equal the work item task_id, and Build/Deploy contract requirement_ids/acceptance_ids must include that unit's original R/AC. The work stage and actual intake completion boundary cannot exceed the parent requested boundary. The host must authenticate review/authority and run the existing stage admission checker; hash presence never grants authority.

Return JSON contains `protocol=goal-stage-return-v1/basis_sha256/goal_id/work_id/candidate_ref/definition_sha256/stage/status/evidence_refs/review_ref`. Status is completed/failed/blocked/unknown; raw evidence is nonempty. Complete needs separate independent review plus actual readback. Goal wraps/references the original stage output, PR/quality/main or environment result without rewriting it. Unknown effects request `READBACK_STAGE_RESULT` before retry or unrelated execution. A failed/blocked return requires an explicit blocker until a hashed recovery_ref binds goal_id/basis_sha256/work_id/definition_sha256/candidate_ref/return_sha256/decision=resume/nonempty evidence_refs to that exact original return. Retain the failure and candidate; changing state to active or clearing blocker alone cannot resume it. Recovery does not bypass dependencies, budgets or unknown-effect readback.

Reconciliation `definition_sha256` is `digest({work_id: definition_digest})`. Its `observation_sha256` is `digest({"observations": observations, "proofs": business_proofs, "pending": sorted_pending_decision_ids})`. The host verifies the underlying event/state, records its readback and preserves prior revisions; this is a stale-input check, not authenticated execution.

`control` contains current `basis_sha256/goal_id/state/record_ref`, where state is stopped/running and record_ref identifies actual Human stop/resume authority. Stop returns `STOPPED/NO_ACTION` before live-baseline drift and supersedes continuation/readback suggestions. A later design request does not resume the stopped implementation. Authenticate any running/resume record; no auto-resume service is installed.

## Selection and proof boundaries

1. Stop dominates. Otherwise validate original sources, discovery/architecture, complete inventory, admissions and return bindings.
2. Read back unknown effects first. Reconcile every new return/event and changed observation before selecting more work.
3. Preserve an active candidate; if blocked, suspend it before switching. Reuse suspended candidates once their prerequisites recover; do not create replacement PRs.
4. Select an unblocked admitted unit whose dependencies completed. An unadmitted ready unit requests `ADMIT_WORK_ITEM`, never execution. Existing stage checks and action authority remain required.
5. If all stages completed but business evidence is missing, request `VERIFY_BUSINESS_OUTCOME`. Only all required units, original AC, decisions, integration/target proof and independent review can reach `REVIEW_GOAL_CLOSURE`; it is still a candidate for external verification, never `goal_complete=true`.
6. Request Human/resource recovery only when no independently executable required work remains. Show exact affected units/AC, raw evidence, Owner, options/recommendation and minimum recovery action. An unresolved module obligation remains in the denominator.

Outputs preserve `PASS_STATIC_ONLY`, `authentic_approval/runtime=NOT_VERIFIED`, `execution_granted=false`; examples stay `EXAMPLE_ONLY`. Deterministic checks cannot decide whether decomposition is sufficient, a declared dependency is truthful or a supplied approval/evidence is authentic. Independent semantic review must inspect the original requirements and actual sources. No self-labelled graph or receipt can replace those checks.
