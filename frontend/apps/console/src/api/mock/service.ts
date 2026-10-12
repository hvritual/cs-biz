import type {
  AccessContext,
  Customer,
  CustomerInput,
  CustomerView,
  Grant,
  MemberView,
  Membership,
  MockDatabase,
  MockService,
  MockServiceOptions,
  NavigationItem,
  PermissionCode,
  PlatformTenant,
  RequestContext,
  RequestOptions,
  Role,
  ServiceEvent,
  StorageLike,
  User,
} from './types';

import { createSeedDatabase } from './seed';
import { PERMISSIONS } from './types';

export const DATABASE_KEY = 'csbiz.s01.database.v1';
export const SESSION_KEY = 'csbiz.s01.session.v1';

/** Local interaction errors; this adapter is not a server authorization boundary. */
export class ServiceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly params: Record<string, string | number>;

  constructor(code: string, status = 400, params: Record<string, string | number> = {}) {
    super(code);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
    this.params = params;
  }
}

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

function browserStorage(kind: 'localStorage' | 'sessionStorage'): StorageLike {
  if (typeof window === 'undefined') return memoryStorage();
  try {
    return window[kind];
  } catch {
    // Browser writes must remain durable; a denied getter cannot silently change
    // the persistence contract to an in-memory session that disappears on reload.
    return fail('STORAGE_UNAVAILABLE', 507);
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function fail(code: string, status = 400, params: Record<string, string | number> = {}): never {
  throw new ServiceError(code, status, params);
}

function id(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function textField(value: unknown, field: string, max = 200, required = true): string {
  if (typeof value !== 'string') return fail('INVALID_INPUT', 422, { field });
  const result = value.trim();
  if ((required && !result) || result.length > max) return fail('INVALID_INPUT', 422, { field });
  return result;
}

function emailField(value: unknown): string {
  const result = textField(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) return fail('INVALID_EMAIL', 422);
  return result;
}

function aborted(): never {
  const error = new ServiceError('REQUEST_CANCELLED', 499);
  error.name = 'AbortError';
  throw error;
}

async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return aborted();
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const finish = () => { signal?.removeEventListener('abort', cancel); resolve(); };
    const timer = setTimeout(finish, ms);
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      const error = new ServiceError('REQUEST_CANCELLED', 499);
      error.name = 'AbortError';
      reject(error);
    };
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

const NAVIGATION: Array<NavigationItem & { permission: PermissionCode }> = [
  { name: 'overview', path: '/overview', viewKey: 'workspace.overview', titleKey: 'menu.overview', order: 10, permission: 'workspace.read' },
  { name: 'customers', path: '/customers', viewKey: 'workspace.customers', titleKey: 'menu.customers', order: 20, permission: 'crm.customer.read' },
  { name: 'members', path: '/members', viewKey: 'workspace.members', titleKey: 'menu.members', order: 30, permission: 'tenant.member.read' },
  { name: 'roles', path: '/roles', viewKey: 'workspace.roles', titleKey: 'menu.roles', order: 40, permission: 'tenant.role.read' },
  { name: 'settings', path: '/settings', viewKey: 'workspace.settings', titleKey: 'menu.settings', order: 50, permission: 'tenant.profile.read' },
  { name: 'platform', path: '/platform', viewKey: 'workspace.platform', titleKey: 'menu.platform', order: 60, permission: 'tenant.module.read' },
];

/**
 * Browser-only stateful adapter for S01. Every request names its tenant; sessions
 * are tab-local. The same checks must move to a real server in S02. Storage
 * writes are synchronous within one instance, not database transactions across tabs.
 */
export function createMockService(options: MockServiceOptions = {}): MockService {
  const storage = options.storage ?? browserStorage('localStorage');
  const sessionStorage = options.sessionStorage ?? browserStorage('sessionStorage');
  const eventTarget = options.window ?? (typeof window === 'undefined' ? undefined : window);
  const latency = options.latencyMs ?? 160;
  const now = options.now ?? (() => new Date().toISOString());
  const listeners = new Set<(event: ServiceEvent) => void>();
  let state = createSeedDatabase();
  let subjectId = sessionStorage.getItem(SESSION_KEY) ?? 'chen';
  let sessionGeneration = 0;

  function read(): void {
    const raw = storage.getItem(DATABASE_KEY);
    if (!raw) return;
    try {
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== 2) {
        return fail('STORAGE_INVALID', 500);
      }
      const candidate = value as MockDatabase;
      if (!Array.isArray(candidate.users) || !Array.isArray(candidate.tenants) || !Array.isArray(candidate.memberships)
        || !Array.isArray(candidate.roles) || !Array.isArray(candidate.customers) || !candidate.accessVersions
        || !candidate.entitlements || !Array.isArray(candidate.activationRequests) || !candidate.idempotency) {
        return fail('STORAGE_INVALID', 500);
      }
      state = candidate;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      return fail('STORAGE_INVALID', 500);
    }
  }

  function emit(event: ServiceEvent): void {
    for (const listener of listeners) {
      try { listener(clone(event)); } catch (error) {
        // A subscriber failure must not turn an already saved change into a failed write.
        queueMicrotask(() => { throw error; });
      }
    }
  }

  function commit(next: MockDatabase, event: ServiceEvent): void {
    try { storage.setItem(DATABASE_KEY, JSON.stringify(next)); } catch {
      return fail('STORAGE_UNAVAILABLE', 507);
    }
    state = next;
    emit(event);
  }

  function policyCommit(next: MockDatabase, tenantId: string): void {
    next.accessVersions[tenantId] = (state.accessVersions[tenantId] ?? 0) + 1;
    commit(next, { type: 'access', tenantId });
  }

  read();
  if (!storage.getItem(DATABASE_KEY)) {
    try { storage.setItem(DATABASE_KEY, JSON.stringify(state)); } catch {
      return fail('STORAGE_UNAVAILABLE', 507);
    }
  }

  function currentUser(expectedSubject?: string): User {
    const user = state.users.find((entry) => entry.id === subjectId);
    if (!user) return fail('SESSION_REQUIRED', 401);
    if (expectedSubject && expectedSubject !== user.id) return fail('SESSION_CHANGED', 401);
    return user;
  }

  async function begin(request: RequestOptions = {}, expectedSubject?: string): Promise<() => User> {
    const generation = sessionGeneration;
    currentUser(expectedSubject);
    await delay(request.delayMs ?? latency, request.signal);
    // An await caller resumes in a later microtask. Refresh inside that caller's
    // synchronous execution segment, immediately before authorization and writes,
    // so another instance cannot commit between this refresh and the operation.
    return () => {
      if (request.signal?.aborted) return aborted();
      if (generation !== sessionGeneration) return fail('SESSION_CHANGED', 401);
      read();
      return currentUser(expectedSubject);
    };
  }

  function membership(context: RequestContext): Membership {
    currentUser(context.subjectId);
    if (!state.tenants.some((tenant) => tenant.id === context.tenantId)) return fail('TENANT_NOT_FOUND', 404);
    const member = state.memberships.find((entry) => entry.tenantId === context.tenantId && entry.userId === context.subjectId);
    if (!member) return fail('MEMBERSHIP_REQUIRED', 403);
    if (member.status !== 'active') return fail('MEMBER_DISABLED', 403);
    return member;
  }

  function memberRoles(member: Membership, database = state): Role[] {
    return database.roles.filter((role) => role.tenantId === member.tenantId && member.roleIds.includes(role.id));
  }

  function grantsFor(member: Membership, database = state): Grant[] {
    return memberRoles(member, database).flatMap((role) => role.grants);
  }

  function moduleAvailable(tenantId: string, action: PermissionCode): boolean {
    const definition = PERMISSIONS.find((permission) => permission.code === action);
    if (!definition) return false;
    return !definition.moduleCode || !!state.entitlements[tenantId]?.some((entry) => entry.moduleCode === definition.moduleCode && entry.status === 'active');
  }

  function can(context: RequestContext, action: PermissionCode, resource?: { ownerId: string }): boolean {
    const member = state.memberships.find((entry) => entry.tenantId === context.tenantId && entry.userId === context.subjectId);
    if (member?.status !== 'active' || !moduleAvailable(context.tenantId, action)) return false;
    // Match action and its own scope together. Never union scopes across actions.
    return grantsFor(member).some((grant) => grant.action === action
      && (grant.scope === 'all' || (!resource || resource.ownerId === context.subjectId)));
  }

  function authorize(context: RequestContext, action: PermissionCode, resource?: { ownerId: string }): Membership {
    const member = membership(context);
    if (!moduleAvailable(context.tenantId, action)) return fail('MODULE_INACTIVE', 403);
    if (!can(context, action, resource)) return fail('PERMISSION_DENIED', 403);
    return member;
  }

  function ownerCount(tenantId: string, database = state): number {
    return database.memberships.filter((member) => member.tenantId === tenantId && member.status === 'active'
      && memberRoles(member, database).some((role) => role.isOwner)).length;
  }

  function memberView(context: RequestContext, member: Membership): MemberView {
    const user = state.users.find((entry) => entry.id === member.userId);
    if (!user) return fail('MEMBER_NOT_FOUND', 404);
    const roles = memberRoles(member);
    const isOwner = roles.some((role) => role.isOwner);
    return clone({ ...member, user, roles, isOwner,
      canManage: can(context, 'tenant.member.manage') && !(isOwner && member.status === 'active' && ownerCount(context.tenantId) === 1),
    });
  }

  function customerView(context: RequestContext, customer: Customer): CustomerView {
    return clone({ ...customer,
      ownerName: state.users.find((user) => user.id === customer.ownerId)?.name ?? '',
      canUpdate: !customer.archivedAt && can(context, 'crm.customer.update', customer),
      canArchive: !customer.archivedAt && can(context, 'crm.customer.archive', customer),
    });
  }

  function findCustomer(context: RequestContext, customerId: string): Customer {
    membership(context);
    const customer = state.customers.find((entry) => entry.id === customerId && entry.tenantId === context.tenantId);
    if (!customer || !can(context, 'crm.customer.read', customer)) return fail('CUSTOMER_NOT_FOUND', 404);
    return customer;
  }

  function normalizeCustomer(input: CustomerInput): CustomerInput {
    const company = textField(input.company, 'company', 120);
    const contact = textField(input.contact, 'contact', 80);
    const phone = textField(input.phone, 'phone', 40, false);
    const notes = textField(input.notes, 'notes', 2000, false);
    if (!['company', 'retail', 'hospitality', 'studio'].includes(input.kind)) return fail('INVALID_INPUT', 422, { field: 'kind' });
    if (!['active', 'prospect', 'paused'].includes(input.status)) return fail('INVALID_INPUT', 422, { field: 'status' });
    const ownerId = textField(input.ownerId, 'ownerId', 160);
    return { company, kind: input.kind, contact, phone, ownerId, status: input.status, notes };
  }

  function requireActiveOwner(context: RequestContext, ownerId: string): void {
    const owner = state.memberships.find((member) => member.tenantId === context.tenantId && member.userId === ownerId && member.status === 'active');
    if (!owner) return fail('INVALID_OWNER', 422);
  }

  function requireUniqueCompany(context: RequestContext, company: string, exceptId?: string): void {
    if (state.customers.some((entry) => entry.tenantId === context.tenantId && !entry.archivedAt && entry.id !== exceptId
      && entry.company.toLocaleLowerCase() === company.toLocaleLowerCase())) return fail('CUSTOMER_EXISTS', 409);
  }

  function idempotency(context: RequestContext, operation: string, key: string, payload: unknown) {
    if (typeof key !== 'string' || key.length < 6 || key.length > 128) return fail('IDEMPOTENCY_KEY_REQUIRED', 422);
    const lookupKey = JSON.stringify(['tenant', context.subjectId, context.tenantId, operation, key]);
    // The payload is a separate comparison value, never a component of the unique key.
    const fingerprint = JSON.stringify(payload);
    const existing = state.idempotency[lookupKey];
    if (existing && existing.payload !== fingerprint) return fail('IDEMPOTENCY_CONFLICT', 409);
    return { lookupKey, fingerprint, existing };
  }

  function validateGrants(context: RequestContext, input: Grant[]): Grant[] {
    const actor = membership(context);
    if (!Array.isArray(input)) return fail('INVALID_INPUT', 422, { field: 'grants' });
    const authority = grantsFor(actor);
    const result: Grant[] = [];
    for (const item of input) {
      const definition = PERMISSIONS.find((entry) => entry.code === item.action);
      if (!definition || !definition.scopes.includes(item.scope)) return fail('INVALID_PERMISSION', 422);
      if (!authority.some((grant) => grant.action === item.action && (grant.scope === 'all' || grant.scope === item.scope))) {
        return fail('GRANT_EXCEEDS_AUTHORITY', 403);
      }
      if (!result.some((grant) => grant.action === item.action && grant.scope === item.scope)) result.push({ action: item.action, scope: item.scope });
    }
    return result;
  }

  function normalizeRoleIds(roleIds: string[]): string[] {
    if (!Array.isArray(roleIds)) return fail('INVALID_INPUT', 422, { field: 'roleIds' });
    return [...new Set(roleIds.map((value) => textField(value, 'roleIds', 160)))].sort();
  }

  function validateRoleIds(context: RequestContext, roleIds: string[]): string[] {
    const uniqueIds = normalizeRoleIds(roleIds);
    for (const roleId of uniqueIds) {
      const role = state.roles.find((entry) => entry.id === roleId && entry.tenantId === context.tenantId);
      if (!role) return fail('ROLE_NOT_FOUND', 404);
      validateGrants(context, role.grants);
    }
    return uniqueIds;
  }

  function requireUniqueRole(context: RequestContext, name: string, exceptId?: string): void {
    if (state.roles.some((entry) => entry.tenantId === context.tenantId && entry.id !== exceptId
      && entry.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return fail('ROLE_EXISTS', 409);
  }

  function requirePlatform(): void {
    if (currentUser().platformRole !== 'operator') return fail('PLATFORM_ACCESS_REQUIRED', 403);
  }

  function platformTenant(tenantId: string): PlatformTenant {
    const tenant = state.tenants.find((entry) => entry.id === tenantId);
    if (!tenant) return fail('TENANT_NOT_FOUND', 404);
    return clone({ ...tenant,
      memberCount: state.memberships.filter((member) => member.tenantId === tenantId && member.status === 'active').length,
      customerCount: state.customers.filter((customer) => customer.tenantId === tenantId && !customer.archivedAt).length,
      entitlements: state.entitlements[tenantId] ?? [],
      activationRequests: state.activationRequests.filter((request) => request.tenantId === tenantId),
    });
  }

  const storageChanged = (event: Event) => {
    const storageEvent = event as StorageEvent;
    if (storageEvent.key !== DATABASE_KEY) return;
    const previousVersions = { ...state.accessVersions };
    read();
    for (const tenant of state.tenants) {
      emit({ type: previousVersions[tenant.id] !== state.accessVersions[tenant.id] ? 'access' : 'data', tenantId: tenant.id });
    }
  };
  eventTarget?.addEventListener('storage', storageChanged);

  const service: MockService = {
    listUsers() { read(); return clone(state.users); },
    getSession() { read(); return clone(state.users.find((user) => user.id === subjectId) ?? null); },
    selectUser(userId) {
      read();
      const user = state.users.find((entry) => entry.id === userId);
      if (!user) return fail('USER_NOT_FOUND', 404);
      sessionStorage.setItem(SESSION_KEY, user.id);
      subjectId = user.id;
      sessionGeneration += 1;
      emit({ type: 'session', subjectId });
      return clone(user);
    },
    logout() {
      sessionStorage.setItem(SESSION_KEY, 'signed-out');
      subjectId = 'signed-out';
      sessionGeneration += 1;
      emit({ type: 'session' });
    },
    async listTenants(request) {
      const user = (await begin(request))();
      const ids = new Set(state.memberships.filter((member) => member.userId === user.id && member.status === 'active').map((member) => member.tenantId));
      return clone(state.tenants.filter((tenant) => ids.has(tenant.id)));
    },
    async getAccessContext(context) {
      const user = (await begin(context, context.subjectId))();
      const member = membership(context);
      const tenant = state.tenants.find((entry) => entry.id === context.tenantId)!;
      const permissions = PERMISSIONS.filter(({ code }) => can(context, code)).map(({ code }) => code);
      const navigation = NAVIGATION.filter((item) => permissions.includes(item.permission)).map(({ permission: _permission, ...item }) => item);
      const result: AccessContext = {
        subjectId: user.id, tenantId: tenant.id, accessVersion: `${tenant.id}:${state.accessVersions[tenant.id] ?? 0}`,
        user, tenant, membership: memberView(context, member), entitlements: state.entitlements[tenant.id] ?? [], permissions, navigation,
      };
      return clone(result);
    },
    async listCustomers(context) {
      (await begin(context, context.subjectId))();
      authorize(context, 'crm.customer.read');
      return state.customers.filter((entry) => entry.tenantId === context.tenantId && !entry.archivedAt && can(context, 'crm.customer.read', entry))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map((entry) => customerView(context, entry));
    },
    async listCustomerOwners(context, action) {
      (await begin(context, context.subjectId))();
      if (action !== 'crm.customer.create' && action !== 'crm.customer.update') return fail('INVALID_PERMISSION', 422);
      authorize(context, action);
      // Candidates come from active membership, including people without any
      // customer yet. Match the requested write action's own scope, never read scope.
      return state.memberships.filter((member) => member.tenantId === context.tenantId && member.status === 'active'
        && can(context, action, { ownerId: member.userId })).flatMap((member) => {
        const user = state.users.find((entry) => entry.id === member.userId);
        return user ? [{ id: user.id, name: user.name }] : [];
      });
    },
    async getCustomer(context, customerId) {
      (await begin(context, context.subjectId))();
      authorize(context, 'crm.customer.read');
      return customerView(context, findCustomer(context, customerId));
    },
    async createCustomer(context, input, key) {
      (await begin(context, context.subjectId))();
      authorize(context, 'crm.customer.create');
      const normalized = normalizeCustomer(input);
      authorize(context, 'crm.customer.create', normalized);
      const request = idempotency(context, 'customer.create', key, normalized);
      if (request.existing) return customerView(context, findCustomer(context, request.existing.resultId));
      requireActiveOwner(context, normalized.ownerId);
      requireUniqueCompany(context, normalized.company);
      const next = clone(state);
      const customer: Customer = { ...normalized, id: id('customer'), tenantId: context.tenantId, updatedAt: now() };
      next.customers.push(customer);
      next.idempotency[request.lookupKey] = { payload: request.fingerprint, resultId: customer.id };
      commit(next, { type: 'data', tenantId: context.tenantId });
      return customerView(context, customer);
    },
    async updateCustomer(context, customerId, input) {
      (await begin(context, context.subjectId))();
      authorize(context, 'crm.customer.update');
      const current = findCustomer(context, customerId);
      if (current.archivedAt) return fail('CUSTOMER_ARCHIVED', 409);
      authorize(context, 'crm.customer.update', current);
      const normalized = normalizeCustomer({ ...current, ...input });
      requireActiveOwner(context, normalized.ownerId);
      // An own-scope editor cannot transfer a record to another owner to bypass scope.
      authorize(context, 'crm.customer.update', normalized);
      requireUniqueCompany(context, normalized.company, customerId);
      const next = clone(state);
      const updated = { ...current, ...normalized, updatedAt: now() };
      next.customers[next.customers.findIndex((entry) => entry.id === customerId)] = updated;
      commit(next, { type: 'data', tenantId: context.tenantId });
      return customerView(context, updated);
    },
    async archiveCustomer(context, customerId) {
      (await begin(context, context.subjectId))();
      authorize(context, 'crm.customer.archive');
      const current = findCustomer(context, customerId);
      authorize(context, 'crm.customer.archive', current);
      if (current.archivedAt) return customerView(context, current);
      const next = clone(state);
      const timestamp = now();
      const updated = { ...current, archivedAt: timestamp, updatedAt: timestamp };
      next.customers[next.customers.findIndex((entry) => entry.id === customerId)] = updated;
      commit(next, { type: 'data', tenantId: context.tenantId });
      return customerView(context, updated);
    },
    async listMembers(context) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.member.read');
      return state.memberships.filter((entry) => entry.tenantId === context.tenantId).map((entry) => memberView(context, entry));
    },
    async createMember(context, input, key) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.member.manage');
      const normalized = { name: textField(input.name, 'name', 80), email: emailField(input.email),
        title: textField(input.title ?? '', 'title', 80, false), roleIds: normalizeRoleIds(input.roleIds) };
      const request = idempotency(context, 'member.create', key, normalized);
      if (request.existing) {
        const existing = state.memberships.find((member) => member.id === request.existing!.resultId && member.tenantId === context.tenantId);
        if (!existing) return fail('MEMBER_NOT_FOUND', 404);
        return memberView(context, existing);
      }
      validateRoleIds(context, normalized.roleIds);
      const existingUser = state.users.find((user) => user.email.toLowerCase() === normalized.email);
      if (existingUser && state.memberships.some((member) => member.tenantId === context.tenantId && member.userId === existingUser.id)) return fail('MEMBER_EXISTS', 409);
      const next = clone(state);
      const user: User = existingUser ?? { id: id('user'), name: normalized.name, email: normalized.email, title: normalized.title,
        initials: normalized.name.slice(0, 1) };
      if (!existingUser) next.users.push(user);
      const member: Membership = { id: id('member'), tenantId: context.tenantId, userId: user.id, status: 'active', roleIds: normalized.roleIds, joinedAt: now() };
      next.memberships.push(member);
      next.idempotency[request.lookupKey] = { payload: request.fingerprint, resultId: member.id };
      policyCommit(next, context.tenantId);
      return memberView(context, member);
    },
    async updateMembership(context, memberId, input) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.member.manage');
      const current = state.memberships.find((entry) => entry.id === memberId && entry.tenantId === context.tenantId);
      if (!current) return fail('MEMBER_NOT_FOUND', 404);
      if (input.status !== undefined && !['active', 'disabled'].includes(input.status)) return fail('INVALID_INPUT', 422, { field: 'status' });
      const nextStatus = input.status ?? current.status;
      const roleIds = input.roleIds !== undefined || (nextStatus === 'active' && current.status !== 'active')
        ? validateRoleIds(context, input.roleIds ?? current.roleIds) : current.roleIds;
      const next = clone(state);
      const updated = { ...current, status: nextStatus, roleIds };
      next.memberships[next.memberships.findIndex((entry) => entry.id === memberId)] = updated;
      if (ownerCount(context.tenantId, next) === 0) return fail('LAST_OWNER', 409);
      policyCommit(next, context.tenantId);
      return memberView(context, updated);
    },
    async listRoles(context) {
      (await begin(context, context.subjectId))();
      membership(context);
      if (!can(context, 'tenant.role.read') && !can(context, 'tenant.member.manage')) return fail('PERMISSION_DENIED', 403);
      return clone(state.roles.filter((entry) => entry.tenantId === context.tenantId));
    },
    async createRole(context, input) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.role.manage');
      const name = textField(input.name, 'name', 80);
      const description = textField(input.description, 'description', 300, false);
      const grants = validateGrants(context, input.grants);
      requireUniqueRole(context, name);
      const next = clone(state);
      const role: Role = { id: id('role'), tenantId: context.tenantId, name, description, grants, isSystem: false, isOwner: false };
      next.roles.push(role);
      policyCommit(next, context.tenantId);
      return clone(role);
    },
    async updateRole(context, roleId, input) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.role.manage');
      const current = state.roles.find((entry) => entry.id === roleId && entry.tenantId === context.tenantId);
      if (!current) return fail('ROLE_NOT_FOUND', 404);
      if (current.isSystem) return fail('PROTECTED_ROLE', 409);
      const name = input.name === undefined ? current.name : textField(input.name, 'name', 80);
      const description = input.description === undefined ? current.description : textField(input.description, 'description', 300, false);
      const grants = input.grants === undefined ? current.grants : validateGrants(context, input.grants);
      requireUniqueRole(context, name, roleId);
      const next = clone(state);
      const updated = { ...current, name, description, grants };
      next.roles[next.roles.findIndex((entry) => entry.id === roleId)] = updated;
      policyCommit(next, context.tenantId);
      return clone(updated);
    },
    async deleteRole(context, roleId) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.role.manage');
      const role = state.roles.find((entry) => entry.id === roleId && entry.tenantId === context.tenantId);
      if (!role) return fail('ROLE_NOT_FOUND', 404);
      if (role.isSystem) return fail('PROTECTED_ROLE', 409);
      if (state.memberships.some((member) => member.tenantId === context.tenantId && member.roleIds.includes(roleId))) return fail('ROLE_IN_USE', 409);
      const next = clone(state);
      next.roles = next.roles.filter((entry) => entry.id !== roleId);
      policyCommit(next, context.tenantId);
    },
    async updateTenant(context, input) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.profile.update');
      const current = state.tenants.find((entry) => entry.id === context.tenantId)!;
      const updated = { ...current,
        name: input.name === undefined ? current.name : textField(input.name, 'name', 100),
        contact: input.contact === undefined ? current.contact : textField(input.contact, 'contact', 80),
        phone: input.phone === undefined ? current.phone : textField(input.phone, 'phone', 40, false),
        email: input.email === undefined ? current.email : emailField(input.email),
      };
      const next = clone(state);
      next.tenants[next.tenants.findIndex((entry) => entry.id === context.tenantId)] = updated;
      policyCommit(next, context.tenantId);
      return clone(updated);
    },
    async listEntitlements(context) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.module.read');
      return clone(state.entitlements[context.tenantId] ?? []);
    },
    async listActivationRequests(context) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.module.read');
      return clone(state.activationRequests.filter((request) => request.tenantId === context.tenantId));
    },
    async requestActivation(context, moduleCode) {
      (await begin(context, context.subjectId))();
      authorize(context, 'tenant.module.request');
      if (moduleCode !== 'crm') return fail('MODULE_NOT_FOUND', 404);
      if (state.entitlements[context.tenantId]?.some((entry) => entry.moduleCode === moduleCode && entry.status === 'active')) return fail('MODULE_ALREADY_ACTIVE', 409);
      const existing = state.activationRequests.find((entry) => entry.tenantId === context.tenantId && entry.moduleCode === moduleCode && entry.status === 'pending');
      if (existing) return clone(existing);
      const next = clone(state);
      const request = { id: id('activation'), tenantId: context.tenantId, moduleCode, status: 'pending' as const, requestedBy: context.subjectId, requestedAt: now() };
      next.activationRequests.push(request);
      commit(next, { type: 'data', tenantId: context.tenantId });
      return clone(request);
    },
    async platformListTenants(request) {
      (await begin(request))();
      requirePlatform();
      return state.tenants.map((tenant) => platformTenant(tenant.id));
    },
    async platformSetModule(tenantId, moduleCode, enabled) {
      (await begin())();
      requirePlatform();
      if (moduleCode !== 'crm') return fail('MODULE_NOT_FOUND', 404);
      if (typeof enabled !== 'boolean') return fail('INVALID_INPUT', 422, { field: 'enabled' });
      platformTenant(tenantId);
      const next = clone(state);
      const existing = next.entitlements[tenantId]?.find((entry) => entry.moduleCode === moduleCode);
      if (existing?.status === (enabled ? 'active' : 'inactive')) return platformTenant(tenantId);
      next.entitlements[tenantId] = [{ moduleCode, status: enabled ? 'active' : 'inactive', ...(enabled ? { activatedAt: now() } : {}) }];
      if (enabled) {
        for (const request of next.activationRequests) {
          if (request.tenantId === tenantId && request.moduleCode === moduleCode && request.status === 'pending') {
            request.status = 'approved';
            request.resolvedAt = now();
          }
        }
      }
      policyCommit(next, tenantId);
      return platformTenant(tenantId);
    },
    async getActivationRequests(request) {
      (await begin(request))();
      requirePlatform();
      return clone(state.activationRequests);
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reset() {
      read();
      const next = createSeedDatabase();
      for (const tenant of next.tenants) next.accessVersions[tenant.id] = (state.accessVersions[tenant.id] ?? 0) + 1;
      commit(next, { type: 'reset' });
      service.selectUser('chen');
    },
    dispose() { listeners.clear(); eventTarget?.removeEventListener('storage', storageChanged); },
  };
  return service;
}

export const api = createMockService();
