import { createApp, watchEffect } from 'vue';
import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/ele';
import '#/styles/business.css';

import { ElLoading } from 'element-plus';
import { $t, setupI18n } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';

export async function bootstrap(namespace: string) {
  await initComponentAdapter();
  await initSetupVbenForm();
  const app = createApp(App);
  app.directive('loading', ElLoading.directive);
  registerLoadingDirective(app, { loading: false, spinning: 'spinning' });
  await setupI18n(app);
  await initStores(app, { namespace });
  registerAccessDirective(app);
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);
  const workspace = useWorkspaceStore();
  await workspace.initialize();
  if (workspace.error && workspace.error.status >= 500) throw workspace.error;
  app.use(router);
  await router.isReady();
  watchEffect(() => {
    const title = router.currentRoute.value.meta.title;
    document.title = title ? `${$t(title)} · ${preferences.app.name}` : preferences.app.name;
  });
  app.mount('#app');
}
