# CoffeeLink Desktop UI Contract v1.0

Status: canonical product UI standard for hvritual/cs-biz; Desktop-only scope.

Source references: 01-members-desktop(5).png (1536x1172), 02-overlay-menu-480(2).png (1536x1024), 03-collapsed-menu(4).png (1536x1024), plus business UI specification V1.1.

## Scope and precedence

This task validates 1366x768, 1440x900 and 1536x1024 only. No new mobile-specific breakpoint CSS or mobile completion claims. Screenshot content is example data, never actual quota. The current screenshot-specific preset uses expanded 208px and collapsed 76px; it intentionally overrides V1.1's generic 200px/68px values. All screenshots are visual references, not proof of previous implementation.

## Canonical tokens

The executable design tokens live in frontend/apps/console/src/styles/desktop.css. Pages must consume the shared --cl-* values and must not redefine the shared shell sizes.

| Token | Value |
|---|---|
| --cl-header-height | 56px |
| --cl-rail-expanded | 208px |
| --cl-rail-collapsed | 76px |
| --cl-flyout-width | 480px |
| --cl-flyout-padding | 20px |
| --cl-page-gutter | 24px |
| --cl-canvas | #F5F7FA |
| --cl-surface | #FFFFFF |
| --cl-action | #2563EB |
| --cl-ink | #1F2937 |
| --cl-muted | #596579 |
| --cl-line | #E5E7EB |

Page title 24px/32px at weight 600-650. Base text and navigation 14px/22px. Dense table may use 12-13px text. White surfaces, thin borders, subtle shadows, blue for operations, green for successful states.

## Shared layout

AppShell contains a fixed GlobalHeader, primary navigation rail, NavigationOverlay, and PageContent. Flyout is an overlay, not a second column. Its left position equals the current rail width, its own width is 480px, and there must be no gap between surfaces.

Flyout has a heading/close button, authorized local pages on the left, executable quick actions on the right, and an optional decorative coffee panel below. Submenu entries contain icons and text without trailing arrows; the active background wraps content, not the entire column. Hover/toggle, explicit close, Escape, outside click and route changes close the flyout. Content location and width stay unchanged within 1 CSS pixel when the flyout opens or closes. Its subtle mask must not allow click-through; tab focus must remain in the active dialog.

Collapsing the primary rail is separate from opening the flyout; collapse is allowed to resize the main workspace. After tenant or account changes, navigation, quick actions, member detail and selected records must use the new authorization context.

## Member management ListPage

Desktop page order: heading + retained right-side illustration; four actual-data metrics; independent search/filter panel; one data panel with toolbar, member table and pagination. Columns: member, email, department, role, data permission, status, last sign-in if known, join time, actions. Detail panel opens on View without selecting records or resetting filter/pagination. It is 360px wide, does not dim the page, and closes to the original View trigger.

Metric values derive from the current tenant data. Never copy the screenshot's 368 members, 12 roles, 500 quota, or 74% into hard-coded business state. Existing S01 has no member quota service; show active/total instead. Existing member status is active/disabled, not deleted; use the truthful Paused Members shortcut instead of a fictitious recycle bin. Do not display Invite or billing buttons without real actions.

Access uses action-specific scope; a read-all role combined with a write-own role must not imply write-all. Pending commands remain idempotent; data refresh and tenant switching must not resurrect previous context.

## Product copy and review gates

End-user UI never shows Mock, API, 未接入, 占位, 待开发, stack traces or empty interactive buttons. Unknown facts must be displayed as unknown, not guessed numbers. A click is not success unless the state is read back from the current mock service.

Required for each desktop UI PR: TypeScript typecheck, linter, bilingual copy scan, unit tests, build, desktop browser journeys, screen captures for member list, open menu, collapsed menu and member detail, and an independently reviewed diff. Evidence must be tied to the exact GitHub commit. Product code is not production server authentication.

## Header liquid-glass and opaque sidebar rule (v1.1)

The 56px global navigation header is the **only glass navigation surface**.
Use a translucent surface with alpha between 0.60 and 0.85, genuine `backdrop-filter: blur(24px) saturate(175%)`, a restrained highlight/rim and a clear text contrast. Keep its clickable elements above noninteractive reflection layers. The visual treatment must work in light and dark themes; browsers without backdrop filtering receive a near-opaque fallback.

The left primary navigation rail is **not** glass: its background must remain fully opaque (`--cl-rail-surface`, light `#ffffff`, dark `#1a222d`), with no background bleed-through and no inherited global-header transparency. When the company menu opens, the rail and navigation panel stay visually solid while the header stays glassy. Do not alter the approved 208px/76px/480px sizing, or introduce mobile styles.

Visual and functional acceptance: computed CSS in Chromium must confirm header background alpha below 1, nonempty blur filter, rail alpha exactly 1 and theme-appropriate opaque color at 1366/1440/1536 widths. Take member list, expanded menu and collapsed menu screenshots, plus a dark-theme screen capture. Do not call a static design drawing a runtime screenshot.

### Dark theme contrast after visual inspection

Dark-mode Desktop uses an opaque canvas `#11171f` behind the opaque rail `#1a222d`, so white page titles do not disappear into a light canvas. Table header surface `#263445` and text `#d2dff1` remain paired; the top toolbar icons use high-contrast foreground. Check the computed background and text colors, not only the presence of a `dark` class. The header itself remains translucent in dark mode.
