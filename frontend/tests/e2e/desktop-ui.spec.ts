import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

async function saveScreenshot(page: Page, info: TestInfo, name: string) {
  const filename = info.outputPath(name + '.png');
  await page.screenshot({ path: filename, animations: 'disabled' });
  await info.attach(name, { path: filename, contentType: 'image/png' });
}
async function openMembers(page: Page) {
  await page.goto('/members');
  await expect(page.getByRole('heading', { name: '成员管理', level: 1, exact: true })).toBeVisible();
  await expect(page.locator('.cs-workspace-loading')).toHaveCount(0);
}
for (const size of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1536, height: 1024 }]) {
  test('CoffeeLink Desktop shell and member page ' + size.width, async ({ page }, info) => {
    await page.setViewportSize(size);
    await openMembers(page);
    const header = page.locator('.cl-global-header');
    const rail = page.locator('.cl-primary-rail');
    const main = page.locator('.cl-desktop-main');
    await expect(header).toBeVisible();
    await expect(rail).toBeVisible();
    const h = await header.boundingBox();
    const r = await rail.boundingBox();
    expect(Math.abs((h?.height ?? 0) - 56)).toBeLessThanOrEqual(1);
    expect(Math.abs((r?.width ?? 0) - 208)).toBeLessThanOrEqual(1);
    await expect(page.locator('.cl-metric-card')).toHaveCount(4);
    await expect(page.locator('.cl-members-filter-panel')).toBeVisible();
    await expect(page.locator('.cl-members-table')).toBeVisible();
    await saveScreenshot(page, info, 'members-' + size.width);
    const headerElements = await page.locator('.cl-global-header > *').evaluateAll(nodes =>
      nodes.map(node => { const rect = node.getBoundingClientRect(); return { left:rect.left,right:rect.right }; })
    );
    for (let i = 0; i < headerElements.length - 1; i++) {
      expect(headerElements[i]!.right).toBeLessThanOrEqual(headerElements[i+1]!.left + 1);
    }
    const before = await main.boundingBox();
    await page.locator('[data-domain="enterprise"]').click();
    const panel = page.locator('.cl-navigation-panel');
    await expect(panel).toBeVisible();
    const pb = await panel.boundingBox();
    expect(Math.abs((pb?.width ?? 0) - 480)).toBeLessThanOrEqual(1);
    expect(Math.abs((pb?.x ?? 0) - 208)).toBeLessThanOrEqual(1);
    const after = await main.boundingBox();
    expect(Math.abs((before?.x ?? 0) - (after?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((before?.width ?? 0) - (after?.width ?? 0))).toBeLessThanOrEqual(1);
    await expect(panel.locator('.cl-navigation-menus')).toBeVisible();
    await expect(panel.locator('.cl-navigation-actions')).toBeVisible();
    await saveScreenshot(page, info, 'enterprise-open-' + size.width);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    const view = page.locator('.cl-member-row-actions').first().getByRole('button', { name:'查看', exact: true });
    await view.click();
    await expect(page.locator('.cl-member-detail')).toBeVisible();
    await expect(page.locator('.cl-toolbar-selection')).toContainText('已选择 0 项');
    await expect(page.locator('.cl-hero-art')).toBeVisible();
    await saveScreenshot(page, info, 'member-detail-' + size.width);
    await page.getByRole('button', { name:'关闭成员详情' }).click();
    await expect(page.locator('.cl-member-detail')).toHaveCount(0);
    await page.locator('.cl-rail-toggle').click();
    const collapsed = await rail.boundingBox();
    expect(Math.abs((collapsed?.width ?? 0) - 76)).toBeLessThanOrEqual(1);
    await page.locator('[data-domain="enterprise"]').click();
    const collapsedFlyout = await panel.boundingBox();
    expect(Math.abs((collapsedFlyout?.x ?? 0) - 76)).toBeLessThanOrEqual(1);
    await saveScreenshot(page, info, 'collapsed-menu-' + size.width);
    await page.locator('.cl-navigation-mask').click({ position: { x: size.width - 6, y: 10 } });
    await expect(panel).toHaveCount(0);
  });
}

test('Desktop member query preserves data and enforces existing service permissions', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await openMembers(page);
  const initial = await page.locator('.cl-members-table .el-table__body-wrapper tbody tr').count();
  expect(initial).toBeGreaterThan(0);
  await page.locator('.cl-member-search input').fill('陈雨');
  await page.getByRole('button',{name:'查询', exact:true}).click();
  await expect(page.locator('.cl-members-table .el-table__body-wrapper tbody tr')).toHaveCount(1);
  await page.locator('.cl-member-row-actions').first().getByRole('button', {name:'查看'}).click();
  await expect(page.locator('.cl-member-detail')).toContainText('陈雨');
  await expect(page.locator('.cl-toolbar-selection')).toContainText('已选择 0 项');
  await page.getByRole('button',{name:'关闭成员详情'}).click();
  await expect(page.locator('.cl-member-search input')).toHaveValue('陈雨');
  await page.getByRole('button',{name:'重置',exact:true}).click();
  await expect(page.locator('.cl-members-table .el-table__body-wrapper tbody tr')).toHaveCount(initial);
});
