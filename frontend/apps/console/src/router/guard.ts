import type { Router } from 'vue-router';
import { isSafeLocalPath, isWorkspacePath } from '#/platform/navigation';
import { canVisitPath, getWorkspaceHome } from '#/platform/routing';
import { useWorkspaceStore } from '#/store/workspace';

export function createRouterGuard(router: Router) {
  router.beforeEach(async (to) => {
    const workspace = useWorkspaceStore();
    await workspace.initialize();
    if (!workspace.user && workspace.error) {
      return to.path === '/forbidden' ? true : { path: '/forbidden', replace: true };
    }
    if (to.path === '/auth/login') {
      if (workspace.user && to.query.choose !== '1') return getWorkspaceHome();
      return true;
    }
    if (!workspace.user) {
      return { path: '/auth/login', query: isSafeLocalPath(to.fullPath) ? { redirect: to.fullPath } : {}, replace: true };
    }
    if ((isWorkspacePath(to.path) || to.path === '/platform') && !canVisitPath(to.path)) {
      return { path: '/forbidden', query: { from: to.path }, replace: true };
    }
    if (to.path === '/') return getWorkspaceHome();
    const resolved = router.resolve(to.fullPath);
    if (to.name !== resolved.name || to.matched[0] !== resolved.matched[0]) {
      return { path: to.path, query: to.query, hash: to.hash, replace: true };
    }
    return true;
  });
}
