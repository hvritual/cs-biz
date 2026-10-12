# 前端检查

S01 的前端检查命令定义在 [package.json](../package.json)。以下命令均在仓库的 `frontend` 目录执行。使用 Node.js 22.18.0 及以上的 22.x 或 24.x，通过 Corepack 选用项目固定的 `pnpm@10.33.4`。

## 完整门禁

```sh
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm check
```

`pnpm check` 按以下顺序执行，失败时停止后续步骤：

| 入口 | 执行内容与边界 |
| --- | --- |
| `pnpm typecheck` | `@cs-biz/console` 的 Vue/TypeScript 类型检查 |
| `pnpm lint` | `apps/console/src` 的静态规则检查 |
| `pnpm check:copy` | `ci/check-copy.mjs` 检查用户可见文案约束 |
| `pnpm test:unit` | `vitest.config.ts` 选取 Console 的行为测试 |
| `pnpm build` | 生成 `apps/console/dist`，供浏览器检查使用 |
| `pnpm test:e2e` | `ci/playwright.config.ts` 指定的 Chromium 浏览器流程 |

仓库根目录使用 `bash doc/ci/check.sh` 运行结构与前端的统一检查。单独调用前端命令时先进入 `frontend`，让 Corepack 读取该目录的包管理器版本；不要依赖仓库根目录之外的全局 pnpm 版本。全局结构检查仍为 `python3 doc/ci/check_repository.py`；其范围由 [全局 CI 说明](../../doc/ci/README.md) 定义。

## 单独运行浏览器检查

```sh
pnpm build
pnpm test:e2e
```

Playwright 配置通过 `webServer` 管理 `5778` 端口的预览进程，检查构建后的应用。浏览器测试与手动 `pnpm preview` 分别运行，保持测试使用的端口可用。

默认使用 Playwright 安装的 Chromium。受限环境已经具有兼容 Chromium 二进制时，将变量值替换为该文件的真实绝对路径：

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium pnpm test:e2e
```

该变量只选择浏览器程序；依赖版本、生产构建和检查断言保持相同。浏览器或其系统依赖不可用时应记录实际失败，不能记作浏览器检查通过。

## 关键行为与证据

本地服务检查关注主体、租户、模块与动作范围的组合；包括撤权后的请求、幂等重放、同键变参、共享本地存储实例的旧快照，以及初始化保存失败。其运行边界见 [Mock 数据说明](../doc/mock-data.md)。

浏览器检查关注真实页面操作：客户保存与刷新、深链接、企业与账户切换、动态菜单和权限变化、中文/英文、主题切换及适配布局。文案脚本和单元测试不能替代页面渲染检查。

实际执行应记录命令、Node/pnpm/浏览器版本、检查所对应的 Git 提交及结果；截图和失败报告按测试配置保存。当前文件说明如何运行门禁，不预先宣称任何最新 CI、E2E 或线上环境已通过。[S01 任务](../../doc/tasks/S01-frontend-mock.md) 记录范围，[S01 验收](../../doc/evidence/S01-validation.md) 记录已执行结果。GitHub Actions 上传 `frontend-browser-evidence-*`，保留截图、HTML 报告和失败 trace 7 天。构建入口和 CI 均固定关闭 Turbo 遥测。
