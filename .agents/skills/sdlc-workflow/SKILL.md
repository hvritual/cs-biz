---
name: sdlc-workflow
description: Turn raw intent into a source-grounded IntentSpec and reviewed solution, design and in-project preview. For a whole module, freeze complete acceptance and route authorized continuous issue delivery to intent-to-outcome-closure; implementation and delivery remain the executing model's responsibilities.
---

# SDLC Workflow — Intent / Design

Read AGENTS.md, doc/workflow/project-profile.md, doc/workflow/INTENT-DESIGN-WORKFLOW.md and the actual task first. This is the sole entrypoint for **intent/design**, not a Build scheduler or approval authority. Reconcile original outcomes through task-progression at start/resume and handoff. Preserve existing Goal/Resume references when present; never reset authority or original AC.

## Ownership
- `prompt-optimizer`: immutable raw request, bounded ADR/doc/source discovery, conditions/resources/preferences, decision tree and traceable IntentSpec. READY means review-ready.
- `sdlc-design`: solution + requirements + design + journey/flow + current-project Preview demo, controlled revisions and exact-version Human review.
- `b2b-product-ux`: eight-dimensional task context, nine UX obligations, safe automation, text/bulk selection, effects and recovery; use for UI tasks.
- `engineering-language`: expression review only; preserve meaning and raw text.
- `task-progression` and `sdlc-build`: reused by the **executing model outside this workflow** for implementation and evidence. Do not dispatch Build, tests, Full, merge or release as workflow stages.

## Transitions
1. RAW_CAPTURED: preserve exact source text/ref/hash and literal constraints before rewriting.
2. OPTIMIZE: gather bounded relevant ADR/doc/current-source evidence. Distinguish accepted/proposed/superseded/conflict; historical source is not current capability. Construct decision nodes with alternatives, recommendation, consequences and answer provenance. First resolve facts that the system can inspect; ask Human only for missing material choices or unavailable inputs.
3. INTENT_READY: output objective/outcome, scope/exclusions, resources and available/missing/unknown conditions, preferences, authority, R/AC and raw-to-Intent trace. Obtain material Human decisions under existing authority. No unresolved blocking choice may be hidden by an assumed preference.
4. DESIGN_REVIEW: hand approved Intent to sdlc-design. Each round includes a designed solution and project-based visual demo together. UI previews live in the existing frontend application, using its shell/components/tokens/i18n; standalone demo.html or screenshots alone do not qualify. The executing model prepares and verifies preview runtime under authorized design scope.
5. REVISION: retain exact feedback target, sealed baseline, allowed change and preservation anchor. Obsolete feedback => NEEDS_REBASE. Goal/rights/meaning change => optimizer/Human.
6. DESIGN_HANDOFF: record the same-version full design pack, preview reproduction/evidence, Human decision ref, R/AC, invariants, allowed/forbidden paths, resources, risk and separate execution authority. Partial review or missing conditions/evidence cannot be labeled handoff-ready.

## Executing model after handoff
Continue authorized work using task-progression and sdlc-build: slice plan, implementation, actual verification, Fast/applicable Targeted, independent review and evidence readback. These are not workflow stages, and are not delegated to Human as ordinary engineering work. Design disagreement returns to Design Loop; intent/authority disagreement returns to optimizer/Human. Follow the current project risk-based delivery policy, separate merge/deploy authority and exact-SHA evidence; do not infer a universal Human Full wait from legacy records.

## Whole-module acceptance and continuous delivery
For “finish all issues in this module”, load ../intent-to-outcome-closure/SKILL.md and doc/workflow/MODULE-OUTCOME-CONTRACT.md. Before autonomous implementation, freeze the complete issue inventory (including closed and blocked), original requirement/design/state-to-AC coverage, observable pass/fail and negative/recovery conditions, module integration exit, dependencies/resources, allowed paths, existing budget, exact-version review and separate execution authority. Reuse valid confirmed decisions; return missing material acceptance definitions to Human, never invent them. The index must not redefine approved source documents.

Have an independent reviewer reverse-check the original design for missing obligations, then run check_module_workflow.py. Its PASS_STATIC_ONLY/READY_STATIC/CLOSURE_CANDIDATE_STATIC never authenticate approval, runtime or permission. Use the actual approved locked commit and fresh authoritative main/Issue/PR/evidence readback; source, body or inventory drift requires reconciliation and, when meaning changes, a new approved revision.

After DESIGN_HANDOFF, the closure coordinator continuously selects one authorized unblocked issue, invokes the existing executing-model delivery loop, verifies its full acceptance and main, refreshes observations and advances without routine “continue” prompts. Keep independent branches executable and blockers visible; scope/authority/meaning changes return to Intent/Design/Human. All issues closed does not prove module completion: require current evidence for every original AC and the integrated journey at the agreed boundary. This adds a coordination wrapper, not Build stages inside intent-design-v2 or an unattended service.

## Checks and compatibility
`python3 doc/ci/check_sdlc_workflow.py --mode structure` checks wiring.
`python3 doc/ci/check_design_workflow.py --task <task-dir> --repo-root .` checks new intent-design-v2 handoff references; not semantic correctness, authenticated approval, real CI or business success.
Read doc/workflow/ORIGINAL-RUNTIME-VALIDATION.md for historical artifacts. Existing lightweight `--mode intent|design|build` and v0.2/v0.4 validators remain compatibility tools; never mix formats or allow an old standalone preview to satisfy new UI handoff. No parallel task database, self-approval or automatic Issue-to-Codex promise.
