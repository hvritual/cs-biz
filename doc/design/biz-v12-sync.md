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
- Biz left rail at x=8 width=200/68; 480px panel aligned at x=208/76.
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
- Biz header blur(10px) replaced the earlier 24px liquid-glass requirement?
  **No.** The prior cs-biz liquid-glass header is preserved as the sole
  visual exception; the rail remains solid.

## Acceptance

Use the same commit for check runs, screenshots and review. `doc/ci/check.sh`
executes structural, TypeScript, copy, design, unit, build and Playwright gates.
The desktop test checks rail x/width and flyout x, theme/density tokens,
navbar translucency and deep links. No screenshots are generated from source
image references; only attached Playwright artifacts count as runtime evidence.
