# SDLC Agent workflow adoption

Current outer SDLC: **Design Agent → Build Agent → Deploy Agent**, routed by `.agents/skills/sdlc-workflow/SKILL.md`. Every stage owns its workflow, single-function capability Skills, input/output contracts, templates, examples and generic read-only checker inside its own Skill. Agent controls ordering, conditions, raw artifact verification, repair and handoff; a capability stops at its one output.

| Stage | Owned package | Output |
| --- | --- | --- |
| design | .agents/skills/sdlc-design | design-to-build.json |
| build | .agents/skills/sdlc-build | build-to-deploy.json |
| deploy | .agents/skills/sdlc-deploy | deploy-receipt.json |

[Migration and ownership](../../.agents/skills/sdlc-workflow/references/migration.md) records relocated protocols/checkers, source ownership and compatibility. [Definition sources](../../.agents/skills/sdlc-workflow/references/standards.md) distinguishes documented Agent/Skill formats from repository-owned workflow/envelope protocols. Native Agent registration mirrors are checked; this environment lacks Codex CLI, so native discovery/spawn is NOT_VERIFIED.

The earlier statement that the whole workflow stops after Design is superseded. Existing intent-design-v2 artifacts still end the **Design subworkflow** at DESIGN_HANDOFF/auto_execute=false, preserving all sealed review/Preview/acceptance bindings. Build/Deploy each need their existing separate authority; neither receives permission through a handoff. No historical task rounds, criteria or approvals are rewritten.

Modules retain [the fixed outcome contract](MODULE-OUTCOME-CONTRACT.md), full member denominator and original acceptance. The coordinator selects one Issue and invokes only the needed stage. A reviewed-design task need not Build and a main-integration task need not Deploy. Real operational/physical/business exits retain their own proof. Skills and scripts do not install an unattended runner or authenticate external records.

The sole automatic quality entry remains Risk-based Quality; its static job checks the packages and all old/new governance regressions. Final candidate and post-merge main use real exact-SHA CI/independent receipts. Compatibility validators remain available through old doc/ci paths, with active code located inside the respective Skills. Project policies/source data remain outside the bundles as authoritative inputs; workflow implementation resources do not.
