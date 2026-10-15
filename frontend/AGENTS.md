# Frontend standards

The canonical product UI contract is **doc/design/desktop-ui.md** in the repo root. Apply it to all future changes in frontend/apps/console. Desktop-only viewports: 1366x768, 1440x900, 1536x1024. Do not create new mobile breakpoint code for this task. Reuse shared tokens, Vben/Element Plus integrations, existing typed services, access and navigation. No inert quick actions, invented business numbers, UI engineering placeholders or false-success copy. Run check:desktop and browser journey evidence before delivery.

## Fast/Full acceptance

All frontend changes follow **doc/ci/NO-STALL-GATES.md**: first `corepack pnpm check:fast`; for UI behavior use `corepack pnpm check:desktop:runtime` locally; then freeze a candidate and await the Human-only Full decision. Full is dispatched manually by Human on main for the exact PR/SHA under the root agreement; Agents must not invoke local check:full as a substitute. The fold/expand layout must consume the same CSS tokens used by the flyout and page gutter. CI red is not a reason to suppress tests.

## Design Preview

For design changes read `doc/workflow/INTENT-DESIGN-WORKFLOW.md` and `.agents/skills/b2b-product-ux/SKILL.md`. Create task-scoped Preview inside this application using current shell/tokens/i18n/components; isolate fixture data/writes and keep preview entry/routes out of production builds. Record candidate source hashes, reproducible route/command, scenarios and actual browser evidence. Human reviews the same-version solution and full journey together. Bulkable tasks evaluate text import for rapid selection, with validation/deduplication/scoped matching/ambiguity/final scope/effects/recovery. Selection never executes. No production feature implementation is authorized by a design-only task.
