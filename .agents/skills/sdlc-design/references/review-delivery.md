# Requirement-originator journey experience

Use for UI Design UX/Preview and same-version Human review. Keep the authoritative task and raw requirements; `review-plan.json` and `review-delivery.json` are bound assets inside that task, not another task database. Preserve sealed rounds. Apply this contract to new rounds; old records retain their original workflow version and are never rehashed into current approval.

Human is the requirement originator. Frontend review means that person experiences the planned user journeys as they would use the released product. The Design loop is: refine requirements → plan user journeys → design frontend interfaces to the requirements → output the experience operation flow → originator experience/feedback → affected revisions. The Agent prepares and checks the experience; the originator supplies business feedback and design confirmation.

## Product experience and separate operation flow

Use the intended released appearance, labels, normal entry/navigation, permissions, inputs, confirmations, transitions and business results. Product UI contains only product content and guidance relevant to the current business decision. Keep review banners, journey IDs/action counts, scenario/role/page controls, fixture accounts, simulation commentary, engineering status and evidence instructions out of the product.

Deliver the operation flow outside the product: business goal, normal entry, necessary account/access/input, ordered role actions and expected visible results, plus relevant business recovery. The originator follows it without engineering assistance. Candidate hashes, coverage counts, setup/faults, commands, receipts, proof limitations and workflow status belong to internal Agent records. The Agent records actual feedback and derives version/coverage bindings; the originator does not fill technical forms or execute engineering tests.

Bind `experience.audience=requirement_originator`, `interface=released_product`, `guidance_location=outside_product` and hashed `guide_ref`. Browser observation substantiates product interface, no review chrome and no unrelated engineering copy. Presentation binds the same operation flow. Approved feedback identifies the requirement originator; declarations alone do not authenticate the person or browser.

## Plan the Human review before building the Preview

At capture/intent identify the reviewing actor, task goal, final review environment and access needs, original requirement denominator, questions requiring judgment, existing decisions, and final-entry browser capability. Resolve tooling early; missing browser access is an executor/resource gap, not Human's UI-debugging task. At UX bind the plan to the intake raw asset, map every original requirement to task IDs, and obtain independent original-coverage review before implementation. The Agent checks meaning against the original sources; a set of IDs alone cannot prove completeness.

Use [review plan template](../templates/review-plan.json). The current plan/delivery protocols are `design-review-plan-v2` and `design-review-delivery-v2`. Do not migrate sealed v1 rounds or approvals; recover them with their recorded package commit. Current unapproved drafts must receive a new revision and invalidate affected evidence explicitly.

## Human follows the complete journey as the actual roles

The experience unit is the complete business journey with its applicable product roles. The requirement originator follows the planned role actions and relevant business branches through normal product UI. Agent rehearsal cannot replace this experience. Technical negative tests, fault setup, regressions and evidence bookkeeping remain Agent work.

For each role record account context, Tenant AND Scope, permitted business navigation and task bindings. Enter through normal sign-in, a legitimate invitation or account-recovery/public entry, then use product navigation. An isolated identity adapter uses the selected account's stored grants. Record implementation/proof boundaries internally; they do not become product banners or operation-flow commentary. The design environment remains isolated from production even though the intended product experience is the same.

Each journey records its goal, entry, executor-owned fixture preparation, ordered walkthrough, business object inputs/outputs, cross-role handoffs, branches and observable end result. Login, organization selection, navigation, input, confirmation, result access and handoff are explicit actions. A newly created organization, invitation, original operation, release plan or support reference must carry the **same actual identifier** into later steps and the receiving role's session. Do not substitute a seeded equivalent record. Include each role's normal login/identity verification after handoff and the legitimate delivery channel. Joining the role grants nothing until normal acceptance/authorization succeeds.

