import type { Scope } from './model';
export interface RoleInput { name: string; menu: boolean; access: boolean; read: Scope; update: Scope; export: Scope; marketingRead: Scope; marketingExecute: Scope; targets: Record<string, string[]> }
export const roleTableHeader = '角色名称\t后台入口\t客户读取\t客户修改\t客户导出\t营销读取\t营销执行\t成员管理\t客户读取对象\t客户修改对象\t客户导出对象\t营销读取对象\t营销执行对象';
export const roleTableHeaderEn = 'Role name\tConsole entry\tCustomer read\tCustomer update\tCustomer export\tMarketing read\tMarketing execute\tMember management\tCustomer read targets\tCustomer update targets\tCustomer export targets\tMarketing read targets\tMarketing execute targets';
export const roleTableExample = roleTableHeader + '\n服务成员\t允许\t当前企业全部\t本人负责\t不允许\t本人负责\t本人负责\t不允许\t\t\t\t\t';
export const roleTableExampleEn = roleTableHeaderEn + '\nService member\tAllowed\tAll in organization\tOwned by me\tNot allowed\tOwned by me\tOwned by me\tNot allowed\t\t\t\t\t';
export function parseRoleTable(text: string): RoleInput {
  if (text.length > 16000) throw new Error('配置内容过长，请只填写一个角色。');
  const lines = text.replaceAll('\r', '').split('\n');
  while (lines.length && !lines.at(-1)?.trim()) lines.pop();
  const expected = roleTableHeader.split('\t');
  const columns = lines[0]?.split('\t').map(v => v.trim()) || [];
  if (lines.length !== 2 || columns.length !== expected.length || ![expected, roleTableHeaderEn.split('\t')].some(header => columns.every((v, i) => v === header[i])))
    throw new Error('请粘贴完整的13列角色表：表头一行、配置一行，保留空的对象列。');
  const values = lines[1]!.split('\t').map(v => v.trim());
  if (values.length !== 13 || !values[0] || values[0].length > 60 || values.some(v => /^[=+@]/.test(v))) throw new Error('请核对完整13列内容，不使用公式。');
  const scopeNames: Record<string, Scope> = { '不允许': 'none', '当前企业全部': 'tenant', '本人负责': 'self', '明确指派': 'assigned', '指定对象': 'explicit', 'Not allowed': 'none', 'All in organization': 'tenant', 'Owned by me': 'self', 'Assigned': 'assigned', 'Explicit targets': 'explicit' };
  const scope = (index: number): Scope => {
    const value = scopeNames[values[index]!]; if (!value) throw new Error(`第${index + 1}列范围无效，不接受未知或旧分组权限。`); return value;
  };
  const flag = (index: number): boolean => {
    if (!['允许', '不允许', 'Allowed', 'Not allowed'].includes(values[index]!)) throw new Error(`第${index + 1}列请填写允许或不允许。`); return ['允许', 'Allowed'].includes(values[index]!);
  };
  const scopes = { read: scope(2), update: scope(3), export: scope(4), marketingRead: scope(5), marketingExecute: scope(6) };
  const targets: Record<string, string[]> = {};
  Object.entries(scopes).forEach(([action, value], index) => {
    const ids = [...new Set(values[index + 8]!.split('|').map(v => v.trim()).filter(Boolean))];
    if (ids.length > 1000 || (value === 'explicit' && !ids.length) || (value !== 'explicit' && ids.length)) throw new Error('只有指定对象范围填写对象编号，且该范围必须至少有一个明确对象。');
    targets[action] = ids;
  });
  return { name: values[0]!, menu: flag(1), access: flag(7), ...scopes, targets };
}
