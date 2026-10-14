# S02 prerequisite / PR #4: repair qualification and merge

## Status and authority

- Source: user explicitly requested repair of the failing checks and merge of PR #4 into main.
- Repository: hvritual/cs-biz. Base: b6d6b6a6cc3f08206206788f910dd6183fb6f434.
- Original candidate: fe3a0d81d3126c0e4db4cf4bdb887733ab5876ad.
- Status at authoring: repair prepared; new candidate, CI conclusions and merge receipt are recorded in the [PR conversation](https://github.com/hvritual/cs-biz/pull/4). This file does not pre-approve the candidate.
- Authorized: bounded source corrections, real qualification, review promotion, normal PR merge and main readback. Not authorized: deployment, production data, weakening tests or branch rules.

## Outcome and source ownership

Restore the existing [Desktop contract](../design/desktop-ui.md) and the broken design-document link so the commercial-independent backend kernel can be qualified without suppressing unrelated repository gates.

The original source failure is documented by repository job 115958778520 (removed RoleGrantEditor link) and frontend job 115958779114 (rail inset/material contract). The existing browser test also requires actual header alpha, opaque rail, rail/flyout geometry and outside-click behavior. The source had a zero inset and missing light header/rail backgrounds. The scrim must cover the 8px inset too, with the opaque rail above it.

## Scope

| Boundary | Decision |
| --- | --- |
| Allowed | Shared Desktop CSS/tokens, the obsolete component link and historical-doc clarification, a targeted cloud test entry, this task record, and verified root-cause fixes discovered by the existing qualification |
| Preserved | All existing authorization code, permission and tenant semantics, business outcome assertions, original Fast/Full checkers, dependency locks, canonical Desktop contract |
| Excluded | Real authentication, persistent grants, SaaS API/DB integration, Commercial Guard, production rollout, S02/S03 completion |
| Rollback | Revert this bounded repair; do not disable a checker or restore commercial authorization dependencies |

## Validation and recovery

Follow [No-Stall gates](../ci/NO-STALL-GATES.md). The current execution container cannot resolve GitHub or fetch the frontend dependencies; use the repository's locked cloud runtime instead of claiming local browser validation.

1. Preserve the original failing evidence; inspect the exact changed diff before publication.
2. Run repository structure, backend test/vet/race, and frontend Fast on the repaired candidate.
3. The new read-only `frontend-targeted.yml` executes Fast before `corepack pnpm check:desktop:runtime`, retains artifacts, and never runs Full. It supports the cloud-only equivalent of the existing local targeted probe.
4. Only after Fast and targeted succeed, mark PR ready so the unchanged Full Gate runs `corepack pnpm check:full`.
5. A failing result is terminal evidence: inspect it and batch demonstrated fixes, never rerun unchanged code until green. No retries/skips count as passes.
6. Re-read PR head/base and review findings, merge with expected head SHA, then re-read actual main and its applicable push checks. Full browser evidence belongs to its tested candidate/tree, not an invented main run.

## Expected acceptance

The flow under test is members -> enterprise flyout -> Escape/outside close -> member detail -> collapse -> flyout, at 1366x768, 1440x900 and 1536x1024, plus the existing dark-theme test. Preserve viewing-versus-selection, action permissions, theme and geometry assertions.

No Browser plugin is available for this session; the existing Playwright suite on GitHub Actions is the browser evidence source. Static source checks and Mock UI journeys do not prove real SaaS identity or database authorization.

## Evidence-backed test adapter correction

After candidate `16090c2dcec432c6b7e2791b1264a54830c5a942` passed repository, Fast and targeted Desktop checks, Full run `38653044953` failed in two workspace journeys. The run is not retried unchanged. Artifact `11935103336`, SHA-256 `3165a3e0c29cf007e7a852b60dea52cc62e644c55e808f73ff106aefc24e9da8`, contains the inspected screenshots and page snapshots:

- The role page displays `成员权限` / `新建权限集` / `权限集名称` / `保存权限集`. The old test stopped while awaiting the retired `角色权限` heading.
- Member creation navigates to `/members/create`, with required username/name/email and two steps. The old test waited for a creation dialog that no longer exists; the current dialog only edits existing member permissions.

The next change updates only those two tests' UI adapters: current labels, wizard fields, step transition and explicit permission-set selection. It does not remove any original create/persist, empty-grant denial, own/group scope, pause/resume, last-owner protection, restricted member navigation, or assigned-customer assertions. New route and existing-set reuse assertions make the completion path explicit. Product UI, mock authority, backend permission logic, timeouts and retries remain unchanged.

The targeted workflow retains its Desktop probe and additionally executes only the two repaired member journeys against the already built application, with separate report/output directories. The original Full suite still runs all existing tests. The pre-existing skipped mobile test remains outside the approved Desktop scope and is never counted as a pass.

## Evidence boundary

Final outcomes, exact candidate/main SHAs, run/job links, test counts and any unverified items are appended to PR #4 after execution. No future PASS is recorded here. The main branch's actual protection must be read rather than inferred from a green check.
