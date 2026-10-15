---
name: sdlc-workflow
description: Orchestrate Intent -> preview-first Design -> approved Plan -> acceptance-driven Build -> independent Test/Review -> authorized Release/Maintain. Route to peer Skills, preserve real project authority and evidence.
---

# SDLC Workflow — cs-biz Orchestrator

This is the only stage entrypoint. Read AGENTS.md, doc/workflow/project-profile.md and the current task authority first. Do not create a new status database or override the project's CI and approval system.

## Peer ownership
- `prompt-optimizer`: IntentSpec, decision tree, objective/constraints/human questions.
- `sdlc-design`: journey, flow, preview demo, Human review and controlled multi-round revision; requirements/design approval.
- `task-progression`: original-goal preservation, slice admission, remaining outcomes, failure and handoff.
- `sdlc-build`: one demonstrably unproven outcome at a time, acceptance-first XP/TDD or suitable alternative, scope/behavior preservation, layered CI.
- `engineering-language`: wording clarity at handoff; not approval.
Do not duplicate sub-skill policy inside this coordinator.

## Stage transitions (gates, not automatic permissions)
1. INTENT: raw request -> IntentSpec; Decision Tree READY means only review-ready. Human acceptance is needed for material business goals.
2. DESIGN_PREVIEW: approved Intent -> user journey, executable/nonproduction preview and Mermaid flow; Human reviews current exact version. Feedback loops before detailed design.
3. DESIGN: requirements.md, design.md, R/AC and invariants; exact approved Design revision with preserved-asset checks.
4. PLAN: approved design -> smallest independent slices, allowed/forbidden paths, dependencies, tests, risks and rollback. Human approval binds version when required.
5. BUILD_LOOP: run task-progression admission and sdlc-build microcycles; RED is a real behavior failure, GREEN fulfills locked AC, REFACTOR preserves behavior. Existing verified/static/preserve modes do not manufacture RED. Fast -> targeted (if UI) -> qualifying Full on one frozen candidate, per cs-biz No-Stall rule.
6. TEST/REVIEW: independently compare source, acceptance, candidate SHA, negative cases, protected behavior and actual results; PASS/FAIL/INCONCLUSIVE. Implementer cannot approve itself.
7. RELEASE/MAINTAIN: only with separate explicit authority, real CI/review receipt, rollback and deployed monitoring. Merge, main verification and production outcome are different states.
At every stage check prior artifact digest and current approval. Any upstream semantic change invalidates affected downstream approvals and evidence; must be re-reviewed.

## Failure routing
Evidence missing -> bounded readonly research; design change -> sdlc-design; goal/scope/rights -> prompt-optimizer or Human; implementation error -> bounded Build repair; infrastructure unavailable -> WAITING/UNVERIFIED; budget exhausted/unknown side effect -> stop & handoff. New run IDs do not reset root task budget. Avoid spinning or repeated terminal CI polling.

## Safe launch
`$sdlc-workflow` reads current records before acting. Requests for design only cannot grant Build. A request for full delivery is not implicit merge, external action, production deployment, exception to policy or permission to weaken locked acceptance. Human approval requires trusted external identity/version, not a JSON field authored by the agent.

## Repository checks
`python3 doc/ci/check_sdlc_workflow.py --mode structure`
`python3 doc/ci/check_sdlc_workflow.py --mode intent --task .sdlc/tasks/<id>`
`python3 doc/ci/check_sdlc_workflow.py --mode design --task .sdlc/tasks/<id>`
`python3 doc/ci/check_sdlc_workflow.py --mode build --task .sdlc/tasks/<id>`
Checks fail closed for missing artifacts/invalid scope; they cannot authenticate approvals, prove semantics or substitute for existing CI.

## Original runtime compatibility
Before claiming an original v0.4-like gate, read `doc/workflow/ORIGINAL-RUNTIME-VALIDATION.md`. For original-form artifacts use, in stage order: `check_intent_v02.py`, `check_revision_v04.py`, `check_build_v04.py`. The earlier `check_sdlc_workflow.py` file validates a **different lightweight task schema** and is NOT original v0.4 workflow equivalence. The original revision CAS store, full workflow gate, actual GitHub verifier, and all inherited regression fixtures remain separate work. Never infer actual Human acceptance from local hashes.
