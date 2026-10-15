# Frontend standards

> **三权最新要求（2026-10-15）：** 新 Console/Marketing 权限 UI 必须满足 [三权 Access V3](../doc/contracts/three-rights-v3.md)；菜单开关不自动勾选 Function，每个 Function 的 Scope 独立；无 Console Menu 的营销成员仍能使用营销入口；前端隐藏不替代后端真实授权。Yunka typed PB/TS Client 是 F1 之后的目标，不能把尚未合并 PR #8 当 main。


The canonical product UI contract is **doc/design/desktop-ui.md** in the repo root. Apply it to all future changes in frontend/apps/console. Desktop-only viewports: 1366x768, 1440x900, 1536x1024. Do not create new mobile breakpoint code for this task. Reuse shared tokens, Vben/Element Plus integrations, existing typed services, access and navigation. No inert quick actions, invented business numbers, UI engineering placeholders or false-success copy. Run check:desktop and browser journey evidence before delivery.

## Fast/Full acceptance

All frontend changes follow **doc/ci/NO-STALL-GATES.md**: first `corepack pnpm check:fast`; for UI behavior use `corepack pnpm check:desktop:runtime` locally; then qualify one frozen commit using `corepack pnpm check:full` on review-ready PR. The fold/expand layout must consume the same CSS tokens used by the flyout and page gutter. CI red is not a reason to suppress tests.
