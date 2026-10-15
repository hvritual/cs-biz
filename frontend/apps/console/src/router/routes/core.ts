import type { RouteRecordRaw } from 'vue-router';
import { createWorkspaceRoot } from '#/platform/routing';

export const coreRoutes: RouteRecordRaw[] = [
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
