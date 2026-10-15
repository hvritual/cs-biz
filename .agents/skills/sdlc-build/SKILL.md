---
name: sdlc-build
description: Deliver approved design outcomes through acceptance-driven, short Build loops with XP/TDD, layered checks, scope protection and independent verification. Uses task-progression and the repository's own CI authority.
---

# SDLC Build — acceptance-driven short delivery loops

## Execution responsibility outside the design workflow
The executing model invokes this Skill after the Intent/Design handoff under separate, already granted implementation authority. It owns planning, implementation, verification and gates; sdlc-workflow does not schedule Build/CI. Preserve the approved solution and in-project preview bindings. Returning a design handoff does not mean business delivery is complete.

## Inputs and authority
Read AGENTS.md, project-profile.md, current approved Design and locked Acceptance, approved implementation scope, and task-progression. If there is no approved implementation slice, perform read-only assessment and propose the slice; do not claim implementation authorization. Do not substitute a locally generated approval.

## Main loop: close one unproven acceptance gap
1. Reconcile via task-progression. Enumerate every approved R/AC and protected behavior; locate current evidence. Choose the smallest independent unproven outcome, not the easiest file.
2. Establish evidence: observable result, relevant negative case, existing capability, correct test entrypoint, exact allowed/forbidden paths, environment and reviewer exit. If already satisfied, collect current proof and do not manufacture code changes.
3. Select loop mode based on actual work:
   - tdd: new behavior or reproducible defect: locked acceptance -> legitimate RED -> minimal GREEN -> refactor only when warranted -> focused regression.
   - preserve: behavior-neutral refactor: capture existing behavior baseline -> modify -> regression/equivalence.
   - static: documentation or declarative change: baseline -> change -> structure/compatibility/relevant checks.
   - existing_verified: no source change; run current acceptance and record evidence.
   - harness_required: no valid test path; build an authorized verification seam first, without inventing successful behavior.
4. A valid RED is an assertion that fails for the target missing behavior. Dependency failure, compiler breakage or credential absence is not RED. Preserve test identity/source hash for a micro-cycle; new tests may be added in later cycles.
5. Run focused checks in isolated execution context before project Fast; only after passing applicable targeted checks create a candidate, then stop at WAITING_HUMAN_FULL until Human chooses RUN_FULL, a valid governance-only WAIVE_FULL or DEFER. A waiver is not a passing Full test and needs exact-SHA Human approval with independent review. Full CI must be started explicitly by Human from GitHub Actions for exact PR/SHA, never by Agent. External result/receipt is read-only evidence. Never use full remote CI as an edit debugger.
6. At each candidate compare newly delivered result AND protected prior behavior. Independent verifier reads approved contract, exact diff, tests, logs/runtime and negative cases; implementer self-report is not accepted evidence.
7. Close the slice only if current evidence covers AC and protected invariants, there is no scope leak and required checks are valid. Reconcile remaining R/AC and repeat or hand off to review.

## Failure router
- Known implementation defect -> bounded targeted repair and original regression.
- Incorrect test -> independent evidence and governed acceptance amendment; do not weaken original expectation privately.
- Environment/tool unavailable -> WAITING/UNVERIFIED with owner and recovery condition.
- Design discrepancy -> Design Loop; changed goal/authorization -> Prompt Optimizer/Human.
- CI terminal failure -> collect actual job/log root cause; don't poll a terminal run or relaunch same candidate without justified change.
- Unknown effect after timeout -> authoritative readback, no blind replay.
- No new useful diagnostic information or budget exhausted -> stop affected work and escalate with evidence. Reuse project retry policy, never override it.

## Evidence requirements
Each slice records approved Design ref/hash, R/AC IDs, risk T0-T4, mode, exact candidate SHA/tree, modified paths, testing command, environment, run/attempt ID, test log or artifact, regression status and reviewer outcome (PASS/FAIL/INCONCLUSIVE). An agent-authored JSON PASS or stale SHA is not evidence.

## Hard boundaries
Executor must not silently edit approved Intent, Design, Acceptance, CI judges, protection rules or project budget. Changes to authoritative criteria must be reviewed separately. The project retains its own commands, workflow policy and completion authority. A green Fast is not a delivery gate; a verified slice is not a merged/deployed product.

## Handoff
Use the project task template. Report: original required outcomes, approved scope changes, completed AC with evidence, remaining AC, candidate and real qualification, blocker, one authorized next action.

## Original-format proof adapter
For v0.4 `build-loop.json` use `python3 doc/ci/check_build_v04.py --task .sdlc/tasks/<id>`. It checks current Design/Plan bindings, R/AC coverage, TDD phase identities, allowed paths, final candidate and declared CI references, with cs-biz non-TDD modes. The result is `PASS_STATIC_ONLY`, not authenticated CI or independent review. Project No-Stall remains the real qualification authority. See `doc/workflow/ORIGINAL-RUNTIME-VALIDATION.md`.
