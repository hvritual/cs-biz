# Frontend 验证

现行交付遵循 [风险门禁](../../doc/ci/RISK-BASED-GATES.md)。唯一自动 quality.yml 为最终前端候选执行 Fast、一次生产构建、全部 tester-army 与 retained Playwright 浏览器旅程，并生成独立精确 SHA 回执；旧前端 workflow 只留手动诊断。

## 本地命令（frontend 目录）

Node 范围和 pnpm 版本只以 [package.json](../package.json) / 锁文件为准。先安装依赖，编辑时选择相关断言后运行 Fast：

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm check:fast
```

`corepack pnpm check` 等同 Fast：类型、lint、双语文案、Desktop tokens/policy、E2E 类型与单元测试，不含 build/E2E。

UI 浏览器前提是各 engine 独立安装，不能只安装一个 Chromium 后假定两套 runner 通用：

```sh
corepack pnpm exec playwright install chromium
corepack pnpm exec e2e-web install chromium
corepack pnpm check:desktop:runtime
```

Desktop runtime 构建并运行受影响的 Desktop spec；完整本地诊断用 check:full，包含 Fast/build/test:e2e。独立运行 tester-army journey 前先 build；`test:e2e` 顺序运行新旧两套 runner。新用例写法和证据见 [E2E](../doc/e2e.md)。不要每次 CSS 编辑都重新安装/全量运行浏览器。

## 证明范围

固定 candidate/source hashes、真实命令、报告和屏幕证据；保留既有断言、三个 Desktop 尺寸及唯一历史 Mobile skip。Mock 验证页面/本地服务，不证明真实 IAM/DB。缺 provider、环境或失败用例不得跳过求通过。

实际外部 Full/回执与 main 回读由自动 quality 执行并核实。[手动 Full](../../doc/ci/HUMAN-FULL-CONTROL.md) 是可选诊断工具，没有逐 PR 重复 Human 批准要求。完整跨端命令和后端前提见 [全局 CI](../../doc/ci/README.md)。
