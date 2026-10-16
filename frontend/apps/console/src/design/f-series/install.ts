import type { Router } from 'vue-router';
import { installWorkspaceRoutes } from '#/platform/routing';

/** Review-only route, isolated from normal application and production origins. */
export async function installFSeriesPreview(router: Router) {
  if (import.meta.env.MODE !== 'design' || location.hostname !== '127.0.0.1' || location.port !== '5790') {
    throw new Error('Design review requires its dedicated loopback origin');
  }
  // Publish no Mock Console navigation before the first render, including reloads.
  // This isolates the fixture; real BFF/Menu authorization remains a later F2 proof.
  await installWorkspaceRoutes([], false, () => true);
  const reviewPaths = new Set(['/__design', '/__design/f-series', '/forbidden']);
  router.beforeEach(to => {
    if (!reviewPaths.has(to.path)) return '/forbidden';
    return true;
  });
  router.addRoute({
    name: 'FSeriesDesign', path: '/__design', redirect: '/__design/f-series',
    component: () => import('./PreviewLayout.vue'),
    children: [{ name: 'FSeriesJourney', path: 'f-series', component: () => import('./JourneyPreview.vue') }],
  });
  router.removeRoute('Forbidden');
  router.addRoute({
    name: 'FSeriesDenied', path: '/forbidden',
    component: () => import('./PreviewLayout.vue'),
    children: [{ name: 'FSeriesDeniedState', path: '', component: () => import('./DeniedPreview.vue') }],
  });
}
