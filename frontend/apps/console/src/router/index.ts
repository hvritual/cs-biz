import { createRouter, createWebHistory } from 'vue-router';
import { configureWorkspaceRouter } from '#/platform/routing';
import { createRouterGuard } from './guard';
import { routes } from './routes';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});
configureWorkspaceRouter(router);
createRouterGuard(router);
