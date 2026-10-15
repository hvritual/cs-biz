# E2E：tester-army/e2e

当前门禁以 [风险分级](../../doc/ci/RISK-BASED-GATES.md) 为准：Full 在最终候选按风险自动运行，无需逐 PR Human dispatch；下文 Human-only 的描述仅为旧手动诊断入口。正常 CI 为 quality.yml，一次 Fast/build/两套完整 E2E。

2026-10-15 Human 指定 E2E 使用 tester-army/e2e。原输入 `tester-amy/e2e` 按已核对的上游名称更正。

## 固定来源与边界

- 上游：<https://github.com/tester-army/e2e>，Apache-2.0；使用发布包，不复制框架源码。
- 本次审阅源码：`fc9064415d427060fad1d406c4c491dda248ad4f`（tag `e2e@0.20.0`）。
- 精确依赖：`e2e@0.20.0`、`@e2e-dev/web@0.14.0`；实际包完整性和传递依赖以 pnpm-lock.yaml 为准。
- 官方迁移说明：<https://github.com/tester-army/e2e/blob/fc9064415d427060fad1d406c4c491dda248ad4f/docs/migrate/playwright.mdx>。
- Node：22.22.3+（22 系列）或 24.8+；CI 固定 24.19.0，pnpm 10.33.4。

新旅程用 `*.e2e.ts`、`e2e.config.ts` 和 `@e2e-dev/web` 的 test。旧 `*.spec.ts` 留在原 Playwright runner，
两者文件模式不重叠。官方建议逐文件迁移；旧套件的多标签页、存储故障注入、CSS/截图断言全部保留，
不能把接入一个框架等同于已迁完全部测试。此轮迁入成员查询→详情→关闭保留筛选→重置，旧同名回归仍保留。
底层 web engine 自带固定 playwright-core，因此两个 runner 的 Chromium 必须各按其版本安装。

## 命令（frontend 目录）

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm check:e2e:types
E2E_TELEMETRY_DISABLED=1 corepack pnpm exec e2e list
corepack pnpm exec e2e-web install chromium
corepack pnpm exec playwright install chromium
corepack pnpm build
E2E_TELEMETRY_DISABLED=1 corepack pnpm test:e2e:journey
```

`test:e2e` 顺序执行新框架与全部旧回归，前者失败不能继续冒充通过；`check:full` 仍包含 Fast、build 和该聚合命令。
编辑时 Targeted Desktop 在 Fast/build 后运行；最终候选统一由 quality.yml 跑 Fast/build 和新旧全部旅程一次。
Agent 按已授权风险门禁执行，无需再等待每个 PR 的 Human dispatch。本次测试基础设施变更不适用文档自动交付例外。

Fast 新增配置/新用例类型检查及 runner/固定版本/制品收集的策略反例，不安装浏览器、不调用模型。
输出 `.e2e/report.json`、`junit.xml`、`summary.md`、截图和失败 trace 由 Targeted/Full 上传；本地产物忽略不提交。
现有 Playwright 证据继续收集。没有配模型、没有执行的 AI 步骤不得写成已验证。

## AI 步骤与数据

当前成员旅程仅确定性 locator + assertion，无 agent 调用、无模型费用、无账号/凭据要求。
后续需要自然语言 `agent.act/assert` 时，必须显式绑定获准 provider、预算及数据范围，不能自动读取/复制聊天登录态，
不能假定 ChatGPT 订阅等于此执行环境已完成登录。缺凭据明确失败或阻断，不降级为假通过。
CI 设置 `E2E_TELEMETRY_DISABLED=1`。本轮只验证本项目现有 Mock UI，不声称真实服务端授权或生产租户隔离已验证。
