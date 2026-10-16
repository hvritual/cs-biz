---
name: sdlc-design
description: Coordinate the Design Agent's artifact workflow using single-function capability Skills, versioned handoff contracts and demand-loaded context. Use for the design stage only; do not infer authority from this Skill.
---

# SDLC Design Agent workflow

Read [Agent instructions](agents/agent.md) and `workflow.json`, then the current task's authoritative intake. The Agent owns sequencing, invocation, output checking, retries, recovery and stage handoff. Skills under `skills/` each own one function and stop at one output; they do not select or spawn successors.

Run `python3 .agents/skills/sdlc-design/scripts/check_workflow.py --task TASK --include-skill`. Read only the returned current capability and its declared inputs/resources. Inspect raw output and real evidence, write its bound artifact, rerun the checker and repeat. `--structure` validates the package without running work. Resource names are references, not instructions to preload every file. Use [contracts](references/contracts.md) for envelope fields, phase boundaries and commands.

The final file is `design-to-build.json`. Its source hashes, task ID, acceptance and scope are carried to the next stage. Independently verify the actual upstream review, permissions, repository/environment and current proof; static checks never authenticate these. Use the existing task record for artifacts and evidence; there is no new task database or unattended service.

Read [stage method](references/method.md) when resolving a stage-specific decision or failure. [Complete example](examples/complete/design-to-build.json) and [blocked example](examples/blocked/design/capture.json) are synthetic, always EXAMPLE_ONLY or BLOCKED, never runtime evidence. The blocked template is [artifact.json](templates/artifact.json); fill real values before claiming readiness.

For incomplete broad goals start with [goal coordination](../intent-to-outcome-closure/SKILL.md). Use the Design-owned [Architecture Agent](agents/architecture.md) for actual technical constraints, mature patterns, compatibility and a separate roadmap. Carry its bound evidence into the existing research/solution packet; do not create a second product specification or retrofit sealed legacy tasks. Product discovery and architecture may return feedback to each other before current implementation acceptance freezes. A dedicated role process is optional and host-dependent.

The native Agent definition is [agents/design.toml](agents/design.toml); its `.codex/agents` copy is an installation mirror, not a second authority. Inherit host model, provider, tools, permissions and existing budgets. If no separate Agent can be spawned, disclose the limitation and use the same bounded role only within current authority.

Legacy approved `intent-design-v2` is verified by `scripts/check_design_workflow.py`; read [v2 protocol](references/intent-design-v2.md) only for that artifact type. Design freezes the whole module acceptance before autonomous Build.
