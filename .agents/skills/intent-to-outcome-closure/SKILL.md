---
name: intent-to-outcome-closure
description: Turn business intent or an approved module design into frozen, observable acceptance; discover necessary work, coordinate every required issue within existing authority, and verify whole-module closure. Use for end-to-end outcomes, autonomous module issue batches, missing prerequisites, or diagnosing false completion. Exclude ordinary single-step tasks and unrequested project management.
---

# Intent to Outcome Closure

Operate as a thin coordinator, not a new workflow engine. Make the user's intended outcome, necessary work, authority, and proof explicit. Separate artifact completion from business completion. Never treat this Skill's invocation as additional permission.

## Preserve the invariants

- Define the goal in your own words before proposing or executing work. Preserve the user's intent and expose conflicting assumptions.
- Match authority to the request: analysis authorizes inspection and a proposal; implementation authorizes bounded changes; neither automatically authorizes external writes, merges, deployment, payments, or destructive operations.
- Reuse the project's authoritative PRD, semantic document, issue, acceptance record, and development rules. Add a linked view or missing fields instead of creating a competing specification.
- Derive necessary work from a specific acceptance obligation or evidenced dependency. Keep optional improvements outside the completion boundary.
- Preserve project rules, protected paths, unrelated changes, budgets, data constraints, and required approvals.
- Distinguish intended behavior, observed behavior, and human acceptance. Never promote a design, mock, test pass, merged change, or another agent's summary into stronger proof than it supplies.
- Continue through safe, relevant next steps within authority; do not stop merely because one artifact is finished. Stop at genuine decision, permission, dependency, or validation boundaries.

Read [references/closure-record.md](references/closure-record.md) when forming the contract and maintaining the evidence record. Adapt it to existing project formats; do not require a new saved file for every task.

## Module batch mode: freeze before autonomous advance

For a complete module or all issues in a designed area, read [the module protocol](../sdlc-workflow/references/module-outcome-v1.md) before selecting work. The outer SDLC now has Design, Build and Deploy Agent workflows; its old design-only boundary applies only to the Design subworkflow. The actual Issue/task records remain authoritative; the module contract is a frozen acceptance/index view, never another task database.

1. Read the complete module inventory, including closed issues, explicit exclusions, all pagination and child/dependency links. Discover derived required work from named acceptance obligations. Create missing necessary issues only within existing authority, then reconcile the full inventory before freeze. Never equate all open issues with all required work.
2. Trace original requirement/design/state -> stable AC -> issue -> observation/test -> evidence in both directions. Define actor, Given/When/Then, measurable pass/fail, negative/recovery cases, protected invariants, proof environment and a module integration exit. An independent reviewer checks the original design for missing obligations and vague acceptance; static field presence cannot do this.
3. Resolve material choices and preserve approved definitions. Freeze the same-version sources, membership, graph, criteria, resources, paths, budget and explicit implementation/merge/deploy authority as module-outcome-v1 in the existing doc/tasks module record. Obtain real exact-version approval where required; reuse valid prior authorization rather than repeatedly asking Human. Save its actual locked Git commit. Never approve a changed contract by recomputing its digest.
4. Run check_module_workflow.py against current authoritative observations and the independently read approved lock/main. Treat READY_STATIC as an admission suggestion only. Independently verify snapshot authenticity, scope, resource readiness, approval, actual checks and evidence before acting. A declaration grants no authority.
5. Choose one unblocked required issue, resume an existing candidate first, and route through sdlc-workflow to the required Design, Build and Deploy Agents, or controlled-issue-delivery for the bounded engineering unit. Keep all per-issue gates. After verified merge/readback, refresh the graph and continue to the next authorized required issue without another routine Human continuation prompt. Continue independent authorized branches when another is blocked; keep every required item in the denominator.
6. Reconcile failures, read back uncertain side effects and enforce the existing budget (at most two materially identical failures without new information). Escalate real design/value/exception/authority/irreversibility or stalled-progress decisions with owner, raw evidence and minimal recovery action. No blind retry, polling terminal CI, automatic recurring task or protected-rule bypass.
7. On contract/membership drift, return affected work to Design/Intent and create an approved new revision; never overwrite the sealed version. On main/head/environment drift, invalidate affected evidence and revalidate its current applicability. Close individual issues only after their complete acceptance; close the parent module only after every required criterion and integration outcome has independently inspected current proof at the agreed boundary. CLOSURE_CANDIDATE_STATIC is not verified completion.

