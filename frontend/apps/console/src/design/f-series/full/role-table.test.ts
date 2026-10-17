import { expect, it } from 'vitest';
import { parseRoleTable, roleTableExampleEn } from './role-table';
const header = '角色名称\t后台入口\t客户读取\t客户修改\t客户导出\t营销读取\t营销执行\t成员管理\t客户读取对象\t客户修改对象\t客户导出对象\t营销读取对象\t营销执行对象';
it('parses the complete business table and keeps per-action explicit sets separate', () => {
  const row = parseRoleTable(header + '\n服务成员\t允许\t当前企业全部\t指定对象\t不允许\t本人负责\t不允许\t不允许\t\tC-1001|C-1002\t\t\t');
  expect(row.name).toBe('服务成员');
  expect(row.update).toBe('explicit');
  expect(row.targets.update).toEqual(['C-1001', 'C-1002']);
  expect(row.export).toBe('none');
});
it('rejects unknown scope and incomplete or extra columns rather than broadening grants', () => {
  expect(() => parseRoleTable('角色名称\t客户修改\n宽权\t旧分组')).toThrow();
  expect(() => parseRoleTable(header + '\n服务成员\t允许\t当前企业全部\t旧分组\t不允许\t本人负责\t不允许\t不允许\t\t\t\t\t')).toThrow();
});
it('accepts the visible English business template with the same bounded grants', () => {
  const row = parseRoleTable(roleTableExampleEn);
  expect(row.menu).toBe(true); expect(row.update).toBe('self'); expect(row.access).toBe(false);
});
