import type { CustomerInput, MockDatabase, RequestContext, ServiceEvent, StorageLike } from './types';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockService, DATABASE_KEY } from './service';

function memory(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

const context = (subjectId = 'chen', tenantId = 'qinghe'): RequestContext => ({ subjectId, tenantId });
const customerInput = (overrides: Partial<CustomerInput> = {}): CustomerInput => ({
  company: '松间工作室', kind: 'studio', contact: '许松', phone: '13800009001',
  ownerId: 'chen', status: 'prospect', notes: '约定周五联系。', ...overrides,
});

const services: ReturnType<typeof createMockService>[] = [];
function service(storage = memory(), userId = 'chen', eventTarget?: EventTarget) {
  const instance = createMockService({
    storage, sessionStorage: memory(), latencyMs: 0,
    window: eventTarget as unknown as Pick<Window, 'addEventListener' | 'removeEventListener'>,
    now: () => '2026-10-12T09:00:00.000Z',
  });
  instance.selectUser(userId);
  services.push(instance);
  return instance;
}

afterEach(() => {
  for (const instance of services.splice(0)) instance.dispose();
  vi.useRealTimers();
});

describe('S01 local customer and access contract', () => {
  it('preserves the read-all and write-own association across two roles', async () => {
    const api = service(undefined, 'zhou');
    const rows = await api.listCustomers(context('zhou'));
    expect(rows).toHaveLength(8);
    expect(rows.filter((row) => row.canUpdate).map((row) => row.id).sort()).toEqual(['qh-qingniao', 'qh-xinghe']);
    expect(rows.filter((row) => row.canArchive)).toHaveLength(2);
    await expect(api.updateCustomer(context('zhou'), 'qh-yunshan', { notes: '越界修改' }))
      .rejects.toMatchObject({ code: 'PERMISSION_DENIED', status: 403 });
    await expect(api.updateCustomer(context('zhou'), 'qh-xinghe', { ownerId: 'chen' }))
      .rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    await expect(api.createCustomer(context('zhou'), customerInput(), 'create-other-owner'))
      .rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    expect((await api.updateCustomer(context('zhou'), 'qh-xinghe', { notes: '已确认下次沟通时间。' })).notes)
      .toBe('已确认下次沟通时间。');
    await api.archiveCustomer(context('zhou'), 'qh-qingniao');
    expect(await api.listCustomers(context('zhou'))).toHaveLength(7);
  });

  it('lists a new active member so an owner can assign that member their first customer', async () => {
    const api = service();
    const member = await api.createMember(context(), { name: '许松', email: 'new.owner@example.test', title: '客户顾问',
      roleIds: ['qinghe-viewer', 'qinghe-specialist'] }, 'first-owner-member-key');
    expect((await api.listCustomers(context())).some((row) => row.ownerId === member.userId)).toBe(false);
    const candidates = await api.listCustomerOwners(context(), 'crm.customer.create');
    expect(candidates).toContainEqual({ id: member.userId, name: '许松' });
    expect(await api.listCustomerOwners(context(), 'crm.customer.update')).toContainEqual({ id: member.userId, name: '许松' });
    expect(candidates.every((candidate) => Object.keys(candidate).sort().join(',') === 'id,name')).toBe(true);
    const created = await api.createCustomer(context(), customerInput({ ownerId: member.userId }), 'first-owner-customer-key');
    expect(created.ownerId).toBe(member.userId);
    expect(created.ownerName).toBe('许松');
  });

  it('uses the requested write scope for owner candidates even when another role can read all customers', async () => {
    const api = service(undefined, 'zhou');
    expect(await api.listCustomers(context('zhou'))).toHaveLength(8);
    expect(await api.listCustomerOwners(context('zhou'), 'crm.customer.update')).toEqual([{ id: 'zhou', name: '周远' }]);
    expect(await api.listCustomerOwners(context('zhou'), 'crm.customer.create')).toEqual([{ id: 'zhou', name: '周远' }]);
    api.selectUser('chen');
    const creator = await api.createRole(context(), { name: '客户创建协调员', description: '', grants: [{ action: 'crm.customer.create', scope: 'all' }] });
    await api.updateMembership(context(), 'qinghe-zhou', { roleIds: ['qinghe-viewer', 'qinghe-specialist', creator.id] });
    api.selectUser('zhou');
    expect((await api.listCustomerOwners(context('zhou'), 'crm.customer.create')).map((owner) => owner.id).sort()).toEqual(['chen', 'yu', 'zhou']);
    expect(await api.listCustomerOwners(context('zhou'), 'crm.customer.update')).toEqual([{ id: 'zhou', name: '周远' }]);
    api.selectUser('yu');
    await expect(api.listCustomerOwners(context('yu'), 'crm.customer.create')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    await expect(api.listCustomerOwners(context('yu'), 'crm.customer.update')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    await expect(api.listCustomerOwners(context('yu'), 'crm.customer.read' as never)).rejects.toMatchObject({ code: 'INVALID_PERMISSION' });
  });

  it('removes disabled members from owner candidates and refuses a new assignment to them', async () => {
    const api = service();
    expect((await api.listCustomerOwners(context(), 'crm.customer.create')).map((owner) => owner.id)).not.toContain('shen');
    await api.updateMembership(context(), 'qinghe-zhou', { status: 'disabled' });
    expect((await api.listCustomerOwners(context(), 'crm.customer.update')).map((owner) => owner.id)).not.toContain('zhou');
    await expect(api.createCustomer(context(), customerInput({ ownerId: 'zhou' }), 'disabled-owner-assignment-key'))
      .rejects.toMatchObject({ code: 'INVALID_OWNER' });
    await expect(api.updateCustomer(context(), 'qh-yunshan', { ownerId: 'zhou' })).rejects.toMatchObject({ code: 'INVALID_OWNER' });
  });

  it('keeps owner candidates within the requested active tenant and its module boundary', async () => {
    const api = service();
    expect((await api.listCustomerOwners(context(), 'crm.customer.create')).map((owner) => owner.id).sort()).toEqual(['chen', 'yu', 'zhou']);
    await expect(api.listCustomerOwners(context('chen', 'yunlan'), 'crm.customer.create')).rejects.toMatchObject({ code: 'MODULE_INACTIVE' });
    api.selectUser('platform');
    await api.platformSetModule('yunlan', 'crm', true);
    await expect(api.listCustomerOwners(context('platform'), 'crm.customer.update')).rejects.toMatchObject({ code: 'MEMBERSHIP_REQUIRED' });
    api.selectUser('chen');
    expect((await api.listCustomerOwners(context('chen', 'yunlan'), 'crm.customer.create')).map((owner) => owner.id).sort()).toEqual(['chen', 'zhou']);
    api.selectUser('yu');
    await expect(api.listCustomerOwners(context('yu', 'yunlan'), 'crm.customer.update')).rejects.toMatchObject({ code: 'MEMBERSHIP_REQUIRED' });
  });

  it('limits a group-scope grant to records owned within the member department', async () => {
    const api = service();
    const groupRead = await api.createRole(context(), { name: '同组客户观察', description: '', grants: [{ action: 'crm.customer.read', scope: 'group' }] });
    // The peer joins zhou's department, so group scope reaches zhou's customers only.
    const peer = await api.createMember(context(), { name: '同组同事', email: 'peer.group@example.test', title: '客户顾问',
      department: '运营管理部', roleIds: [groupRead.id] }, 'group-peer-key');
    api.selectUser(peer.userId);
    const rows = await api.listCustomers(context(peer.userId));
    expect(rows.map((row) => row.id).sort()).toEqual(['qh-qingniao', 'qh-xinghe']);
    await expect(api.getCustomer(context(peer.userId), 'qh-yunshan'))
      .rejects.toMatchObject({ code: 'CUSTOMER_NOT_FOUND', status: 404 });
  });

  it('separates tenant resources, module entitlement, and platform membership', async () => {
    const api = service();
    await expect(api.getCustomer(context(), 'yl-shanlan')).rejects.toMatchObject({ code: 'CUSTOMER_NOT_FOUND', status: 404 });
    await expect(api.listCustomers(context('chen', 'yunlan'))).rejects.toMatchObject({ code: 'MODULE_INACTIVE' });
    const unavailable = await api.getAccessContext(context('chen', 'yunlan'));
    expect(unavailable.navigation.some((item) => item.viewKey === 'crm.customer.list')).toBe(false);
    expect(unavailable.permissions).toContain('tenant.profile.update');
    api.selectUser('platform');
    expect(await api.listTenants()).toEqual([]);
    await expect(api.getAccessContext(context('platform'))).rejects.toMatchObject({ code: 'MEMBERSHIP_REQUIRED' });
    await api.platformSetModule('yunlan', 'crm', true);
    api.selectUser('chen');
    const qinghe = await api.listCustomers(context());
    const yunlan = await api.listCustomers(context('chen', 'yunlan'));
    expect(qinghe).toHaveLength(8);
    expect(yunlan).toHaveLength(4);
    expect(yunlan.every((row) => row.tenantId === 'yunlan')).toBe(true);
    expect(qinghe.some((row) => yunlan.some((other) => other.id === row.id))).toBe(false);
  });

  it('refuses forged subjects, readonly writes, and disabled memberships', async () => {
    const api = service(undefined, 'yu');
    expect(await api.listCustomers(context('yu'))).toHaveLength(8);
    await expect(api.createCustomer(context('yu'), customerInput(), 'viewer-create'))
      .rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    await expect(api.listCustomers(context('chen'))).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    api.selectUser('shen');
    expect(await api.listTenants()).toEqual([]);
    await expect(api.getAccessContext(context('shen'))).rejects.toMatchObject({ code: 'MEMBER_DISABLED' });
    api.logout();
    await expect(api.listTenants()).rejects.toMatchObject({ code: 'SESSION_REQUIRED', status: 401 });
  });

  it.each([
    ['role', 'PERMISSION_DENIED'],
    ['member', 'MEMBER_DISABLED'],
    ['module', 'MODULE_INACTIVE'],
  ])('rechecks %s changes after latency before committing a previously allowed write', async (policy, code) => {
    vi.useFakeTimers();
    const storage = memory();
    const member = service(storage, 'zhou');
    const admin = service(storage);
    const pending = member.updateCustomer({ ...context('zhou'), delayMs: 80 }, 'qh-xinghe', { contact: '不应保存' });
    const denied = expect(pending).rejects.toMatchObject({ code });
    if (policy === 'role') await admin.updateMembership(context(), 'qinghe-zhou', { roleIds: ['qinghe-viewer'] });
    if (policy === 'member') await admin.updateMembership(context(), 'qinghe-zhou', { status: 'disabled' });
    if (policy === 'module') {
      admin.selectUser('platform');
      await admin.platformSetModule('qinghe', 'crm', false);
    }
    await vi.advanceTimersByTimeAsync(80);
    await denied;
    const stored = JSON.parse(storage.getItem(DATABASE_KEY)!) as MockDatabase;
    expect(stored.customers.find((row) => row.id === 'qh-xinghe')?.contact).toBe('林溪');
  });

  it('keeps one durable result for concurrent or retried keys and rejects changed payloads', async () => {
    const storage = memory();
    const api = service(storage);
    const input = customerInput();
    const [first, concurrent] = await Promise.all([
      api.createCustomer(context(), input, 'customer-preknown-key'),
      api.createCustomer(context(), input, 'customer-preknown-key'),
    ]);
    expect(first.id).toBe(concurrent.id);
    expect(await api.listCustomers(context())).toHaveLength(9);
    await expect(api.createCustomer(context(), { ...input, company: '另一家工作室' }, 'customer-preknown-key'))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
    const restored = service(storage);
    // A completely lost first response can be recovered using the preknown key.
    expect((await restored.createCustomer(context(), input, 'customer-preknown-key')).id).toBe(first.id);
    expect(await restored.listCustomers(context())).toHaveLength(9);
  });

  it('reauthorizes an idempotent replay after the creator loses write permission', async () => {
    const storage = memory();
    const member = service(storage, 'zhou');
    const admin = service(storage);
    const input = customerInput({ ownerId: 'zhou' });
    await member.createCustomer(context('zhou'), input, 'own-customer-key');
    await admin.updateMembership(context(), 'qinghe-zhou', { roleIds: ['qinghe-viewer'] });
    await expect(member.createCustomer(context('zhou'), input, 'own-customer-key'))
      .rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    expect(await admin.listCustomers(context())).toHaveLength(9);
  });

  it('does not overwrite a concurrent revocation with another instance\'s stale database snapshot', async () => {
    const storage = memory();
    const admin = service(storage);
    const member = service(storage, 'zhou');
    const outcomes = await Promise.allSettled([
      admin.updateMembership(context(), 'qinghe-zhou', { roleIds: ['qinghe-viewer'] }),
      member.updateCustomer(context('zhou'), 'qh-xinghe', { notes: '不应覆盖已撤销的权限' }),
    ]);
    expect(outcomes[0]?.status).toBe('fulfilled');
    expect(outcomes[1]).toMatchObject({ status: 'rejected', reason: { code: 'PERMISSION_DENIED' } });
    const current = (await admin.listMembers(context())).find((entry) => entry.id === 'qinghe-zhou');
    expect(current?.roleIds).toEqual(['qinghe-viewer']);
    expect((await admin.getCustomer(context(), 'qh-xinghe')).notes).toBe('城西门店正在筹备秋季读书会。');
  });

  it('returns the same idempotent result when two service instances start together', async () => {
    const storage = memory();
    const firstInstance = service(storage);
    const secondInstance = service(storage);
    const input = customerInput();
    const [first, second] = await Promise.all([
      firstInstance.createCustomer(context(), input, 'shared-instance-key'),
      secondInstance.createCustomer(context(), input, 'shared-instance-key'),
    ]);
    expect(first.id).toBe(second.id);
    expect((await firstInstance.createCustomer(context(), input, 'shared-instance-key')).id).toBe(first.id);
    expect(await secondInstance.listCustomers(context())).toHaveLength(9);
  });

  it('recovers an existing customer result when its owner was disabled after the original write', async () => {
    const api = service();
    const input = customerInput({ ownerId: 'zhou' });
    const first = await api.createCustomer(context(), input, 'lost-owner-response-key');
    await api.updateMembership(context(), 'qinghe-zhou', { status: 'disabled' });
    const recovered = await api.createCustomer(context(), input, 'lost-owner-response-key');
    expect(recovered.id).toBe(first.id);
    expect(await api.listCustomers(context())).toHaveLength(9);
    await expect(api.createCustomer(context(), { ...input, company: '新的客户' }, 'another-owner-key'))
      .rejects.toMatchObject({ code: 'INVALID_OWNER' });
  });

  it('reports initialization persistence failures with a stable error code', () => {
    const blocked: StorageLike = {
      getItem: () => null,
      setItem: () => { throw new DOMException('Storage is full', 'QuotaExceededError'); },
      removeItem: () => {},
    };
    expect(() => createMockService({ storage: blocked, sessionStorage: memory(), latencyMs: 0 }))
      .toThrow(expect.objectContaining({ code: 'STORAGE_UNAVAILABLE', status: 507 }));
  });

  it.each(['localStorage', 'sessionStorage'] as const)('refuses to substitute memory when the browser %s getter is denied', (kind) => {
    const getter = vi.spyOn(window, kind, 'get').mockImplementation(() => {
      throw new DOMException('Storage access is denied', 'SecurityError');
    });
    try {
      expect(() => createMockService())
        .toThrow(expect.objectContaining({ code: 'STORAGE_UNAVAILABLE', status: 507 }));
    } finally {
      getter.mockRestore();
    }
  });

  it('recovers an existing member result after the originally assigned role is replaced and deleted', async () => {
    const api = service();
    const role = await api.createRole(context(), { name: '短期协作', description: '', grants: [{ action: 'workspace.read', scope: 'all' }] });
    const input = { name: '许松', email: 'song.xu@example.test', title: '客户顾问', roleIds: [role.id] };
    const first = await api.createMember(context(), input, 'lost-member-response-key');
    await api.updateMembership(context(), first.id, { roleIds: ['qinghe-viewer'] });
    await api.deleteRole(context(), role.id);
    const recovered = await api.createMember(context(), input, 'lost-member-response-key');
    expect(recovered.id).toBe(first.id);
    expect(recovered.roleIds).toEqual(['qinghe-viewer']);
    await expect(api.createMember(context(), { ...input, email: 'another@example.test' }, 'another-member-role-key'))
      .rejects.toMatchObject({ code: 'ROLE_NOT_FOUND' });
  });

  it('creates one local member and enforces both the idempotency key and existing membership', async () => {
    const api = service();
    const input = { name: '许松', email: 'song.xu@example.test', title: '客户顾问', roleIds: ['qinghe-viewer'] };
    const [first, retry] = await Promise.all([
      api.createMember(context(), input, 'member-preknown-key'),
      api.createMember(context(), input, 'member-preknown-key'),
    ]);
    expect(first.id).toBe(retry.id);
    expect(await api.listMembers(context())).toHaveLength(5);
    expect(api.listUsers().filter((user) => user.email === input.email)).toHaveLength(1);
    await expect(api.createMember(context(), { ...input, roleIds: [] }, 'member-preknown-key'))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    await expect(api.createMember(context(), input, 'another-member-key')).rejects.toMatchObject({ code: 'MEMBER_EXISTS' });
    api.selectUser(first.userId);
    const access = await api.getAccessContext(context(first.userId));
    expect(access.permissions).toContain('crm.customer.read');
    expect(access.permissions).not.toContain('crm.customer.update');
  });

  it('protects the last owner and prevents delegated managers from widening their authority', async () => {
    const api = service();
    await expect(api.updateMembership(context(), 'qinghe-chen', { status: 'disabled' })).rejects.toMatchObject({ code: 'LAST_OWNER' });
    await expect(api.updateMembership(context(), 'qinghe-chen', { roleIds: ['qinghe-viewer'] })).rejects.toMatchObject({ code: 'LAST_OWNER' });
    await expect(api.updateRole(context(), 'qinghe-owner', { grants: [] })).rejects.toMatchObject({ code: 'PROTECTED_ROLE' });
    const delegation = await api.createRole(context(), { name: '成员协调员', description: '维护授权范围内的角色与成员', grants: [
      { action: 'tenant.member.manage', scope: 'all' }, { action: 'tenant.role.manage', scope: 'all' },
    ] });
    await api.updateMembership(context(), 'qinghe-zhou', { roleIds: ['qinghe-viewer', 'qinghe-specialist', delegation.id] });
    api.selectUser('zhou');
    await expect(api.updateRole(context('zhou'), 'qinghe-specialist', { grants: [{ action: 'crm.customer.update', scope: 'all' }] }))
      .rejects.toMatchObject({ code: 'GRANT_EXCEEDS_AUTHORITY' });
    await expect(api.createMember(context('zhou'), { name: '新负责人', email: 'owner@example.test', roleIds: ['qinghe-owner'] }, 'delegated-owner-key'))
      .rejects.toMatchObject({ code: 'GRANT_EXCEEDS_AUTHORITY' });
    await expect(api.createRole(context('zhou'), { name: '未知动作', description: '', grants: [{ action: 'unknown' as never, scope: 'all' }] }))
      .rejects.toMatchObject({ code: 'INVALID_PERMISSION' });
  });

  it('supports role CRUD and blocks deletion while a member holds the role', async () => {
    const api = service();
    const role = await api.createRole(context(), { name: '协作观察员', description: '', grants: [{ action: 'workspace.read', scope: 'all' }] });
    const changed = await api.updateRole(context(), role.id, { description: '参与企业协作' });
    expect(changed.description).toBe('参与企业协作');
    await api.updateMembership(context(), 'qinghe-yu', { roleIds: ['qinghe-viewer', role.id] });
    await expect(api.deleteRole(context(), role.id)).rejects.toMatchObject({ code: 'ROLE_IN_USE' });
    await api.updateMembership(context(), 'qinghe-yu', { roleIds: ['qinghe-viewer'] });
    await api.deleteRole(context(), role.id);
    expect((await api.listRoles(context())).some((entry) => entry.id === role.id)).toBe(false);
  });

  it('reports a new unbound role as data so an in-flight member creation keeps its session', async () => {
    const api = service();
    const events: ServiceEvent[] = [];
    const unsubscribe = api.subscribe((event) => events.push(event));
    await api.createRole(context(), { name: '协作观察员', description: '', grants: [{ action: 'workspace.read', scope: 'all' }] });
    unsubscribe();
    expect(events).toContainEqual({ type: 'data', tenantId: 'qinghe' });
    expect(events.some((event) => event.type === 'access')).toBe(false);
  });

  it('separates tenant activation requests from operator approval and persists the outcome', async () => {
    const api = service();
    await expect(api.platformSetModule('yunlan', 'crm', true)).rejects.toMatchObject({ code: 'PLATFORM_ACCESS_REQUIRED' });
    const first = await api.requestActivation(context('chen', 'yunlan'), 'crm');
    const retry = await api.requestActivation(context('chen', 'yunlan'), 'crm');
    expect(first.id).toBe(retry.id);
    expect(await api.listActivationRequests(context())).toHaveLength(0);
    expect(await api.listActivationRequests(context('chen', 'yunlan'))).toHaveLength(1);
    await expect(api.getActivationRequests()).rejects.toMatchObject({ code: 'PLATFORM_ACCESS_REQUIRED' });
    api.selectUser('platform');
    const before = await api.platformListTenants();
    expect(before.find((tenant) => tenant.id === 'yunlan')?.entitlements[0]?.status).toBe('inactive');
    await api.platformSetModule('yunlan', 'crm', true);
    expect((await api.getActivationRequests())[0]?.status).toBe('approved');
    api.selectUser('chen');
    const access = await api.getAccessContext(context('chen', 'yunlan'));
    expect(access.navigation.some((entry) => entry.name === 'customers')).toBe(true);
    expect((await api.listActivationRequests(context('chen', 'yunlan')))[0]?.status).toBe('approved');
  });

  it('emits policy invalidation with increasing versions while keeping other-tab sessions separate', async () => {
    const storage = memory();
    const otherTab = new EventTarget();
    const admin = service(storage);
    const member = service(storage, 'zhou', otherTab);
    const events: ServiceEvent[] = [];
    const unsubscribe = member.subscribe((event) => events.push(event));
    const initial = await member.getAccessContext(context('zhou'));
    await admin.updateMembership(context(), 'qinghe-zhou', { roleIds: ['qinghe-viewer'] });
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: DATABASE_KEY });
    otherTab.dispatchEvent(event);
    expect(member.getSession()?.id).toBe('zhou');
    expect(events).toContainEqual({ type: 'access', tenantId: 'qinghe' });
    expect(events.some((item) => item.type === 'session')).toBe(false);
    const refreshed = await member.getAccessContext(context('zhou'));
    expect(Number(refreshed.accessVersion.split(':')[1])).toBeGreaterThan(Number(initial.accessVersion.split(':')[1]));
    expect(refreshed.permissions).not.toContain('crm.customer.update');
    admin.selectUser('platform');
    expect(member.getSession()?.id).toBe('zhou');
    unsubscribe();
  });

  it('cancels an in-flight request and rejects requests from a changed local session', async () => {
    vi.useFakeTimers();
    const api = service();
    const controller = new AbortController();
    const pending = api.listCustomers({ ...context(), delayMs: 100, signal: controller.signal });
    const cancelled = expect(pending).rejects.toMatchObject({ name: 'AbortError', code: 'REQUEST_CANCELLED' });
    controller.abort();
    await cancelled;
    const oldSession = api.listCustomers({ ...context(), delayMs: 100 });
    const stale = expect(oldSession).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    api.selectUser('zhou');
    await vi.advanceTimersByTimeAsync(100);
    await stale;
  });
});

describe('Desktop member data remains tenant-scoped', () => {
  it('persists department on membership instead of globally on the user', async () => {
    const api = service();
    const added = await api.createMember(context(), {
      name: '林远', email: 'desktop-member@example.test', title: '运营',
      roleIds: ['qinghe-viewer'], department: '客户成功部',
    }, 'desktop-department-1');
    expect(added.department).toBe('客户成功部');
    expect((await api.listMembers(context())).find((row) => row.id === added.id)?.department).toBe('客户成功部');
    await expect(api.listMembers(context('chen', 'yunlan'))).resolves.not.toContainEqual(added);
    expect(added.user).not.toHaveProperty('department');
  });
});

describe('member bulk operation remains atomic', () => {
  it('updates multiple members together with one policy change and refuses removing the last owner', async () => {
    const api = service();
    const rows = await api.listMembers(context());
    const ids = rows.filter((row) => !row.isOwner).slice(0, 2).map((row) => row.id);
    expect(ids).toHaveLength(2);
    expect((await api.bulkUpdateMembershipStatus(context(), ids, 'disabled')).updatedCount).toBe(2);
    const state = await api.listMembers(context());
    expect(state.filter((row) => ids.includes(row.id)).every((row) => row.status === 'disabled')).toBe(true);
    const owner = state.find((row) => row.isOwner)!;
    await expect(api.bulkUpdateMembershipStatus(context(), [owner.id], 'disabled')).rejects.toMatchObject({code:'LAST_OWNER'});
    expect((await api.listMembers(context())).find((row) => row.id === owner.id)?.status).toBe('active');
    await expect(api.bulkUpdateMembershipStatus(context(), [owner.id, 'member-nonexistent'], 'disabled'))
      .rejects.toMatchObject({code:'MEMBER_NOT_FOUND'});
    expect((await api.listMembers(context())).find((row) => row.id === owner.id)?.status).toBe('active');
  });
});


describe('V2.2 independent Menu / Function / Data grants', () => {
  it('allows marketing-only membership while denying Console navigation and unrelated APIs', async () => {
    const api = service();
    const role = await api.createRole(context(), { name: '营销执行员', description: '仅负责指定营销活动',
      menuGrants: [], grants: [
        { action: 'marketing.campaign.read', scope: 'own' },
        { action: 'marketing.campaign.execute', scope: 'own' },
      ] });
    await api.updateMembership(context(), 'qinghe-zhou', { roleIds: [role.id] });
    api.selectUser('zhou');
    const ctx = context('zhou');
    const access = await api.getAccessContext(ctx);
    expect(access.menuGrants).toEqual([]);
    expect(access.navigation).toEqual([]);
    expect(access.permissions).toContain('marketing.campaign.execute');
    const campaigns = await api.listCampaigns(ctx);
    expect(campaigns.map((c) => c.id)).toEqual(['qh-marketing-zhou']);
    await expect(api.listCustomers(ctx)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    await expect(api.executeCampaign(ctx, 'qh-marketing-chen', 'cross-owner')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    const first = await api.executeCampaign(ctx, 'qh-marketing-zhou', 'same-operation');
    const retry = await api.executeCampaign(ctx, 'qh-marketing-zhou', 'same-operation');
    expect(first.executions).toBe(1);
    expect(retry.executions).toBe(1);
  });

  it('preserves per-function scope when editing a different function and blocks unowned menus', async () => {
    const api = service();
    const role = await api.createRole(context(), { name: '读全部改本人', description: '',
      menuGrants: ['crm.customer.list'],
      grants: [{ action: 'crm.customer.read', scope: 'all' }, { action: 'crm.customer.update', scope: 'own' }] });
    const changed = await api.updateRole(context(), role.id, { grants: [
      { action: 'crm.customer.read', scope: 'own' }, { action: 'crm.customer.update', scope: 'own' },
    ] });
    expect(changed.menuGrants).toEqual(['crm.customer.list']);
    expect(changed.grants.find((g) => g.action === 'crm.customer.update')?.scope).toBe('own');
    expect(changed.grants.find((g) => g.action === 'crm.customer.read')?.scope).toBe('own');
    await expect(api.createRole(context(), { name: '非法菜单', description: '', menuGrants: ['marketing.functions' as never], grants: [] }))
      .rejects.toMatchObject({ code: 'INVALID_PERMISSION' });
    const noMenu = await api.createRole(context(), { name: '仅查看功能', description: '', menuGrants: [],
      grants: [{ action: 'crm.customer.read', scope: 'all' }] });
    await api.updateMembership(context(), 'qinghe-yu', { roleIds: [noMenu.id] });
    api.selectUser('yu');
    expect((await api.getAccessContext(context('yu'))).navigation).toEqual([]);
    expect(await api.listCustomers(context('yu'))).toHaveLength(8);
  });

  it('treats marketing availability as business gate without revoking IAM grants', async () => {
    const api = service();
    const before = await api.getAccessContext(context());
    expect(before.permissions).toContain('marketing.campaign.execute');
    api.selectUser('platform');
    await api.platformSetModule('qinghe', 'marketing', false);
    api.selectUser('chen');
    const after = await api.getAccessContext(context());
    expect(after.permissions).not.toContain('marketing.campaign.execute');
    expect((await api.listRoles(context())).find((r) => r.id === 'qinghe-owner')?.grants.some((g) => g.action === 'marketing.campaign.execute')).toBe(true);
    await expect(api.listCampaigns(context())).rejects.toMatchObject({ code: 'MODULE_INACTIVE' });
    expect(await api.listCustomers(context())).toHaveLength(8);
  });
});

describe('V2.2 menu-only authorization', () => {
  it('allows a Console route with no API Function and refuses direct data reads', async () => {
    const api = service();
    const role = await api.createRole(context(), { name: '菜单访问但不授予数据读取', description: '',
      menuGrants: ['crm.customer.list'], grants: [] });
    await api.updateMembership(context(), 'qinghe-yu', { roleIds: [role.id] });
    api.selectUser('yu');
    const ctx = context('yu');
    const access = await api.getAccessContext(ctx);
    expect(access.navigation.map((entry) => entry.path)).toEqual(['/customers']);
    expect(access.permissions).not.toContain('crm.customer.read');
    expect(access.dataScopes).toEqual([]);
    await expect(api.listCustomers(ctx)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });
});