This is a model-driven bounded coordinator. It does not install a daemon or promise unattended Issue-to-Codex startup. Missing authentic approval/runtime proof remains NOT_VERIFIED even if all submitted observations say PROVEN. Do not launch implementation batches merely because this Skill was updated.

## 1. Qualify intent, context, and authority

Resolve the business problem, affected actors, expected observable change, operating environment, exclusions, constraints, authoritative project sources, current baseline, and available permissions.

Inspect actual contracts, existing behavior, related work, failure history, dependencies, and applicable repository or service rules before inferring missing work. Record versions, commit IDs, environments, and observation times when relevant. Use configured task-relevant credentials normally; do not extract credentials or bypass an access wall.

Classify the request as analyze/propose, change/build, or continue/verify. Reuse confirmed decisions already available. Ask only for material unknowns that affect the outcome, acceptance, authority, cost, data, security, compatibility, or irreversibility. Provide a recommended route and alternatives, but do not treat silence as approval. Use reversible assumptions only when they cannot change the business contract; label them.

In a non-interactive run, preserve material unknowns as blocked decisions and finish only the safely authorized part. Do not invent a decision or grant yourself permission.

## 2. Establish the outcome contract

State who must be able to do what, under which conditions, and what observable result demonstrates success. Fix the acceptance boundary explicitly: proposal, reviewed design, software validated in a named environment, integrated mainline, deployed capability, physical-device result, or operational business metric.

For each required outcome, define:

- a stable criterion ID and its source;
- preconditions, action, observable result, and required measurement or threshold;
- material failure, permission, and recovery cases;
- the observation method, evidence source, and necessary human acceptance;
- the condition that would falsify the claim.

Include side-effect constraints such as exactly-once confirmation, tenant isolation, retained rights, or rollback only when supported by the intent or system contract. Do not invent prices, payment rules, performance targets, device capabilities, or business policies.

Obtain approval for unresolved business definitions or changed criteria before consequential execution. Do not weaken acceptance criteria after seeing a failing result. Separate corrections to a mistaken measurement from changes to the promised outcome, and retain the reason and approval.

## 3. Build the smallest completion graph

Map every required criterion to the work and dependencies needed to satisfy it. Classify nodes as:

- **Explicit required:** requested directly by the user or authoritative contract.
- **Derived required:** necessary for a named criterion; include the dependency evidence and why omission prevents completion.
- **Optional:** useful but not necessary; exclude from the authorized critical path unless approved.

Record for each required node its deliverable, dependencies, allowed change surface, executor or appropriate Skill, checks, proof, permissions, approvals, and current state. Prefer the smallest independently reviewable slice. Keep unresolved dependencies visible; do not implement replacements for inaccessible systems.

Treat a new repository, external commitment, security policy, paid resource, production mutation, incompatible migration, or protected-path change as a potential scope/authority expansion. Obtain the necessary decision before proceeding. An approval to use recommended defaults does not waive these gates.

## 4. Route bounded work to existing capabilities

- Use `design-journey-screen-pack` for a requested repository-grounded journey review pack. Treat its output as design evidence, not working functionality or human acceptance.
- Use `controlled-issue-delivery` for one approved, independently reviewable engineering unit. Honor its canonical-baseline, review, merge, readback, and closure rules. Do not silently chain unrelated issues; each next unit must already be inside the approved graph and authority.
- Use applicable project Skills, harnesses, and available tools for specifications, implementation, tests, integrations, operations, and physical checks. Read each invoked Skill's instructions and preserve its boundaries.
- If a required capability is unavailable, state the missing capability and use a safe, authorized fallback only when it preserves the acceptance contract. Do not silently replace real verification with a mock.

Give executors only the relevant criterion IDs, baseline, dependencies, scope, constraints, and proof obligations. Request raw artifacts and exact evidence, not just a completion narrative. Do not create parallel specifications or assume delegation transfers permissions. Follow the current environment's delegation rules.

