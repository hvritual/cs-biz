import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({
    $reset: vi.fn(), setAccessCodes: vi.fn(), setAccessMenus: vi.fn(),
    setAccessRoutes: vi.fn(), setIsAccessChecked: vi.fn(),
  }),
  useUserStore: () => ({ $reset: vi.fn(), setUserInfo: vi.fn() }),
  useTabbarStore: () => ({ $reset: vi.fn(), renderRouteView: true }),
}));
vi.mock('./routing', () => ({
  clearWorkspaceRoutes: vi.fn(), installWorkspaceRoutes: vi.fn(async () => true),
  navigateToLogin: vi.fn(), navigateWorkspace: vi.fn(),
  canVisitPath: vi.fn(() => true), getWorkspaceHome: vi.fn(() => '/overview'),
}));
vi.mock('../store/appearance', () => ({
  useAppearanceStore: () => ({ restoreScope: vi.fn(async () => undefined) }),
}));

import { api, createMockService, ServiceError } from '../api/mock/service';
import { useWorkspaceStore } from '../store/workspace';
import { createRouterGuard } from '../router/guard';

function administrator() {
  const values = new Map<string, string>();
  return createMockService({
    storage: localStorage,
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: (key) => { values.delete(key); },
    },
    window: new EventTarget(),
    latencyMs: 0,
  });
}

beforeEach(() => {
  api.dispose();
  localStorage.clear();
  sessionStorage.clear();
  api.reset();
  setActivePinia(createPinia());
});

describe('workspace selection after access is withdrawn', () => {
  it('keeps the current workspace and its error until the user explicitly selects another workspace', async () => {
    api.selectUser('zhou');
    const workspace = useWorkspaceStore();
    const accessRequest = vi.spyOn(api, 'getAccessContext');
    await workspace.initialize();
    expect(workspace.context?.tenantId).toBe('qinghe');
    const previous = workspace.capture();
    const admin = administrator();
    try {
      await admin.updateMembership({ subjectId: 'chen', tenantId: 'qinghe' }, 'qinghe-zhou', { status: 'disabled' });
      const refreshing = workspace.refreshAccess();
      expect(previous.isCurrent()).toBe(false);
      expect(workspace.context).toBeNull();
      await refreshing;
      expect(workspace.error?.code).toBe('MEMBER_DISABLED');
      expect(workspace.tenant?.id).toBe('qinghe');
      expect(workspace.tenants.map((entry) => entry.id)).toEqual(['yunlan']);
      expect(workspace.context).toBeNull();
      expect(workspace.can('crm.customer.read')).toBe(false);
      expect(accessRequest).toHaveBeenLastCalledWith(expect.objectContaining({ subjectId: 'zhou', tenantId: 'qinghe' }));
      expect(sessionStorage.getItem('cs-biz:tenant:v1:zhou')).toBe('qinghe');

      await workspace.switchTenant('yunlan');
      expect(workspace.error).toBeNull();
      expect(workspace.context?.tenantId).toBe('yunlan');
      expect(workspace.tenant?.id).toBe('yunlan');
      expect(sessionStorage.getItem('cs-biz:tenant:v1:zhou')).toBe('yunlan');
    } finally { admin.dispose(); }
  });

  it('revalidates a saved workspace even when it is missing from the available list on reload', async () => {
    api.selectUser('zhou');
    sessionStorage.setItem('cs-biz:tenant:v1:zhou', 'qinghe');
    const admin = administrator();
    try {
      await admin.updateMembership({ subjectId: 'chen', tenantId: 'qinghe' }, 'qinghe-zhou', { status: 'disabled' });
      const accessRequest = vi.spyOn(api, 'getAccessContext');
      const workspace = useWorkspaceStore();
      await workspace.initialize();
      expect(workspace.error?.code).toBe('MEMBER_DISABLED');
      expect(workspace.context).toBeNull();
      expect(workspace.tenants.map((entry) => entry.id)).toEqual(['yunlan']);
      expect(accessRequest).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'qinghe' }));
      expect(sessionStorage.getItem('cs-biz:tenant:v1:zhou')).toBe('qinghe');
    } finally { admin.dispose(); }
  });
});

afterEach(() => { api.dispose(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('workspace session failure recovery', () => {
  it('finishes loading with a business error if reading the initial session fails', async () => {
    vi.spyOn(api, 'getSession').mockImplementation(() => { throw new ServiceError('STORAGE_INVALID', 500); });
    const workspace = useWorkspaceStore();
    await expect(workspace.initialize()).resolves.toBeUndefined();
    expect(workspace.loading).toBe(false);
    expect(workspace.ready).toBe(true);
    expect(workspace.context).toBeNull();
    expect(workspace.error?.code).toBe('STORAGE_INVALID');
    expect(workspace.can('crm.customer.read')).toBe(false);
  });

  it('routes a failed identity lookup to the business error page without a redirect loop', async () => {
    vi.spyOn(api, 'getSession').mockImplementation(() => { throw new ServiceError('STORAGE_INVALID', 500); });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/auth/login', name: 'Login', component: {} },
        { path: '/forbidden', name: 'Forbidden', component: {} },
      ],
    });
    createRouterGuard(router);
    await router.push('/auth/login');
    expect(router.currentRoute.value.name).toBe('Forbidden');
    expect(useWorkspaceStore().loading).toBe(false);
  });

  it('withholds business access when the workspace selection could not be saved', async () => {
    const storage = sessionStorage;
    vi.stubGlobal('sessionStorage', {
      getItem: storage.getItem.bind(storage),
      setItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
    });
    const workspace = useWorkspaceStore();
    await workspace.initialize();
    expect(workspace.error?.code).toBe('STORAGE_UNAVAILABLE');
    expect(workspace.context).toBeNull();
    expect(workspace.loading).toBe(false);
    expect(workspace.can('crm.customer.read')).toBe(false);
  });
});
