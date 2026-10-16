import type { Router } from 'vue-router';

/** Review-only route, isolated from normal application and production origins. */
export function installFSeriesPreview(router: Router) {
  if (import.meta.env.MODE !== 'design' || location.hostname !== '127.0.0.1' || location.port !== '5790') {
    throw new Error('Design review requires its dedicated loopback origin');
  }
  router.addRoute({
    name: 'FSeriesDesign', path: '/__design',
    component: () => import('./PreviewLayout.vue'),
    children: [{ name: 'FSeriesJourney', path: 'f-series', component: () => import('./JourneyPreview.vue') }],
  });
}