Prepare accounts, baseline data and reproducible failures outside the Human path. A branch names its triggering condition and executor preparation, then replays the relevant prefix from the same normal entry. Failure injection is not user work. Human must not open a scene tool, use a page picker, edit storage, force a URL/state, reset midway, or ask an engineer to move between steps. Legitimate invitation links are product entry points. Read-only/denied roles must reach a safe, understandable end through normal navigation without fabricating an allowed write.

Each task still defines actor, goal, entry context, explicit preconditions, separately counted normal paths (`paths`: id/method/steps), typed failure/recovery paths (`recovery`: id/kind/condition/steps), terms, images, selection and results. Journeys reference these paths without replacing them. `walkthrough` nodes are single `user_action`, `task_path` expansions, or visible `handoff`; `consumes`/`produces` bind business object keys. Branches bind `from_step`, condition, executor preparation, walkthrough and end result. All original journey IDs, tasks and normal/recovery paths remain covered. The plan is planned behavior, not runtime proof.

Record cumulative actions for each full normal route and each prefix-plus-branch route. A full journey can contain multiple independently meaningful tasks and exceed four actions; the existing four-action limit applies to each original business task and recovery. Do not split one promised outcome to meet it, omit entry/navigation effort, or treat a pre-opened screen as end-to-end completion. Task efficiency and complete-journey continuity are separate obligations.

The originator judges whether the experience meets the need: discoverability, terminology, roles, continuity, effects, results and recovery. Deliver business operation steps with necessary access, inputs/templates, handoffs and expected results. The Agent prepares branch conditions, records natural feedback and maps it to the affected version/journey/step internally. Record actual experience coverage honestly; partial experience stays partial. Prepare material business/aesthetic choices separately when needed.

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

Only a final-entry browser observation of the delivered URL, access/actor and exact deployed/local version can support availability. Source CI, native deployment success, hash equivalence, screenshots alone and offline reconstructed entry probes are separate evidence. Observe the actual normal actions and required recoveries, image guidance, all bulk methods, selected count/details and result recovery. In addition, journey_runs must reproduce every ordered full walkthrough and branch prefix, with role sessions, actual actor per action, original-object bindings and no fixture controls/reset. Isolated task_runs alone are insufficient. Keep missing/failed/contradictory evidence as a blocker; a disclosure paragraph cannot upgrade it to availability. The executor owns any automatic final-entry tests within existing authorized capability; missing tooling does not grant browser installation or access bypass.

Internally bind delivery and originator feedback to the exact plan and product version. Deliver the working entry, necessary access and separate business operation flow; keep engineering status/proof outside that flow and the UI. Revalidate material target/configuration changes and retain actual delivery records. No separate acknowledgment is required; natural feedback enters the loop directly. No response remains pending. The Agent derives receipts from actual events and feedback; fields alone cannot authenticate runtime, identity, comprehension or delivery.

## Ownership and continuation

Goal owns original outcome and admission. Design refines requirements, plans journeys, designs interfaces and outputs the operation flow. Preview prepares and checks the product experience. Independent review checks coverage and evidence internally. Human is the requirement originator who experiences the product and decides whether it meets the need, including business meaning, aesthetics and material choices. Engineering qualification and debugging stay with the Agent.

Every local result returns to Goal. CONTENT_COMPLETE must not become parent completion; missing tooling blocks only affected work. After actual presentation wait for the requested design judgment, with a concrete next action rather than another autonomous phase. Human stop dominates. On feedback bind the same candidate and affected requirement/task/screen IDs; repair only affected work/dependents, retain unaffected evidence with explicit version equivalence, then reobserve invalidated paths. Respect repeated-failure limits and existing CI risk policy. Bounded Preview checks and merge Full serve different claims; neither replaces the other. No new daemon, notification service, approval prompt or deployment authority is created.

The read-only consistency implementation is [review_checks.py](../scripts/review_checks.py); synthetic fixtures are generated by [create_review_examples.py](../scripts/create_review_examples.py). Run focused negative tests before the existing package/governance checks. Synthetic pass declarations remain examples, never actual browser or Human proof.
