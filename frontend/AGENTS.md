# Frontend standards

The canonical product UI contract is **doc/design/desktop-ui.md** in the repo root. Apply it to all future changes in frontend/apps/console. Desktop-only viewports: 1366x768, 1440x900, 1536x1024. Do not create new mobile breakpoint code for this task. Reuse shared tokens, Vben/Element Plus integrations, existing typed services, access and navigation. No inert quick actions, invented business numbers, UI engineering placeholders or false-success copy. Run check:desktop and browser journey evidence before delivery.

## Fast/Full acceptance

Current policy: `doc/ci/RISK-BASED-GATES.md`. Final frontend candidates run Fast/build/all tester-army and retained Playwright journeys once in automatic quality CI; an independent exact-SHA receipt and main readback qualify authorized merge. Daily editing remains focused/Fast. Actual design/production approvals remain required.

New E2E journeys use `tester-army/e2e` (`e2e` + `@e2e-dev/web`) with `e2e.config.ts` and `*.e2e.ts`. Read `frontend/doc/e2e.md`. Preserve existing `*.spec.ts` Playwright coverage until equivalent runtime evidence and explicit retirement authority exist. `test:e2e` includes both runners; missing providers or failed journeys must not be silently skipped. Framework selection grants no new action authority.

All frontend changes follow **doc/ci/RISK-BASED-GATES.md**: first `corepack pnpm check:fast`; for UI behavior use focused Desktop probes, then freeze a candidate and verify automatic Full plus independent exact-SHA receipt. The fold/expand layout must consume the same CSS tokens used by the flyout and page gutter. CI red is not a reason to suppress tests.

## Design Preview

For design changes read `.agents/skills/sdlc-design/references/intent-design-v2.md` and `.agents/skills/sdlc-design/skills/design-ux/SKILL.md`. Create task-scoped Preview inside this application using current shell/tokens/i18n/components; isolate fixture data/writes and keep preview entry/routes out of production builds. Record candidate source hashes, reproducible route/command, scenarios and actual browser evidence. Human reviews the same-version solution and full journey together. Bulkable tasks evaluate text import for rapid selection, with validation/deduplication/scoped matching/ambiguity/final scope/effects/recovery. Selection never executes. No production feature implementation is authorized by a design-only task.

Human 是需求发起人；前端审阅就是让需求发起人体验规划好的用户旅程。遵循 `.agents/skills/sdlc-design/references/review-delivery.md`，界面、文案、正常入口、业务导航、权限、交互和结果呈现均按正式发布的产品设计。产品中不放审阅横幅、场景/页面/角色工具、旅程编号/动作计数、模拟说明或工程状态。单独输出可照着操作的业务流程；环境准备、技术验证、版本/覆盖记录由 Agent 在内部处理。保持隔离设计环境，正式产品体验不授予真实生产操作权限。
