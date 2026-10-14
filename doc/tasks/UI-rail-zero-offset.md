# UI-rail-zero-offset: Desktop rail flush to the viewport

## Status, source and authority

- User requirement: change the Desktop 8px offset to 0.
- Repository/base: `hvritual/cs-biz`, `main@af021df9721d745920d4147763e895c982ee601d`.
- Status at authoring: implementation prepared; actual candidate, check results and PR receipt belong to the PR conversation. This document does not pre-record a PASS.
- Authorized scope: this geometry change, synchronized design/test contracts and a reviewable repository delivery. No production deployment. The previous PR #4 merge authorization is not a standing authorization to merge future PRs.

## User-visible outcome

The Desktop rail is flush left at x=0, both expanded and collapsed. Its width remains 200px/68px. The main content and the 480px enterprise flyout begin at x=200px/68px, with no extra 8px gutter. Page content padding remains 24px (compact 18px).

## Dependencies and boundaries

| Field | Scope |
| --- | --- |
| Inputs | User change request; existing [Desktop contract](../design/desktop-ui.md); shared token aliases and existing Playwright suite |
| Allowed | Rail offset token, Desktop numeric assertions, global UI contract and synchronization notes, this task |
| Preserved | Header height/glass, opaque rail, widths, content padding, theme/density, mask and dismissal, all IAM/tenant/business behavior, locks and CI policy |
| Excluded | Backend changes, permission behavior changes, mobile adaptation, new frontend framework, production release |
| Rollback | Revert this atomic token/contract/test change together; do not independently restore an 8px assertion |

## Flow under test

Members -> expanded enterprise flyout -> Escape close -> member detail -> collapse rail -> collapsed flyout -> outside close. Validate 1366x768, 1440x900 and 1536x1024, plus the existing dark-theme journey. Observe rail x=0, main/flyout x=200/68, unchanged widths/materials and no main-content movement when the flyout opens.

This is an explicit design-contract change, not a repair back to Biz's original 8px. Historical PR #4 evidence remains unchanged. Existing business assertions and the inherited out-of-scope mobile exclusion are retained.

## Validation and evidence

Follow [No-Stall gates](../ci/NO-STALL-GATES.md): repository and Fast first, then the existing targeted cloud Desktop/member probe; promote the frozen candidate for the unchanged Full Gate only after targeted success.

- Repository: `python3 doc/ci/check_repository.py`.
- Fast: `cd frontend && corepack pnpm check:fast`.
- Targeted: `cd frontend && corepack pnpm check:desktop:runtime`.
- Full: `cd frontend && corepack pnpm check:full`.

Browser plugin not available; use the repository's existing Playwright on GitHub Actions. This session's container cannot resolve GitHub, so no local dependency install or browser PASS is claimed. Record exact SHA/tree, cloud run conclusions, actual screenshots and skipped tests in the PR. Merge and deployment remain separate actions.
