# 风险分级质量门禁（2026-10-15）

Human 已授权按测试专家方法重新设计门禁、保证质量前提下降低时间，并将对应 PR 合并 main。
本规则取代全候选 `WAITING_HUMAN_FULL`、每轮人工 Full/豁免及旧自动 Fast/Targeted 的重复调度。
它不改变产品验收、既有设计确认、不可逆风险决策、权限边界或部署授权。

## 测试策略

必需浏览器用例与报告合同由实际套件和 check_browser_evidence.py 管理；保留既有 Desktop 覆盖与唯一历史 Mobile skip。
不为了省时删用例、不增加 retry 掩盖 flaky、不缩小 Desktop 三尺寸；前端全量成本主要是重复安装/构建和等待人工调度。
先消除重复，再用可信完整 diff 排除不相关技术栈；不靠文件扩展名猜测业务风险。

| 分类 | 条件 | 必需验证 | 不运行及理由 |
| --- | --- | --- | --- |
| docs | 与文档自动交付相同的普通非可执行文档资产 | 结构/链接、所有 Python 治理/反例、静态流程及 Node policy | 不安装 pnpm/browser/Go；无运行代码改动 |
| backend | 仅现有 backend/internal/platform/authz 下 Go 文件，可伴普通文档 | docs 档 + 后端所有 unit、race、vet | 不跑 Mock 前端：当前未消费该独立 Go 库，其 UI 测试不能证明 Go 授权正确 |
| full | 前端含 CSS/翻译、依赖、CI、Skill、规则、API/部署/新后端面、混合、空或未知变更、特殊文件 | docs 档 + 后端全部 + 前端 Fast、一次生产构建、tester-army 与全部旧浏览器回归 | 不丢任何已有断言；不按标题/标签降低门禁 |

backend 的隔离假设一旦被真实 API 集成改变，必须先更新分类器和相应集成测试；当前 Mock UI 通过不能证明真实权限。
依赖/工具不可用、分类错误、任一必需测试失败或缺证据都阻断；未知内容选择 full，非法/不可读 SHA 或过期 base 直接失败。
分类器使用 git raw diff 检查原/新模式、删除和改名的双方；可执行/符号链接/submodule 不进低档。

## 单一自动入口与证据

`.github/workflows/quality.yml` 是唯一自动质量入口：PR 检查精确 head，main push 合并后检查。
不再对同仓分支 push 和 PR 双跑；新 head 取消旧自动 run。其余旧工作流只保留手动诊断入口。
Go 与前端 job 可并行；前端每次只 frozen install 一次、Fast 一次、build 一次、每条浏览器用例一次。
按 OS/Node/完整 lock 哈希缓存 pnpm 下载 store，仍执行 frozen install 和所有所选检查，不缓存 node_modules/build/test 成功结论。
不盲目缓存浏览器：Playwright 官方指出恢复耗时可与下载接近且 Linux 系统依赖不能缓存；两个 engine 分别安装固定版本。

分类器从 PR base（main 的精确 SHA）读取，而非 PR 代码；默认分支尚无分类器的迁移候选保守执行 full。
必需 job 完成后，独立干净 `quality-gate` job 不检出候选，检查实际 needs 结果，回读 GitHub 当前 head/main，
并输出绑定 repo/PR/base/head/tier/run/attempt 的 quality receipt。低档因计划跳过的栈明确记录 skipped，不写 Full PASS。
每个浏览器 runner 的必需报告分别校验；tester-army 必须匹配精确 commit、无脏树且所有已发现用例执行通过，
legacy 至少保留现有 16 项通过和唯一的既有 Mobile skip，禁止新增跳过或重试掩盖 flaky。
文档 `DOCS_AUTO_QUALIFIED / NOT_REQUIRED_DOCS`；backend `BACKEND_QUALIFIED / FRONTEND_NOT_APPLICABLE`；full `FULL_QUALIFIED`。
主线或候选移动必须重新验证；旧 SHA、Agent 自报 PASS、取消/失败/未知结果均不能复用。

## 合并与 Human 边界

已授权执行模型可自动运行候选最终 Full、读取 quality-gate/receipt、自动审查原验收与 diff，
在实际 GitHub 保护允许且无未解决阻断审阅时合并，回读 main 及合并后门禁后再报告完成。
不再要求每个代码 PR 重复 Human review 或手工 Full dispatch；仍不得自造 GitHub APPROVED review。
价值选择、已批准方案变更、规则例外、生产操作和不可逆影响仍须 Human 决定。
治理/门禁修改必须核对当前任务的真实授权和独立审查；初次规则迁移的授权不外推后续修改。
保留 `Frontend Full Gate` 的手动入口及其旧 receipt 校验供诊断；它不是正常合并的必经路径。
Agent 的日常编辑先局部/Fast，最终候选才自动 Full，不能每个小编辑都跑全套。

没有依据声称 GitHub 已配置 required checks 或保护；实际保护优先，不强推/绕过。
独立干净 job 只隔离候选工作目录，不代表 PR 内工作流定义不可修改。分类器来自可信 base，但工作流/检查器本身的治理改动
仍须独立审查并获明确授权；同 PR 的绿色自检不能替代这项审查。当前是流程与 CI 证据模型，尚非抗恶意候选篡改的服务端强制。
要实现后者需管理员配置受保护的 main-owned required workflow/审阅规则；普通仓库文件不能自行提供该保证。
新建议 required check 为 `quality-gate`，管理员配置前仅有执行模型遵守的流程与真实 CI，不能把文档当服务端强制。
不自动部署，不从 Mock/静态门禁推断真实生产闭环。

## 耗时与质量验收

同类完整候选对比 GitHub job 的安装/Fast/build/browser/wall-clock，而不是拿文档快通道与完整回归比较。
同时报告队列等待、runner-minutes、所选用例数、skip/flake、缺陷发现和证据绑定；少跑用例不自动等于优化成功。
历史迁移的耗时比较保留在对应任务/PR；后续比较必须使用各自真实 run，不承诺未经测量的百分比。
完整回归可能发现旧 Targeted 未覆盖的故障；必须修复真实原因、保留原断言后重跑，不用 waiver 掩盖失败。

参考：<https://playwright.dev/docs/ci>、<https://playwright.dev/docs/test-sharding>。
现有套件小且状态/截图敏感，保持单 worker，暂不引入 sharding 的额外安装与报告合并成本。
