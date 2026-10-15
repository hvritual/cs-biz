---
name: sdlc-design
description: Design a complete solution and navigable journey preview inside the existing project frontend, with b2b-product-ux, source-grounded conditions and versioned Human feedback. Output a design handoff; production implementation and delivery checks belong to the executing model.
---

# SDLC Design — solution and project Preview Loop

Read accepted Intent from prompt-optimizer, its ADR/doc evidence, condition/preference decisions, authorized task scope and doc/workflow/INTENT-DESIGN-WORKFLOW.md. For UI work read doc/design/desktop-ui.md and ../b2b-product-ux/SKILL.md with its cs-biz project binding. Unknown facts stay unknown. Missing design-scope write authority permits read-only analysis, not frontend edits.

## Each design round
1. Reconcile original outcomes, current source and knowledge supersession. Derive role/task/entity/workflow/state/action/risk/decision; identify system/human/mixed work. System handles authorized deterministic work, Human handles material judgment and necessary confirmation.
2. Draft solution.md (background, impact, objective, conditions, alternatives, module flow and chosen approach), requirements.md (R/AC/invariants) and design.md (interaction/contracts/reuse/file boundaries). Keep distinct purposes and a single source per business rule.
3. Produce journey.md, flow.mmd, stable Screen/State IDs, key operations, empty/denied/error/partial/unknown/recovery states. Use the existing UX analysis template; evaluate nine dimensions without invented efficiency scores or claimed API truth.
4. For batchable work, evaluate pasted text/CSV import for rapid **selection** and explain any rejection. Design parsing, normalization/deduplication, scoped exact matching, unmatched/ambiguous/invalid rows, explicit final selection, impact/necessary confirmation, per-item partial/unknown outcomes and safe recovery. Text is data; selection never executes. Do not bypass tenant/permission checks or invent retry/rollback contracts.
5. Add Preview demo in the existing frontend application on a design branch/worktree. Reuse shell/routes/tokens/i18n/services/components; isolate fixture writes and gate preview from production builds. Do not build a separate application or use only demo.html/screenshots. Mark simulated capability in reviewer context; keep product copy in business language.
6. Have the executing model run the bounded project preview and targeted browser journey under its existing authority; collect current source hashes, candidate commit, route/command, scenarios, screenshots and logs. This verification is the model's work, not a workflow CI scheduler. Runtime unavailable => NEEDS_EVIDENCE, never a fake screenshot/receipt.
7. Present solution + design + project preview **together in the same round**. Human confirms actual usable conditions/preferences, complete journey and recovery. Record exact-version feedback and approval; partial approval cannot become complete Design approval. Use engineering-language before review, never to rewrite raw/approved meaning.

## Controlled revisions
Locate feedback by base revision/hash, stable object_id and scenario/page/state; coordinates alone are insufficient. Obsolete base => NEEDS_REBASE. Freeze raw feedback, exact targets/allowed files, intended deltas, preserved objects/behavior and checks before editing.
Seal rounds/rNNN assets and source snapshot refs in Git/protected history; never overwrite old rounds. Compare against original preservation anchor and approved feedback, not only the previous round. Local digests do not enforce immutable history or authenticate Human identity. Goal/rights/acceptance meaning changes return to optimizer/Human.

## Mandatory handoff
Deliver same-version solution.md, requirements.md, design.md, journey.md, flow.mmd, ux-analysis.yaml, project preview source/entry/reproduction/scenarios/runtime evidence, traceability, knowledge/conditions/preferences and exact-version Human decision reference in design-loop.json. Non-UI tasks must explicitly justify UI/UX inapplicability; they still deliver the solution and technical flow, never fabricate an interface.
Persist approved references in the existing doc/tasks record, not only ignored .sdlc cache. Retain unresolved prerequisites with owners and implementation blockers. State DESIGN_HANDOFF only after design-blocking decisions are resolved and the complete round is reviewed. Static validation cannot grant approval.
The executing model receives R/AC, preserved behavior, allowed/forbidden paths, resources/risks, verification suggestions and separate execution authority. It owns implementation, fact-checking and delivery gates outside this workflow using task-progression/sdlc-build; no self-approval, auto Full, merge or deployment.

## Compatibility
Use doc/ci/check_design_workflow.py for intent-design-v2. Historical controlled-revisions-v1 ledgers use check_revision_v04.py; earlier lightweight artifacts use check_sdlc_workflow.py --mode design. Preserve sealed history and do not mix formats. The original CAS writer and authenticated external evidence adapters remain unimplemented; a local PASS is never Human approval or business completion.
