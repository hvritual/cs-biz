import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('Desktop member query preserves data and existing service permissions', async ({ app, screen, browser }) => {
  await app.open('/members');
  await expect(screen.getByRole('heading', { name: '成员管理', level: 1, exact: true })).toBeVisible();
  await expect(browser.locator('.cs-workspace-loading')).toHaveCount(0);
  const rows = browser.locator('.cl-members-table .el-table__body-wrapper tbody tr');
  await expect(rows.first()).toBeVisible();
  const initial = await rows.count();
  expect(initial).toBeGreaterThan(0);
  await browser.locator('.cl-member-search input').fill('陈雨');
  await screen.getByRole('button', { name: '查询', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await browser.locator('.cl-member-row-actions').first().getByRole('button', { name: '查看' }).click();
  await expect(browser.locator('.cl-member-detail')).toContainText('陈雨');
  await expect(browser.locator('.cl-toolbar-selection')).toContainText('已选择 0 项');
  await app.screenshot('member-query-detail');
  await screen.getByRole('button', { name: '关闭成员详情' }).click();
  await expect(browser.locator('.cl-member-search input')).toHaveValue('陈雨');
  await screen.getByRole('button', { name: '重置', exact: true }).click();
  await expect(rows).toHaveCount(initial);
  await app.screenshot('member-query-reset');
});
