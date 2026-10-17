export type Outcome = "pending" | "unknown" | "succeeded" | "failed" | "partial";
export type Scope = "none" | "self" | "tenant";
export interface Account {
  id: string;
  name: string;
  email: string;
  initials: string;
  title: string;
  issuer: string;
  subject: string;
  verified: boolean;
  systemRoles: string[];
}
export interface Member {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role: string;
  state: "active" | "invited" | "suspended" | "removed";
  version: number;
}
export interface Invite {
  id: string;
  tenantId: string;
  membershipId: string;
  email: string;
  role: string;
  state: "created" | "accepted" | "withdrawn" | "expired";
  delivery: "pending" | "delivered" | "delivery_failed";
  version: number;
  expiresAt: string;
  acceptedBy?: string;
  delegatorId: string;
  authority: "tenant_delegation" | "platform_nomination";
  roleVersion: number;
  ceiling: Role;
}
export interface Customer {
  id: string;
  name: string;
  owner: string;
  note: string;
  version: number;
}
export interface Campaign {
  id: string;
  name: string;
  owner: string;
  state: "draft" | "active";
  version: number;
}
export interface Role {
  id: string;
  name: string;
  menu: boolean;
  read: Scope;
  update: Scope;
  export: Scope;
  access: boolean;
  marketingRead: Scope;
  marketingExecute: Scope;
  version: number;
}
export interface Tenant {
  id: string;
  name: string;
  code: string;
  owner: string;
  state: string;
  modules: string[];
  moduleConfig: Record<string, { expiresAt: string; quota: string }>;
  version: number;
}
export interface Effect {
  kind:
    | "campaign"
    | "customer"
    | "batch"
    | "export"
    | "member"
    | "role"
    | "invite"
    | "invite-state"
    | "accept-invite"
    | "tenant"
    | "nominate"
    | "module"
    | "release"
    | "recovery";
  ids: string[];
  values: Record<string, string>;
}
export interface TaskItem {
  id: string;
  label: string;
  status: Outcome;
  committedStatus: "succeeded" | "failed";
  reason: string;
}
export interface Task {
  id: string;
  title: string;
  titleEn: string;
  tenant: string;
  actor: string;
  origin: string;
  key: string;
  intentSlot: string;
  digest: string;
  status: Outcome;
  effect: Effect;
  items: TaskItem[];
  trace: string;
  sequence: number;
  downloadExpired: boolean;
}
export interface Audit {
  id: string;
  tenant: string;
  action: string;
  object: string;
  actor: string;
  result: string;
  task: string;
}
export interface Space {
  members: Member[];
  customers: Customer[];
  campaigns: Campaign[];
  roles: Role[];
}
export interface ReviewDatabase {
  schema: 4;
  revision: number;
  accounts: Account[];
  tenants: Tenant[];
  invites: Invite[];
  spaces: Record<string, Space>;
  tasks: Task[];
  audits: Audit[];
}
export interface ReviewData extends Space {
  revision: number;
  tenants: Tenant[];
  invites: Invite[];
  tasks: Task[];
  audits: Audit[];
}
export const databaseKey = "cs-biz:f-series-full:v4:database";
export function emptySpace(): Space {
  return { members: [], customers: [], campaigns: [], roles: defaultRoles() };
}
export function defaultRoles(): Role[] {
  return [
    {
      id: "owner",
      name: "企业负责人",
      menu: true,
      read: "tenant",
      update: "self",
      export: "self",
      access: true,
      marketingRead: "tenant",
      marketingExecute: "self",
      version: 1,
    },
    {
      id: "manager",
      name: "有委派权限的管理员",
      menu: true,
      read: "tenant",
      update: "self",
      export: "self",
      access: true,
      marketingRead: "tenant",
      marketingExecute: "self",
      version: 1,
    },
    {
      id: "operator",
      name: "业务成员",
      menu: false,
      read: "tenant",
      update: "self",
      export: "self",
      access: false,
      marketingRead: "tenant",
      marketingExecute: "self",
      version: 1,
    },
    {
      id: "reader",
      name: "只读成员",
      menu: true,
      read: "tenant",
      update: "none",
      export: "none",
      access: false,
      marketingRead: "tenant",
      marketingExecute: "none",
      version: 1,
    },
  ];
}
export function seedDatabase(
  base: { id: string; name: string; email: string; initials: string; title: string },
  organizations: readonly { id: string; name: string }[],
): ReviewDatabase {
  const account: Account = {
    ...base,
    issuer: "https://identity.review.invalid",
    subject: "review-base-subject",
    verified: true,
    systemRoles: ["platform", "support", "ops"],
  };
  const others: Account[] = [
    ["account-lin", "林沐", "lin@example.test"],
    ["account-yu", "陈雨", "yu@example.test"],
    ["account-xia", "夏宁", "xia@example.test"],
  ].map(([id, name, email]) => ({
    id: id!,
    name: name!,
    email: email!,
    initials: name!.slice(0, 1),
    title: "成员",
    issuer: "https://identity.review.invalid",
    subject: id!,
    verified: true,
    systemRoles: [],
  }));
  const db: ReviewDatabase = {
    schema: 4,
    revision: 1,
    accounts: [account, ...others],
    tenants: [],
    invites: [],
    spaces: {},
    tasks: [],
    audits: [],
  };
  for (const [index, org] of organizations.entries()) {
    const code = index === 0 ? "qinghe" : "yunlan";
    db.tenants.push({
      id: org.id,
      name: org.name,
      code,
      owner: base.email,
      state: "active",
      modules: ["crm", "marketing"],
      moduleConfig: {
        crm: { expiresAt: "", quota: "unlimited" },
        marketing: { expiresAt: "", quota: "unlimited" },
      },
      version: 1,
    });
    db.spaces[org.id] = {
      members: [
        {
          id: "me",
          accountId: base.id,
          name: base.name,
          email: base.email,
          role: "owner",
          state: "active",
          version: 1,
        },
        {
          id: "lin",
          accountId: "account-lin",
          name: "林沐",
          email: "lin@example.test",
          role: "operator",
          state: "active",
          version: 1,
        },
        {
          id: "yu",
          accountId: "account-yu",
          name: "陈雨",
          email: "yu@example.test",
          role: "reader",
          state: "active",
          version: 1,
        },
        {
          id: "xia",
          accountId: "account-xia",
          name: "夏宁",
          email: "xia@example.test",
          role: "owner",
          state: "suspended",
          version: 1,
        },
      ],
      customers: [
        {
          id: "C-1001",
          name: index ? "云岚运营中心" : "青禾科技园",
          owner: base.id,
          note: "每月核对服务情况",
          version: 1,
        },
        {
          id: "C-1002",
          name: index ? "云岚商务中心" : "青禾商务中心",
          owner: "account-lin",
          note: "联系负责人后安排服务",
          version: 1,
        },
        { id: "C-1003", name: "星河中心", owner: base.id, note: "东区", version: 1 },
        { id: "C-1004", name: "星河中心", owner: "account-lin", note: "西区", version: 1 },
        {
          id: "C-1005",
          name: index ? "云岚生活广场" : "青禾生活广场",
          owner: base.id,
          note: "",
          version: 1,
        },
        { id: "C-1006", name: "远山创意园", owner: base.id, note: "", version: 1 },
      ],
      campaigns: [
        {
          id: "M-1001",
          name: index ? "云岚秋日计划" : "秋日客户关怀",
          owner: base.id,
          state: "draft",
          version: 1,
        },
        { id: "M-1002", name: "会员服务回访", owner: "account-lin", state: "draft", version: 1 },
        { id: "M-1003", name: "园区服务月", owner: base.id, state: "active", version: 1 },
      ],
      roles: defaultRoles(),
    };
    // Explicit historical review fixtures: execution outcome is fixed before any readback.
    for (const [n, status] of (
      ["succeeded", "failed", "pending", "unknown", "partial"] as const
    ).entries()) {
      const ids =
        status === "partial"
          ? ["C-1001", "C-1003", "C-1005"]
          : [status === "pending" ? "C-1006" : status === "unknown" ? "C-1005" : "C-1001"];
      const effect: Effect = {
        kind: status === "partial" ? "batch" : "customer",
        ids,
        values: {
          note: db.spaces[org.id]!.customers.find((x) => x.id === ids[0])!.note,
          version: String(db.spaces[org.id]!.customers.find((x) => x.id === ids[0])!.version),
        },
      };
      const items = ids.map((id, j) => ({
        id,
        label: id,
        status:
          status === "partial"
            ? ((j === 0 ? "succeeded" : j === 1 ? "failed" : "unknown") as Outcome)
            : status,
        committedStatus: (status === "failed" || (status === "partial" && j === 1)
          ? "failed"
          : "succeeded") as "succeeded" | "failed",
        reason: "",
      }));
      for (const item of items)
        if (item.committedStatus === "succeeded") {
          const row = db.spaces[org.id]!.customers.find((x) => x.id === item.id);
          if (row) {
            row.note = effect.values.note || row.note;
            row.version++;
          }
        }
      const record = `ACT-SAMPLE-${index}-${n}`;
      db.tasks.push({
        id: record,
        title: "审阅历史操作样例",
        titleEn: "Historical review activity",
        tenant: org.id,
        actor: base.id,
        origin: "customer-edit",
        key: record,
        intentSlot: record,
        digest: JSON.stringify(effect),
        status,
        effect,
        items,
        trace: `trace-${record}`,
        sequence: 0,
        downloadExpired: false,
      });
    }
    const member = "pending-" + org.id;
    db.spaces[org.id]!.members.push({
      id: member,
      accountId: "",
      name: "待加入成员",
      email: "new@example.test",
      role: "reader",
      state: "invited",
      version: 1,
    });
    db.invites.push({
      id: "INV-REVIEW-" + index,
      tenantId: org.id,
      membershipId: member,
      email: "new@example.test",
      role: "reader",
      delegatorId: base.id,
      authority: "tenant_delegation",
      roleVersion: 1,
      ceiling: { ...defaultRoles()[0]! },
      state: "created",
      delivery: "pending",
      version: 1,
      expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
    });
  }
  return db;
}