## 5. Advance, check, and repair

Select the next unblocked required node inside authority. Inspect and act; do not repeatedly generate plans while an executable next step exists. After each meaningful result:

1. Read back the changed artifact or external state and assess it against the criterion.
2. Recheck dependencies, baseline drift, scope, side effects, evidence freshness, and approvals.
3. Repair failures inside the approved surface; rerun every invalidated check.
4. Update the graph and evidence record; continue to the next authorized required node.

Treat repeated attempts without new information as a stall. Respect the project's retry, time, and cost limits; if none exist, stop after two materially identical failed attempts and identify a different recovery action. Do not retry a denied permission, bypass a gate, or create a recurring task merely to continue.

If one branch blocks, complete independent authorized branches when doing so cannot invalidate their work or prejudge the missing decision. Never mark the overall outcome complete while a required branch is unresolved.

## 6. Prove closure at the agreed boundary

For every required criterion, inspect independently checkable evidence tied to the exact delivered version and target environment. Capture the source, observation method or command, result, time, and relevant identity/version. Prefer reproducible runtime behavior and authoritative system readback to narratives.

Apply these proof rules:

- Use tests as evidence for what they actually exercised. A mock proves only the mock contract; a sandbox does not prove production; desktop emulation does not prove physical hardware.
- Demonstrate user-visible state and required side effects, not only response codes or screenshots. For consequential workflows, check failure and recovery invariants as required by the contract.
- Verify evaluator integrity: inputs and assertions must come from the agreed contract, not merely mirror the implementation. Preserve negative controls where relevant. Do not manufacture expected outputs or edit evidence to pass.
- Treat subagent reports as leads; inspect the underlying artifacts. An additional agent is not independent proof by itself.
- Obtain a separate authorized reviewer when governance requires independent review. Do not self-approve, count the implementer as the independent reviewer, or substitute machine checks for required human acceptance.
- Invalidate affected evidence after version, configuration, environment, or contract drift. Reobserve or rerun; do not reuse stale success.

Declare verified completion only when **every** required criterion has current adequate proof, every required dependency is satisfied, all required checks and approvals passed, and no contradictory evidence remains. At least one direct observation must demonstrate the claimed result at the agreed boundary. If operational improvement needs elapsed time or a baseline, report software readiness separately and leave the business result pending.

Keep criterion states distinct: `PROVEN`, `UNPROVEN`, `FAILED`, `BLOCKED`, or `OUTSIDE_AUTHORITY`. Track work/approval state separately. Human acceptance pending is not acceptance granted.

## 7. Report the actual result

Lead with the strongest state the evidence permits:

- **Verified complete at [boundary]:** all required proof and acceptance exist; name the boundary so the claim cannot imply a stronger environment or outcome.
- **Artifact/software ready; outcome unproven:** delivered work exists, but actual outcome evidence or required acceptance is missing.
- **Partial / repair required:** some criteria are proven; identify the remaining failures.
- **Blocked / decision required:** give the exact blocker, evidence, responsible authority, minimal recovery input, and safely completed work.
- **Already satisfied:** fresh readback proves the agreed outcome; do not create redundant work.

Summarize the observed result, criterion-to-evidence coverage, exclusions, residual risks, and the single next action. Link existing canonical artifacts where useful. Do not claim deployment, business impact, independent approval, or physical success without corresponding evidence.

## Acceptance checks for this workflow

Before handoff, confirm:

1. Every completion claim names the actor, observable outcome, version/environment, and acceptance boundary.
2. Every explicit and derived required node maps to a criterion, and every derived node has a necessity rationale.
3. Every required criterion has proof or an explicit non-complete state; there are no silent skips or unsupported stronger claims.
4. Every executed mutation was inside the request's scope and permissions, with required approvals obtained.
5. Every blocker has an owner/authority and concrete recovery action; optional work did not expand the critical path.
6. The user need not infer what remains unfinished from an artifact list.

For the first three real uses, ask for human review of missing mandatory work, overreach, evidence quality, and remaining false-completion claims. Treat this as calibration, not proof of correctness from three successes.
