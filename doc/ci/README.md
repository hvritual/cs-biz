# 全局与跨端检查

## 当前可执行入口

```sh
python3 doc/ci/check_repository.py
# 已按 frontend/README.md 安装依赖和浏览器后，执行当前全部运行门禁：
bash doc/ci/check.sh
```

Windows：`py -3 doc/ci/check_repository.py`。要求 Python 3.10+，不安装第三方依赖。脚本从自己的位置寻找仓库根，不依赖机器上的固定绝对路径。

检查内容：必备目录、非空说明文件、关键设计与证据文件、JSON 来源记录、Markdown 中本仓库使用的普通相对文件链接。输出非零表示失败。

检查局限：不解析完整 CommonMark，不验证锚点或远程链接，不检查 UI、权限算法、业务数据、API、数据库、依赖、构建、性能或生产环境。它只是 S00 的目录和文档门禁。

## GitHub 自动入口

`.github/workflows/repository.yml` 在 push、PR 或手动触发时调用结构脚本，job 名为 `repository-structure`。S01 增加 `.github/workflows/frontend.yml` 的 `frontend-validation`：冻结安装、应用类型/lint/文案/单元测试、真实静态构建和 Playwright 用户旅程；报告和截图作为 CI artifact 保留。两个 job 的范围分别解释，结构成功不能代替前端成功。

[check.sh](check.sh) 是仓库内的本地全局调度入口，依次执行结构检查和 `frontend` 的 `pnpm check`，任何门禁失败都会停止。当前尚没有后端运行实现，因此它不宣称覆盖真实跨端契约或数据库集成。后续增加后端时在此接入真实门禁，不能以跳过后端获得“跨端通过”。

GitHub 只自动发现 `.github/workflows` 的工作流；此处存放检查逻辑与本地入口。[来源：GitHub 官方语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)。

## 运行代码加入后的职责

| 范围 | 逻辑位置 | 必须覆盖的实际结果 |
| --- | --- | --- |
| 前端 | `frontend/ci/` | 可复现安装、类型、构建、组件/路由行为 |
| 后端 | `backend/ci/` | 服务测试、数据库集成、授权与数据隔离 |
| 跨端契约 | `doc/ci/` 调度各端入口 | API 结构与生成消费者一致 |
| 用户旅程 | `doc/ci/` 调度真实前后端测试环境 | SAAS-01、幂等恢复、切租户、撤权 |
| 发布验收 | 各端 deploy + 全局调度 | 固定构建、迁移、部署与环境回读 |

S01 已增加前端真实 job；S02/S03 引入后端与跨端运行代码时继续增加对应 job。缺少依赖时应失败并给出原因，不能回退成只执行结构检查后宣布功能完成。PR 门禁、主线合并、部署成功分别记录，参见 [S01 验证](../evidence/S01-validation.md)。

## Fast Gate / Full Gate (2026-10)

Read [No-Stall Delivery Gates](NO-STALL-GATES.md). The fast path is `bash doc/ci/check.sh --fast`; `bash doc/ci/check.sh --full` (default) is reserved for qualification. On UI changes, use a targeted browser probe before Full. The GitHub Fast push workflow stays automatic. **Full is Human-only manual**: a Human selects main in GitHub Actions, enters PR number and exact head SHA, and approves the protected `full-ci-human-approval` environment. PR Ready does not start Full. See [No-Stall Delivery Gates](NO-STALL-GATES.md) for the required Human receipt, separate PR status binding and branch-protection limitations. A Full run is not proof of qualification for a changed PR head. Do not run a Full local CLI command from an Agent without explicit Human approval; local shell commands do not authenticate Human identity.
