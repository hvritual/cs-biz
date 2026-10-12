export type DataScope = 'all' | 'own';
export type ModuleCode = 'crm';
export type MembershipStatus = 'active' | 'disabled';
export type CustomerStatus = 'active' | 'prospect' | 'paused';
export type CustomerKind = 'company' | 'retail' | 'hospitality' | 'studio';

export type PermissionCode =
  | 'workspace.read'
  | 'crm.customer.read'
  | 'crm.customer.create'
  | 'crm.customer.update'
  | 'crm.customer.archive'
  | 'tenant.member.read'
  | 'tenant.member.manage'
  | 'tenant.role.read'
  | 'tenant.role.manage'
  | 'tenant.profile.read'
  | 'tenant.profile.update'
  | 'tenant.module.read'
  | 'tenant.module.request';

export interface PermissionDefinition {
  code: PermissionCode;
  labelKey: string;
  moduleCode?: ModuleCode;
  scopes: DataScope[];
}

export const PERMISSIONS: PermissionDefinition[] = [
  { code: 'workspace.read', labelKey: 'permission.workspace.read', scopes: ['all'] },
  { code: 'crm.customer.read', labelKey: 'permission.crm.customer.read', moduleCode: 'crm', scopes: ['all', 'own'] },
  { code: 'crm.customer.create', labelKey: 'permission.crm.customer.create', moduleCode: 'crm', scopes: ['all', 'own'] },
  { code: 'crm.customer.update', labelKey: 'permission.crm.customer.update', moduleCode: 'crm', scopes: ['all', 'own'] },
  { code: 'crm.customer.archive', labelKey: 'permission.crm.customer.archive', moduleCode: 'crm', scopes: ['all', 'own'] },
  { code: 'tenant.member.read', labelKey: 'permission.tenant.member.read', scopes: ['all'] },
  { code: 'tenant.member.manage', labelKey: 'permission.tenant.member.manage', scopes: ['all'] },
  { code: 'tenant.role.read', labelKey: 'permission.tenant.role.read', scopes: ['all'] },
  { code: 'tenant.role.manage', labelKey: 'permission.tenant.role.manage', scopes: ['all'] },
  { code: 'tenant.profile.read', labelKey: 'permission.tenant.profile.read', scopes: ['all'] },
  { code: 'tenant.profile.update', labelKey: 'permission.tenant.profile.update', scopes: ['all'] },
  { code: 'tenant.module.read', labelKey: 'permission.tenant.module.read', scopes: ['all'] },
  { code: 'tenant.module.request', labelKey: 'permission.tenant.module.request', scopes: ['all'] },
];

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  title: string;
  lastLoginAt?: string;
  platformRole?: 'operator';
}

export interface Tenant {
  id: string;
  name: string;
  shortName: string;
  contact: string;
  phone: string;
  email: string;
  brandColor: string;
  status: 'active';
  createdAt: string;
}

export interface Grant {
  action: PermissionCode;
  scope: DataScope;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  grants: Grant[];
  isSystem: boolean;
  isOwner: boolean;
}

export interface Membership {
  id: string;
  tenantId: string;
  userId: string;
  status: MembershipStatus;
  roleIds: string[];
  joinedAt: string;
  department?: string;
}

export interface MemberView extends Membership {
  user: User;
  roles: Role[];
  isOwner: boolean;
  canManage: boolean;
}

export interface CustomerInput {
  company: string;
  kind: CustomerKind;
  contact: string;
  phone: string;
  ownerId: string;
  status: CustomerStatus;
  notes: string;
}

