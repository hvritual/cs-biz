# Repository working agreement

## Scope and truth

- The target is `hvritual/cs-biz`. Do not infer code or completion from another repository.
- Read `doc/tasks/S00-repository-design.md`, `doc/roadmap.md`, and the relevant task before changing files.
- Distinguish user requirements, proposed decisions, implemented code, validated behavior, and deployed behavior.
- Existing ADRs marked `proposed` are recommendations, not accepted technology constraints.
- Keep work within the current user-authorized task. Preserve unrelated files and changes.

## Structure

- Application code belongs in `frontend/` or `backend/`.
- Each side owns its `deploy/`, `ci/`, and `doc/`.
- Cross-side architecture, contracts, journeys, task templates, and local orchestration belong in `doc/`.
- GitHub workflow entry points belong in `.github/workflows/` and call repository scripts.
- Do not create another root `docs/` as a competing source of truth.

## Delivery

- Use `doc/templates/task.md` for independently reviewable delivery units.
- Run `python3 doc/ci/check_repository.py` for this skeleton. It does not replace application, authorization, browser, or integration tests.
- Add real runtime gates when runtime code is introduced; never report a missing tool, skipped gate, or mock demonstration as a passing production check.
- Keep API authorization server-side and tenant-scoped. Menu visibility cannot authorize an operation.
- Record upstream source commits, retained licenses, and actual dependency locks when importing a frontend template.
- Repository writes, merge, deployment, and contacting other people are separate actions. Follow the user's actual authorization and the repository's enforced controls.
