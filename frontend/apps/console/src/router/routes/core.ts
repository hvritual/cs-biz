import type { RouteRecordRaw } from 'vue-router';
import { createWorkspaceRoot } from '#/platform/routing';

export const coreRoutes: RouteRecordRaw[] = [
  {
    name: 'Marketing', path: '/marketing', component: () => import('#/views/marketing/index.vue'),
    meta: { title: 'menu.marketing', hideInMenu: true, hideInTab: true },
  },
  {
    name: 'NoConsole', path: '/auth/no-console', component: () => import('#/views/auth/no-console.vue'),
    meta: { title: 'states.noConsoleTitle', hideInMenu: true, hideInTab: true },
  },
  createWorkspaceRoot(),
  {
    name: 'Login', path: '/auth/login', component: () => import('#/views/auth/index.vue'),
    meta: { title: 'menu.login', hideInMenu: true, hideInTab: true },
  },
  {
    name: 'TenantChoice', path: '/auth/tenants', component: () => import('#/views/auth/tenants.vue'),
    meta: { title: 'auth.chooseTenant', hideInMenu: true, hideInTab: true },
  },
];
