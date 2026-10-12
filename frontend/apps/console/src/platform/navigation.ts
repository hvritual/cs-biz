import type { NavigationItem } from '#/api/mock/types';

export const NAVIGATION_POLICY = {
  'workspace.overview': { name: 'overview', path: '/overview', titleKey: 'menu.overview', order: 10 },
  'workspace.customers': { name: 'customers', path: '/customers', titleKey: 'menu.customers', order: 20 },
  'workspace.members': { name: 'members', path: '/members', titleKey: 'menu.members', order: 30 },
  'workspace.roles': { name: 'roles', path: '/roles', titleKey: 'menu.roles', order: 40 },
  'workspace.settings': { name: 'settings', path: '/settings', titleKey: 'menu.settings', order: 50 },
  'workspace.platform': { name: 'platform', path: '/platform', titleKey: 'menu.platform', order: 60 },
} as const;

export type WorkspaceViewKey = keyof typeof NAVIGATION_POLICY;

export const ENTERPRISE_CENTER_ITEMS = [
  { key: 'personal', titleKey: 'menu.personal', path: '/personal' },
  { key: 'members', titleKey: 'menu.members', path: '/members' },
  { key: 'roles', titleKey: 'menu.roles', path: '/roles' },
  { key: 'organization', titleKey: 'menu.organization', path: '/organization' },
  { key: 'package', titleKey: 'menu.package', path: '/package' },
  { key: 'enterprise', titleKey: 'menu.enterprise', path: '/enterprise' },
  { key: 'brand', titleKey: 'menu.brand', path: '/brand' },
  { key: 'logs', titleKey: 'menu.logs', path: '/logs' },
] as const;

export function validateNavigation(input: readonly NavigationItem[]): NavigationItem[] {
  const names = new Set<string>();
  const paths = new Set<string>();
  const views = new Set<string>();
  return input.map((item) => {
    if (!Object.hasOwn(NAVIGATION_POLICY, item.viewKey)) throw new Error('Invalid navigation view');
    const policy = NAVIGATION_POLICY[item.viewKey as WorkspaceViewKey];
    if (
      policy.name !== item.name || policy.path !== item.path || policy.titleKey !== item.titleKey ||
      !Number.isFinite(item.order) || names.has(item.name) || paths.has(item.path) || views.has(item.viewKey)
    ) throw new Error('Invalid navigation entry');
    names.add(item.name); paths.add(item.path); views.add(item.viewKey);
    return { ...policy, viewKey: item.viewKey };
  }).sort((a, b) => a.order - b.order);
}

export function isWorkspacePath(path: string) {
  return Object.values(NAVIGATION_POLICY).some((item) => item.path === path);
}

export function isSafeLocalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') &&
    !value.startsWith('//') && !value.includes('\\') &&
    !Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}
