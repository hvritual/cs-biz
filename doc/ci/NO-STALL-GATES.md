# No-Stall Delivery Gates — cs-biz

## Non-negotiable objective
One change, one small feedback loop, one qualified candidate. Do not make GitHub Full CI
the developer's debugger. Fix the smallest demonstrated cause; do not weaken a passing
assertion, turn off security checks, or claim a skipped check passed.

### Execution order
1. Freeze exact base/head, owner, visible user outcome and changed-file scope.
2. Run `bash doc/ci/check.sh --fast`: repository structure plus typecheck,
   lint, copy scan, Desktop token/collapse contract, workflow-policy negative fixtures
   and unit tests. **No build, browser install, browser E2E or screenshots.**
3. If a layout/CSS/runtime interaction changed, run one **targeted desktop probe**
   after Fast: `cd frontend && corepack pnpm check:desktop:runtime`.
   This builds once and runs `desktop-ui.spec.ts` only. Keep browser installed
   across local iterations; never reinstall per screenshot.
4. Resolve ALL Fast/targeted failures in one root-cause batch. Avoid serial
   one-line pushes and CI-wait loops. Once clean, freeze the candidate SHA.
5. Promote the PR from Draft to **Ready for review**: `frontend-full.yml`
   then runs **once for that head** (plus when a new commit changes the head).
   Full runs the same Fast checks, build, and all Chromium journeys; uploads
   artifacts. Outdated in-progress runs cancel.
6. Before stating "done", read back branch SHA, full workflow conclusion,
   all skipped/failing tests, and screenshots for the exact SHA. Merge and
   production deployment are separate, explicitly authorized steps.

### Gate map
| Phase | Trigger | Executed | Excluded | Evidence |
| --- | --- | --- | --- | --- |
| Fast | internal push; fork PR | check:fast (static/units/policy) | Playwright install, build, full E2E | frontend-fast |
| Targeted Desktop | local on visible UI changes | build + one desktop-ui spec | unrelated E2E | screenshots, exact workspace revision |
| Full | non-Draft PR open/update or review promotion, explicit dispatch on default branch | check:full (Fast + build + all E2E) | skipped tests are NOT passes | frontend-validation + artifacts |
| Repo | internal push, external PR | structure/docs | frontend/runtime | repository-structure |

Manual dispatch is available once the workflow has been introduced to the default
branch. PRs remaining Draft deliberately **do not qualify** as Full-complete.

### Time and scope budget
- Before editing, name the **one failing assertion** and source owner.
- If only CSS changed, do not modify API, auth or tenant data.
- Use one batched candidate for all identified failures; no multiple concurrent
  candidates. Prefer targeted checks over Full until passing.
- CI failures must be classified: real behavior defect, contract drift,
  infrastructure, or assertion bug. Tests are not changed without evidence.
- Preserve 1366x768 / 1440x900 / 1536x1024 Desktop regression and Mock
  authorization; mobile remains out of scope.
- Every check is bound to SHA; artifacts or logs from another SHA are background,
  never completion evidence.

### GitHub merge gate limitation
Workflow checks alone do **not** block merges without repository protection.
As observed during this task, the GitHub connection cannot modify branch
protection (403) and there are no accessible repository rulesets.
Repository admins must require `repository-structure`, `frontend-fast`
and `frontend-validation` for protected branches and disallow merge when
required checks are pending or failed. Until configured, this is an enforced
*process and CI* contract, not a claimed protected-branch rule.

### Fail-closed rule
- Fast red: stop, repair Fast; do not run Full.
- Targeted red: repair UI cause; do not run Full.
- Full red: not qualified; fix grouped root cause, run Fast again and send
  a new head for review. Never use prior green head.
- Missing tool/infrastructure: record **unavailable** rather than pass.

### Yunka F0–F6 将增加的门禁（目标，尚未存在于 cs-biz CI）

参照 [Issue #10](https://github.com/hvritual/cs-biz/issues/10) 与 [F0–F6](../tasks/YUNKA-MIGRATION-F0-F6.md)：F1 冻结 Go/protoc/Yunka 版本后新增 `yunka generate/check`、二次生成零漂移、source/dependency/assembly 检查；F2–F5 附真实 Gateway/Scope/Domain SQL/API 直调与 HTTP/gRPC/Worker negative fixtures；F6 真 MySQL/IdP/恢复与发布门禁。**现有 Fast/Targeted/Full 顺序与用户界面标准不改变。**

[PR #9](https://github.com/hvritual/cs-biz/pull/9) 提议 Full 改 Human 手动，2026-10-15 核查时尚未合并；当前以仓库 main 的工作流为准。历史已通过的 Mock/Go CI 不能作为 Yunka Consumer 或生产资格。
