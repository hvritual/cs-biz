# Frontend validation — Fast/Full gates

> **2026-10-15 最新状态：** 此文描述当前 GitHub main 的 Fast/Targeted/Full；[PR #9](https://github.com/hvritual/cs-biz/pull/9) 还未合并，故 Full 手动触发只能作为提案。未来 Yunka Consumer 生成/真实 Go/DB 门禁独立追加，保留 Desktop 范围与既有权限反例。见 [路线](../../doc/roadmap.md)。


Authoritative process: [No-Stall Delivery Gates](../../doc/ci/NO-STALL-GATES.md).
Pinned toolchain: Node 22.18+ or 24.x, pnpm 10.33.4 from Corepack.

## Local run (from frontend/)

```sh
corepack enable && corepack install
corepack pnpm install --frozen-lockfile       # once per lockfile version
corepack pnpm check:fast                      # every iteration
corepack pnpm exec playwright install chromium  # once, only when UI browser work requires it
corepack pnpm check:desktop:runtime           # UI-only: one build, targeted Desktop E2E
corepack pnpm check:full                      # once for the frozen release candidate
```

Do not reinstall Chromium or rerun all customer/tenant journeys after every CSS
edit. Fast includes typecheck, oxlint, bilingual product-copy checks, Desktop
semantic Token checks, self-tested pipeline/collapse checks, and unit tests.
Full adds the actual production build and all Playwright journeys.

## GitHub workflows

- `.github/workflows/frontend.yml`: **Frontend Fast Gate**, automatic on
  internal branch push and external PR, no browser installation. A duplicate
  PR hook for an internal push is skipped.
- `.github/workflows/frontend-full.yml`: **Frontend Full Gate**, only when
  PR is ready for review (not Draft); includes browser and artifact uploads.
  Stale attempts cancel on new PR revisions. Manual dispatch requires workflow
  to be present on default branch.
- `.github/workflows/repository.yml`: cheap structure validation; duplicate
  internal PR job skipped; external fork PRs are checked.

Run `bash doc/ci/check.sh --fast` from the root for a structural preflight
plus Fast; default `bash doc/ci/check.sh` remains Full for compatibility.

## Stop conditions

Do not mark a result PASS if its command failed, was skipped, or references an
older SHA. If one targeted UI assertion fails, repair its cause before promotion.
S01 Mock authorization is not production server authority.
The branch protection required-check controls need repository admin rights.
