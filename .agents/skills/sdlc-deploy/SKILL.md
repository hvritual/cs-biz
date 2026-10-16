---
name: sdlc-deploy
description: Coordinate the Deploy Agent's artifact workflow using single-function capability Skills, versioned handoff contracts and demand-loaded context. Use for the deploy stage only; do not infer authority from this Skill.
---

# SDLC Deploy Agent workflow

Read [Agent instructions](agents/agent.md) and `workflow.json`, then the current task's authoritative intake. The Agent owns sequencing, invocation, output checking, retries, recovery and stage handoff. Skills under `skills/` each own one function and stop at one output; they do not select or spawn successors.

Run `python3 .agents/skills/sdlc-deploy/scripts/check_workflow.py --task TASK --include-skill`. Read only the returned current capability and its declared inputs/resources. Inspect raw output and real evidence, write its bound artifact, rerun the checker and repeat. `--structure` validates the package without running work. Resource names are references, not instructions to preload every file. Use [contracts](references/contracts.md) for envelope fields, phase boundaries and commands.

The final file is `deploy-receipt.json`. Its source hashes, task ID, acceptance and scope are carried to the next stage. Independently verify the actual upstream review, permissions, repository/environment and current proof; static checks never authenticate these. Use the existing task record for artifacts and evidence; there is no new task database or unattended service.

Read [stage method](references/method.md) when resolving a stage-specific decision or failure. [Complete example](examples/complete/deploy-receipt.json) and [blocked example](examples/blocked/deploy/admit.json) are synthetic, always EXAMPLE_ONLY or BLOCKED, never runtime evidence. The blocked template is [artifact.json](templates/artifact.json); fill real values before claiming readiness.

The native Agent definition is [agents/deploy.toml](agents/deploy.toml); its `.codex/agents` copy is an installation mirror, not a second authority. Inherit host model, provider, tools, permissions and existing budgets. If no separate Agent can be spawned, disclose the limitation and use the same bounded role only within current authority.
