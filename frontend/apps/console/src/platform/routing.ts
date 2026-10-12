import type { Router, RouteRecordRaw } from 'vue-router';
import type { ComponentRecordType, RouteRecordStringComponent } from '@vben/types';
import type { NavigationItem } from '#/api/mock/types';

import { markRaw } from 'vue';
import { generateAccessible } from '@vben/access';
import { BookOpenText, Grid, LayoutGrid, LockKeyhole, Settings, UserRoundPen } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { isSafeLocalPath, validateNavigation } from './navigation';

let workspaceRouter: Router | undefined;
let homePath = '/overview';
let allowedPaths = new Set<string>();
let installQueue: Promise<unknown> = Promise.resolve();

const viewMap: ComponentRecordType = {
  '/workspace.overview.vue': () => import('#/views/overview/index.vue').then((module) => module.default),
  '/crm.customer.list.vue': () => import('#/views/customers/index.vue').then((module) => module.default),
  '/workspace.members.vue': () => import('#/views/members/index.vue').then((module) => module.default),
  '/workspace.roles.vue': () => import('#/views/roles/index.vue').then((module) => module.default),
  '/workspace.profile.vue': () => import('#/views/settings/index.vue').then((module) => module.default),
  '/workspace.apps.vue': () => import('#/views/applications/index.vue').then((module) => module.default),
  '/platform.vue': () => import('#/views/platform/index.vue').then((module) => module.default),
};

const icons = {
  overview: markRaw(LayoutGrid), customers: markRaw(BookOpenText),
  members: markRaw(UserRoundPen), roles: markRaw(LockKeyhole),
  settings: markRaw(Settings), applications: markRaw(Grid), platform: markRaw(Grid),
};

export function createWorkspaceRoot(): RouteRecordRaw {
  return {
    name: 'Root', path: '/', component: () => import('#/layouts/basic.vue'),
    redirect: () => homePath,
    meta: { title: 'CS Biz', hideInBreadcrumb: true },
    children: [
      {
        name: 'Personal', path: '/personal', component: () => import('#/views/personal/index.vue'),
        meta: { title: 'menu.personal', hideInMenu: true, keepAlive: false },
      },
      {
        name: 'Forbidden', path: '/forbidden', component: () => import('#/views/states/index.vue'),
        meta: { title: 'menu.forbidden', hideInMenu: true, state: 'forbidden', keepAlive: false },
      },
      {
        name: 'NotFound', path: '/:path(.*)*', component: () => import('#/views/states/index.vue'),
        meta: { title: 'menu.notFound', hideInMenu: true, state: 'notFound', keepAlive: false },
      },
    ],
  };
}

export function configureWorkspaceRouter(router: Router) { workspaceRouter = router; }

export function clearWorkspaceRoutes() {
  allowedPaths = new Set();
  homePath = '/forbidden';
  const access = useAccessStore();
  access.setAccessMenus([]);
  access.setAccessRoutes([]);
  access.setIsAccessChecked(false);
  if (workspaceRouter) {
    workspaceRouter.removeRoute('Root');
    workspaceRouter.addRoute(createWorkspaceRoot());
  }
}

/** Serializing publication prevents an older asynchronous route build replacing a newer one. */
export function installWorkspaceRoutes(
  navigation: readonly NavigationItem[], platform: boolean, isCurrent: () => boolean,
) {
  const task = installQueue.then(async () => {
    if (!workspaceRouter || !isCurrent()) return false;
    const routes: RouteRecordStringComponent[] = platform
      ? [{
          name: 'platform', path: '/platform', component: 'platform',
          meta: { title: 'menu.platform', icon: icons.platform, order: 10, keepAlive: false },
        }]
      : validateNavigation(navigation).map((item) => ({
          name: `workspace-${item.name}`, path: item.path, component: item.viewKey,
          meta: {
            title: item.titleKey, order: item.order,
            icon: icons[item.name as keyof typeof icons], keepAlive: false,
          },
        }));
    clearWorkspaceRoutes();
    const { accessibleMenus, accessibleRoutes } = await generateAccessible('backend', {
      router: workspaceRouter, routes: [], pageMap: viewMap,
      fetchMenuListAsync: async () => routes,
    });
    if (!isCurrent()) { clearWorkspaceRoutes(); return false; }
    allowedPaths = new Set(routes.map((route) => route.path));
    homePath = routes[0]?.path || '/forbidden';
    const access = useAccessStore();
    access.setAccessMenus(accessibleMenus);
    access.setAccessRoutes(accessibleRoutes);
    access.setIsAccessChecked(true);
    return true;
  });
  installQueue = task.catch(() => undefined);
  return task;
}

export function canVisitPath(path: string) {
  return path === '/personal' || path === '/forbidden' || allowedPaths.has(path);
}

export function getWorkspaceHome() { return homePath; }

export async function navigateWorkspace(preferred?: unknown) {
  if (!workspaceRouter) return;
  const current = workspaceRouter.currentRoute.value;
  const requested = isSafeLocalPath(preferred) ? preferred : current.fullPath;
  const target = isSafeLocalPath(requested) && workspaceRouter.resolve(requested).path !== '/forbidden' && canVisitPath(workspaceRouter.resolve(requested).path)
    ? requested : homePath;
  await workspaceRouter.replace(target);
}

export async function navigateToLogin() { await workspaceRouter?.replace('/auth/login'); }
