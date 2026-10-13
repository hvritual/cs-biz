# Frontend standards

The canonical product UI contract is **doc/design/desktop-ui.md** in the repo root. Apply it to all future changes in frontend/apps/console. Desktop-only viewports: 1366x768, 1440x900, 1536x1024. Do not create new mobile breakpoint code for this task. Reuse shared tokens, Vben/Element Plus integrations, existing typed services, access and navigation. No inert quick actions, invented business numbers, UI engineering placeholders or false-success copy. Run check:desktop and browser journey evidence before delivery.

## Fast/Full acceptance

All frontend changes follow **doc/ci/NO-STALL-GATES.md**: first `corepack pnpm check:fast`; for UI behavior use `corepack pnpm check:desktop:runtime` locally; then qualify one frozen commit using `corepack pnpm check:full` on review-ready PR. The fold/expand layout must consume the same CSS tokens used by the flyout and page gutter. CI red is not a reason to suppress tests.
