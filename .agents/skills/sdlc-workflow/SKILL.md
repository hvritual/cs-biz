---
name: sdlc-workflow
description: Route a cs-biz task through Design, Build and Deploy Agents using self-contained workflow Skills, frozen acceptance and versioned file handoffs. Use for SDLC start/resume or an authorized whole-module issue batch; load only the needed stage.
---

# SDLC workflow router

Read AGENTS.md and the actual task. Select the stage from authoritative artifacts and the requested completion boundary; do not reset scope, budgets or original acceptance. Agent is the LLM + instructions + host tools/context/control loop. A capability Skill performs one bounded function and returns an artifact. `agents/openai.yaml` is Skill UI metadata, not a runnable Agent.

| Current need | Agent / workflow Skill | Handoff |
| --- | --- | --- |
| Raw intent, factual discovery, solution, journey/Preview, frozen acceptance | `design` → [sdlc-design](../sdlc-design/SKILL.md) | `design-to-build.json` |
| Approved Design, bounded implementation, verification/review and integration | `build` → [sdlc-build](../sdlc-build/SKILL.md) | `build-to-deploy.json` |
| Verified immutable release, authorized environment, deployment/readback/recovery | `deploy` → [sdlc-deploy](../sdlc-deploy/SKILL.md) | `deploy-receipt.json` |

Each workflow package owns `agents/`, `workflow.json`, `skills/`, `contracts/`, `templates/`, `examples/`, `scripts/` and references. Read only the selected stage entry and Agent instructions; its checker returns one current capability with bound inputs. Native Codex role entrypoints are generated mirrors of the authoritative definitions inside these packages. The host must support/allow delegation; otherwise execute the same role in the current session and disclose that no separate process was spawned. Do not change models/providers/permissions or install a new runner implicitly.

Stop at the authorized outcome boundary: a reviewed-design task need not Build, and an integrated-main task need not Deploy. Separate implementation, merge and deployment authority. In an authorized module batch, use [module outcome contract](references/module-outcome-v1.md) and intent-to-outcome-closure to select one required Issue at a time; Design/Build/Deploy own that Issue's stage loops. Keep the complete denominator and final module integration exit; advance through already-authorized work without routine “continue” prompts.

For source/meaning/acceptance changes return to Design, implementation defects to Build, and value/exception/irreversible/authority or stalled-progress decisions to Human. Handoffs carry exact task/version/scope/AC, input hashes and evidence references, never an entire transcript or new permission. A missing tool, unverified external record or static candidate remains unverified.

Run `python3 .agents/skills/sdlc-workflow/scripts/check_packages.py` for package ownership, native mirrors, identical generic runtimes, consumer contracts, examples and portable package checks. Legacy protocols and compatibility entrypoints are indexed in [migration](references/migration.md). Historical sealed task files remain unchanged.
