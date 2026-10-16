# Three-stage workflow ownership and migration

The public stage Skill names remain sdlc-design and sdlc-build, with sdlc-deploy added. Each is a self-contained workflow bundle with its own Agent/control loop, workflow.json, single-function skills, contracts, templates, examples and scripts. The parent sdlc-workflow routes to a stage and coordinates a frozen module graph; it does not preload capability bodies or grant approvals.

| Authority | Current owner | Compatibility entry |
| --- | --- | --- |
| intent-design-v2 method and handoff | sdlc-design/references | doc/workflow/INTENT-DESIGN-WORKFLOW.md and DESIGN-HANDOFF-CONTRACT.md forward only |
| Design v2 / Intent v0.2 / revisions v0.4 validators | sdlc-design/scripts | original doc/ci/check_*.py forward only |
| Build v0.4 validator | sdlc-build/scripts | doc/ci/check_build_v04.py forwards only |
| module-outcome-v1 method and validator | sdlc-workflow/references and scripts | doc/workflow/MODULE-OUTCOME-CONTRACT.md and doc/ci/check_module_workflow.py forward only |
| task progression and former composite optimizer | owning Build/Design references and capability steps | old Skill names are compatibility routing methods |
| reusable B2B UX and expression method | Design's design-ux / design-language capabilities | old names route to the owned capability; old ancillary copies remain historical import evidence |

Historical sealed task rounds, acceptance and review blobs are not rewritten. intent-design-v2's DESIGN_HANDOFF/auto_execute=false remains the Design subworkflow boundary; it no longer describes the outer SDLC as ending at Design. The next Build Agent has its own workflow and requires separate implementation authority. Build and Deploy similarly exchange an immutable file without transferring permissions.

All new workflow implementation resources live inside their owning Skill. Outside files are project policy/data inputs, CI entrypoints/test bridges, legacy compatibility pointers or generated native Agent registration mirrors; none is a second workflow implementation. The generic runtime has one maintenance source under sdlc-workflow/scripts. Byte-identical copies of check_workflow.py and artifact_io.py are distributed with each stage for portability; check_packages.py rejects divergence. Build's local Design admission verifier is a byte-identical, checked dependency copy from Design. Consumers carry exact producer handoff contracts; their intake schemas are checked against the producing owner.

Native definitions are maintained inside each stage's agents directory and mirrored to .codex/agents for documented Codex discovery. The environment running this task has no Codex CLI. TOML shape, mirror identity and instruction-based Agent forward trials can be checked here; native Codex discovery/spawn itself remains NOT_VERIFIED. This does not create a scheduler/daemon, provider credential or SDK service.