export interface Customer extends CustomerInput {
  id: string;
  tenantId: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface CustomerView extends Customer {
  ownerName: string;
  canUpdate: boolean;
  canArchive: boolean;
}

export type CustomerOwnerAction = 'crm.customer.create' | 'crm.customer.update';

export interface CustomerOwner {
  id: string;
  name: string;
}

export interface Entitlement {
  moduleCode: ModuleCode;
  status: 'active' | 'inactive';
  activatedAt?: string;
}

export interface ActivationRequest {
  id: string;
  tenantId: string;
  moduleCode: ModuleCode;
  status: 'pending' | 'approved';
  requestedBy: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface NavigationItem {
  name: string;
  path: string;
  viewKey: string;
  titleKey: string;
  order: number;
}

export interface AccessContext {
  subjectId: string;
  tenantId: string;
  accessVersion: string;
  user: User;
  tenant: Tenant;
  membership: MemberView;
  entitlements: Entitlement[];
  permissions: PermissionCode[];
  navigation: NavigationItem[];
}

export interface PlatformTenant extends Tenant {
  memberCount: number;
  customerCount: number;
  entitlements: Entitlement[];
  activationRequests: ActivationRequest[];
}

export interface RequestOptions {
  signal?: AbortSignal;
  delayMs?: number;
}

export interface RequestContext extends RequestOptions {
  subjectId: string;
  tenantId: string;
}

export interface CreateMemberInput {
  name: string;
  email: string;
  title?: string;
  department?: string;
  roleIds: string[];
}

export interface RoleInput {
  name: string;
  description: string;
  grants: Grant[];
}

export interface TenantInput {
  name?: string;
  contact?: string;
  phone?: string;
  email?: string;
}

export interface ServiceEvent {
  type: 'access' | 'data' | 'session' | 'reset';
  tenantId?: string;
  subjectId?: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MockServiceOptions {
  storage?: StorageLike;
  sessionStorage?: StorageLike;
  window?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  latencyMs?: number;
  now?: () => string;
}

export interface IdempotencyRecord {
  payload: string;
  resultId: string;
}

export interface MockDatabase {
  schemaVersion: 1;
  users: User[];
  tenants: Tenant[];
  memberships: Membership[];
  roles: Role[];
  customers: Customer[];
  entitlements: Record<string, Entitlement[]>;
  accessVersions: Record<string, number>;
  activationRequests: ActivationRequest[];
  idempotency: Record<string, IdempotencyRecord>;
}

export interface MockService {
  listUsers(): User[];
  getSession(): User | null;
  selectUser(userId: string): User;
  logout(): void;
  listTenants(options?: RequestOptions): Promise<Tenant[]>;
  getAccessContext(context: RequestContext): Promise<AccessContext>;
  listCustomers(context: RequestContext): Promise<CustomerView[]>;
  listCustomerOwners(context: RequestContext, action: CustomerOwnerAction): Promise<CustomerOwner[]>;
  getCustomer(context: RequestContext, id: string): Promise<CustomerView>;
  createCustomer(context: RequestContext, input: CustomerInput, key: string): Promise<CustomerView>;
  updateCustomer(context: RequestContext, id: string, input: Partial<CustomerInput>): Promise<CustomerView>;
  archiveCustomer(context: RequestContext, id: string): Promise<CustomerView>;
  listMembers(context: RequestContext): Promise<MemberView[]>;
  createMember(context: RequestContext, input: CreateMemberInput, key: string): Promise<MemberView>;
  updateMembership(context: RequestContext, id: string, input: { roleIds?: string[]; status?: MembershipStatus }): Promise<MemberView>;
  listRoles(context: RequestContext): Promise<Role[]>;
  createRole(context: RequestContext, input: RoleInput): Promise<Role>;
  updateRole(context: RequestContext, id: string, input: Partial<RoleInput>): Promise<Role>;
  deleteRole(context: RequestContext, id: string): Promise<void>;
  updateTenant(context: RequestContext, input: TenantInput): Promise<Tenant>;
  listEntitlements(context: RequestContext): Promise<Entitlement[]>;
  listActivationRequests(context: RequestContext): Promise<ActivationRequest[]>;
  requestActivation(context: RequestContext, moduleCode: ModuleCode): Promise<ActivationRequest>;
  platformListTenants(options?: RequestOptions): Promise<PlatformTenant[]>;
  platformSetModule(tenantId: string, moduleCode: ModuleCode, enabled: boolean): Promise<PlatformTenant>;
  getActivationRequests(options?: RequestOptions): Promise<ActivationRequest[]>;
  subscribe(listener: (event: ServiceEvent) => void): () => void;
  reset(): void;
  dispose(): void;
}
