import type { AccessContext, PermissionCode, RequestContext, ServiceEvent, Tenant, User } from '#/api/mock/types';

import { computed, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import { useAccessStore, useTabbarStore, useUserStore } from '@vben/stores';

import { api, ServiceError } from '#/api/mock/service';
import { RequestEpoch } from '#/platform/request-epoch';
import { resolveTenantEntry } from '#/platform/tenant-entry';
import { clearWorkspaceRoutes, installWorkspaceRoutes, navigateToLogin, navigateToTenantSelection, navigateWorkspace } from '#/platform/routing';
import { useAppearanceStore } from './appearance';

export const useWorkspaceStore = defineStore('workspace', () => {
  const user = shallowRef<User | null>(null);
  const tenant = shallowRef<Tenant | null>(null);
  const tenants = ref<Tenant[]>([]);
  const context = shallowRef<AccessContext | null>(null);
  const loading = ref(false);
  const ready = ref(false);
  const error = shallowRef<ServiceError | null>(null);
  const revision = ref(0);
  const generation = ref(0);
  const epoch = new RequestEpoch();
  const access = useAccessStore();
  const coreUser = useUserStore();
  const tabs = useTabbarStore();
  const appearance = useAppearanceStore();
  let activeLoad: Promise<boolean> | undefined;
  let activeRefresh: Promise<void> | undefined;
  let refreshAgain = false;
  let requestedTenant: string | undefined;
  let ownSessionChange = false;
  let eventTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingPolicy = false;
  let pendingSession = false;

  const isPlatform = computed(() => user.value?.platformRole === 'operator');
  const hasConsoleMenu = computed(() => !!context.value?.navigation.length);
  const canUseMarketing = computed(() => !!context.value?.permissions.includes('marketing.campaign.read'));

  function permissionsHome(permissions: readonly PermissionCode[]): string | undefined {
    return permissions.includes('marketing.campaign.read') ? '/marketing' : undefined;
  }

  function savedTenant(subjectId: string) {
    try { return sessionStorage.getItem(`cs-biz:tenant:v1:${subjectId}`) || undefined; }
    catch { throw new ServiceError('STORAGE_UNAVAILABLE', 507); }
  }

  function rememberTenant(subjectId: string, tenantId: string) {
    try {
      sessionStorage.setItem(`cs-biz:tenant:v1:${subjectId}`, tenantId);
      sessionStorage.removeItem(`cs-biz:tenant-entry-pending:v1:${subjectId}`);
    } catch { throw new ServiceError('STORAGE_UNAVAILABLE', 507); }
  }

  function invalidate() {
    if (eventTimer) clearTimeout(eventTimer);
    eventTimer = undefined;
    pendingPolicy = false;
    pendingSession = false;
    const ticket = epoch.advance();
    generation.value = ticket.revision;
    revision.value += 1;
    loading.value = true;
    error.value = null;
    context.value = null;
    access.$reset();
    coreUser.$reset();
    tabs.$reset();
    tabs.renderRouteView = false;
    clearWorkspaceRoutes();
    return ticket;
  }

  async function performLoad(targetTenant?: string) {
    const ticket = invalidate();
    let subjectId: string | undefined;
    const isCurrent = () => ticket.isCurrent() && api.getSession()?.id === subjectId;
    try {
      const session = api.getSession();
      const previousTenant = user.value?.id === session?.id ? tenant.value : null;
      user.value = session;
      subjectId = session?.id;
      if (!session) {
        tenant.value = null; tenants.value = []; requestedTenant = undefined;
        await appearance.restoreScope();
        return isCurrent();
      }
      coreUser.setUserInfo({
        userId: session.id, username: session.email, realName: session.name, avatar: '', roles: [],
      });
      if (session.platformRole === 'operator') {
        tenant.value = null; tenants.value = []; requestedTenant = undefined;
        await appearance.restoreScope(session.id, 'platform');
        if (!isCurrent()) return false;
        return await installWorkspaceRoutes([], true, isCurrent);
      }
      const choices = await api.listTenants({ signal: ticket.signal });
      if (!isCurrent()) return false;
      tenants.value = choices;
      // An intentional new account entry with 2+ tenants must choose explicitly.
      // A fresh S01 preview session retains its historical default only until
      // the user actually enters via the account selection screen.
      const choicePending = sessionStorage.getItem(`cs-biz:tenant-entry-pending:v1:${session.id}`) === 'pending';
      const preferred = targetTenant || requestedTenant || (choicePending ? undefined : savedTenant(session.id));
      const decision = resolveTenantEntry(choices.map((item) => item.id), preferred, choicePending, true);
      const selectedId = 'tenantId' in decision ? decision.tenantId : undefined;
      if (!selectedId) {
        tenant.value = null; requestedTenant = undefined;
        await appearance.restoreScope(session.id);
        if (!isCurrent()) return false;
        return true;
      }
      tenant.value = choices.find((item) => item.id === selectedId)
        || (previousTenant?.id === selectedId ? previousTenant : null);
      requestedTenant = selectedId;
      const next = await api.getAccessContext({ subjectId: session.id, tenantId: selectedId, signal: ticket.signal });
      if (!isCurrent()) return false;
      await appearance.restoreScope(session.id, selectedId, next.tenant.brandColor);
      if (!isCurrent()) return false;
      const installed = await installWorkspaceRoutes(next.navigation, false, isCurrent, permissionsHome(next.permissions));
      if (!installed || !isCurrent()) return false;
      rememberTenant(session.id, selectedId);
      context.value = next;
      tenant.value = next.tenant;
      user.value = next.user;
      access.setAccessCodes(next.permissions);
      coreUser.setUserInfo({
        userId: next.user.id, username: next.user.email, realName: next.user.name,
        avatar: '', roles: next.membership.roles.map((role) => role.id),
      });
      return true;
    } catch (failure) {
      if (!ticket.isCurrent()) return false;
      error.value = failure instanceof ServiceError ? failure : new ServiceError('SERVICE_UNAVAILABLE', 503);
      context.value = null;
      access.setAccessCodes([]);
      clearWorkspaceRoutes();
      return true;
    } finally {
      if (ticket.isCurrent()) {
        ready.value = true;
        loading.value = false;
        tabs.renderRouteView = true;
        revision.value += 1;
      }
    }
  }

  function launch(targetTenant?: string) {
    const task = performLoad(targetTenant).finally(() => {
      if (activeLoad === task) activeLoad = undefined;
    });
    activeLoad = task;
    return task;
  }

  async function initialize() {
    if (!ready.value && !activeLoad) launch();
    while (activeLoad) await activeLoad;
  }

  async function selectAccount(userId: string, preferredPath?: string) {
    ownSessionChange = true;
    let selected: User;
    try { selected = api.selectUser(userId); } finally { ownSessionChange = false; }
    if (!selected.platformRole) {
      try {
        sessionStorage.setItem(`cs-biz:tenant-entry-pending:v1:${selected.id}`, 'pending');
        sessionStorage.removeItem(`cs-biz:tenant:v1:${selected.id}`);
      } catch {
        invalidate();
        throw new ServiceError('STORAGE_UNAVAILABLE', 507);
      }
    }
    requestedTenant = undefined;
    if (await launch()) {
      if (user.value && !isPlatform.value && !context.value && !error.value)
        await navigateToTenantSelection(preferredPath);
      else await navigateWorkspace(preferredPath);
    }
  }

  async function switchTenant(tenantId: string, preferredPath?: string) {
    if (tenantId === tenant.value?.id && !loading.value) return;
    if (!tenants.value.some((item) => item.id === tenantId)) throw new ServiceError('MEMBERSHIP_REQUIRED', 403);
    requestedTenant = tenantId;
    if (await launch(tenantId)) await navigateWorkspace(preferredPath);
  }

  async function refreshAccess() {
    if (activeRefresh) { refreshAgain = true; return activeRefresh; }
    const task = (async () => {
      do {
        refreshAgain = false;
        if (await launch(requestedTenant)) {
          if (!user.value) await navigateToLogin();
          else if (!isPlatform.value && !context.value && !error.value) await navigateToTenantSelection();
          else await navigateWorkspace();
        }
      } while (refreshAgain);
    })().finally(() => { if (activeRefresh === task) activeRefresh = undefined; });
    activeRefresh = task;
    return task;
  }

  async function logout() {
    ownSessionChange = true;
    try { api.logout(); } finally { ownSessionChange = false; }
    if (await launch()) await navigateToLogin();
  }

  function can(code: PermissionCode | string) {
    return !loading.value && !!context.value?.permissions.includes(code as PermissionCode);
  }

  function requestContext(): RequestContext {
    if (!user.value) throw new ServiceError('SESSION_REQUIRED', 401);
    if (!context.value || loading.value) throw error.value || new ServiceError('MEMBERSHIP_REQUIRED', 403);
    return { subjectId: user.value.id, tenantId: context.value.tenantId, signal: epoch.signal };
  }

  function capture() {
    const captured = requestContext();
    const ticket = epoch.capture();
    return {
      context: captured, generation: ticket.revision,
      isCurrent: () => ticket.isCurrent() && user.value?.id === captured.subjectId && context.value?.tenantId === captured.tenantId,
      isSameWorkspace: () => user.value?.id === captured.subjectId && tenant.value?.id === captured.tenantId && requestedTenant === captured.tenantId,
    };
  }

  async function run<T>(task: (request: RequestContext) => Promise<T>): Promise<T | undefined> {
    const captured = capture();
    try {
      const result = await task(captured.context);
      return captured.isCurrent() ? result : undefined;
    } catch (failure) {
      if (!captured.isCurrent() || captured.context.signal?.aborted) return undefined;
      throw failure;
    }
  }

  function onServiceEvent(event: ServiceEvent) {
    if (event.type === 'session' && ownSessionChange) return;
    if (event.type === 'data' && event.tenantId && event.tenantId !== tenant.value?.id && !isPlatform.value) return;
    pendingSession ||= event.type === 'session' || event.type === 'reset';
    pendingPolicy ||= event.type === 'access' || pendingSession;
    if (eventTimer) return;
    // A completed write can show its result before the access projection is renewed.
    eventTimer = setTimeout(() => {
      eventTimer = undefined;
      const policy = pendingPolicy;
      const session = pendingSession;
      pendingPolicy = false; pendingSession = false;
      if (session) requestedTenant = undefined;
      if (policy) void refreshAccess(); else revision.value += 1;
    }, 0);
  }

  api.subscribe(onServiceEvent);

  return {
    user, tenant, tenants, context, loading, ready, error, revision, generation, isPlatform, hasConsoleMenu, canUseMarketing,
    initialize, selectAccount, switchTenant, refreshAccess, logout, can, requestContext, capture, run,
  };
});
