# cs-biz workflow binding (project profile)

This file binds shared task-progression and sdlc-build methods to **hvritual/cs-biz**. It is not a new source of task state, authorization or CI truth.

## Authoritative sources
- Highest repository guidance: `AGENTS.md`.
- Actual task/Issue: its approved source and existing `doc/templates/task.md`-based task record.
- Roadmap: `doc/roadmap.md`, re-check against live source/PR and evidence; stale status is not authority.
- UI design: `doc/design/desktop-ui.md`.
- Delivery and retry: `doc/ci/NO-STALL-GATES.md` and actual workflows.
- Actual implementation: `frontend/`, `backend/`; Mock does not certify persistent authorization.
- Do not create a competing `docs/`, task-status store, acceptance authority or CI engine.

## Existing commands: only run when relevant and available
- Repository skeleton: `python3 doc/ci/check_repository.py`
- Fast, after applicable focused tests: `bash doc/ci/check.sh --fast`
- Changed Desktop visuals/interaction: `cd frontend && corepack pnpm check:desktop:runtime`
- Full, only for final qualified candidate: `bash doc/ci/check.sh --full`
- Frontend focused tests: choose an existing Vitest spec via `corepack pnpm exec vitest run <existing-spec>` from `frontend/`; verify actual spec.
- Backend: use `backend/ci/check.sh` and real Go tests appropriate to affected packages; do not invent a missing test command.
- Real CI qualification: read the workflow run, exact candidate and artifacts; never infer a pass from a local text report.
- Desktop scope only: 1366x768, 1440x900, 1536x1024; don't add Mobile requirements.

## Project-specific protections
- Do not rewrite existing Vben/Element Plus frontend or authorization kernel just to demonstrate workflow.
- Platform auth and tenant data scope are server-enforced. Frontend Mock role switches are not production authentication.
- Do not edit CI expectations or lower gates without a separate approved governance change.
- Fast before targeted UI before Full; no repeat Full as debug loop.
- Branch/pull request, review, merge and deploy each require their own actual authorization.
- Preserve existing user changes; separate test failures from environment/tool unavailability.

## Pilot acceptance
First pilot is one **existing approved and genuinely unverified** slice. Audit before selection. If the candidate outcome is already verified, record it and select the next missing AC. Do not create a fake defect. No business code edits under this workflow-only integration change.

## Yunka 功能权限阶段的项目绑定（目标，还未导入）

当前任务和审批源仍是 Issue/Task + `AGENTS.md` + 原 SDLC Skill；[Issue #10](https://github.com/hvritual/cs-biz/issues/10) 有独立 F0–F6 子 Issue。若任务涉及新增权限或 Go Operation，应阅读 [Access V3](../contracts/three-rights-v3.md) 与 [Yunka Developer SOP](../tasks/YUNKA-DEVELOPER-PERMISSION-FLOW.md)：Intent/Design 先确认 Actor/入口、Menu/Function/Data 与负例，Build 先产生 RED，F1 真实引入后补 Yunka `generate/check` 与真 DB/Scope，再走 cs-biz Fast/Targeted/Full。不得自发修改 Yunka 框架库来规避消费者缺口；Go 1.25.13、protoc 3.21.12 和模块锁需经 F0/F1 验证。
