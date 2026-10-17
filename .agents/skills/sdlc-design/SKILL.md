---
name: sdlc-design
description: Refine requirements, plan complete user journeys, design the existing-project frontend, and deliver the requirement originator's experience operation flow. Use for the Design loop; do not infer Build or deployment authority.
---

# SDLC Design Agent workflow

Human is the requirement originator. The Design loop has four connected outcomes: clarified requirements, complete user journeys, frontend interfaces designed to those requirements, and an operation flow the originator can follow to experience the product. Present the interface and interactions as they should appear after release. Keep review controls, engineering explanations, fixture setup and evidence outside that experience. Use the originator's experience feedback to refine the affected requirements, journeys, interface and operation flow, then repeat until the originator confirms the design.

Read [Agent instructions](agents/agent.md) and `workflow.json`, then the current task's authoritative intake. The Agent owns sequencing, invocation, output checking, retries, recovery and stage handoff. Skills under `skills/` each own one function and stop at one output; they do not select or spawn successors.

Run `python3 .agents/skills/sdlc-design/scripts/check_workflow.py --task TASK --include-skill`. Read only the returned current capability and its declared inputs/resources. Inspect raw output and real evidence, write its bound artifact, rerun the checker and repeat. `--structure` validates the package without running work. Resource names are references, not instructions to preload every file. Use [contracts](references/contracts.md) for envelope fields, phase boundaries and commands.

The final file is `design-to-build.json`. Its source hashes, task ID, acceptance and scope are carried to the next stage. Independently verify the actual upstream review, permissions, repository/environment and current proof; static checks never authenticate these. Use the existing task record for artifacts and evidence; there is no new task database or unattended service.

Read [stage method](references/method.md) when resolving a stage-specific decision or failure. [Complete example](examples/complete/design-to-build.json) and [blocked example](examples/blocked/design/capture.json) are synthetic, always EXAMPLE_ONLY or BLOCKED, never runtime evidence. The blocked template is [artifact.json](templates/artifact.json); fill real values before claiming readiness.

For incomplete broad goals start with [goal coordination](../intent-to-outcome-closure/SKILL.md). Use the Design-owned [Architecture Agent](agents/architecture.md) for actual technical constraints, mature patterns, compatibility and a separate roadmap. Carry its bound evidence into the existing research/solution packet; do not create a second product specification or retrofit sealed legacy tasks. Product discovery and architecture may return feedback to each other before current implementation acceptance freezes. A dedicated role process is optional and host-dependent.

The native Agent definition is [agents/design.toml](agents/design.toml); its `.codex/agents` copy is an installation mirror, not a second authority. Inherit host model, provider, tools, permissions and existing budgets. If no separate Agent can be spawned, disclose the limitation and use the same bounded role only within current authority.

Legacy approved `intent-design-v2` is verified by `scripts/check_design_workflow.py`; read [v2 protocol](references/intent-design-v2.md) only for that artifact type. Design freezes the whole module acceptance before autonomous Build.

For new UI rounds use [review delivery](references/review-delivery.md): UX binds review-plan.json, Preview binds review-delivery.json, and acceptance requires actual same-version design approval. Content, final-entry browser observation, presentation and Human review are distinct states. Read this reference during UX/Preview or a delivery failure; preserve old sealed rounds under their original package version.

Frontend review means the requirement originator personally experiences the planned user journeys through normal product entry, navigation and business role handoffs. Deliver the operation flow separately from the product interface; the originator does not perform engineering qualification or fill technical approval receipts. The Agent prepares and records the experience and actual feedback. Bound v2 assets preserve continuity and internal proof without putting that machinery into the product or the operation flow.
