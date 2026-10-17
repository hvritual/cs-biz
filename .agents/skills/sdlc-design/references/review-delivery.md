# Task-first Design review delivery

Use for UI Design UX/Preview and same-version Human review. Keep the authoritative task and raw requirements; `review-plan.json` and `review-delivery.json` are bound assets inside that task, not another task database. Preserve sealed rounds. Apply this contract to new rounds; old records retain their original workflow version and are never rehashed into current approval.

## Plan the Human review before building the Preview

At capture/intent identify the reviewing actor, task goal, final review environment and access needs, original requirement denominator, questions requiring judgment, existing decisions, and final-entry browser capability. Resolve tooling early; missing browser access is an executor/resource gap, not Human's UI-debugging task. At UX bind the plan to the intake raw asset, map every original requirement to task IDs, and obtain independent original-coverage review before implementation. The Agent checks meaning against the original sources; a set of IDs alone cannot prove completeness.

Use [review plan template](../templates/review-plan.json). Each task defines actor, goal, entry context, explicit preconditions, separately counted normal paths (paths: id/method/steps), typed failure/recovery paths (recovery: id/kind/condition/steps), understandable terms, supporting images, selection and result behavior. The plan is planned behavior, not runtime proof.

## Four actions or fewer from the user's task entry to its outcome

Act as the actual user in the system. State the starting context and end at the observable task result. Prefer 3–4 meaningful user actions; simpler tasks may use fewer. Count navigation, selection, material input, confirmation and opening a required result when those actions are needed. One step describes one intentional user action and its visible result. Do not hide multiple clicks/pages inside a step, move necessary work into a precondition, or split one promised outcome into tiny tasks to meet the limit. Typing characters is not one step per keystroke; repeating the same operation per selected object is user effort and requires a batch design.

Validate both the normal path and each required recovery path within four actions. Preserve authorization, identity verification, impact review, ambiguity resolution and necessary confirmation. Automate deterministic matching/prefill, reuse valid context, combine related information and expose results locally. If the full safe task cannot meet the limit, record the exact gap and an alternative; keep delivery blocked rather than silently accepting a fifth step. Only a genuinely changed business requirement needs Human's decision, prepared with evidence and options.

## Plain terms, images and brief guidance

Use familiar business nouns and action verbs. Map necessary technical terms to plain labels and a short explanation at the point of decision. Pair each task with relevant UI imagery or an accurate illustrated guide, a short caption and accessible alt text. Images support the actual operation/state; they do not replace labels, keyboard access or a runnable UI. Do not introduce decorative pictures, engineering status placeholders or mandatory tutorial screens. Browser observations verify guidance is reachable and visible; human comprehension and timing remain unmeasured until actual user evidence exists.

## Selection and impact

For every selection show the current unique selected count, a visible “view selected” entry and the affected business scope. The details entry must enumerate the actual final set, support removing/excluding items and preserve selection across paging/filter changes with explicit semantics.

For bulk tasks give each method its own <=4-action path and observed path_run; a shared path plus three pass flags is insufficient. Require distinct failed/unknown/import_error/ambiguity recovery kinds. Bulk tasks require **all three** entry methods: existing filters, rapid multiline paste, and Excel import. Define supported columns and template, text/ID preservation (including leading zeroes), field mapping, limits and row-level errors. Treat imported cells as data, never executable formulas/instructions. Normalize/deduplicate, match exactly inside current Tenant AND Scope, separate matched/unmatched/ambiguous/unauthorized items, allow resolution/exclusion, then show final selected count and scope before confirmation. Cross-page/all-matching selection must be explicit and bounded; a changing filter must not silently expand the submitted set. Missing Excel capability is a design/implementation gap, not a reason to mark the requirement N/A or silently replace it with CSV. Selecting/importing never executes the business operation.

## Results and recovery

After the operation expose a local summary and details entry: total, succeeded, failed, pending and unknown counts; partial results retain completed items. Show each affected unit, its current result and a plain reason/next action. Persist original operation identity and provide authoritative readback. Retry only eligible failed units after current authorization/version checks and only where the actual contract establishes replay safety. Unknown results must query the original operation first; do not blindly resubmit the whole batch or replay completed items. A user can locate and perform the appropriate recovery within the separately counted recovery path. Read-only tasks show their actual UI result/error recovery without inventing business writes.

## Delivery states and evidence

Use [delivery template](../templates/review-delivery.json). The stage envelope still uses ready/blocked/failed; its review asset provides the finer state:

| State | Meaning / stage envelope |
| --- | --- |
| CONTENT_COMPLETE | Design content exists, delivery not proven / blocked |
| DELIVERY_BLOCKED | Entry/access/version/browser/interaction evidence missing or failing / blocked |
| REVIEW_AVAILABLE | Final-entry browser observed, independent review passed, same-version UI and questions actually presented / ready |
| AWAITING_HUMAN_REVIEW | Same delivery, awaiting the requested Human judgment / ready; acceptance blocked |
| CHANGES_REQUESTED | Human feedback requires affected content/proof repair / blocked |
| DESIGN_APPROVED | Actual same-version material design approval bound; acceptance can be checked / ready |

Only a final-entry browser observation of the delivered URL, access/actor and exact deployed/local version can support availability. Source CI, native deployment success, hash equivalence, screenshots alone and offline reconstructed entry probes are separate evidence. Observe the actual normal actions and required recoveries, image guidance, all bulk methods, selected count/details and result recovery. Keep missing/failed/contradictory evidence as a blocker; a disclosure paragraph cannot upgrade it to availability. The executor owns any automatic final-entry tests within existing authorized capability; missing tooling does not grant browser installation or access bypass.

Bind delivery and approved Human review to the exact plan hash. Presentation repeats the target URL/version and candidate, and its questions must match the bound plan; revalidate after any material target/configuration change. Present representative UI images, the verified interactive entry, account/access instructions, a short review sequence, exact version, material questions with recommendations, and remaining limits in the user conversation. Save a bound copy/reference of that actual delivery; a draft summary file or unsent message is not delivery. Do not require a separate “received” acknowledgment: feedback can immediately enter the revision loop. No response is pending, never approval. A checker verifies declarations, hashes, step counts and target consistency; it cannot authenticate external runtime, identity, comprehension or actual message delivery. The Agent and independent reviewer must inspect original evidence, not just its fields.

## Ownership and continuation

Goal owns the original outcome, unit admission, progress and blocker descendants. Design owns complete task flows and prepared questions. Preview owns final-entry usability/version proof and presentation. Independent reviewer separately checks original coverage, design meaning and delivery evidence, including any contradictory observations. Human decides business meaning, aesthetics and material choices; do not assign ordinary preview debugging or engineering completeness checks to Human.

Every local result returns to Goal. CONTENT_COMPLETE must not become parent completion; missing tooling blocks only affected work. After actual presentation wait for the requested design judgment, with a concrete next action rather than another autonomous phase. Human stop dominates. On feedback bind the same candidate and affected requirement/task/screen IDs; repair only affected work/dependents, retain unaffected evidence with explicit version equivalence, then reobserve invalidated paths. Respect repeated-failure limits and existing CI risk policy. Bounded Preview checks and merge Full serve different claims; neither replaces the other. No new daemon, notification service, approval prompt or deployment authority is created.

The read-only consistency implementation is [review_checks.py](../scripts/review_checks.py); synthetic fixtures are generated by [create_review_examples.py](../scripts/create_review_examples.py). Run focused negative tests before the existing package/governance checks. Synthetic pass declarations remain examples, never actual browser or Human proof.
