import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

const issues = new Map<string, string[]>();
const forbiddenCopy = /未接入|未对接|开发中|待开发|占位|演示数据|模拟数据|\b(?:mock|stub|placeholder|TODO|API|backend|frontend|not implemented|coming soon)\b/i;

test.beforeEach(async ({ page, context }, info) => {
  const messages: string[] = [];
  issues.set(info.testId, messages);
  const observe = (target: Page) => {
    target.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    target.on('requestfailed', (request) => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') messages.push(`request failed: ${request.url()} ${request.failure()?.errorText}`);
    });
    target.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`);
    });
  };
  observe(page);
  context.on('page', observe);
});

test.afterEach(async ({ page }, info) => {
  if (!page.isClosed()) {
    await expect(page.locator('body')).not.toContainText(forbiddenCopy);
    await expect(page).not.toHaveTitle(forbiddenCopy);
  }
  expect(issues.get(info.testId) ?? [], 'Browser console and unhandled errors').toEqual([]);
  issues.delete(info.testId);
});

async function open(page: Page, path: string, title: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('.cs-workspace-loading')).toHaveCount(0);
}

async function account(page: Page, id: string) {
  await page.goto('/auth/login?choose=1');
  await page.getByTestId(`account-${id}`).click();
  await expect(page).not.toHaveURL(/\/auth\/login/);
  if (id === 'chen' || id === 'zhou') {
    // New account entry is not permission to choose the first of several tenants.
    await expect(page).toHaveURL(/\/auth\/tenants/);
    await page.getByTestId('tenant-choice-qinghe').click();
    // A click dispatch is not a completed asynchronous workspace switch.
    // Wait for the authorized tenant shell, not for a loading node which
    // does not exist on the standalone tenant chooser.
    await expect(page.locator('.cs-tenant-select')).toContainText('青禾咖啡');
    await expect(page).not.toHaveURL(/\/auth\/tenants/);
  }
  await expect(page.locator('.cs-workspace-loading')).toHaveCount(0);
}

async function tenant(page: Page, name: string, label = '选择企业') {
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.cs-tenant-select').filter({ has: page.getByRole('combobox', { name: label, exact: true }) }).click();
  await page.getByRole('option', { name, exact: true }).click();
  await expect(page.locator('.cs-workspace-loading')).toHaveCount(0);
  await expect(page.locator('.cs-tenant-select')).toContainText(name);
}

async function shot(page: Page, info: TestInfo, name: string) {
  await expect(page.locator('.el-message')).toHaveCount(0);
  const hasDialog = await page.getByRole('dialog').count() > 0;
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: !hasDialog, animations: 'disabled' });
  await info.attach(name, { path: info.outputPath(`${name}.png`), contentType: 'image/png' });
  await expect(page.locator('body')).not.toContainText(forbiddenCopy);
}

const rows = (page: Page) => page.locator('.el-table__body-wrapper tbody tr');
const customerRow = (page: Page, name: string) => page.getByTestId('customer-table').locator('tbody tr').filter({ hasText: name });

test('customer journey: validate, create, search, edit, refresh, archive, paginate', async ({ page }, info) => {
  await open(page, '/customers', '客户管理');
  await expect(customerRow(page, '云杉科技')).toBeVisible();
  await expect(rows(page)).toHaveCount(8);
  await shot(page, info, 'customers-desktop');

  await page.getByTestId('customer-status-filter').click();
  await page.getByRole('option', { name: '洽谈中', exact: true }).click();
  await expect(rows(page)).toHaveCount(2);
  await page.getByTestId('customer-search').fill('没有这家企业');
  await expect(page.getByText('没有找到符合条件的客户', { exact: true })).toBeVisible();
  await shot(page, info, 'customers-empty-search');
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(rows(page)).toHaveCount(8);

  await page.getByTestId('create-customer').click();
  await expect(page.getByRole('dialog', { name: '新建客户' })).toBeVisible();
  await shot(page, info, 'customer-create-drawer');
  await page.getByTestId('save-customer').click();
  await expect(page.getByText('请填写客户名称', { exact: true })).toBeVisible();
  await page.getByTestId('customer-company').fill('松风空间');
  await page.getByTestId('customer-contact').fill('宋岚');
  await page.getByTestId('customer-phone').fill('13800002001');
  await page.getByTestId('save-customer').dblclick();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(customerRow(page, '松风空间')).toHaveCount(1);

  await page.getByTestId('customer-search').fill('松风');
  await customerRow(page, '松风空间').getByRole('button', { name: '编辑', exact: true }).click();
  await page.getByTestId('customer-phone').fill('13800002002');
  await page.getByTestId('save-customer').click();
  await expect(customerRow(page, '松风空间')).toContainText('13800002002');
  await page.reload();
  await expect(customerRow(page, '松风空间')).toContainText('13800002002');
  await customerRow(page, '松风空间').getByRole('button', { name: '查看', exact: true }).click();
  await page.getByRole('button', { name: '归档客户', exact: true }).click();
  await page.locator('.el-message-box').getByRole('button', { name: '归档客户', exact: true }).click();
  await expect(customerRow(page, '松风空间')).toHaveCount(0);
  await expect(rows(page)).toHaveCount(8);
  await page.locator('.el-pagination__sizes').click();
  await page.getByRole('option', { name: '5条/页', exact: true }).click();
  await expect(rows(page)).toHaveCount(5);
  await page.locator('.btn-next').click();
  await expect(rows(page)).toHaveCount(3);
});

test('roles and members: create, persist, change access, protect the last owner', async ({ page }, info) => {
  await open(page, '/roles', '成员权限');
  await page.getByRole('button', { name: '新建权限集', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('textbox', { name: /权限集名称$/ }).fill('客户协作');
  await drawer.locator('.pse-row', { hasText: '工作台' }).locator('.pse-menu .el-switch').click();
  await drawer.getByText('查看工作台', { exact: true }).click();
  await expect(drawer.getByRole('checkbox', { name: '查看工作台', exact: true })).toBeChecked();
  await drawer.locator('.pse-row', { hasText: '客户列表' }).locator('.pse-menu .el-switch').click();
  await drawer.getByText('查看客户', { exact: true }).click();
  await expect(drawer.getByRole('checkbox', { name: '查看客户', exact: true })).toBeChecked();
  await shot(page, info, 'role-scope-editor');
  await drawer.getByRole('button', { name: '保存权限集', exact: true }).click();
  await expect(rows(page).filter({ hasText: '客户协作' })).toBeVisible();
  await page.reload();
  await expect(rows(page).filter({ hasText: '客户协作' })).toBeVisible();

  await open(page, '/members', '成员管理');
  const owner = rows(page).filter({ hasText: '陈予安' });
  await expect(owner.getByRole('button', { name: '暂停访问', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '添加成员', exact: true }).click();
  // The persisted UI is a two-step page, not the retired creation drawer.
  await expect(page).toHaveURL(/\/members\/create$/);
  await expect(page.getByRole('heading', { name: '添加成员', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('textbox', { name: /用户名$/ }).fill('linqing');
  await page.getByRole('textbox', { name: /姓名$/ }).fill('林清');
  await page.getByRole('textbox', { name: /邮箱$/ }).fill('linqing@example.test');
  await page.getByRole('textbox', { name: /职务$/ }).fill('客户顾问');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.getByRole('button', { name: '自定义权限', exact: true }).click();
  await page.locator('.cl-custom-panel').getByRole('combobox').press('Enter');
  await page.getByRole('option', { name: '客户协作', exact: true }).click();
  await page.getByRole('heading', { name: '添加成员', exact: true, level: 1 }).click();
  await expect(page.getByRole('checkbox', { name: '查看客户', exact: true })).toBeChecked();
  await expect(page.getByText('当前权限配置与「客户协作」一致，将直接复用，不会重复创建。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '保存成员', exact: true }).click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(rows(page).filter({ hasText: '林清' })).toBeVisible();
  await rows(page).filter({ hasText: '林清' }).getByRole('button', { name: '暂停访问', exact: true }).click();
  await page.locator('.el-message-box').getByRole('button', { name: '暂停访问', exact: true }).click();
  await expect(rows(page).filter({ hasText: '林清' })).toContainText('已暂停');
  await rows(page).filter({ hasText: '林清' }).getByRole('button', { name: '恢复访问', exact: true }).click();
  await page.locator('.el-message-box').getByRole('button', { name: '恢复访问', exact: true }).click();
  await expect(rows(page).filter({ hasText: '林清' })).toContainText('可访问');
  await shot(page, info, 'members-desktop');

  await page.goto('/auth/login?choose=1');
  await page.getByRole('button').filter({ hasText: 'linqing@example.test' }).click();
  await open(page, '/customers', '客户管理');
  await expect(page.getByTestId('create-customer')).toHaveCount(0);
  await expect(page.getByText('还没有客户', { exact: true })).toBeVisible();
  await page.goto('/members');
  await expect(page).toHaveURL(/\/forbidden/);

  await account(page, 'chen');
  await open(page, '/customers', '客户管理');
  await page.getByTestId('create-customer').click();
  await page.getByTestId('customer-company').fill('林间小筑');
  await page.getByTestId('customer-contact').fill('乔林');
  await page.getByTestId('customer-phone').fill('13800005001');
  await page.getByTestId('customer-owner').click();
  await page.getByRole('option', { name: '林清', exact: true }).click();
  await page.getByTestId('save-customer').click();
  await expect(customerRow(page, '林间小筑')).toContainText('林清');
  await page.goto('/auth/login?choose=1');
  await page.getByRole('button').filter({ hasText: 'linqing@example.test' }).click();
  await open(page, '/customers', '客户管理');
  await expect(rows(page)).toHaveCount(1);
  await expect(customerRow(page, '林间小筑')).toBeVisible();
});

test('member creation configures and binds a new permission set inline', async ({ page }, info) => {
  await open(page, '/members', '成员管理');
  await page.getByRole('button', { name: '添加成员', exact: true }).click();
  await expect(page).toHaveURL(/\/members\/create$/);
  await expect(page.getByRole('heading', { name: '添加成员', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('textbox', { name: /用户名$/ }).fill('shenzhao');
  await page.getByRole('textbox', { name: /姓名$/ }).fill('沈昭');
  await page.getByRole('textbox', { name: /邮箱$/ }).fill('shenzhao@example.test');
  await page.getByRole('textbox', { name: /所属部门$/ }).fill('运营管理部');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.getByRole('button', { name: '自定义权限', exact: true }).click();
  await page.locator('.cl-inline-set-name').getByRole('textbox').fill('客户协作组');
  await page.getByRole('button', { name: '保存成员', exact: true }).click();
  await expect(page.getByText('请至少启用一个菜单', { exact: true })).toBeVisible();
  const crmRow = page.locator('.pse-row', { hasText: '客户列表' });
  await crmRow.locator('.pse-menu .el-switch').click();
  await crmRow.getByText('查看客户', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: '查看客户', exact: true })).toBeChecked();
  await crmRow.getByText('同组', { exact: true }).click();
  await expect(crmRow.getByRole('radio', { name: '同组', exact: true })).toBeChecked();
  await shot(page, info, 'member-inline-permission-set');
  await page.getByRole('button', { name: '保存成员', exact: true }).click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.getByRole('heading', { name: '成员管理', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const created = rows(page).filter({ hasText: '沈昭' });
  await expect(created).toContainText('客户协作组');
  await expect(created).toContainText('同组数据');
  await page.reload();
  await expect(rows(page).filter({ hasText: '沈昭' })).toContainText('客户协作组');
});

test('read-all does not widen write-own; live revocation clears the open customer form', async ({ page, context }, info) => {
  await account(page, 'zhou');
  await open(page, '/customers', '客户管理');
  await expect(rows(page)).toHaveCount(8);
  await expect(customerRow(page, '云杉科技').getByRole('button', { name: '编辑', exact: true })).toHaveCount(0);
  await expect(customerRow(page, '星河书店').getByRole('button', { name: '编辑', exact: true })).toBeVisible();
  await expect(page.getByTestId('customer-table').getByRole('button', { name: '编辑', exact: true })).toHaveCount(2);
  await customerRow(page, '星河书店').getByRole('button', { name: '编辑', exact: true }).click();
  await page.getByTestId('customer-phone').fill('13800009999');
  const admin = await context.newPage();
  await open(admin, '/members', '成员管理');
  await rows(admin).filter({ hasText: '周远' }).getByRole('button', { name: '暂停访问', exact: true }).click();
  await admin.locator('.el-message-box').getByRole('button', { name: '暂停访问', exact: true }).click();
  await expect(page).toHaveURL(/\/forbidden/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('customer-table')).toHaveCount(0);
  await expect(page.getByText(/访问已暂停/)).toBeVisible();
  await shot(page, info, 'access-paused');
  await page.goto('/customers');
  await expect(page).toHaveURL(/\/forbidden/);
  await open(admin, '/customers', '客户管理');
  await expect(customerRow(admin, '星河书店')).toContainText('13800001002');
});

test('enterprise isolation and application request through platform approval and closure', async ({ page, context }, info) => {
  await open(page, '/customers', '客户管理');
  await page.getByTestId('create-customer').click();
  await page.getByTestId('customer-company').fill('不应带到另一企业');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await tenant(page, '云岚生活');
  await expect(page.getByTestId('customer-table')).toHaveCount(0);
  await open(page, '/applications', '应用中心');
  await page.getByRole('button', { name: '申请开通', exact: true }).click();
  await page.locator('.el-message-box').getByRole('button', { name: '提交申请', exact: true }).click();
  await expect(page.getByText('申请处理中', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('申请处理中', { exact: true })).toBeVisible();
  await shot(page, info, 'application-request');
  const operator = await context.newPage();
  await account(operator, 'platform');
  await expect(operator.getByRole('heading', { name: '企业管理', exact: true })).toBeVisible();
  await operator.getByRole('button', { name: '同意开通', exact: true }).click();
  await operator.locator('.el-message-box').getByRole('button', { name: '开通应用', exact: true }).click();
  await expect(page.getByRole('button', { name: '进入客户管理', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '进入客户管理', exact: true }).click();
  await expect(rows(page)).toHaveCount(4);
  await expect(customerRow(page, '云杉科技')).toHaveCount(0);
  await shot(operator, info, 'platform-enterprises');
  await rows(operator).filter({ hasText: '云岚生活' }).filter({ has: operator.getByRole('button', { name: '暂停应用', exact: true }) }).getByRole('button', { name: '暂停应用', exact: true }).click();
  await operator.locator('.el-message-box').getByRole('button', { name: '暂停应用', exact: true }).click();
  await expect(page.getByTestId('customer-table')).toHaveCount(0);
  await page.goto('/customers');
  await expect(page).toHaveURL(/\/forbidden/);
  await tenant(page, '青禾咖啡');
  await open(page, '/customers', '客户管理');
  await expect(customerRow(page, '云杉科技')).toBeVisible();
  await expect(rows(page)).toHaveCount(8);
  await page.goto('/platform');
  await expect(page).toHaveURL(/\/forbidden/);
});

test('preferences: language, theme, color, density, system mode and scoped persistence', async ({ page }, info) => {
  await open(page, '/personal', '个人偏好');
  const originalBrandColor = await page.locator('.cs-brand-mark').first().evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByTestId('theme-dark').click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByTestId('color-3').click();
  await expect(page.getByTestId('color-3')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.locator('.cs-brand-mark').first().evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(originalBrandColor);
  await page.getByText('紧凑', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await page.getByTestId('locale-select').click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Personal preferences', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Personal preferences', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByTestId('color-3')).toHaveAttribute('aria-pressed', 'true');
  await open(page, '/customers', 'Customers');
  await expect(page.getByTestId('create-customer')).toHaveText('New customer');
  const brandColor = await page.locator('.cs-brand-mark').first().evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(page.getByTestId('create-customer')).toHaveCSS('background-color', brandColor);
  await expect(page.locator('.el-pager .is-active')).toHaveCSS('background-color', brandColor);
  await expect(page.locator('.el-pagination__sizes')).toContainText('/page');
  await page.getByTestId('create-customer').click();
  await page.getByTestId('save-customer').click();
  await expect(page.getByText('Enter a customer name.', { exact: true })).toBeVisible();
  await page.getByTestId('customer-company').hover();
  await expect(page.getByTestId('save-customer')).toHaveCSS('background-color', brandColor);
  await shot(page, info, 'customer-dark-english');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await tenant(page, '云岚生活', 'Select a workspace');
  await open(page, '/personal', '个人偏好');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.getByTestId('color-1')).toHaveAttribute('aria-pressed', 'true');
  await tenant(page, '青禾咖啡');
  await expect(page.getByRole('heading', { name: 'Personal preferences', exact: true })).toBeVisible();
  await page.getByTestId('theme-auto').click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test.skip('mobile: usable navigation and full-width customer drawer without page overflow', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/customers', '客户管理');
  await expect(customerRow(page, '云杉科技')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await shot(page, info, 'customers-mobile');
  await page.getByTestId('create-customer').click();
  const box = await page.getByRole('dialog', { name: '新建客户' }).boundingBox();
  expect(box).toBeTruthy();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  await shot(page, info, 'customer-drawer-mobile');
  await page.getByTestId('customer-company').fill('南巷书房');
  await page.getByTestId('customer-contact').fill('南知');
  await page.getByTestId('customer-phone').fill('13800003001');
  await page.getByTestId('save-customer').click();
  await expect(customerRow(page, '南巷书房')).toBeVisible();
  await page.getByRole('button', { name: '展开侧栏', exact: true }).click();
  await expect(page.getByRole('button', { name: '收起侧栏', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('menuitem', { name: '工作台', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('陈予安');
  await expect(page.getByRole('button', { name: '展开侧栏', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await shot(page, info, 'overview-mobile');
  await page.getByRole('button', { name: '账户 · 陈予安', exact: true }).click();
  await page.getByRole('menuitem', { name: '个人偏好', exact: true }).click();
  await expect(page.getByRole('heading', { name: '个人偏好', exact: true })).toBeVisible();
  await page.getByTestId('theme-dark').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await shot(page, info, 'preferences-mobile-dark');
});

test('profile draft survives unrelated data updates; saved values survive refresh', async ({ page, context }, info) => {
  await open(page, '/settings', '企业资料');
  await page.getByTestId('tenant-name').fill('青禾咖啡工作室');
  const colleague = await context.newPage();
  await open(colleague, '/customers', '客户管理');
  await colleague.getByTestId('create-customer').click();
  await colleague.getByTestId('customer-company').fill('山茶工坊');
  await colleague.getByTestId('customer-contact').fill('茶知');
  await colleague.getByTestId('customer-phone').fill('13800004001');
  await colleague.getByTestId('save-customer').click();
  await expect(customerRow(colleague, '山茶工坊')).toBeVisible();
  await expect(page.getByTestId('tenant-name')).toHaveValue('青禾咖啡工作室');
  await page.getByRole('button', { name: '保存资料', exact: true }).click();
  await expect(page.locator('.cs-tenant-select')).toContainText('青禾咖啡工作室');
  await page.reload();
  await expect(page.getByTestId('tenant-name')).toHaveValue('青禾咖啡工作室');
  await shot(page, info, 'enterprise-profile');
});

test('logout preserves a safe deep link and never grants platform access', async ({ page }) => {
  await open(page, '/customers', '客户管理');
  await page.getByRole('button', { name: '账户 · 陈予安', exact: true }).click();
  await page.getByRole('menuitem', { name: '退出登录', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.goto('/customers');
  await expect(page).toHaveURL(/\/auth\/login\?redirect=/);
  await page.getByTestId('account-yu').click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(rows(page)).toHaveCount(8);
  await expect(page.getByTestId('create-customer')).toHaveCount(0);
  await expect(page.getByTestId('customer-table').getByRole('button', { name: '编辑', exact: true })).toHaveCount(0);
  await page.goto('/platform');
  await expect(page).toHaveURL(/\/forbidden/);
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('没有找到');
});

test('startup failure preserves existing records and supports recovery after storage is repaired', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('qa-corrupt-once')) {
      sessionStorage.setItem('qa-corrupt-once', 'yes');
      localStorage.setItem('csbiz.s01.database.v1', '{unreadable');
    }
  });
  await page.goto('/customers');
  await expect(page.getByRole('heading', { name: '暂时无法打开工作空间', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('csbiz.s01.database.v1'))).toBe('{unreadable');
  await expect(page.locator('#__app-loading__')).toHaveCount(0);
  await shot(page, info, 'startup-recovery');
  // The user-facing retry never deletes records. This removal simulates an external repair.
  await page.evaluate(() => localStorage.removeItem('csbiz.s01.database.v1'));
  await page.getByRole('button', { name: '重新打开', exact: true }).click();
  await expect(customerRow(page, '云杉科技')).toBeVisible();
});

test('storage quota failure shows business recovery copy and never claims a successful save', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('qa-quota-once')) {
      sessionStorage.setItem('qa-quota-once', 'yes');
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'csbiz.s01.database.v1') throw new DOMException('Quota', 'QuotaExceededError');
        original.call(this, key, value);
      };
    }
  });
  await page.goto('/customers');
  await expect(page.getByRole('heading', { name: '暂时无法打开工作空间', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('csbiz.s01.database.v1'))).toBeNull();
  await page.getByRole('button', { name: '重新打开', exact: true }).click();
  await expect(customerRow(page, '云杉科技')).toBeVisible();
});

test('account list failure during use keeps a business recovery action and can be retried', async ({ page }, info) => {
  await open(page, '/customers', '客户管理');
  const database = await page.evaluate(() => localStorage.getItem('csbiz.s01.database.v1'));
  expect(database).toBeTruthy();
  await page.evaluate(() => localStorage.setItem('csbiz.s01.database.v1', '{unreadable'));
  await page.getByRole('button', { name: '账户 · 陈予安', exact: true }).click();
  await page.getByRole('menuitem', { name: '切换账户', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login\?choose=1$/);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('account-chen')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '重试', exact: true })).toBeVisible();
  await shot(page, info, 'account-recovery');
  expect(await page.evaluate(() => localStorage.getItem('csbiz.s01.database.v1'))).toBe('{unreadable');
  await page.evaluate((saved) => localStorage.setItem('csbiz.s01.database.v1', saved!), database);
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await page.getByTestId('account-chen').click();
  await expect(page).toHaveURL(/\/auth\/tenants/);
  await page.getByTestId('tenant-choice-qinghe').click();
  // Recovery is complete only when the newly-authorized workspace shell exists.
  await expect(page.locator('.cs-tenant-select')).toContainText('青禾咖啡');
  await expect(page).not.toHaveURL(/\/auth\/tenants/);
  await open(page, '/customers', '客户管理');
  await expect(customerRow(page, '云杉科技')).toBeVisible();
});


test('account entry with multiple eligible enterprises requires a deliberate selection', async ({ page }) => {
  await page.goto('/auth/login?choose=1');
  await page.getByTestId('account-chen').click();
  await expect(page).toHaveURL(/\/auth\/tenants/);
  await expect(page.getByRole('heading', { name: '选择要进入的企业' })).toBeVisible();
  await expect(page.getByTestId('tenant-choice-qinghe')).toBeVisible();
  await expect(page.getByTestId('tenant-choice-yunlan')).toBeVisible();
  await page.goto('/customers');
  await expect(page).toHaveURL(/\/auth\/tenants/);
  await page.getByTestId('tenant-choice-qinghe').click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByRole('heading', { name: '客户管理', level: 1 })).toBeVisible();
});

test('authenticated account without active memberships sees recovery instead of a login loop', async ({ page }) => {
  await page.goto('/auth/login?choose=1');
  await page.getByTestId('account-shen').click();
  await expect(page).toHaveURL(/\/auth\/tenants/);
  await expect(page.getByRole('heading', { name: '暂时没有可进入的企业' })).toBeVisible();
  await expect(page.locator('[data-testid^="tenant-choice-"]')).toHaveCount(0);
  await page.goto('/members');
  await expect(page).toHaveURL(/\/auth\/tenants/);
  await page.getByRole('button', { name: '切换账号' }).click();
  await expect(page).toHaveURL(/\/auth\/login\?choose=1$/);
});


test('V2.2: separate Console Menu grants from Function grants and retain per-function Data scope', async ({ page }, info) => {
  await open(page, '/roles', '成员权限');
  await page.getByRole('button', { name: '新建权限集', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: /权限集名称$/ }).fill('按动作独立范围');
  const crm = dialog.locator('.pse-row', { hasText: '客户列表' });
  await crm.locator('.pse-menu .el-switch').click();
  await expect(crm.getByRole('checkbox', { name: '查看客户' })).not.toBeChecked();
  await crm.getByText('查看客户', { exact: true }).click();
  await crm.getByText('编辑客户', { exact: true }).click();
  const cells = crm.locator('.pse-action-scope');
  await cells.nth(0).getByText('所有', { exact: true }).click();
  await cells.nth(2).getByText('个人', { exact: true }).click();
  await expect(cells.nth(0).getByRole('radio', { name: '所有' })).toBeChecked();
  await expect(cells.nth(2).getByRole('radio', { name: '个人' })).toBeChecked();
  await shot(page, info, 'three-rights-menu-function-scope');
  await dialog.getByRole('button', { name: '保存权限集', exact: true }).click();
  const target = rows(page).filter({ hasText: '按动作独立范围' });
  await expect(target).toBeVisible();
  await target.getByRole('button', { name: '编辑' }).click();
  const reloaded = page.getByRole('dialog').locator('.pse-row', { hasText: '客户列表' }).locator('.pse-action-scope');
  await expect(reloaded.nth(0).getByRole('radio', { name: '所有' })).toBeChecked();
  await expect(reloaded.nth(2).getByRole('radio', { name: '个人' })).toBeChecked();
});

test('V2.2: marketing Function without any Console Menu grants uses marketing but cannot open Console', async ({ page }, info) => {
  await open(page, '/members', '成员管理');
  // This fixture uses the S01 browser-only local data contract, not a credential bypass in a real server.
  await page.evaluate(() => {
    const key = 'csbiz.s01.database.v1';
    const state = JSON.parse(localStorage.getItem(key)!) as {
      roles: Array<Record<string, unknown>>;
      memberships: Array<{ id: string; roleIds: string[] }>;
      accessVersions: Record<string, number>;
    };
    state.roles.push({
      id: 'qinghe-marketing-fixture', tenantId: 'qinghe', name: '营销执行成员',
      description: '仅营销能力', isSystem: false, isOwner: false, menuGrants: [],
      grants: [
        { action: 'marketing.campaign.read', scope: 'own' },
        { action: 'marketing.campaign.execute', scope: 'own' },
      ],
    });
    const member = state.memberships.find((m) => m.id === 'qinghe-zhou')!;
    member.roleIds = ['qinghe-marketing-fixture'];
    state.accessVersions.qinghe = (state.accessVersions.qinghe ?? 0) + 1;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.goto('/auth/login?choose=1');
  await page.getByTestId('account-zhou').click();
  await expect(page).toHaveURL(/\/auth\/tenants/);
  await page.getByTestId('tenant-choice-qinghe').click();
  await expect(page).toHaveURL(/\/marketing$/);
  await expect(page.getByRole('heading', { name: '营销工作区' })).toBeVisible();
  await expect(page.getByTestId('marketing-campaigns').locator('.el-table__body-wrapper tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: '执行活动', exact: true }).click();
  await expect(page.getByTestId('marketing-campaigns')).toContainText('1');
  await shot(page, info, 'marketing-function-no-console-menu');
  await page.goto('/members');
  await expect(page).toHaveURL(/\/auth\/no-console/);
  await expect(page.getByRole('heading', { name: '当前账号没有管理后台权限' })).toBeVisible();
  await page.getByRole('button', { name: '进入营销工作区' }).click();
  await expect(page).toHaveURL(/\/marketing$/);
});
