import { afterAll, beforeAll, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { chromium, expect as pwExpect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../..', import.meta.url));
let preview: ChildProcess | undefined;
let startupLog = '';
beforeAll(async () => {
  preview = spawn(process.execPath, [resolve(frontend, 'node_modules/vite/bin/vite.js'), '--mode', 'design', '--host', '127.0.0.1', '--port', '5790', '--strictPort'], {
    cwd: resolve(frontend, 'apps/console'), stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, TURBO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' },
  });
  preview.stdout?.on('data', data => { startupLog += String(data); });
  preview.stderr?.on('data', data => { startupLog += String(data); });
  preview.on('error', error => { startupLog += error.message; });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) throw new Error(`Design server exited: ${startupLog}`);
    try { if ((await fetch('http://127.0.0.1:5790/')).ok) return; } catch { /* Wait only for this owned server. */ }
    await new Promise(resolveWait => setTimeout(resolveWait, 200));
  }
  throw new Error(`Design server not ready: ${startupLog}`);
});
afterAll(async () => {
  if (!preview || preview.exitCode !== null) return;
  const child = preview;
  const exited = new Promise<void>(resolveExit => { child.once('exit', () => resolveExit()); });
  child.kill('SIGTERM');
  await Promise.race([exited, new Promise<void>(resolveWait => setTimeout(resolveWait, 3000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
});

test('F-series design: production isolation and 1366 identity states', async ({ app, screen, browser }) => {
  await app.open('/__design/f-series');
  await expect(browser.locator('[data-design-preview]')).toHaveCount(0);
  await browser.setViewport({ width: 1366, height: 768 });
  await browser.goto('http://127.0.0.1:5790/__design/f-series');
  await expect(screen.getByRole('heading', { name: '企业与业务协作', exact: true })).toBeVisible();
  await expect(browser.locator('.cl-global-header')).toBeVisible();
  await screen.getByRole('button', { name: '继续使用组织账号', exact: true }).click();
  await expect(screen.getByRole('heading', { name: '选择企业', exact: true })).toBeVisible();
  await screen.getByRole('button', { name: /云岚生活/ }).click();
  await expect(browser.locator('.review-card h2')).toHaveText('云岚生活');
  await screen.getByRole('button', { name: '无企业', exact: true }).click();
  await expect(screen.getByRole('heading', { name: '尚未加入企业', exact: true })).toBeVisible();
  await screen.getByRole('button', { name: '一家企业', exact: true }).click();
  await expect(browser.locator('.review-card h2')).toHaveText('青禾咖啡');
  await screen.getByRole('button', { name: '切换失败', exact: true }).click();
  await expect(screen.getByRole('heading', { name: '暂时无法进入目标企业', exact: true })).toBeVisible();
  await screen.getByRole('button', { name: '重新核对', exact: true }).click();
  expect(await browser.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const geometry = await browser.evaluate(() => ({ x: document.querySelector('.cl-primary-rail')!.getBoundingClientRect().x, height: document.querySelector('.cl-global-header')!.getBoundingClientRect().height }));
  expect(geometry).toEqual({ x: 0, height: 56 });
  await app.screenshot('f-series-1366-identity');
});

test('F-series design: 1440 campaign denial and unknown readback', async ({ app, screen, browser }) => {
  await browser.setViewport({ width: 1440, height: 900 });
  await browser.goto('http://127.0.0.1:5790/__design/f-series');
  await screen.getByRole('button', { name: '一家企业', exact: true }).click();
  await screen.getByRole('button', { name: '营销活动', exact: true }).click();
  for (const state of ['权限已撤销', '成员已停用', '营销服务已关闭']) {
    await screen.getByRole('button', { name: state, exact: true }).click();
    await expect(screen.getByRole('button', { name: '执行活动', exact: true })).toBeDisabled();
    await expect(screen.getByRole('heading', { name: '当前无法执行此操作', exact: true })).toBeVisible();
  }
  await screen.getByRole('button', { name: '有营销权限，无后台菜单', exact: true }).click();
  await screen.getByRole('button', { name: '执行活动', exact: true }).click();
  await screen.getByRole('button', { name: '取消', exact: true }).click();
  await expect(screen.getByRole('button', { name: '执行活动', exact: true })).toBeEnabled();
  await screen.getByRole('button', { name: '执行活动', exact: true }).click();
  await screen.getByRole('button', { name: '确认执行', exact: true }).click();
  await expect(screen.getByRole('heading', { name: '操作结果待确认', exact: true })).toBeVisible();
  await expect(screen.getByRole('button', { name: '执行活动', exact: true })).toBeDisabled();
  await app.screenshot('f-series-1440-unknown');
  await expect(browser.locator('.cl-primary-link')).toHaveCount(0);
  await screen.getByRole('combobox', {name:'选择企业', exact:true}).click();
  await screen.getByRole('option', {name:'云岚生活', exact:true}).click();
  await expect(screen.getByRole('button', {name:'执行活动', exact:true})).toBeEnabled();
  await expect(browser.locator('.review-card')).not.toContainText('operation-review-qinghe-001');
  await screen.getByRole('combobox', {name:'选择企业', exact:true}).click();
  await screen.getByRole('option', {name:'青禾咖啡', exact:true}).click();
  await expect(screen.getByRole('heading', {name:'操作结果待确认', exact:true})).toBeVisible();
  await screen.getByRole('combobox', {name:'查询结果场景', exact:true}).click();
  await screen.getByRole('option', {name:'操作结果待确认', exact:true}).click();
  await screen.getByRole('button', {name:'查询原操作', exact:true}).click();
  await expect(screen.getByRole('heading', {name:'操作结果待确认', exact:true})).toBeVisible();
  await screen.getByRole('combobox', {name:'查询结果场景', exact:true}).click();
  await screen.getByRole('option', {name:'当前无权查询原操作', exact:true}).click();
  await screen.getByRole('button', {name:'查询原操作', exact:true}).click();
  await expect(browser.locator('.review-notice')).toHaveText('当前无权查询原操作');
  await expect(screen.getByRole('heading', {name:'操作结果待确认', exact:true})).toBeVisible();
  await screen.getByRole('combobox', {name:'查询结果场景', exact:true}).click();
  await screen.getByRole('option', {name:'活动已启动', exact:true}).click();
  await screen.getByRole('button', { name: '查询原操作', exact: true }).click();
  await expect(screen.getByRole('heading', { name: '活动已启动', exact: true })).toBeVisible();
  await expect(browser.locator('.outcome')).toContainText('operation-review-qinghe-001');
  await screen.getByRole('button', { name: '切换深色', exact: true }).click();
  expect(await browser.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  await app.screenshot('f-series-1440-dark-result');
  await screen.getByRole('button', {name:'查看后台入口', exact:true}).click();
  await expect(browser.locator('[data-design-preview]')).toHaveCount(0);
  expect(await browser.evaluate(() => location.pathname)).toBe('/forbidden');
  await browser.goto('http://127.0.0.1:5790/members/create');
  expect(await browser.evaluate(() => location.pathname)).toBe('/forbidden');
});

test('F-series design: 1536 invitations, scope and safe support in both languages', async ({ app, screen, browser }) => {
  await browser.setViewport({ width: 1536, height: 1024 });
  await browser.goto('http://127.0.0.1:5790/__design/f-series');
  await screen.getByRole('button', { name: '一家企业', exact: true }).click();
  await screen.getByRole('button', { name: '成员邀请', exact: true }).click();
  await browser.locator('textarea').fill('lin@example.test\nyu@example.test\nmei@example.test\nLIN@example.test\ninvalid\nnot-in-scope@example.org');
  await screen.getByRole('button', { name: '核对名单', exact: true }).click();
  await expect(browser.locator('.outcome').first()).toContainText('已选定 3');
  await expect(browser.locator('.outcome').first()).toContainText('格式错误 1 · 重复合并 1 · 范围外 1');
  await expect(screen.getByRole('heading', { name: '邀请创建结果', exact: true })).toHaveCount(0);
  await screen.getByRole('button', { name: '创建邀请', exact: true }).click();
  await browser.locator('.el-dialog').getByRole('button', { name: '创建邀请', exact: true }).click();
  await expect(screen.getByRole('heading', { name: '邀请创建结果', exact: true })).toBeVisible();
  await browser.locator('textarea').fill('changed@example.test');
  await screen.getByRole('button', { name: '核对名单', exact: true }).click();
  await expect(screen.getByRole('button', {name:'创建邀请', exact:true})).toBeDisabled();
  await expect(browser.locator('[role="status"]')).toContainText('yu@example.test');
  await expect(screen.getByRole('button', {name:'查询此项', exact:true})).toHaveCount(2);
  await screen.getByRole('button', { name: '查询此项', exact: true }).first().click();
  await expect(screen.getByRole('button', {name:'查询此项', exact:true})).toHaveCount(1);
  await expect(browser.locator('[role="status"]')).toContainText('投递状态待确认');
  await app.screenshot('f-series-1536-invitation-results');
  await screen.getByRole('button', { name: '角色与负责人', exact: true }).click();
  await screen.getByRole('button', { name: '取消本人的负责人身份', exact: true }).click();
  await expect(browser.locator('[role="alert"]')).toContainText('当前负责人保持不变');
  await screen.getByRole('button', { name: '扩大成员的客户修改范围', exact: true }).click();
  await expect(browser.locator('[role="status"]')).toContainText('超出您当前可委派的范围');
  await screen.getByRole('button', { name: '客户与范围', exact: true }).click();
  await browser.locator('tbody tr').last().getByRole('button', { name: '修改', exact: true }).click();
  await expect(browser.locator('[role="status"]')).toContainText('此客户不在您的修改范围内');
  await screen.getByRole('checkbox', { name: '青禾科技园', exact: true }).check();
  await screen.getByRole('button', { name: '导出选定客户', exact: true }).click();
  await browser.locator('.el-dialog').getByRole('button', { name: '导出选定客户', exact: true }).click();
  await expect(browser.locator('[role="status"]')).toContainText('导出请求已提交');
  await screen.getByRole('button', { name: '操作与排障', exact: true }).click();
  await screen.getByRole('button', { name: '查看处理详情', exact: true }).click();
  await expect(browser.locator('.el-dialog')).toContainText('event-review-001');
  await screen.getByRole('button', { name: '关闭', exact: true }).click();
  await screen.getByRole('button', { name: '语言', exact: true }).click();
  await screen.getByText('English', { exact: true }).click();
  await expect(screen.getByRole('heading', { name: 'Organization and business workflows', exact: true })).toBeVisible();
  await expect(screen.getByRole('heading', { name: 'Release qualification', exact: true })).toBeVisible();
  expect(await browser.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await app.screenshot('f-series-1536-english-operations');
});

// Public Playwright API is used for two simultaneous tabs; the normal runner
// owns and reports this test, and the additional browser is closed in finally.
test('F-series design: two actual tabs retain scoped unknown results and share logout', async () => {
  const engine = await chromium.launch();
  try {
    const context = await engine.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});
    const a = await context.newPage();
    const b = await context.newPage();
    await Promise.all([a.goto('http://127.0.0.1:5790/__design/f-series'),b.goto('http://127.0.0.1:5790/__design/f-series')]);
    for (const page of [a,b]) await page.getByRole('button', {name:'一家企业',exact:true}).click();
    await b.getByRole('combobox', {name:'选择企业',exact:true}).click();
    await b.getByRole('option', {name:'云岚生活',exact:true}).click();
    for (const page of [a,b]) {
      await page.getByRole('button', {name:'营销活动',exact:true}).click();
      await page.getByRole('button', {name:'执行活动',exact:true}).click();
      await page.getByRole('button', {name:'确认执行',exact:true}).click();
      await pwExpect(page.getByRole('heading', {name:'操作结果待确认',exact:true})).toBeVisible();
    }
    for (const [page,tenant] of [[a,'qinghe'],[b,'yunlan']] as const) {
      await page.reload();
      await page.getByRole('button', {name:'营销活动',exact:true}).click();
      await pwExpect(page.getByRole('heading', {name:'操作结果待确认',exact:true})).toBeVisible();
      await pwExpect(page.locator('.review-card')).toContainText(`operation-review-${tenant}-001`);
    }
    await b.getByRole('combobox', {name:'查询结果场景',exact:true}).click();
    await b.getByRole('option', {name:'活动未启动',exact:true}).click();
    await b.getByRole('button', {name:'查询原操作',exact:true}).click();
    await pwExpect(b.getByRole('heading', {name:'活动未启动',exact:true})).toBeVisible();
    await pwExpect(a.getByRole('heading', {name:'操作结果待确认',exact:true})).toBeVisible();
    await mkdir(resolve(frontend,'.e2e/artifacts/f-series-design'),{recursive:true});
    await b.screenshot({path:resolve(frontend,'.e2e/artifacts/f-series-design/two-tabs-failed.png')});
    await b.getByRole('button', {name:'退出当前浏览器',exact:true}).click();
    for (const page of [a,b]) {
      await pwExpect(page.getByRole('button', {name:'执行活动',exact:true})).toHaveCount(0);
      await pwExpect(page.getByRole('heading', {name:'当前无法执行此操作',exact:true})).toBeVisible();
    }
  } finally { await engine.close(); }
});
