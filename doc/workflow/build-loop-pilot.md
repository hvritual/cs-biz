# Build Loop MVP — controlled adoption

## Objective
Adopt generic Task Progression and acceptance-driven Build while preserving the actual cs-biz task, design and CI authorities. This integration is workflow-only, not evidence of full business delivery.

## Wiring
`sdlc-build` calls `task-progression` at resume, slice admission, failure reconciliation, slice close and handoff. The latter must read the repository profile and record to existing task template instead of creating a new task-status service.

## Acceptance coverage
| Check | Negative example | Expected |
| --- | --- | --- |
| No silent scope reduction | Mark original AC as skipped and count complete | reject completion |
| Legitimate RED | Dependency install failed | classify environment; not RED |
| Behavior preservation | UI passed while tenant scope changed | reject / needs evidence |
| Accurate existing capability | Current function already satisfies AC | verify, no fabricated diff |
| Exact evidence | Green run belongs to older SHA | reject current completion |
| CI separation | Fast pass while Full pending | not merge-qualified |
| Risk classification | Frontend button makes tenant state change | T4 if human-triggered business operation |
| No duplicate budgets | General Build allows 3 attempts but project stops sooner | apply project rule |
| Independent review | Author writes `approved: true` | invalid authorization |
| Missing real service | Mock UI passes | no real API/tenant completion |

## Trial slice selection
Read current live tasks and candidate first. Prefer one bounded existing UI interaction or one demonstrably missing integration result with a current and independently testable AC. Existing authorization kernel and Mock must not be rewritten. Trial business implementation is a separate authorized task.

## Definition of integration done
Skill files and project profile exist; repository checker succeeds; focused contract tests/review pass; PR CI is read for exact SHA. These do **not** equal a real Build Loop trial. The real trial requires an approved design slice, observed RED where applicable, GREEN, regressions, reviewer and actual qualification.

## Exclusions
No new agent service, duplicate state ledger, database/schema, automatic merge, deployment, new commercial rules or unverifiable business claims.
