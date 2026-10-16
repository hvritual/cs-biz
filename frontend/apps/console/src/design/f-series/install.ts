import type { Router } from 'vue-router';

const roleKey = 'cs-biz:f-series-design:function-only';
export function setFunctionOnly(value: boolean) {
  if (value) sessionStorage.setItem(roleKey, '1');
  else sessionStorage.removeItem(roleKey);
}

/** Review-only route, isolated from normal application and production origins. */
export function installFSeriesPreview(router: Router) {
  if (import.meta.env.MODE !== 'design' || location.hostname !== '127.0.0.1' || location.port !== '5790') {
    throw new Error('Design review requires its dedicated loopback origin');
  }
  // Fixture routing: every Console path, including nested/unlisted paths, is denied.
  // Production PEP is a later F2 obligation, not proven by this review guard.
  router.beforeEach(to => {
    if (sessionStorage.getItem(roleKey) && !to.path.startsWith('/__design/') && to.path !== '/forbidden') return '/forbidden';
    return true;
  });
  router.addRoute({
    name: 'FSeriesDesign', path: '/__design',
    component: () => import('./PreviewLayout.vue'),
    children: [{ name: 'FSeriesJourney', path: 'f-series', component: () => import('./JourneyPreview.vue') }],
  });
}
