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
| Preserved | All existing authorization code, permission and tenant semantics, original Fast/Full checkers and test expectations, dependency locks, canonical Desktop contract |
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

## Evidence boundary

Final outcomes, exact candidate/main SHAs, run/job links, test counts and any unverified items are appended to PR #4 after execution. No future PASS is recorded here. The main branch's actual protection must be read rather than inferred from a green check.
