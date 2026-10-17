# Design artifact contracts

`workflow.json` is the Agent's control map. It declares the intake, ordered capability dependencies, explicit bound inputs, payload contracts, required asset roles, optional predicates, resource references and final consumer. Each capability outputs one envelope; the Agent checks it before moving on. The detector does not invoke a model or execute task commands.

Intake: `request.json`. Final file: `design-to-build.json`. Deploy also requires deploy-request.json. The producer's handoff schema is copied byte-for-byte into the consumer's intake contract and checked against its owner. Output templates are blocked/incomplete drafts and must not be promoted by deleting blockers.

## Envelope

`sdlc-artifact-v1` records task_id, stage, step, status, definition_sha256, input_sha256, contract, payload, assets and blockers. Input bindings equal the current bytes of the declared intake and predecessor outputs; an old hash, omitted input or extra binding fails. assets maps role → {path, sha256} inside the task. Paths are canonical, bounded and nonsymlink; JSON duplicate keys and non-finite numbers fail. Payload `_ref` fields declared in the manifest must match their asset path. Asset bytes are checked at every read.

The frozen contract contains repository, baseline_sha, frontend_change, mode, allowed_paths, forbidden_paths, completion_boundary, requirement_ids and acceptance_ids. Design may derive IDs before acceptance freeze; later Design outputs and every Build/Deploy output preserve the frozen contract. Final Design is also bound to the same acceptance artifact and intent-design-v2 packet. Independent semantic completeness, real identity/authorization and actual runtime remain separate checks.

A downstream handoff carries upstream asset roles under `upstream.` plus the current stage's material assets. Prefixing preserves parent evidence when stages use the same local role name, such as admission. Consumers validate these exact asset bytes; a ready JSON assertion is not stronger evidence than its underlying observation.

## State and failure

Statuses: ready, blocked, failed, not_applicable. blocked/failed requires owner/next_action/evidence_ref and prevents downstream outputs. not_applicable requires the declared condition to be false and an explicit reason; applicable UI/recovery steps cannot be skipped. Design UX/Preview depends on the frozen frontend_change. Deploy recovery depends on failed/unknown observation, retaining the operation ID before readback/recovery. A healthy release cannot be turned into an unsolicited rollback.

A final successful declaration yields HANDOFF_CANDIDATE_STATIC. Deploy rolled_back and failed/unknown remain ROLLED_BACK / OUTCOME_UNPROVEN. Synthetic mode is inherited through the chain and yields EXAMPLE_ONLY even if every record says ready/deployed. Every result retains authentic_approval=NOT_VERIFIED, runtime=NOT_VERIFIED and execution_granted=false. An Agent must inspect authoritative external proof before actual acceptance or mutation.

## Commands

From the repository root:

```bash
python3 .agents/skills/sdlc-design/scripts/check_workflow.py --structure
python3 .agents/skills/sdlc-design/scripts/check_workflow.py --task doc/tasks/TASK --include-skill
python3 .agents/skills/sdlc-design/scripts/check_workflow.py --task .agents/skills/sdlc-design/examples/complete
```

For a copied package, execute its scripts/check_workflow.py from the package and give an actual task path. The JSON context packet contains only the selected capability text (when requested), exact input references/digests, output contract and relevant resource names. It does not load the previous stage transcript, all Skills or every reference. The standard-library checker supports the documented schema subset: object/array/string/integer/boolean/null, required/properties/additionalProperties/items, const/enum, minLength/minItems/uniqueItems/pattern and anyOf. Unknown keywords fail. External project tools and actual approvals are not bundled or implicitly available.

Every final handoff preserves every prior capability asset at the original role/path/digest. Build and Deploy recheck release package digest, exact candidate/main receipt identities, independent-review declarations and a passing evidence reference per frozen AC. Deploy persists operation_id in the validated plan before any side effect; execute reads back that ID before submission and blocks if replay safety cannot be established. These are consistency checks, not authentication.

## New UI review assets

UX additionally binds review_plan_ref to the review_plan asset; Preview binds review_delivery_ref to review_delivery and preserves the exact plan hash. [Review delivery](review-delivery.md) defines the task/action/selection/result contract and finer state machine. Design-owned review_checks.py checks these at UX/Preview, before final handoff. An unavailable final-entry browser observation blocks delivery; acceptance cannot consume a merely available UI as Human-approved. The checker remains PASS_STATIC_ONLY and authenticates no runtime, identity or presentation. Sealed earlier rounds retain their original definition hashes and must use their recorded version; do not refresh them to satisfy this revision.
