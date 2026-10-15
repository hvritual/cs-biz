---
name: sdlc-design
description: Preview-first Design Loop with Human review, versioned feedback targets, frozen scoped revisions and preservation evidence. Do not implement production code.
---

# SDLC Design — preview and controlled revision

Read accepted intent from prompt-optimizer, project design standards and approved task scope. UI design for cs-biz must use doc/design/desktop-ui.md. Keep design exploration distinct from changes to approved work.

## Initial Design Loop
1. Extract user journey, current and target states, constraints, decisions and boundary.
2. Produce a navigable **nonproduction** preview/demo, Mermaid flow, key page/operation states, failure and recovery examples. Identify real-vs-Mock evidence clearly.
3. Run engineering-language review on preview wording, preserve identifiers and decisions.
4. Ask Human to review these preview assets BEFORE writing full requirements/design.
5. If Human rejects, enter Revision Loop with explicit feedback. If Human approves exact preview version, produce requirements.md and design.md, including numbered R/AC, invariants, paths, API/data/tenant contract and failure behavior.
6. Check detailed design completeness and obtain separate approval; preview approval is not final Design or Build authorization.

## Revision Loop — no rewriting from scratch by default
- Locate feedback by base revision, snapshot SHA256, stable object_id and scenario/page/state. Coordinates alone do not identify an object. Feedback for an obsolete revision => NEEDS_REBASE; do not apply blindly.
- Freeze a change contract BEFORE editing: raw feedback, target elements, exact allowed files, preserved behavior/objects, expected changes, acceptance checks and impact edges. Do not weaken inherited preservations.
- Use a new revision directory `rounds/rNNN/` containing immutable preview, journey, flow and design-object manifest. Never overwrite or retroactively edit a sealed prior round.
- Compare candidate files with a trusted baseline and original preservation anchor, not only the immediately previous revision. Review the changed scope and previously accepted feedback in every following revision.
- Collect feedback-specific verification and independent Human decisions bound to the revision/content hash. A checker's word PASS is not proof of user acceptance. Partial acceptance does not approve the complete Design.
- A business/role/authorization or acceptance-meaning change returns to prompt-optimizer; only approved value changes reopen frozen intent.

## Approval and output
Write in current task directory under `.sdlc/tasks/<id>/`; link approved requirements/Design to actual task authority in doc/tasks, do not create a duplicate status registry. Attach snapshot manifests and SHA256; file immutability requires protected history/permissions beyond local hashes.
Report: preview version, feedback location, changed/preserved items, verification evidence, unresolved decisions, Human approval reference. No screenshots/automated visual tests claimed unless they were really run.

## Original controlled-revisions compatibility gate
When `design-revisions.json` uses `controlled-revisions-v1`, run `python3 doc/ci/check_revision_v04.py --task .sdlc/tasks/<id>`. It checks ledger and snapshot integrity, parent lineage, allowed changes, frozen original preservations and acceptance. It is read-only: it does NOT provide original `revision_store.py` CAS writer; manual checks remain `NEEDS_EVIDENCE`. Do not mix this format with the older lightweight `design-preview.json` validator or rewrite sealed rounds.
