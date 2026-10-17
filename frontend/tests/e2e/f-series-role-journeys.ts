import { test } from '@e2e-dev/web';
import { chromium, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const entry = 'http://127.0.0.1:5790/__design/f-series/full/identity?r=4&journey=';
const folder = fileURLToPath(new URL('../../.e2e/artifacts/r004-role-journeys/', import.meta.url));
async function signIn(page: Page, email: string, organization = '青禾咖啡') {
  await page.getByRole('textbox', {name:'组织账号邮箱',exact:true}).fill(email);
  await page.getByRole('button',{name:'继续使用组织账号',exact:true}).click();
  if (!email.startsWith('platform@')) await page.getByRole('button',{name:'进入 '+organization,exact:true}).click();
}
async function menu(page:Page,name:string) { await page.getByRole('menu',{name:'业务导航',exact:true}).getByRole('menuitem',{name,exact:true}).click(); }
async function run(name:string,width:number,height:number,body:(page:Page,steps:string[])=>Promise<void>) {
  const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {});
  const context=await browser.newContext({viewport:{width,height},locale:'zh-CN'});const page=await context.newPage();page.setDefaultTimeout(12000);
  const steps:string[]=[];const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir(folder,{recursive:true});
  try {
    await body(page,steps);
    expect(errors).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.review-fixtures')).toHaveCount(0);
    await expect(page.locator('.full-review-boundary, .journey-guide, .task-guide')).toHaveCount(0);
    await expect(page.locator('.full-review')).not.toContainText(/完整交互审阅|所有操作仅影响当前审阅|执行者提前准备|主线累计动作计划/);
    await page.screenshot({path:folder+name+'.png',fullPage:true});
    await writeFile(folder+name+'.json',JSON.stringify({url:page.url(),viewport:{width,height},steps,errors,review_tools_used:false,human_approval:false},null,2));
  } finally { await page.screenshot({path:folder+name+'-last.png',fullPage:true}).catch(()=>{});await context.close();await browser.close(); }
}
export function registerRoleJourneyTests() {
  test('r004 role journey: account recovery returns to normal sign-in without authenticating the account',async()=>run('account-recovery',1440,900,async(p,steps)=>{
    await p.goto(entry+'J01');
    await p.getByRole('textbox',{name:'组织账号邮箱',exact:true}).fill('business@example.test');
    await p.getByRole('button',{name:'忘记密码或需要恢复验证方式',exact:true}).click();
    await expect(p.getByRole('dialog')).toContainText('组织账号服务');
    steps.push('从登录入口查看账号恢复方式');
    await p.getByRole('button',{name:'返回并重新登录',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','identity');
    await expect(p.getByRole('menu',{name:'业务导航',exact:true}).getByRole('menuitem',{name:'客户管理',exact:true})).toHaveCount(0);
    await p.getByRole('button',{name:'继续使用组织账号',exact:true}).click();
    await p.getByRole('button',{name:'进入 青禾咖啡',exact:true}).click();
    await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');
    steps.push('返回后重新验证账号并选择企业，查看恢复方式本身不授予权限');
  }));
  test('r004 role journey: new organization and first owner remain continuous across empty access and module grant',async()=>run('onboarding-handoff',1440,900,async(p,steps)=>{
    const name='本次开通体验企业';await p.goto(entry+'SAAS01');await signIn(p,'platform@example.test');steps.push('平台账号正常登录，平台授权不创建企业成员关系');
    await p.getByRole('button',{name:'创建企业',exact:true}).click();await p.getByRole('textbox',{name:'企业名称',exact:true}).fill(name);await p.getByRole('textbox',{name:'负责人邮箱',exact:true}).fill('first-owner@example.test');await p.getByRole('button',{name:'确认创建企业',exact:true}).click();await expect(p.locator('[data-local-outcome]')).toContainText('已完成');steps.push('正常创建同一企业并指定首次负责人，保存本次原ACT');
    await menu(p,'企业管理');await p.locator('tbody tr').filter({hasText:name}).getByRole('button',{name:'查看企业',exact:true}).click();const target=new URL(p.url()).searchParams.get('target');expect(target).toBeTruthy();
    await p.getByRole('button',{name:'打开首次负责人邀请链接',exact:true}).click();const invite=new URL(p.url()).searchParams.get('invite');expect(invite).toMatch(/^INV-/);steps.push('从同一企业交接刚创建的首次Owner INV');
    await p.getByRole('button',{name:'验证受邀组织账号',exact:true}).click();await p.getByRole('button',{name:'核对并接受邀请',exact:true}).click();await p.locator('[data-confirm-submit]').click();await p.getByRole('button',{name:'进入该企业',exact:true}).click();await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');await expect(p.locator('.full-review')).toContainText('尚未开通');steps.push('首次Owner验证接受该INV并首次进入，无商业模块权益');
    await p.locator('.cs-account-tool').click();await p.getByRole('textbox',{name:'组织账号邮箱',exact:true}).fill('first-owner@example.test');await p.getByRole('button',{name:'继续使用组织账号',exact:true}).click();await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');steps.push('首次Owner正常重登，唯一企业自动进入，无场景工具');
    await p.locator('.cs-account-tool').click();await signIn(p,'platform@example.test');await p.locator('tbody tr').filter({hasText:name}).getByRole('button',{name:'查看企业',exact:true}).click();expect(new URL(p.url()).searchParams.get('target')).toBe(target);await p.getByRole('button',{name:'配置模块开通',exact:true}).click();
    await p.getByRole('textbox',{name:'本次模块名称',exact:true}).fill('客户管理');await p.getByRole('textbox',{name:'权益配置行',exact:true}).fill('开通\t2027-12-31\t100');await p.getByRole('button',{name:'确认模块变更',exact:true}).click();await expect(p.locator('[data-local-outcome]')).toContainText('已完成');steps.push('平台正常重登，为同一企业配置并回读模块开通');
    await p.locator('.cs-account-tool').click();await p.getByRole('textbox',{name:'组织账号邮箱',exact:true}).fill('first-owner@example.test');await p.getByRole('button',{name:'继续使用组织账号',exact:true}).click();await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');await expect(p.locator('.full-review')).toContainText('已开通');await menu(p,'客户管理');await expect(p.locator('.full-table tbody')).toContainText('C-SAAS-1');await expect(p.locator('.full-table tbody')).not.toContainText('C-1001');steps.push('同一Owner重登回读权益，正常导航读取本企业同一隔离资源');
  }));
  test('r004 role journey: reader uses normal entry without receiving write or member administration',async()=>run('reader-boundary',1440,900,async(p,steps)=>{
    await p.goto(entry+'J08');await signIn(p,'yu@example.test');steps.push('只读成员正常登录并选择企业');await menu(p,'客户管理');steps.push('从业务导航进入允许的客户读取');
    await expect(p.locator('.full-table tbody')).toContainText('C-1001');
    await expect(p.getByRole('button',{name:/^行内修改 /})).toHaveCount(0);
    await expect(p.getByRole('button',{name:'批量修改',exact:true})).toBeDisabled();
    await expect(p.getByRole('button',{name:'导出选定集合',exact:true})).toBeDisabled();
    await expect(p.getByRole('menu',{name:'业务导航',exact:true}).getByRole('menuitem',{name:'企业成员',exact:true})).toHaveCount(0);steps.push('核对只读、安全终点与无管理入口');
  }));
  for (const [width,height] of [[1366,768],[1440,900],[1536,1024]]) {
    test(`r004 role journey: business sign-in, normal navigation, permitted edit and original outcome ${width}`,async()=>run('business-'+width,width!,height!,async(p,steps)=>{
      await p.goto(entry+'J08');steps.push('正常登录入口');await signIn(p,'business@example.test');steps.push('输入业务成员邮箱','继续组织账号验证','选择青禾咖啡');
      const nav=p.getByRole('menu',{name:'业务导航',exact:true});await expect(nav.getByRole('menuitem',{name:'企业成员',exact:true})).toHaveCount(0);await expect(nav.getByRole('menuitem',{name:'企业管理',exact:true})).toHaveCount(0);
      await menu(p,'客户管理');steps.push('从业务导航打开客户');await p.getByRole('textbox',{name:'筛选客户',exact:true}).fill('C-7001');steps.push('按实际客户编号筛选');
      await p.getByRole('button',{name:'行内修改 C-7001',exact:true}).click();steps.push('打开本人客户行内修改');
      await p.getByRole('textbox',{name:'行内服务备注',exact:true}).fill('完整旅程核对后的服务备注');steps.push('填写服务备注');
      await p.getByRole('button',{name:'确认保存备注',exact:true}).click();steps.push('确认并就地查看实际原操作结果');
      const outcome=p.locator('[data-local-outcome]');await expect(outcome).toContainText('已完成');const id=await outcome.locator('code').first().innerText();expect(id).toMatch(/^ACT-/);
      await outcome.getByRole('button',{name:'查看完整原记录',exact:true}).click();steps.push('从本次结果打开同一原记录');await expect(p).toHaveURL(new RegExp('record='+id));await expect(p.locator('[data-page]')).toHaveAttribute('data-page','task');
    }));
  }
  test('r004 role journey: created invitation reaches the intended account and is read back by its creator',async()=>run('invitation-handoff',1440,900,async(p,steps)=>{
    await p.goto(entry+'J05');await signIn(p,'yuan.chen@example.test');steps.push('负责人输入账号、正常验证并选择企业');
    await menu(p,'邀请记录');steps.push('业务导航打开邀请');await p.getByRole('button',{name:'邀请成员',exact:true}).click();steps.push('打开创建邀请');
    await p.getByRole('button',{name:'粘贴',exact:true}).click();await p.getByRole('textbox',{name:'快速粘贴',exact:true}).fill('new-a@example.test');steps.push('选择粘贴','粘贴受邀账号');
    await p.locator('.el-select:has(input[aria-label="本次邀请角色"]) .el-select__wrapper').click();await p.getByRole('option',{name:'只读成员',exact:true}).click();steps.push('选择只读成员角色');
    await p.getByRole('button',{name:'确认创建邀请',exact:true}).click();steps.push('确认创建并保留实际原ACT');
    await expect(p.locator('[data-local-outcome]')).toContainText('已完成');await menu(p,'邀请记录');steps.push('通过业务导航读取本次邀请记录');
    const row=p.locator('tbody tr').filter({hasText:'new-a@example.test'});const invitation=await row.locator('[data-invitation-id]').innerText();expect(invitation).toMatch(/^INV-/);
    await row.getByRole('button',{name:'打开邀请链接',exact:true}).click();steps.push('将本次实际INV链接交接受邀者并打开');await expect(p).toHaveURL(new RegExp('invite='+invitation));
    await p.getByRole('button',{name:'验证受邀组织账号',exact:true}).click();steps.push('受邀者验证该邀请指定的组织账号');await p.getByRole('button',{name:'核对并接受邀请',exact:true}).click();steps.push('核对接受');await p.locator('[data-confirm-submit]').click();steps.push('确认接受');
    await p.getByRole('button',{name:'进入该企业',exact:true}).click();steps.push('进入同一邀请企业');await expect(p.locator('[data-page]')).toHaveAttribute('data-page','modules');
    await menu(p,'账号与登录设备');await p.locator('[data-page="sessions"]').getByRole('button',{name:'退出当前浏览器',exact:true}).click();await p.getByRole('button',{name:'确认撤销',exact:true}).click();steps.push('受邀者正常退出当前会话');
    await signIn(p,'yuan.chen@example.test');steps.push('负责人正常重新登录并选择原企业');await menu(p,'邀请记录');
    await expect(p.locator('tbody tr').filter({hasText:invitation})).toContainText('已接受');steps.push('回读同一INV的接受状态');
  }));
}
