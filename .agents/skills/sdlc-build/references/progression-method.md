---
name: task-progression
description: Preserve original outcomes, reconcile live repository facts, classify task risk, prevent silent scope reductions, and hand off exactly one authorized next action. Repository-independent core; consult project-profile.md for local bindings.
---

# Task progression — reusable core

## Authority and boundaries
Read repository AGENTS.md and project-profile.md first. The approved task/Issue/design remains authoritative. This skill never creates another task status ledger, changes acceptance, grants merge/deploy authority, or marks work complete from an agent assertion.

## Triggers
Use at task start/resume, before selecting a Build slice, after a material failure, when closing a slice, and at stage handoff. Do not call on every code edit.

## Reconcile
For module batches, use the frozen module-outcome-v1 index and doc/workflow/MODULE-OUTCOME-CONTRACT.md. Reconcile the full inventory, source/Issue-body/acceptance drift, original approved lock, dependencies, current main proof, resource and authority blockers before selecting the next member. Preserve the fixed denominator; a closed issue or previous candidate PASS is not current proof. Return one next action to intent-to-outcome-closure, which continues all already authorized members without a new routine Human prompt.

1. Read original requested outcomes and approved changes; preserve all outstanding requirements, including blocked and skipped.
2. Read current branch, base, head, relevant implementation, tests and evidence. Identify stale results.
3. Compare requested outcome -> capability/operation -> implementation -> evidence, in both directions. Do not mistake an absent UI wrapper for an absent backend capability.
4. Distinguish source facts from assumptions and unknowns. When an existing implementation already meets acceptance, verify and report it without needless edits.
5. Name one next authorized action with its prerequisite and evidence target.

## Task classification
Classify by behavior, not filenames:
- T0 engineering or docs: structural, compatibility and relevant regression.
- T1 presentation: tokens, layout, visuals, accessibility.
- T2 interaction: state, focus, keyboard, selection, restoration.
- T3 backend capability: tenant/auth, invariants, concurrency, failure/observable effects.
- T4 human business task: Actor -> Object -> Understand -> Action -> Result -> Recovery with end-to-end evidence.
Permissions, tenant scope, money, remote device control, deletion, quotas and asynchronous/external side effects cannot be classed below T3; human-triggered business operation uses T4. Risk unknown -> investigate, never default to low.

## Five integration checkpoints
- reconcile: on start/resume; return actual remaining goals and next action.
- admit_slice: compare locked acceptance, file scope, risk, environment and test ability.
- reconcile_failure: classify behavioral defect / test defect / environment / policy/design conflict / unknown, preserve exact attempt and evidence; consume existing project budget, do not invent a second counter.
- close_slice: show AC evidence, protected invariants and still unfinished work. Slice closed does not imply all outcomes complete.
- handoff: record exact candidate, run evidence, unverified items, blocker and one next action in the project's existing task template.

## Critical prohibitions
Never remove a required goal from the denominator because it is blocked; never replace manage/grant with read-only; do not alter protected acceptance to make code green. Mock and screenshots cannot prove live authorization or authoritative state. A commit, green CI, merge, main verification, deployment and business completion are distinct.

## Progress and stop
Continue autonomous work only inside approved scope and existing budgets. Diagnose repeated failures before further patches. External waiting is not progress, and an unknown external side effect must be read back before retry. Value tradeoffs, irreversible consequences, policy exceptions, or exhausted progress/budget go to Human.

## Output
Record: source goal and approved changes; verified current evidence; task risk; selected slice; protected invariants; coverage of all original outcomes; actual next action and constraints.
