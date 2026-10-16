# Workflow ownership and historical lookup

Current public entrypoints are the outcome coordinator, SDLC stage router and Design/Build/Deploy workflow Skills. Stage internals are loaded only by the selected Agent. Each package owns its actual methods, capabilities, contracts, examples and scripts; native .codex registrations are checked mirrors.

The machine-readable [retired inventory](project-docs.json) records removed aliases/adapters, reason, current owner and last-present commit. It contains no task states or permissions. Use the replacement for current work; inspect `git show LAST_PRESENT_COMMIT:OLD_PATH` only for historical investigation. Do not recreate a discovery alias to preserve a dead name.

F0/F1 and F-series business rounds/handoffs, original requirements/reviews and raw evidence remain at their original addresses and bytes. Only live top-level task summaries are refreshed from actual receipts. Current entrypoints are listed in [current protocols](current-protocols.md); Design v2 remains an active consumer contract, not a retired format.

At `a13def36f8abd411e7b601b088845f900256222b`, the old intent v0.2, revision v0.4 and Build v0.4 implementations, forwarding CLIs and format-only synthetic tests were last present. No real current F task consumes those formats. The former lightweight `check_sdlc_workflow.py --mode intent/design/build` was likewise synthetic-only; structure mode remains current. Historical reproduction checks out that commit and its original tests. Fine-grained v0.4-specific checks are retired with that unused format, not claimed to have been automatically ported into current stage validation.

Completed workflow-construction tasks W02–W08 and their one-time replay/log/ZIP evidence, initial scaffolding and superseded repair notes were removed from the current task tree at the same boundary. Source provenance, current UI/architecture/quality contracts, portable workflow examples and business F records remain. Recover a historical task with `git show a13def36f8abd411e7b601b088845f900256222b:doc/tasks/OLD_PATH`; actual approval/runtime still require original external evidence. No history is rewritten. Do not reintroduce governance build logs as active business task documentation.

Common runtime scripts have one maintenance source in this parent Skill and byte-identical copies in each stage to satisfy single-package distribution. Build retains its checked local Design verifier. Consumer intake schemas equal producer handoff schemas. These deliberate copies have a runtime/distribution purpose and automated drift checks; they are not competing documentation authorities.

Project policy/source inputs remain in their owners (AGENTS, doc/ci, application source). The project document map only routes to them. Read only current task needs. No daemon, model/provider/permission change, native activation proof or deployment authority is introduced by these files.
