# Biz V1.2 → cs-biz frontend synchronization

- Biz source commit: `a8a2368f03d8f8ce53d6adcb431fb3ba55df1184`.
- Biz UI specification: `docs/design/COFFEELINK-BUSINESS-UI-V1.2.md`;
  token source: `web/src/styles/tokens.css`;
  runtime: `web/src/ui/base/theme.ts`.
- Layout: `web/src/features/app-shell/components/{AppShell,AppHeader,PrimaryNavigation,ModulePanel}.vue`.
- Biz asset blobs copied exactly: `brand-mark.png` (5c514373a8a9956ac2b9d190cdf88380a84dc491),
  `coffee-banner.webp` (580bcc9ea04cb11f9be1c02454cca4a6e1e79218),
  `coffee-menu.webp` (00241adde5c59f50d2f048325613288a3576a1eb).

## Applied
- Biz semantic color/status/typography/spacing/radius/density geometry, with
  Biz dark colors and 36px controls/64px table rows.
- Rail width=200/68 and 480px panel retained. Current cs-biz rail is at x=0;
  main content and panel align at x=200/68 per the user-approved zero-offset override.
- Tenant main canvas white, platform canvas #f5f7fa; 14px card radius,
  status colors and Biz actual coffee artwork.
- Token adapter aliases existing `--biz-*` and `--cl-*` consumers to a
  single `coffeelink-tokens.css`; no second business theme system.
- Current Vben/Element Plus personalization and tenant brand palette remain
  authoritative. Biz fallback blue is never allowed to overwrite tenant-specific primary.
- Global UI source [desktop-ui.md](desktop-ui.md), root and frontend AGENTS rules,
  task contract and `pnpm check:desktop`.

## Explicitly not copied

- Biz shadcn `--background`, `--primary` tokens: Vben interprets some of
  these as HSL components and direct copy would corrupt the existing app.
- Biz `--color-fixed-*` hashes: legacy one-off migration variables, not
  stable public design semantics. Promote a value only with real consumers.
- Biz backend/API authorization and navigation IA: cs-biz S01 retains its typed
  local Mock and strict route/tenant access model; adding dead menu links would
  be misleading. Biz is a reference UI, not a cloned application.
- Biz 390px mobile rules: current instruction is Desktop-only.
- Biz's 8px rail inset is superseded by the requested 0px offset. The old
  x=208/76 panel positions remain historical source evidence, not current targets.
  See [UI-rail-zero-offset](../tasks/UI-rail-zero-offset.md).
- Biz header blur(10px) replaced the earlier 24px liquid-glass requirement?
  **No.** The prior cs-biz liquid-glass header is preserved as an explicit
  visual exception alongside the flush rail; the rail remains solid.

## Acceptance

Use the same commit for check runs, screenshots and review. Current candidate qualification follows [Risk-based Gates](../ci/RISK-BASED-GATES.md).
Local commands and their actual scope are in [CI](../ci/README.md); root check.sh defaults
to structure + full backend + frontend Fast, and does not run build/browser by default.
The desktop test checks rail x/width and flyout x, theme/density tokens,
navbar translucency and deep links. No screenshots are generated from source
image references; only attached Playwright artifacts count as runtime evidence.
