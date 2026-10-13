# CoffeeLink Desktop UI Contract v1.2 — Biz-aligned

**Authority and evidence:** Biz `hvritual/biz@a8a2368f03d8f8ce53d6adcb431fb3ba55df1184`.
The source of truth is `web/src/styles/tokens.css`; shell contracts come from
`AppShell.vue`, `AppHeader.vue`, `PrimaryNavigation.vue` and `ModulePanel.vue`,
documented in `docs/design/COFFEELINK-BUSINESS-UI-V1.2.md`.
The local consumer and adaptation record is [Biz sync notes](biz-v12-sync.md).

**This repository's executable tokens:** `frontend/apps/console/src/styles/coffeelink-tokens.css`.
`desktop.css` exposes **aliases** (`--cl-*`) for current console components, not a second numeric specification.
Do not edit colors/dimensions in a page when a token already exists.

## Desktop geometry (actual Biz V1.2)

| Biz token | Value | Meaning |
|---|---|---|
| `--header-height` | 56px | Global header |
| `--rail-width` | 200px | Expanded rail |
| `--rail-collapsed-width` | 68px | Collapsed rail |
| `--rail-offset` | 8px | Rail left inset (from Biz AppShell) |
| `--module-width` | 480px | Attached second-level panel |
| `--member-detail-width` | 360px | Independent member detail |
| `--content-padding` | 24px | Desktop page horizontal spacing |
| `--control-height` | 36px | Standard control |
| `--table-row-height` | 64px | Standard table row |
| `--color-text` | #1f2937 | Primary text |
| `--color-text-muted` | #64748b | Muted text |
| `--color-canvas` | #f5f7fa | Platform canvas |
| `--color-surface` | #ffffff | Tenant main canvas/cards |
| `--color-border` | #e5e7eb | Stroke |

With the left inset, the expanded flyout begins at **8+200=208px**, and the collapsed
flyout begins at **8+68=76px**. Hence the old reference images' *screen positions*
can be preserved without keeping the wrong physical rail widths.

## Shell and ownership

- Full-width 56px global header. The previously approved **glass transparency**
  is an explicit cs-biz variant of Biz's blurred header (Biz uses blur(10px));
  keep the previous blur(24px), translucent edge, and theme-safe fallback.
- Rail is fully **opaque**. Expanded 200px, collapsed 68px, left margin 8px.
  Actual business domains depend on existing S01 route and access registry.
- Attached 480px double-column flyout overlays, not reflows, tenant main content.
  Preserve dimming, Escape/outside/close, and authorized quick links.
- For the tenant surface, main content is white. Platform surface uses gray canvas.
  Do not create two unrelated shells or duplicate navigation trees.
- Same Vben 5 + Element Plus application, no shadcn theme injection or second
  theme authority. Use `--el-color-primary` for current tenant brand;
  Biz `#2563eb` is fallback, **not** a permanent tenant override.
- Use Biz primary nav gradient and semantic color roles, card radius 14px,
  and density variables. Compact density reduces content padding to 18px,
  controls to 32px and row height to 42px, but never shell geometry.

## Member ListPage and evidence

Heading/banner → four data-backed metrics → separate query panel →
member table/toolbar/pagination → optional 360px side-by-side detail.
Viewing a member does not select them; tenant switch discards stale detail
and permissions. No fake quota, invitation email, deleted-member recycle bin,
or enterprise module UI before its real data/actions exist. All product text
uses business terms, never integration or development status.

Acceptance: 1366x768, 1440x900, 1536x1024 Desktop only;
test exact visual geometry, two themes, actual values, brand switching,
menu open/close without content shift, no app horizontal overflow,
and real screenshots from the exact commit. Keep security tests, build,
i18n and copy checks. A green TypeScript run does not prove visual parity.

## Header liquid-glass and opaque sidebar rule

The 56px header retains the already-approved cs-biz translucent, blurred
liquid-glass coating: alpha between 0.60 and 0.85, blur(24px), rim light,
and a nearly opaque fallback. This is the sole deliberate departure from
Biz V1.2's 10px header backdrop blur. The rail remains strictly opaque:
light surface #ffffff, dark surface #111827, no backdrop filter.
The 8px rail inset must not expose an interactive background layer.
Retain the 18% scrim, focus restoration, Escape and outside click behavior
while the 480px panel is open.
