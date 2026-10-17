import { test } from '@e2e-dev/web';
import { chromium, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { roleTableExample } from '../../apps/console/src/design/f-series/full/role-table';
import { reviewPages } from '../../apps/console/src/design/f-series/full/catalog';
const origin = 'http://127.0.0.1:5790';
const base = '/__design/f-series/full/';
const artifacts = fileURLToPath(new URL('../../.e2e/artifacts/r004/', import.meta.url));
const template = fileURLToPath(new URL('../../apps/console/src/design/f-series/full/assets/targets.xlsx', import.meta.url));
const invitationTemplate = fileURLToPath(new URL('../../apps/console/src/design/f-series/full/assets/invitations.xlsx', import.meta.url));
async function go(p: Page, page: string, query = '') { await p.goto(origin + base + page + '?r=4' + query); await expect(p.locator('[data-design-preview="f-series-r004"]')).toBeVisible(); }
async function select(p: Page, label: string, value: string) {
  const input = p.getByRole('combobox', { name: label, exact: true });
  await p.locator(`.el-select:has(input[aria-label="${label}"]) .el-select__wrapper`).click();
  const listId = await input.getAttribute('aria-controls');
  await p.locator(`[id="${listId}"]`).getByRole('option', { name: value, exact: true }).click();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
}
async function setup(p: Page, role = '企业负责人') {
  await go(p, 'identity');
  await p.getByRole('button', {name: '继续使用组织账号', exact: true}).click();
  await p.getByRole('button', {name: '进入 青禾咖啡', exact: true}).click();
  // Establish the normal-path precondition through the original operation UI.
  // Seeded C-1006 is pending; business writes must not bypass that uncertainty.
  await go(p, 'task', '&record=ACT-SAMPLE-0-2');
  await p.getByRole('button', {name:'查询原操作结果',exact:true}).first().click();
  await expect(p.locator('[data-local-outcome] .outcome-counts > div').nth(1)).toHaveText('已完成1');
  await go(p,'modules');
  if (role !== '企业负责人') {
    await p.locator('.review-fixtures > summary').click();
    await select(p, '审阅角色', role);
  }
}
async function owned(name: string, run: (p: Page) => Promise<void>) {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {});
  const context = await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});
  const p = await context.newPage(); p.setDefaultTimeout(10000);
  const errors: string[] = []; p.on('pageerror', e => errors.push(e.message));
  p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await mkdir(artifacts, {recursive:true});
  try {
    await run(p);
    expect(errors).toEqual([]);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await p.evaluate(() => window.scrollTo(0, 0));
    await expect(p.locator('.el-overlay:visible')).toHaveCount(0);
    await p.screenshot({path:artifacts+name+'.png',fullPage:true});
    await writeFile(artifacts+name+'.json', JSON.stringify({result:'pass',url:p.url(),viewport:p.viewportSize(),errors,body:await p.locator('body').innerText()},null,2));
  } catch (error) { await p.screenshot({path:artifacts+name+'-failed.png',fullPage:true}); throw error; }
  finally { await browser.close(); }
}
async function result(p: Page, total: number) {
  const outcome = p.locator('[data-local-outcome]');
  await expect(outcome).toBeVisible();
  await expect(outcome.locator('.outcome-counts > div').nth(0)).toHaveText(`总数${total}`);
  await expect(p.locator('.el-overlay:visible')).toHaveCount(0);
  return outcome;
}
export function registerR004ReviewTests() {
  test('r004 T01 recovery: illustrated identity handoff returns through fresh verification in four actions',async()=>owned('T01-idp-recovery',async p=>{
    await go(p,'identity');
    await p.getByRole('button',{name:'忘记密码或需要恢复验证方式',exact:true}).click();
    await p.getByRole('button',{name:'查看账号服务恢复交接示意',exact:true}).click();
    await expect(p.locator('.el-dialog:visible')).toContainText('不表示账号已经恢复');
    await p.getByRole('button',{name:'返回并重新登录',exact:true}).click();
    await p.getByRole('button',{name:'进入 青禾咖啡',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');
    await expect(p.locator('[data-local-outcome]')).toHaveCount(0);
  }));
  test('r004 T24: fresh sign-in returns only to a currently readable original record in four actions',async()=>owned('T24-safe-return',async p=>{
    await setup(p); await go(p,'errors','&scene=unauthenticated&record=ACT-SAMPLE-0-3');
    await p.getByRole('button',{name:'重新登录',exact:true}).click();
    await p.getByRole('button',{name:'继续使用组织账号',exact:true}).click();
    await p.getByRole('button',{name:'进入 青禾咖啡',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','task');
    await p.getByRole('button',{name:'查询原操作结果',exact:true}).first().click();
    await expect(p.locator('[data-local-outcome] code').first()).toHaveText('ACT-SAMPLE-0-3');
    await expect(p.locator('[data-local-outcome] .outcome-counts > div').nth(1)).toHaveText('已完成1');
  }));
  for (const [task,page,role] of [['T14','customers','企业负责人'],['T18','tasks','企业负责人'],['T19','delivery','获准运维人员'],['T20','diagnostics','获准支持人员'],['T21','audit','企业负责人'],['T25','telemetry','获准运维人员']] as const) {
    test(`r004 recovery ${task}: unavailable reads recover without creating a business write`,async()=>owned(task+'-read-recovery',async p=>{
      await setup(p,role); const scene=page==='telemetry'?'unavailable':'offline'; await go(p,page,'&scene='+scene);
      await expect(p.locator('[data-scenario-feedback]')).toContainText(page==='telemetry'?'采集服务不可用':'网络中断');
      await p.getByRole('button',{name:'重新读取当前记录',exact:true}).click();
      await expect(p.locator('[data-page]')).toHaveAttribute('data-scene','normal');
      await expect(p.locator('[data-local-outcome]')).toHaveCount(0);
      await expect(p.locator('[data-page]')).not.toContainText('Writes are paused');
    }));
  }
  test('r004 T09/T14/T18: list-to-detail, original query and invitation withdrawal retain exact scope',async()=>owned('T09-T14-T18',async p=>{
    await setup(p); await go(p,'customers');
    await p.getByRole('textbox',{name:'筛选客户',exact:true}).fill('C-1001'); await p.getByRole('button',{name:'查看详情',exact:true}).click();
    await expect(p.getByRole('heading',{name:'青禾科技园',exact:true})).toBeVisible();
    await go(p,'tasks'); await p.locator('tbody tr').filter({hasText:'ACT-SAMPLE'}).getByRole('button').first().click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','task');
    await p.getByRole('button',{name:'查询原操作结果',exact:true}).click(); await expect(p.locator('[data-page]')).toContainText('ACT-SAMPLE');
    await go(p,'invitations'); await p.locator('tbody tr').filter({hasText:'new@example.test'}).getByRole('button',{name:'撤回',exact:true}).click();
    await p.locator('[data-confirm-submit]').click(); await result(p,1); await expect(p.locator('tbody').first()).toContainText('已撤回');
  }));
  test('r004 regression: clearing assignments cancels an in-flight Excel import without a write',async()=>owned('regression-clear-import',async p=>{
    await setup(p); await go(p,'members');
    await p.locator('tbody tr').filter({hasText:'lin@example.test'}).getByRole('button',{name:'查看详情',exact:true}).click();
    await p.getByRole('button',{name:'Excel',exact:true}).click(); await p.getByLabel('导入Excel',{exact:true}).setInputFiles(template);
    await expect(p.locator('.bulk-selection-bar')).toContainText('已选 2');
    await p.evaluate(()=>{
      const read=File.prototype.arrayBuffer;
      File.prototype.arrayBuffer=async function(){ await new Promise(resolve=>setTimeout(resolve,1000)); const data=await read.call(this); (window as unknown as {readFinished:boolean}).readFinished=true; return data; };
    });
    await p.getByLabel('导入Excel',{exact:true}).setInputFiles(template);
    await p.getByRole('button',{name:'清空本次指派集合',exact:true}).click();
    await p.waitForFunction(()=>(window as unknown as {readFinished:boolean}).readFinished);
    await expect(p.locator('.bulk-selection-bar')).toContainText('已选 0'); await expect(p.locator('[data-local-outcome]')).toHaveCount(0);
    await p.getByRole('button',{name:'确认替换指派集合',exact:true}).click(); await result(p,1);
    await p.reload(); await p.locator('tbody tr').filter({hasText:'lin@example.test'}).getByRole('button',{name:'查看详情',exact:true}).click();
    await expect(p.locator('.inline-impact')).toContainText(/原指派：\s*—/);
  }));
  test('r004 desktop: three supported sizes keep selection, impact and bilingual guidance usable',async()=>owned('desktop-r004',async p=>{
    await setup(p); await go(p,'batch');
    for(const [width,height] of [[1366,768],[1440,900],[1536,1024]]) {
      await p.setViewportSize({width:width!,height:height!});
      await expect(p.locator('.task-guide svg[role=img]')).toBeVisible();
      await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('园');
      await p.getByRole('button',{name:/^选取当前匹配结果/}).click();
      await expect(p.locator('.bulk-selection-bar')).toContainText('已选 2');
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await p.screenshot({path:artifacts+`desktop-zh-${width}.png`,fullPage:true});
    }
    await p.getByRole('button',{name:'语言',exact:true}).click(); await p.getByText('English',{exact:true}).click();
    await expect(p.getByRole('heading',{name:'Batch update',exact:true})).toBeVisible();
    await p.getByRole('button',{name:'Use dark appearance',exact:true}).click(); await expect(p.locator('html')).toHaveClass(/dark/);
    await go(p,'role-edit'); await p.getByRole('button',{name:'Use complete example settings',exact:true}).click();
    await expect(p.getByRole('textbox',{name:'Complete role permissions table',exact:true})).toHaveValue(/^Role name/);
    await expect(p.locator('.inline-impact')).toContainText('Owned');
    await p.getByRole('button',{name:'Confirm role configuration',exact:true}).click();
    await expect(p.locator('[data-local-outcome] .outcome-counts > div').nth(1)).toHaveText('Succeeded1');
    for(const [width,height] of [[1366,768],[1440,900],[1536,1024]]) {
      await p.setViewportSize({width:width!,height:height!});
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await p.screenshot({path:artifacts+`desktop-en-dark-${width}.png`,fullPage:true});
    }
  }));
  test('r004 regression: unresolved customer writes block both note entrypoints', async () => owned('regression-unknown-domain', async p => {
    await setup(p); await go(p,'batch','&scene=unknown');
    await p.getByRole('button',{name:'粘贴',exact:true}).click();
    await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1001');
    await p.getByRole('textbox',{name:'本次统一备注',exact:true}).fill('等待原操作');
    await p.getByRole('button',{name:'确认批量修改',exact:true}).click();
    const original=await p.locator('[data-local-outcome] code').first().innerText();
    await go(p,'customers'); await p.getByRole('button',{name:'行内修改 C-1001',exact:true}).click();
    await p.getByRole('textbox',{name:'行内服务备注',exact:true}).fill('不得重复写');
    await p.getByRole('button',{name:'确认保存备注',exact:true}).click();
    await expect(p.locator('[data-notice]')).toContainText('先查询原操作结果');
    await expect(p.locator('[data-local-outcome] code').first()).toHaveText(original);
    await expect(p.locator('[data-local-outcome] .outcome-counts > div').nth(4)).toHaveText('待核实1');
  }));
  test('r004 regression: switching role targets clears the previous parsed input', async () => owned('regression-role-target', async p => {
    await setup(p); await go(p,'role-edit','&target=reader');
    await p.getByRole('textbox',{name:'完整角色权限表',exact:true}).fill(roleTableExample);
    await p.getByRole('button',{name:'取消并返回',exact:true}).click();
    await p.locator('tbody tr').filter({hasText:'业务成员'}).getByRole('button',{name:'查看并配置',exact:true}).click();
    await expect(p.getByRole('textbox',{name:'完整角色权限表',exact:true})).toHaveValue('');
    await expect(p.getByRole('button',{name:'确认角色配置',exact:true})).toBeDisabled();
  }));
  for (const method of ['filter','paste','excel'] as const) test(`r004 regression: ${method} selection retains its version until explicit review`, async () => owned('regression-version-'+method,async p=>{
    await setup(p); await go(p,'batch');
    if(method==='filter'){await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('园'); await p.getByRole('button',{name:/^选取当前匹配结果/}).click();}
    else {await p.getByRole('button',{name:method==='paste'?'粘贴':'Excel',exact:true}).click(); if(method==='paste') await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1001\nC-1006'); else await p.getByLabel('导入Excel',{exact:true}).setInputFiles(template);}
    await p.getByRole('textbox',{name:'本次统一备注',exact:true}).fill('保留我的草稿');
    const popup=p.waitForEvent('popup'); await p.evaluate(url => window.open(url), origin + base + 'customers?r=4'); const other=await popup; await expect(other.locator('[data-page]')).toHaveAttribute('data-page','customers'); await other.getByRole('button',{name:'行内修改 C-1001',exact:true}).click(); await other.getByRole('textbox',{name:'行内服务备注',exact:true}).fill('其他页面的新值'); await other.getByRole('button',{name:'确认保存备注',exact:true}).click(); await result(other,1);
    await expect(p.locator('.inline-impact').filter({hasText:'选取时'})).toContainText('其他页面的新值');
    await expect(p.getByRole('button',{name:'确认批量修改',exact:true})).toBeDisabled();
    await expect(p.getByRole('textbox',{name:'本次统一备注',exact:true})).toHaveValue('保留我的草稿');
    await p.getByRole('button',{name:'保留输入并核对最新集合',exact:true}).click();
    await p.getByRole('button',{name:'确认批量修改',exact:true}).click(); await result(p,2); await other.close();
  }));
  for (const method of ['filter','paste','excel'] as const) {
    test(`r004 T16: ${method} selection, fixed scope and local result within four actions`, async () => owned('T16-'+method, async p => {
      await setup(p); await go(p,'batch');
      if (method === 'filter') {
        await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('园');
        await p.getByRole('button',{name:/^选取当前匹配结果/}).click();
      } else if (method === 'paste') {
        await p.getByRole('button',{name:'粘贴',exact:true}).click();
        await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1001\nC-1006');
      } else {
        await p.getByRole('button',{name:'Excel',exact:true}).click();
        await p.getByLabel('导入Excel',{exact:true}).setInputFiles(template);
      }
      await expect(p.locator('.bulk-selection-bar')).toContainText('已选 2');
      await expect(p.locator('[data-local-outcome]')).toHaveCount(0);
      await p.getByRole('textbox',{name:'本次统一备注',exact:true}).fill('下一次服务前联系');
      await p.getByRole('button',{name:'确认批量修改',exact:true}).click();
      const outcome = await result(p,2);
      await expect(outcome.locator('.outcome-counts > div').nth(1)).toHaveText('已完成2');
      await expect(p.locator('[data-page]')).toHaveAttribute('data-page','batch');
      const originalId = await outcome.locator('code').first().innerText();
      await p.reload(); await expect(p.locator('[data-local-outcome] code').first()).toHaveText(originalId);
    }));
    test(`r004 T07: ${method} invitation selection distinguishes creation and delivery`, async () => owned('T07-'+method, async p => {
      await setup(p); await go(p,'invite-create');
      if (method === 'filter') {
        await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('待邀');
        await p.getByRole('button',{name:/^选取当前匹配结果/}).click();
      } else if (method === 'paste') {
        await p.getByRole('button',{name:'粘贴',exact:true}).click();
        await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('new-a@example.test\nnew-b@example.test');
      } else {
        await p.getByRole('button',{name:'Excel',exact:true}).click();
        await p.getByLabel('导入Excel',{exact:true}).setInputFiles(invitationTemplate);
      }
      await select(p,'本次邀请角色','业务成员');
      await p.getByRole('button',{name:'确认创建邀请',exact:true}).click();
      await result(p,method === 'filter' ? 6 : 2);
      await go(p,'invitations');
      await expect(p.locator('tbody')).toContainText('new-a@example.test');
      await expect(p.locator('tbody')).toContainText('等待投递');
    }));
    test(`r004 T17: ${method} export finishes with authorized file download`, async () => owned('T17-'+method, async p => {
      await setup(p); await go(p,'export');
      if (method === 'filter') {
        await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('园');
        await p.getByRole('button',{name:/^选取当前匹配结果/}).click();
      } else if (method === 'paste') {
        await p.getByRole('button',{name:'粘贴',exact:true}).click();
        await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1001\nC-1006');
      } else {
        await p.getByRole('button',{name:'Excel',exact:true}).click();
        await p.getByLabel('导入Excel',{exact:true}).setInputFiles(template);
      }
      await p.getByRole('button',{name:'确认导出',exact:true}).click();
      await result(p,2);
      const download = p.waitForEvent('download');
      await p.getByRole('button',{name:'按当前权限下载文件',exact:true}).click();
      await (await download).saveAs(artifacts+'T17-'+method+'.csv');
    }));
  }
  test('r004 T15: inline edit preserves the customer list and reports its real result', async () => owned('T15-inline', async p => {
    await setup(p); await go(p,'customers');
    await p.getByRole('button',{name:'行内修改 C-1001',exact:true}).click();
    await p.getByRole('textbox',{name:'行内服务备注',exact:true}).fill('已确认下一次服务时间');
    await p.getByRole('button',{name:'确认保存备注',exact:true}).click();
    await result(p,1);
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','customers');
    await expect(p.locator('.full-table-wrap tbody')).toContainText('已确认下一次服务时间');
  }));
  test('r004 UX03: filtering preserves explicit selection and selected details support exclusion', async () => owned('UX03-selection', async p => {
    await setup(p); await go(p,'batch');
    await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('园');
    await p.getByRole('button',{name:/^选取当前匹配结果/}).click();
    await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('星河');
    await expect(p.locator('.bulk-selection-bar')).toContainText('已选 2');
    await p.getByRole('button',{name:'查看已选',exact:true}).click();
    await expect(p.getByLabel('已选明细',{exact:true})).toContainText('C-1001');
    await p.getByRole('button',{name:'移除选取 C-1006',exact:true}).click();
    await expect(p.locator('.bulk-selection-bar')).toContainText('已选 1');
    await expect(p.locator('[data-local-outcome]')).toHaveCount(0);
  }));
  test('r004 T16: unknown outcomes are queried before any overlapping resubmission', async () => owned('T16-unknown', async p => {
    await setup(p); await go(p,'batch');
    await p.getByRole('button',{name:'粘贴',exact:true}).click();
    await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1005');
    await p.getByRole('textbox',{name:'本次统一备注',exact:true}).fill('不能重放未知结果');
    await p.getByRole('button',{name:'确认批量修改',exact:true}).click();
    await expect(p.locator('[data-notice]')).toContainText('先查询原操作结果');
    await expect(p.locator('[data-local-outcome]')).toContainText('ACT-SAMPLE');
    const original=await p.locator('[data-local-outcome] code').first().innerText();
    await p.getByRole('button',{name:'查询原操作结果',exact:true}).click();
    await expect(p.locator('[data-local-outcome] code').first()).toHaveText(original);
    await expect(p.locator('[data-local-outcome] .outcome-counts').getByText('待核实')).toBeVisible();
  }));
  test('r004 T04/T05: organization creation and custom entitlement remain explicit, bounded operations', async () => owned('T04-T05-platform', async p => {
    await setup(p,'平台管理员'); await go(p,'tenant-create');
    await p.getByRole('textbox',{name:'企业名称',exact:true}).fill('新禾服务');
    await p.getByRole('textbox',{name:'负责人受控测试地址',exact:true}).fill('new-a@example.test');
    await expect(p.getByRole('textbox',{name:'企业唯一标识',exact:true})).not.toHaveValue('');
    await p.getByRole('button',{name:'确认创建企业',exact:true}).click();
    await result(p,1);
    await go(p,'module-grant');
    await p.getByRole('textbox',{name:'本次模块名称',exact:true}).fill('营销');
    await p.getByRole('textbox',{name:'权益配置行',exact:true}).fill('开通\t2027-12-31\t100');
    await p.getByRole('button',{name:'确认模块变更',exact:true}).click();
    await result(p,1);
    await expect(p.locator('.inline-impact')).toContainText('2027-12-31');
  }));
  test('r004 T10: full role table preserves per-action grants and rejects unconfirmed legacy scope', async () => owned('T10-role-table', async p => {
    await setup(p); await go(p,'role-edit');
    await p.getByRole('textbox',{name:'完整角色权限表',exact:true}).fill(roleTableExample.replace('本人负责','旧分组'));
    await expect(p.getByRole('button',{name:'确认角色配置',exact:true})).toBeDisabled();
    await p.getByRole('textbox',{name:'完整角色权限表',exact:true}).fill(roleTableExample);
    await p.getByRole('button',{name:'确认角色配置',exact:true}).click();
    await result(p,1);
  }));
  test('r004 T01/T02: zero, one and multiple organizations have distinct safe outcomes', async () => owned('T01-T02-organizations', async p => {
    await go(p,'identity','&orgs=zero');
    await p.getByRole('button',{name:'继续使用组织账号',exact:true}).click();
    await expect(p.getByRole('heading',{name:'尚未加入企业',exact:true})).toBeVisible();
    await go(p,'identity','&orgs=one');
    await p.getByRole('button',{name:'继续使用组织账号',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');
    await go(p,'organizations');
    await p.getByRole('button',{name:'进入 云岚生活',exact:true}).click();
    await expect(p.locator('.cl-global-header')).toContainText('云岚生活');
  }));
  test('r004 T03/X06: other-device, current-browser and all-device revocation retain their scope', async () => owned('T03-sessions', async p => {
    await setup(p); await go(p,'sessions');
    await p.getByRole('button',{name:'撤销此设备会话',exact:true}).click();
    await expect(p.locator('.el-dialog:visible')).toContainText('不退出当前浏览器');
    await p.getByRole('button',{name:'确认撤销',exact:true}).click();
    await expect(p.getByRole('button',{name:'撤销此设备会话',exact:true})).toBeDisabled();
    await p.getByRole('button',{name:'退出所有设备',exact:true}).click();
    await p.getByRole('button',{name:'确认撤销',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','identity');
    await setup(p); await go(p,'sessions');
    await p.getByRole('button',{name:'退出当前浏览器',exact:true}).last().click();
    await p.getByRole('button',{name:'确认撤销',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','identity');
  }));
  test('r004 T08/T09: verified invitation joins exactly once and enters its workspace', async () => owned('T08-invitation', async p => {
    await setup(p); await go(p,'invitations');
    await p.getByRole('button',{name:'受邀者入口',exact:true}).first().click();
    await p.getByRole('button',{name:'验证受邀组织账号',exact:true}).click();
    await p.getByRole('button',{name:'核对并接受邀请',exact:true}).click();
    await p.locator('[data-confirm-submit]').click();
    await result(p,1);
    await p.getByRole('button',{name:'进入该企业',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');
    await go(p,'invitation-accept','&invite=INV-REVIEW-0');
    await expect(p.getByRole('button',{name:'核对并接受邀请',exact:true})).toBeDisabled();
  }));
  test('r004 T06/T11/X08/X11: revoke a write role without losing read access and protect the last owner', async () => owned('T06-T11-members', async p => {
    await setup(p); await go(p,'members');
    const lin = p.locator('tbody tr').filter({hasText:'lin@example.test'});
    await lin.getByRole('button',{name:'查看详情',exact:true}).click();
    await p.getByRole('textbox',{name:'本次成员角色集合',exact:true}).fill('只读成员');
    await p.getByRole('button',{name:'确认角色调整',exact:true}).click();
    await result(p,1);
    await expect(lin).not.toContainText('负责客户可写');
    const me = p.locator('tbody tr').filter({hasText:'yuan.chen@example.test'});
    await me.getByRole('button',{name:'停用',exact:true}).click();
    await p.locator('[data-confirm-submit]').click();
    await expect(p.locator('[data-notice]')).toContainText('另一位在任企业负责人');
    await p.getByRole('button',{name:'取消',exact:true}).last().click();
  }));
  for(const method of ['filter','paste','excel'] as const) test(`r004 T26: ${method} resource assignment preserves ownership and displays exact changes`,async()=>owned('T26-'+method,async p=>{
    await setup(p); await go(p,'members');
    await p.locator('tbody tr').filter({hasText:'lin@example.test'}).getByRole('button',{name:'查看详情',exact:true}).click();
    if(method==='filter') {
      await p.getByRole('textbox',{name:'筛选待选对象',exact:true}).fill('园');
      await p.getByRole('button',{name:/^选取当前匹配结果/}).click();
    } else if(method==='paste') {
      await p.getByRole('button',{name:'粘贴',exact:true}).click();await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1001\nC-1006');
    } else {await p.getByRole('button',{name:'Excel',exact:true}).click();await p.getByLabel('导入Excel',{exact:true}).setInputFiles(template);}
    await expect(p.locator('.inline-impact')).toContainText('不改变负责人');
    await p.getByRole('button',{name:'确认替换指派集合',exact:true}).click();await result(p,1);
  }));
  test('r004 T12/T13/X01: marketing function works without console membership menus',async()=>owned('T12-T13-marketing',async p=>{
    await setup(p,'业务成员');await go(p,'modules');await expect(p.getByRole('heading',{name:'企业当前可用模块',exact:true})).toBeVisible();
    await go(p,'campaign','&target=M-1001');
    await p.getByRole('button',{name:'核对并启动活动',exact:true}).click();await p.locator('[data-confirm-submit]').click();
    await result(p,1);await expect(p.locator('[data-page]')).toHaveAttribute('data-page','campaign');
    await p.getByRole('button',{name:'核对后台深链拒绝',exact:true}).click();await expect(p.locator('.denied-preview')).toBeVisible();
  }));
  test('r004 T19/T20/T21/T25: authorized diagnostic, audit and collection views retain source boundaries',async()=>owned('T19-T20-T21-T25-observability',async p=>{
    await setup(p,'获准运维人员');await go(p,'delivery','&scene=deadletter');
    await p.getByRole('button',{name:'查看处理依据',exact:true}).first().click();await expect(p.locator('.full-row-detail')).toContainText('先查询业务效果');
    await go(p,'telemetry','&scene=disabled');await expect(p.locator('.full-stack')).toContainText('终端结构化日志');
    await go(p,'identity');await p.locator('.review-fixtures > summary').click();await select(p,'审阅角色','获准支持人员');
    await go(p,'diagnostics');await p.getByRole('textbox',{name:'排障或操作编号',exact:true}).fill('support-review-004');await p.getByRole('button',{name:'查询记录',exact:true}).click();
    await expect(p.locator('.full-stack')).toContainText('已返回获准来源');
    await go(p,'identity');await p.locator('.review-fixtures > summary').click();await select(p,'审阅角色','企业负责人');await go(p,'audit');
    await p.getByRole('textbox',{name:'筛选审计记录',exact:true}).fill('AUD');await expect(p.locator('.full-stack')).toContainText('不包含凭据');
  }));
  test('r004 T22/T23: qualification gaps block production while simulated plans remain inspectable',async()=>owned('T22-T23-release',async p=>{
    await setup(p,'获准运维人员');await go(p,'qualification');await expect(p.locator('tbody')).toContainText('生产目标、阈值与执行授权');
    await p.getByRole('button',{name:'核对非生产审阅计划',exact:true}).click();await p.getByRole('button',{name:'确认仅保存模拟计划',exact:true}).click();await result(p,1);
    await go(p,'rollout');await p.getByRole('button',{name:'核对恢复或回滚方案',exact:true}).click();await p.getByRole('button',{name:'确认仅保存模拟恢复',exact:true}).click();await result(p,1);
    await go(p,'release','&scene=missing_authority');await expect(p.getByRole('button',{name:'确认仅保存模拟计划',exact:true})).toBeDisabled();
  }));
  test('r004 T16/UX02/UX04: ambiguous rows, import errors and partial outcomes recover without replaying successes',async()=>owned('T16-recovery',async p=>{
    await setup(p);await go(p,'batch','&scene=partial');await p.getByRole('button',{name:'粘贴',exact:true}).click();
    await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('星河中心\nMISSING\nC-1002');
    await expect(p.getByRole('button',{name:'确认批量修改',exact:true})).toBeDisabled();
    await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('C-1001\nC-1003\nC-1006');
    await p.getByRole('textbox',{name:'本次统一备注',exact:true}).fill('仅安全处理失败项');await p.getByRole('button',{name:'确认批量修改',exact:true}).click();
    const outcome=await result(p,3);await expect(outcome.locator('.outcome-counts > div').nth(1)).toHaveText('已完成1');await expect(outcome.locator('.outcome-counts > div').nth(2)).toHaveText('失败1');await expect(outcome.locator('.outcome-counts > div').nth(4)).toHaveText('待核实1');
    const originalId=await outcome.locator('code').first().innerText();await p.getByRole('button',{name:'仅核对明确失败项目',exact:true}).click();
    await p.getByRole('textbox',{name:'失败项服务备注',exact:true}).fill('已核对失败项当前版本');await p.getByRole('button',{name:'确认仅处理失败项',exact:true}).click();
    const retryOutcome=await result(p,1);await expect(retryOutcome).toContainText('C-1003');await expect(retryOutcome).not.toContainText('C-1001');await expect(retryOutcome).not.toContainText('C-1006');await expect(retryOutcome.locator('code').first()).not.toHaveText(originalId);
    await p.getByRole('button',{name:'Excel',exact:true}).click();await p.getByLabel('导入Excel',{exact:true}).setInputFiles({name:'invalid.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('invalid')});
    await expect(p.locator('[data-bulk-picker] [role=alert]')).toBeVisible();await expect(p.getByRole('button',{name:'确认批量修改',exact:true})).toBeDisabled();
  }));
  for(const entry of reviewPages) test(`r004 inventory ${entry.screen}: retained states and task-specific guidance`,async()=>owned('inventory-'+entry.screen,async p=>{
    const capability=entry.audience==='platform'?'平台管理员':entry.audience==='ops'?'获准运维人员':entry.audience==='support'?'获准支持人员':'企业负责人';
    await setup(p,capability);
    for(const scene of entry.scenarios) {
      await go(p,entry.id,'&scene='+scene.id);
      if (entry.id === 'organizations' && scene.id === 'one') await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');
      else await expect(p.getByRole('heading',{name:entry.title[0],exact:true})).toBeVisible();
      await expect(p.locator('.task-guide svg[role=img]')).toBeVisible();
      if(scene.id!=='normal' && !(entry.id==='organizations' && scene.id==='one'))await expect(p.locator('[data-scenario-feedback]')).toContainText(scene.help[0]);
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }));
}
