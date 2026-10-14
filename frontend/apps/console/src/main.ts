import { startApplication } from './platform/startup-boundary';

async function initApplication() {
  const [{ initPreferences, updatePreferences }, { unmountGlobalLoading }, { overridesPreferences }] = await Promise.all([
    import('@vben/preferences'), import('@vben/utils'), import('./preferences'),
  ]);
  const namespace = `cs-biz-v1-${import.meta.env.PROD ? 'prod' : 'dev'}`;
  await initPreferences({ namespace, overrides: overridesPreferences });
  // Fixed product controls take precedence over a previously cached template layout.
  updatePreferences(overridesPreferences);
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);
  unmountGlobalLoading();
}

void startApplication(initApplication);
