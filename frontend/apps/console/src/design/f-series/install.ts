import type { Router } from 'vue-router';
import { installWorkspaceRoutes } from '#/platform/routing';
import { reviewPages, reviewBase } from './full/catalog';

/** Review-only route, isolated from normal application and production origins. */
export async function installFSeriesPreview(router: Router) {
  const loopback = location.hostname === '127.0.0.1' && location.port === '5790';
  const reviewOrigin = import.meta.env.VITE_F_SERIES_REVIEW_ORIGIN as string | undefined;
  const privateReview = !!reviewOrigin && reviewOrigin.startsWith('https://') && location.origin === reviewOrigin;
  if (import.meta.env.MODE !== 'design' || (!loopback && !privateReview)) {
    throw new Error('Design review requires its dedicated loopback origin');
  }
  // Publish no Mock Console navigation before the first render, including reloads.
  // This isolates the fixture; real BFF/Menu authorization remains a later F2 proof.
  await installWorkspaceRoutes([], false, () => true);
  const reviewPaths = new Set(['/__design', '/__design/f-series', '/forbidden']);
  for (const page of reviewPages) reviewPaths.add(`${reviewBase}/${page.id}`);
  reviewPaths.add(reviewBase);
  router.beforeEach((to, from) => {
    if (!reviewPaths.has(to.path)) {
      if (from.path.startsWith(reviewBase)) sessionStorage.setItem('cs-biz:f-series:review-return', from.fullPath);
      else sessionStorage.removeItem('cs-biz:f-series:review-return');
      return '/forbidden';
    }
    return true;
  });
  // The canonical authorization guard may redirect before this guard sees an
  // inaccessible Console path. Record the successful review route itself.
  router.afterEach((to) => {
    if (to.path.startsWith(reviewBase) && reviewPaths.has(to.path)) {
      sessionStorage.setItem('cs-biz:f-series:review-return', to.fullPath);
    } else if (to.path === '/__design/f-series') {
      sessionStorage.removeItem('cs-biz:f-series:review-return');
    }
  });
  router.addRoute({
    name: 'FSeriesDesign', path: '/__design', redirect: '/__design/f-series',
    component: () => import('./PreviewLayout.vue'),
    children: [
      { name: 'FSeriesJourney', path: 'f-series', component: () => import('./JourneyPreview.vue') },
      { name: 'FSeriesFullHome', path: 'f-series/full', redirect: `${reviewBase}/identity` },
      { name: 'FSeriesFullReview', path: 'f-series/full/:page', component: () => import('./full/ReviewWorkbench.vue') },
    ],
  });
  router.removeRoute('Forbidden');
  router.addRoute({
    name: 'FSeriesDenied', path: '/forbidden',
    component: () => import('./PreviewLayout.vue'),
    children: [{ name: 'FSeriesDeniedState', path: '', component: () => import('./DeniedPreview.vue') }],
  });
  if(privateReview && location.pathname==='/') await router.replace(`${reviewBase}/identity`);
}
