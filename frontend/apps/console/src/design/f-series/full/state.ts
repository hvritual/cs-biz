import { computed, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFSeriesDesignState } from "../state";
import { reviewBase, reviewPages, type ReviewPageId, type ReviewRole } from "./catalog";
import { l } from "./copy";
import { conflictDomain } from './operation-guard';
import {
  databaseKey,
  emptySpace,
  seedDatabase,
  type Effect,
  type Outcome,
  type ReviewData,
  type ReviewDatabase,
  type Scope,
  type ScopeAction,
  type Resource,
  type Member,
  type Task,
  type Role,
} from "./model";
import {
  delegationAllowed,
  grantsFor,
  hasRole,
  permits,
  roleIds,
  scopeActions,
  scopeSummary,
} from "./authorization";
type Text = readonly [string, string];
interface Notice {
  title: Text;
  help: Text;
  kind: "success" | "warning" | "error";
}
interface Confirmation {
  title: Text;
  effect: Effect;
  permission: string;
  context: string;
  key: string;
  slot: string;
  origin: string;
  inline?: boolean;
}
function createState() {
  const legacy = useFSeriesDesignState();
  const route = useRoute();
  const router = useRouter();
  const role = ref<ReviewRole>(
    (sessionStorage.getItem("cs-biz:f-full:role") as ReviewRole) || "owner",
  );
  const base = legacy.baseUser || {
    id: "review-base",
    name: "陈予安",
    email: "yuan.chen@example.test",
    initials: "陈",
    title: "负责人",
  };
  const fresh = () => seedDatabase(base, legacy.initialOrganizations);
  const database = ref<ReviewDatabase>(fresh());
  const page = computed(
    () => reviewPages.find((x) => x.id === route.params.page) || reviewPages[0],
  );
  const scenario = computed(
    () => page.value.scenarios.find((x) => x.id === route.query.scene) || page.value.scenarios[0],
  );
  const scene = computed<string>(() => scenario.value.id);
  const taskMode = computed(() => route.query.r === '4');
  const authenticated = computed(() => legacy.identity.value !== "signed_out");
  const actor = computed(() => legacy.workspace.user?.id || "none");
  const tenantId = computed(() => legacy.activeTenant.value || "");
  const contextKey = computed(() => `${actor.value}:${tenantId.value}:${role.value}`);
  const draftKey = computed(
    () => `cs-biz:f-series-full:drafts:v5:${actor.value}:${tenantId.value}`,
  );
  const drafts = ref<Record<string, Record<string, unknown>>>({});
  const notice = ref<Notice | null>(null);
  const dialog = ref<Confirmation | null>(null);
  const selected = ref<string[]>([]);
  const busy = ref(false);
  const storageFailed = ref(false);
  const readback = ref<"succeeded" | "failed" | "unknown" | "denied">("succeeded");
  const supportReference = computed(() => `support-review-${page.value.id}-003`);
  const profile = (db = database.value) => db.accounts.find((x) => x.id === actor.value);
  const membership = (db = database.value, target = tenantId.value) =>
    db.spaces[target]?.members.find((x) => x.accountId === actor.value);
  const assignedRoles = (db = database.value, target = tenantId.value, account = actor.value) =>
    grantsFor(
      db.spaces[target]?.members.find((x) => x.accountId === account),
      db.spaces[target]?.roles ?? [],
    );
  function activeGrants(db = database.value, target = tenantId.value) {
    if (!authenticated.value || !["owner", "manager", "operator", "reader"].includes(role.value))
      return [];
    return assignedRoles(db, target).map((grant) =>
      role.value === "reader"
        ? {
            ...grant,
            update: "none" as const,
            export: "none" as const,
            marketingExecute: "none" as const,
            access: false,
          }
        : grant,
    );
  }
  const active = computed(
    () =>
      authenticated.value && legacy.identity.value === "active" && membership()?.state === "active",
  );
  function announce(title: Text, help: Text, kind: Notice["kind"] = "warning") {
    notice.value = { title, help, kind };
  }
  function owns(owner: string) {
    return owner === actor.value;
  }
  function moduleActive(module: string, db = database.value, target = tenantId.value) {
    const tenant = db.tenants.find((x) => x.id === target);
    const expiry = tenant?.moduleConfig[module]?.expiresAt;
    return (
      !!tenant &&
      tenant.state === "active" &&
      tenant.modules.includes(module) &&
      (!expiry || new Date(expiry).getTime() > Date.now())
    );
  }
  function scope(action: ScopeAction, db = database.value, target = tenantId.value) {
    return scopeSummary(activeGrants(db, target), action);
  }
  function can(permission: string, db = database.value): boolean {
    if (permission === "public") return true;
    if (!authenticated.value || !profile(db)?.verified) return false;
    if (permission === "account") return true;
    if (permission === "platform")
      return role.value === "platform" && !!profile(db)?.systemRoles.includes("platform");
    if (permission === "ops")
      return role.value === "ops" && !!profile(db)?.systemRoles.includes("ops");
    if (permission === "diagnostics")
      return (
        ["support", "ops"].includes(role.value) &&
        !!profile(db)?.systemRoles.includes(role.value) &&
        !!db.spaces[tenantId.value]
      );
    if (permission === "audit") return can("access", db) || can("diagnostics", db);
    if (permission === "owner")
      return (
        role.value === "owner" &&
        membership(db)?.state === "active" &&
        !!membership(db) &&
        hasRole(membership(db)!, "owner")
      );
    if (permission === "access")
      return (
        ["owner", "manager"].includes(role.value) && activeGrants(db).some((grant) => grant.access)
      );
    if (permission === "marketing.read")
      return moduleActive("marketing", db) && scope("marketingRead", db) !== "none";
    if (permission === "marketing.execute")
      return moduleActive("marketing", db) && scope("marketingExecute", db) !== "none";
    if (permission === "export") return moduleActive("crm", db) && scope("export", db) !== "none";
    if (permission === "write")
      return page.value.group === "marketing"
        ? can("marketing.execute", db)
        : moduleActive("crm", db) && scope("update", db) !== "none";
    return moduleActive("crm", db) && scope("read", db) !== "none";
  }
  function readable(
    resource: Resource,
    action: ScopeAction,
    db = database.value,
    target = tenantId.value,
  ) {
    return permits(activeGrants(db, target), action, resource, actor.value);
  }
  function view(db: ReviewDatabase, write = false): ReviewData {
    const space = db.spaces[tenantId.value] || emptySpace();
    return {
      revision: db.revision,
      tenants:
        can("platform", db) || write
          ? db.tenants
          : db.tenants.filter((x) => x.id === tenantId.value),
      members: write || can("access", db) ? space.members : [],
      roles: write || can("access", db) ? space.roles : [],
      customers: write
        ? space.customers
        : moduleActive("crm", db)
          ? space.customers.filter((x) => readable(x, "read", db))
          : [],
      campaigns: write
        ? space.campaigns
        : moduleActive("marketing", db)
          ? space.campaigns.filter((x) => readable(x, "marketingRead", db))
          : [],
      invites: write
        ? db.invites
        : can("platform", db)
          ? db.invites.filter((x) => x.delegatorId === actor.value)
          : can("access", db)
            ? db.invites.filter((x) => x.tenantId === tenantId.value)
            : [],
      tasks: db.tasks,
      audits: write
        ? db.audits
        : can("audit", db)
          ? db.audits.filter((x) => x.tenant === tenantId.value)
          : [],
    };
  }
  const data = computed(() => view(database.value));
  const effectiveRole = computed(() =>
    ["platform", "support", "ops"].includes(role.value)
      ? role.value
      : membership()?.state === "active"
        ? roleIds(membership()!)
            .map(
              (id) =>
                database.value.spaces[tenantId.value]?.roles.find((grant) => grant.id === id)
                  ?.name || id,
            )
            .join(" + ")
        : role.value,
  );
  const pagePermission = computed(() => {
    const id = page.value.id;
    if (["identity", "invitation-accept", "errors"].includes(id)) return "public";
    if (["organizations", "sessions", "tasks", "task"].includes(id)) return "account";
    if (page.value.group === "platform") return "platform";
    if (["delivery", "telemetry", "qualification", "release", "rollout", "recovery"].includes(id))
      return "ops";
    if (id === "diagnostics") return "diagnostics";
    if (id === "audit") return "audit";
    if (["members", "invitations", "invite-create", "roles", "role-edit"].includes(id))
      return "access";
    if (id === "modules") return "account";
    if (page.value.group === "marketing") return "marketing.read";
    return "read";
  });
  const allowed = computed(() => can(pagePermission.value));
  const blocked = computed(
    () =>
      !allowed.value ||
      [
        "forbidden",
        "revoked",
        "suspended",
        "module_closed",
        "no_function",
        "scope_denied",
        "owner_changed",
        "unpublished",
      ].includes(scene.value),
  );
  function loadDrafts() {
    try {
      drafts.value = JSON.parse(sessionStorage.getItem(draftKey.value) || "{}");
    } catch {
      drafts.value = {};
      storageFailed.value = true;
    }
    dialog.value = null;
    selected.value = [];
  }
  function syncOrganizations() {
    if (!authenticated.value) return;
    const available = database.value.tenants.filter((t) =>
      database.value.spaces[t.id]?.members.some(
        (m) => m.accountId === actor.value && m.state === "active",
      ),
    );
    legacy.workspace.tenants = available.map((t) => ({
      ...legacy.initialOrganizations.find((x) => x.id === t.id),
      id: t.id,
      name: t.name,
      shortName: t.name,
      contact: "",
      phone: "",
      email: "",
      brandColor: legacy.initialOrganizations.find((x) => x.id === t.id)?.brandColor || "#2563eb",
      status: "active" as const,
      createdAt: "2026-10-17",
    }));
    if (tenantId.value && !available.some((x) => x.id === tenantId.value))
      legacy.membershipScenario(available.length ? "many" : "zero");
  }
  function load() {
    try {
      const raw = localStorage.getItem(databaseKey);
      database.value = raw ? (JSON.parse(raw) as ReviewDatabase) : fresh();
      if (database.value.schema !== 5) throw Error("Wrong review database version");
      storageFailed.value = false;
      syncOrganizations();
    } catch {
      storageFailed.value = true;
      announce(
        ["审阅记录无法读取", "Review records cannot be read"],
        [
          "已暂停写入。请保留可用记录后重置审阅样例。",
          "Writes are paused. Preserve available records before resetting review fixtures.",
        ],
        "error",
      );
    }
  }
  load();
  loadDrafts();
  watch(draftKey, loadDrafts, { flush: "sync" });
  watch(role, (value) => {
    sessionStorage.setItem("cs-biz:f-full:role", value);
    dialog.value = null;
    selected.value = [];
  });
  watch(actor, () => {
    syncOrganizations();
    dialog.value = null;
    selected.value = [];
  });
  watch(
    drafts,
    (value) => {
      try {
        sessionStorage.setItem(draftKey.value, JSON.stringify(value));
      } catch {
        storageFailed.value = true;
      }
    },
    { deep: true, flush: "sync" },
  );
  watch(
    () => route.fullPath,
    () => {
      dialog.value = null;
      notice.value = null;
      selected.value = [];
    },
  );
  watch(legacy.identity, (value) => {
    if (value !== "active") {
      dialog.value = null;
      selected.value = [];
    }
  });
  const onStorage = (event: StorageEvent) => {
    if (event.key === databaseKey) load();
  };
  window.addEventListener("storage", onStorage);
  onUnmounted(() => {
    window.removeEventListener("storage", onStorage);
    shared = undefined;
  });
  function draft<T extends Record<string, unknown>>(id: string, initial: T): T {
    if (!drafts.value[id]) drafts.value[id] = structuredClone(initial);
    return drafts.value[id] as T;
  }
  function go(id: ReviewPageId, query: Record<string, string> = {}) {
    void router.push({ path: `${reviewBase}/${id}`, query: taskMode.value ? { ...query, r: '4' } : query });
  }
  function setScene(id: string) {
    void router.replace({ path: route.path, query: { ...route.query, scene: id } });
  }
  function enter() {
    syncOrganizations();
    const first = legacy.workspace.tenants[0];
    if (first) legacy.chooseOrganization(first.name);
  }
  function selectRole(value: ReviewRole) {
    role.value = value;
    if (!authenticated.value) legacy.beginSignIn();
    syncOrganizations();
    if (value !== "platform" && !active.value) enter();
  }
  function guard(permission: string, db = database.value) {
    if (!can(permission, db) || blocked.value) {
      announce(
        ["当前不能执行此操作", "This action is not allowed"],
        [
          "当前身份、模块或动作范围不满足要求，没有产生业务变化。",
          "Current identity, module, or action scope does not allow this. No business change was made.",
        ],
        "error",
      );
      return false;
    }
    if (storageFailed.value) return false;
    if (
      [
        "conflict",
        "key_conflict",
        "csrf",
        "missing_authority",
        "missing_evidence",
        "offline",
      ].includes(scene.value)
    ) {
      announce(
        ["请先核对当前条件", "Review current conditions first"],
        [scenario.value.help[0], scenario.value.help[1]],
        "error",
      );
      return false;
    }
    return true;
  }
  function canReadTask(task: Task, db = database.value) {
    if (!authenticated.value || task.actor !== actor.value) return false;
    if (task.effect.kind === "accept-invite") return !!profile(db)?.verified;
    if (["tenant", "nominate", "module"].includes(task.effect.kind)) return can("platform", db);
    if (["release", "recovery"].includes(task.effect.kind)) return can("ops", db);
    if (task.tenant !== tenantId.value) return false;
    if (["member", "role", "assignment", "invite", "invite-state"].includes(task.effect.kind))
      return can("access", db);
    if (task.effect.kind === "campaign")
      return (
        can("marketing.read", db) &&
        task.effect.ids.every((id) =>
          db.spaces[task.tenant]?.campaigns.some(
            (x) => x.id === id && readable(x, "marketingRead", db, task.tenant),
          ),
        )
      );
    return (
      can("read", db) &&
      task.effect.ids.every((id) =>
        db.spaces[task.tenant]?.customers.some(
          (x) => x.id === id && readable(x, "read", db, task.tenant),
        ),
      )
    );
  }
  function taskTenantName(task: Task) {
    return canReadTask(task)
      ? database.value.tenants.find((x) => x.id === task.tenant)?.name ||
          l("账号工作区", "Account workspace")
      : "";
  }
  const visibleTasks = computed(() => database.value.tasks.filter((x) => canReadTask(x)));
  const currentTask = computed(() =>
    route.query.record
      ? visibleTasks.value.find((x) => x.id === route.query.record)
      : visibleTasks.value.find((x) => x.status === scene.value) || visibleTasks.value[0],
  );
  const intentSlot = (effect: Effect) =>
    `cs-biz:f-series-full:intent:v5:${actor.value}:${tenantId.value}:${effect.kind}:${effect.ids.join("|")}`;
  function releaseIntent(task: Task) {
    if (task.items.some((x) => ["unknown", "pending"].includes(x.status))) return;
    const slot = task.intentSlot;
    if (sessionStorage.getItem(slot) === task.key) sessionStorage.removeItem(slot);
  }
  function request(title: Text, effect: Effect, permission = "write", inline = false) {
    if (!guard(permission)) return;
    const uncertain = visibleTasks.value.find(
      (x) =>
        x.tenant === tenantId.value &&
        conflictDomain(x.effect.kind) === conflictDomain(effect.kind) &&
        x.items.some((i) => effect.ids.includes(i.id) && ["unknown", "pending"].includes(i.status)),
    );
    if (uncertain) {
      announce(
        ["先查询原操作结果", "Check original outcome first"],
        [
          `${uncertain.id} 尚未确认，不建立第二次操作。`,
          `${uncertain.id} is unresolved; no second action is created.`,
        ],
      );
      if (inline) draft<Record<string, string>>('inline-results', {})[page.value.id] = uncertain.id;
      else go("task", { record: uncertain.id });
      return;
    }
    const slot = intentSlot(effect);
    const key = sessionStorage.getItem(slot) || `intent-${crypto.randomUUID()}`;
    sessionStorage.setItem(slot, key);
    dialog.value = {
      title,
      effect: structuredClone(effect),
      permission,
      context: contextKey.value,
      key,
      slot,
      origin: page.value.id,
      inline,
    };
  }
  function delegationError(
    target: Role | undefined,
    ceilings: Role[] | undefined,
    db = database.value,
    tenant = tenantId.value,
    grantor = actor.value,
  ): string | undefined {
    if (!target || !ceilings?.some((grant) => grant.access))
      return l("角色或委派资格不可用", "Role or delegation authority is unavailable");
    const space = db.spaces[tenant];
    if (
      !delegationAllowed(
        target,
        ceilings,
        [...(space?.customers ?? []), ...(space?.campaigns ?? [])],
        grantor,
      )
    )
      return l("目标角色超出逐动作委派范围", "Target role exceeds per-action delegation scope");
  }
  function currentCeiling(db: ReviewDatabase): Role[] {
    return activeGrants(db).map((grant) => ({
      ...grant,
      access: can("access", db) && grant.access,
    }));
  }
  function proposedRole(effect: Effect, version: number): Role {
    return {
      id: effect.ids[0]!,
      name: effect.values.name || "角色",
      menu: effect.values.menu === "yes",
      access: effect.values.access === "yes",
      version,
      read: (effect.values.read || "none") as Scope,
      update: (effect.values.update || "none") as Scope,
      export: (effect.values.export || "none") as Scope,
      marketingRead: (effect.values.marketingRead || "none") as Scope,
      marketingExecute: (effect.values.marketingExecute || "none") as Scope,
      targets: Object.fromEntries(
        scopeActions.map((action) => [
          action,
          JSON.parse(effect.values[action + "Targets"] || "[]") as string[],
        ]),
      ),
    };
  }
  function validate(d: ReviewData, db: ReviewDatabase, effect: Effect): string | undefined {
    const id = effect.ids[0];
    if (effect.kind === "campaign") {
      const row = d.campaigns.find((x) => x.id === id);
      if (!moduleActive("marketing", db) || !row || !readable(row, "marketingExecute", db))
        return l("活动不可执行", "Campaign is not executable");
      if (row.state !== "draft" || row.version !== Number(effect.values.version))
        return l("活动状态或版本已变化", "Campaign state or version changed");
    }
    if (["customer", "batch", "export"].includes(effect.kind)) {
      const action = effect.kind === "export" ? "export" : "update";
      if (!moduleActive("crm", db)) return l("客户模块已关闭", "Customer module is closed");
      const versions = effect.values.versions
        ? (JSON.parse(effect.values.versions) as Record<string, number>)
        : {};
      for (const target of effect.ids) {
        const row = d.customers.find((x) => x.id === target);
        if (!row || !readable(row, action, db))
          return l(
            "至少一项不在当前动作范围，未产生修改或文件",
            "At least one target is outside current action scope; no change or file was produced",
          );
        if (
          (effect.kind === "customer" && row.version !== Number(effect.values.version)) ||
          (effect.kind === "batch" &&
            versions[target] !== undefined &&
            row.version !== versions[target])
        )
          return l("目标版本已变化，请重新核对", "Target version changed; review again");
      }
    }
    if (effect.kind === "member") {
      const row = d.members.find((x) => x.id === id);
      if (!row || row.version !== Number(effect.values.version))
        return l("成员版本已变化", "Membership version changed");
      const next = effect.values.roles
        ? (JSON.parse(effect.values.roles) as string[])
        : effect.values.role
          ? [effect.values.role]
          : roleIds(row);
      if (
        !next.length ||
        new Set(next).size !== next.length ||
        next.some((value) => !d.roles.some((grant) => grant.id === value))
      )
        return l("目标角色不可用", "Target roles are unavailable");
      if (
        hasRole(row, "owner") &&
        row.state === "active" &&
        ((effect.values.state && effect.values.state !== "active") || !next.includes("owner")) &&
        d.members.filter((x) => hasRole(x, "owner") && x.state === "active").length < 2
      )
        return l("请先指定另一位在任企业负责人", "Assign another active owner first");
      if (
        next.includes("owner") &&
        !hasRole(row, "owner") &&
        (!can("owner", db) || row.state !== "active")
      )
        return l(
          "负责人转交需要当前负责人及在任目标",
          "Ownership transfer requires current owner authority and an active target",
        );
      if (effect.values.roles || effect.values.role)
        for (const roleId of next) {
          const error = delegationError(
            d.roles.find((x) => x.id === roleId),
            currentCeiling(db),
            db,
          );
          if (error) return error;
        }
    }
    if (effect.kind === "assignment") {
      const member = d.members.find((x) => x.id === id && x.state === "active");
      if (!member || member.version !== Number(effect.values.version))
        return l("成员状态已变化", "Membership changed");
      const changed = [
        ...JSON.parse(effect.values.add || "[]"),
        ...JSON.parse(effect.values.remove || "[]"),
      ] as string[];
      const versions = JSON.parse(effect.values.versions || "{}") as Record<string, number>;
      for (const resource of changed) {
        const row = [...d.customers, ...d.campaigns].find((x) => x.id === resource);
        if (
          !row ||
          row.version !== versions[resource] ||
          !readable(row, resource.startsWith("M-") ? "marketingExecute" : "update", db)
        )
          return l(
            "指派对象超出当前修改范围或版本已变化",
            "Assigned target is outside current update scope or its version changed",
          );
      }
    }
    if (effect.kind === "role") {
      const row = d.roles.find((x) => x.id === id);
      if (row && row.version !== Number(effect.values.version))
        return l("角色版本已变化", "Role version changed");
      const proposed = proposedRole(effect, (row?.version || 0) + 1);
      if (
        scopeActions.some(
          (action) =>
            !["none", "self", "assigned", "explicit", "tenant"].includes(proposed[action]),
        )
      )
        return l(
          "未知权限或旧分组含义未确认，不能授予",
          "Unknown permissions or unconfirmed legacy scopes cannot be granted",
        );
      if (delegationError(proposed, currentCeiling(db), db))
        return l(
          "不能授予超出该动作当前范围的权限",
          "Cannot delegate a wider scope for this action",
        );
      if (id === "owner" && effect.values.access !== "yes")
        return l(
          "企业负责人必须保留成员管理与转交能力",
          "Owners must retain membership management and ownership transfer authority",
        );
      if (effect.values.access === "yes" && !can("access", db))
        return l("无权委派管理权限", "Cannot delegate management");
    }
    if (effect.kind === "tenant") {
      if (
        !/^[a-z][a-z0-9-]{2,31}$/.test(effect.values.code || "") ||
        !(effect.values.name || "").trim() ||
        !/^[^@\s]+@example\.test$/.test(effect.values.owner || "")
      )
        return l(
          "核对企业名称、唯一标识与负责人测试账号",
          "Review organization name, unique code, and controlled owner account",
        );
      if (db.tenants.some((x) => x.code === effect.values.code))
        return l("企业标识已存在", "Organization code already exists");
    }
    if (effect.kind === "nominate") {
      const tenant = db.tenants.find((x) => x.id === id);
      const space = db.spaces[id || ""];
      if (
        !tenant ||
        !space ||
        tenant.state !== "pending_owner" ||
        tenant.version !== Number(effect.values.version) ||
        space.members.some((x) => hasRole(x, "owner") && x.state === "active") ||
        db.invites.some(
          (x) =>
            x.tenantId === id &&
            x.role === "owner" &&
            x.state === "created" &&
            Date.parse(x.expiresAt) > Date.now(),
        ) ||
        !/^[^@\s]+@example\.test$/.test(effect.values.owner || "")
      )
        return l(
          "首次负责人指定条件或版本已变化，请重新核对",
          "Initial owner nomination conditions or version changed; review again",
        );
    }
    if (effect.kind === "module") {
      const tenant = db.tenants.find((x) => x.id === effect.values.tenant);
      if (
        !tenant ||
        tenant.version !== Number(effect.values.version) ||
        !effect.ids.every((x) => ["crm", "marketing"].includes(x))
      )
        return l("目标、模块或版本不可用", "Target, module, or version unavailable");
      if (
        !effect.values.quota ||
        (effect.values.quota !== "unlimited" && !/^[1-9][0-9]*$/.test(effect.values.quota)) ||
        (effect.values.expiresAt && Number.isNaN(Date.parse(effect.values.expiresAt)))
      )
        return l(
          "请明确期限与额度，不默认价格或扣费",
          "Specify validity and quota without assuming price or charges",
        );
    }
    if (effect.kind === "invite") {
      const error = delegationError(
        d.roles.find((x) => x.id === effect.values.role),
        currentCeiling(db),
      );
      if (error) return error;
      if (effect.values.role === "owner")
        return l(
          "负责人须由在任成员的转交流程指定",
          "Assign ownership through transfer to an active member",
        );
      for (const email of effect.ids)
        if (
          !/^[^@\s]+@example\.test$/.test(email) ||
          d.members.some(
            (x) =>
              x.email === email &&
              x.state !== "removed" &&
              (x.state !== "invited" ||
                db.invites.some(
                  (i) =>
                    i.membershipId === x.id &&
                    i.state === "created" &&
                    Date.parse(i.expiresAt) > Date.now(),
                )),
          ) ||
          db.invites.some(
            (x) =>
              x.tenantId === tenantId.value &&
              x.email === email &&
              x.state === "created" &&
              Date.parse(x.expiresAt) > Date.now(),
          )
        )
          return l(
            "地址已有成员或有效邀请，或不在受控投递范围",
            "Address is a member, already invited, or outside controlled delivery",
          );
    }
    if (effect.kind === "invite-state") {
      const invitation = db.invites.find((x) => x.id === id && x.tenantId === tenantId.value);
      if (
        !invitation ||
        invitation.version !== Number(effect.values.version) ||
        invitation.state !== "created"
      )
        return l("邀请状态已变化", "Invitation state changed");
    }
    if (effect.kind === "accept-invite") {
      const invitation = db.invites.find((x) => x.id === id);
      const account = profile(db);
      if (
        !invitation ||
        !account?.verified ||
        account.email.toLowerCase() !== invitation.email.toLowerCase() ||
        invitation.state !== "created" ||
        Date.parse(invitation.expiresAt) <= Date.now()
      )
        return l(
          "邀请或受邀账号不再有效，不能接受",
          "Invitation or invited account is no longer valid",
        );
      const space = db.spaces[invitation.tenantId];
      const member = space?.members.find((x) => x.id === invitation.membershipId);
      const granted = space?.roles.find((x) => x.id === invitation.role);
      if (!space || !member || member.state !== "invited" || member.role !== invitation.role)
        return l(
          "待加入成员状态已变化，请联系管理员",
          "Pending membership changed; contact an administrator",
        );
      if (
        !granted ||
        granted.version !== invitation.roleVersion ||
        delegationError(
          granted,
          invitation.ceiling,
          db,
          invitation.tenantId,
          invitation.delegatorId,
        )
      )
        return l(
          "邀请权限已变化，请由管理员重新核对并邀请",
          "Invitation permissions changed; an administrator must review and reissue it",
        );
      if (invitation.authority === "platform_nomination") {
        if (
          !db.accounts
            .find((x) => x.id === invitation.delegatorId)
            ?.systemRoles.includes("platform") ||
          db.tenants.find((x) => x.id === invitation.tenantId)?.state !== "pending_owner" ||
          invitation.role !== "owner" ||
          space.members.some((x) => hasRole(x, "owner") && x.state === "active")
        )
          return l("首次负责人指定条件已变化", "Initial owner nomination conditions changed");
      } else {
        const delegator = space.members.find(
          (x) => x.accountId === invitation.delegatorId && x.state === "active",
        );
        const ceiling = grantsFor(delegator, space.roles);
        if (delegationError(granted, ceiling, db, invitation.tenantId, invitation.delegatorId))
          return l(
            "邀请人的当前委派资格已变化，请重新核对",
            "Inviter delegation authority changed; review again",
          );
      }
      if (
        db.spaces[invitation.tenantId]?.members.some(
          (x) => x.accountId === account.id && x.state === "active",
        )
      )
        return l(
          "此账号已经加入目标企业，不重复建立成员关系",
          "This account is already a member; no duplicate membership is created",
        );
      if (invitation.acceptedBy && invitation.acceptedBy !== `${account.issuer}|${account.subject}`)
        return l("邀请已绑定其他身份", "Invitation is bound to another identity");
    }
    if (
      ["release", "recovery"].includes(effect.kind) &&
      (!effect.values.target || !effect.values.version || !effect.values.confirmation)
    )
      return l("请核对目标、版本与影响确认", "Review target, version, and effects");
  }
  function createInvite(
    db: ReviewDatabase,
    target: string,
    email: string,
    assigned: string,
    sequence: number,
    index: number,
    nomination = false,
  ) {
    for (const previous of db.invites.filter(
      (x) =>
        x.tenantId === target &&
        x.email === email &&
        x.state === "created" &&
        Date.parse(x.expiresAt) <= Date.now(),
    )) {
      previous.state = "expired";
      previous.version++;
      const pending = db.spaces[target]?.members.find(
        (x) => x.id === previous.membershipId && x.state === "invited",
      );
      if (pending) {
        pending.state = "removed";
        pending.version++;
      }
    }
    const id = `INV-${crypto.randomUUID()}`;
    const membershipId = `invited-${sequence}-${index}`;
    const space = db.spaces[target];
    if (!space) return;
    space.members.push({
      id: membershipId,
      accountId: "",
      name: email.split("@")[0] || "",
      email,
      role: assigned,
      roles: [assigned],
      state: "invited",
      version: 1,
    });
    db.invites.push({
      id,
      tenantId: target,
      membershipId,
      email,
      role: assigned,
      delegatorId: actor.value,
      authority: nomination ? "platform_nomination" : "tenant_delegation",
      roleVersion: space.roles.find((x) => x.id === assigned)?.version || 0,
      ceiling: structuredClone(
        nomination ? [space.roles.find((x) => x.id === "owner")!] : currentCeiling(db),
      ),
      state: "created",
      delivery: "pending",
      version: 1,
      expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
    });
  }
  function applyItem(
    d: ReviewData,
    db: ReviewDatabase,
    effect: Effect,
    id: string,
    sequence: number,
    index: number,
  ) {
    if (effect.kind === "campaign") {
      const x = d.campaigns.find((r) => r.id === id);
      if (x) {
        x.state = "active";
        x.version++;
      }
    }
    if (["customer", "batch"].includes(effect.kind)) {
      const x = d.customers.find((r) => r.id === id);
      if (x) {
        x.note = effect.values.note || x.note;
        x.version++;
      }
    }
    if (effect.kind === "member") {
      const x = d.members.find((r) => r.id === id);
      if (x) {
        if (effect.values.state) x.state = effect.values.state as typeof x.state;
        if (effect.values.roles || effect.values.role) {
          x.roles = effect.values.roles
            ? (JSON.parse(effect.values.roles) as string[])
            : [effect.values.role!];
          x.role = x.roles.includes("owner") ? "owner" : x.roles[0]!;
        }
        x.version++;
      }
    }
    if (effect.kind === "assignment") {
      const member = d.members.find((x) => x.id === id);
      if (member) {
        const add = JSON.parse(effect.values.add || "[]") as string[];
        const remove = JSON.parse(effect.values.remove || "[]") as string[];
        for (const row of [...d.customers, ...d.campaigns])
          if (add.includes(row.id) || remove.includes(row.id)) {
            row.assignedTo = [
              ...new Set([
                ...(row.assignedTo || []).filter((account) => account !== member.accountId),
                ...(add.includes(row.id) ? [member.accountId] : []),
              ]),
            ];
            row.version++;
          }
        member.version++;
      }
    }
    if (effect.kind === "role") {
      const x = d.roles.find((r) => r.id === id);
      const value = proposedRole(effect, (x?.version || 0) + 1);
      if (x) Object.assign(x, value);
      else d.roles.push(value);
    }
    if (effect.kind === "invite")
      createInvite(db, tenantId.value, id, effect.values.role || "reader", sequence, index);
    if (effect.kind === "invite-state") {
      const x = db.invites.find((r) => r.id === id);
      if (x) {
        x.state = effect.values.state as typeof x.state;
        x.version++;
        const member = db.spaces[x.tenantId]?.members.find((r) => r.id === x.membershipId);
        if (member && member.state === "invited") {
          member.state = "removed";
          member.version++;
        }
      }
    }
    if (effect.kind === "tenant") {
      const newId = `tenant-${effect.values.code}`;
      db.tenants.push({
        id: newId,
        name: effect.values.name || "",
        code: effect.values.code || "",
        owner: effect.values.owner || "",
        state: "pending_owner",
        modules: [],
        moduleConfig: {},
        version: 1,
      });
      db.spaces[newId] = emptySpace();
      createInvite(db, newId, effect.values.owner || "", "owner", sequence, index, true);
    }
    if (effect.kind === "nominate") {
      const tenant = db.tenants.find((x) => x.id === id);
      if (!tenant) return;
      for (const previous of db.invites.filter(
        (x) => x.tenantId === id && x.role === "owner" && x.state !== "accepted",
      )) {
        if (previous.state === "created") previous.state = "expired";
        previous.version++;
        const member = db.spaces[id]?.members.find(
          (x) => x.id === previous.membershipId && x.state === "invited",
        );
        if (member) {
          member.state = "removed";
          member.version++;
        }
      }
      tenant.owner = effect.values.owner || "";
      tenant.version++;
      createInvite(db, id, tenant.owner, "owner", sequence, index, true);
    }
    if (effect.kind === "module") {
      const x = db.tenants.find((r) => r.id === effect.values.tenant);
      if (x) {
        if (effect.values.state === "disabled") x.modules = x.modules.filter((m) => m !== id);
        else {
          x.modules = [...new Set([...x.modules, id])];
          x.moduleConfig[id] = {
            expiresAt: effect.values.expiresAt || "",
            quota: effect.values.quota || "",
          };
        }
        x.version++;
      }
    }
    if (effect.kind === "accept-invite") {
      const invitation = db.invites.find((r) => r.id === id);
      const account = profile(db);
      if (!invitation || !account) return;
      invitation.state = "accepted";
      invitation.acceptedBy = `${account.issuer}|${account.subject}`;
      invitation.version++;
      const space = db.spaces[invitation.tenantId];
      const member = space?.members.find((r) => r.id === invitation.membershipId);
      if (member)
        Object.assign(member, {
          accountId: account.id,
          name: account.name,
          email: account.email,
          role: invitation.role,
          roles: [invitation.role],
          state: "active",
          version: member.version + 1,
        });
      const target = db.tenants.find((r) => r.id === invitation.tenantId);
      if (target && invitation.role === "owner") {
        target.state = "active";
        target.version++;
      }
    }
  }
  async function transaction(action: (data: ReviewData, db: ReviewDatabase) => void) {
    const context = contextKey.value;
    if (!navigator.locks) {
      storageFailed.value = true;
      return;
    }
    try {
      await navigator.locks.request(databaseKey, () => {
        if (context !== contextKey.value || !authenticated.value) return;
        const raw = localStorage.getItem(databaseKey);
        const next = raw ? (JSON.parse(raw) as ReviewDatabase) : fresh();
        action(view(next, true), next);
        if (context !== contextKey.value) return;
        next.revision++;
        localStorage.setItem(databaseKey, JSON.stringify(next));
        database.value = next;
      });
      syncOrganizations();
    } catch {
      storageFailed.value = true;
      announce(
        ["审阅记录未能保存", "Review record could not be saved"],
        [
          "保留输入，存储恢复前暂停写入。",
          "Keep input; writes are paused until storage is available.",
        ],
        "error",
      );
    }
  }
  async function confirm() {
    const command = dialog.value;
    if (
      !command ||
      busy.value ||
      command.context !== contextKey.value ||
      !guard(command.permission)
    )
      return;
    busy.value = true;
    try {
      let saved: Task | undefined;
      await transaction((d, db) => {
        if (!can(command.permission, db) || command.context !== contextKey.value) return;
        const digest = JSON.stringify(command.effect);
        const previous = db.tasks.find((x) => x.key === command.key);
        if (previous) {
          if (previous.digest !== digest)
            announce(
              ["请求编号冲突", "Request reference conflict"],
              [
                "相同编号不能用于不同内容，原记录不变。",
                "A reference cannot be reused with different content; the original is unchanged.",
              ],
              "error",
            );
          else saved = previous;
          return;
        }
        const unresolved = db.tasks.find(task => task.tenant === tenantId.value &&
          conflictDomain(task.effect.kind) === conflictDomain(command.effect.kind) &&
          task.items.some(item => command.effect.ids.includes(item.id) && ['unknown', 'pending'].includes(item.status)));
        if (unresolved) {
          announce(['先查询原操作结果', 'Check original outcome first'],
            ['同一对象存在未决变更，不建立第二次写入。', 'An overlapping change is unresolved; no second write is created.']);
          if (canReadTask(unresolved, db)) saved = unresolved;
          return;
        }
        const error = validate(d, db, command.effect);
        if (error) {
          announce(["变更未执行", "Change was not applied"], [error, error], "error");
          return;
        }
        const result: Outcome = ["unknown", "timeout"].includes(scene.value)
          ? "unknown"
          : scene.value === "pending"
            ? "pending"
            : scene.value === "failed"
              ? "failed"
              : scene.value === "partial" &&
                  command.effect.ids.length > 1 &&
                  ["invite", "batch", "export"].includes(command.effect.kind)
                ? "partial"
                : "succeeded";
        const sequence = db.revision + 1;
        const id = `ACT-${sequence}-${crypto.randomUUID().slice(0, 6)}`;
        const items = command.effect.ids.map((target, index) => ({
          id: target,
          label: target,
          committedStatus: (result === "failed" ||
          (result === "partial" && index % 3 === 1) ||
          (["unknown", "pending"].includes(result) && readback.value === "failed")
            ? "failed"
            : "succeeded") as "succeeded" | "failed",
          status:
            result === "partial"
              ? ((index % 3 === 0
                  ? "succeeded"
                  : index % 3 === 1
                    ? "failed"
                    : "unknown") as Outcome)
              : result,
          reason:
            result === "partial" && index % 3 === 1
              ? l("处理时记录已变化", "Record changed during processing")
              : "",
        }));
        const target =
          command.effect.kind === "accept-invite"
            ? db.invites.find((x) => x.id === command.effect.ids[0])?.tenantId || ""
            : command.effect.kind === "module"
              ? command.effect.values.tenant || ""
              : command.effect.kind === "nominate"
                ? command.effect.ids[0] || ""
                : command.effect.kind === "tenant"
                  ? `tenant-${command.effect.values.code}`
                  : tenantId.value;
        const task: Task = {
          id,
          title: command.title[0],
          titleEn: command.title[1],
          tenant: target,
          actor: actor.value,
          origin: command.origin,
          key: command.key,
          intentSlot: command.slot,
          digest,
          status: result,
          effect: command.effect,
          items,
          trace: `trace-review-${sequence}`,
          sequence,
          downloadExpired: false,
        };
        for (const [index, item] of items.entries())
          if (item.committedStatus === "succeeded")
            applyItem(d, db, command.effect, item.id, sequence, index);
        db.tasks.unshift(task);
        db.audits.unshift({
          id: `AUD-${sequence}`,
          tenant: target,
          action: command.effect.kind,
          object:
            command.effect.kind === "invite"
              ? db.invites
                  .filter((x) => x.membershipId.startsWith(`invited-${sequence}-`))
                  .map((x) => x.id)
                  .join(", ")
              : command.effect.ids.join(", "),
          actor: profile(db)?.name || "",
          result,
          task: id,
        });
        saved = task;
      });
      if (saved) {
        releaseIntent(saved);
        dialog.value = null;
        selected.value = [];
        if (command.inline || taskMode.value)
          draft<Record<string, string>>('inline-results', {})[page.value.id] = saved.id;
        else go("task", { record: saved.id });
      }
    } finally {
      busy.value = false;
    }
  }
  async function queryTask(id: string, itemId?: string) {
    const task = database.value.tasks.find((x) => x.id === id);
    if (
      !task ||
      !canReadTask(task) ||
      readback.value === "denied" ||
      blocked.value ||
      scene.value === "offline"
    ) {
      announce(
        ["暂时无法查询原记录", "Cannot query the original record"],
        [
          "核对当前身份、企业与读取范围。不会重新执行操作。",
          "Check current identity, organization, and read scope. The action is not resubmitted.",
        ],
        "error",
      );
      return;
    }
    if (!task.items.some((x) => ["unknown", "pending"].includes(x.status))) {
      announce(
        ["原结果已确认", "Original outcome is confirmed"],
        [
          "终态保留，不会重写或重复执行。",
          "The terminal result is retained without rewriting or re-execution.",
        ],
        "success",
      );
      return;
    }
    if (readback.value === "unknown") {
      announce(
        ["结果仍待确认", "Outcome remains unknown"],
        [
          "保留原编号稍后查询，或交给获准人员核对。",
          "Keep the reference and query later or ask authorized staff.",
        ],
      );
      return;
    }
    let updated: Task | undefined;
    await transaction((_d, db) => {
      const current = db.tasks.find((x) => x.id === id);
      if (!current || !canReadTask(current, db)) return;
      for (const item of current.items) {
        if ((itemId && item.id !== itemId) || !["unknown", "pending"].includes(item.status))
          continue;
        item.status = item.committedStatus;
      }
      current.status = current.items.some((x) => ["unknown", "pending"].includes(x.status))
        ? "unknown"
        : current.items.every((x) => x.status === "succeeded")
          ? "succeeded"
          : current.items.every((x) => x.status === "failed")
            ? "failed"
            : "partial";
      updated = current;
    });
    if (updated) releaseIntent(updated);
  }

  const hasConsoleMenu = computed(
    () =>
      active.value &&
      ["owner", "manager", "reader"].includes(role.value) &&
      activeGrants().some((grant) => grant.menu),
  );
  const race = ref<{ context: string; target: string; name: string; version: number } | null>(null);
  const lateRead = ref("");
  function deferRead() {
    const row = data.value.customers[0];
    if (row) {
      race.value = {
        context: contextKey.value,
        target: row.id,
        name: row.name,
        version: row.version,
      };
      lateRead.value = "";
      announce(
        ["已挂起读取响应", "Read response held"],
        [
          "可先切换企业或改变范围，再交付旧响应核对隔离。",
          "Switch organization or change scope, then deliver the old response to inspect isolation.",
        ],
      );
    }
  }
  function deliverRead() {
    const pending = race.value;
    const row = database.value.spaces[tenantId.value]?.customers.find(
      (x) => x.id === pending?.target,
    );
    if (!pending) return;
    if (
      pending.context !== contextKey.value ||
      !can("read") ||
      !row ||
      row.version !== pending.version ||
      !readable(row, "read")
    ) {
      lateRead.value = "";
      announce(
        ["旧响应已丢弃", "Stale response discarded"],
        [
          "当前企业、权限和记录保持不变。",
          "The current organization, access, and records are unchanged.",
        ],
        "success",
      );
    } else {
      lateRead.value = pending.name;
      announce(["读取结果已核对", "Read result checked"], [pending.name, pending.name], "success");
    }
    race.value = null;
  }
  async function changeAssignment() {
    const task = currentTask.value;
    const target = String(route.query.target || task?.effect.ids[0] || "C-1001");
    await transaction((d) => {
      const row = d.customers.find((x) => x.id === target);
      if (row) {
        row.owner = "account-lin";
        row.version++;
      }
    });
  }
  const incomingInvitation = computed(() => {
    const id = String(route.query.invite || "");
    const match = id ? database.value.invites.find((x) => x.id === id) : database.value.invites[0];
    if (!match) return undefined;
    return {
      ...match,
      email:
        authenticated.value && profile()?.email === match.email
          ? match.email
          : match.email.replace(/^(.).+(@.*)$/, "$1***$2"),
      targetName: database.value.tenants.find((x) => x.id === match.tenantId)?.name || "",
    };
  });
  function openInvitation(id: string) {
    go("invitation-accept", { invite: id });
  }
  function chooseOrganization(name: string) {
    legacy.chooseOrganization(name);
    const current = membership();
    const grants = assignedRoles();
    role.value =
      current?.state === "active" && hasRole(current, "owner")
        ? "owner"
        : grants.some((grant) => grant.access || grant.menu)
          ? "manager"
          : grants.some((grant) => grant.update !== "none" || grant.marketingExecute !== "none")
            ? "operator"
            : "reader";
  }
  async function selectAccount(id: string, preserveInvitation = false) {
    const account = database.value.accounts.find((x) => x.id === id);
    if (!account) return;
    legacy.setReviewIdentity(account);
    role.value = "reader";
    syncOrganizations();
    // A new account explicitly selects its organization; incoming verification
    // stays on the invitation until acceptance establishes membership.
    if (!preserveInvitation) go("organizations");
  }
  async function verifyInvitedAccount() {
    const raw = database.value.invites.find((x) => x.id === incomingInvitation.value?.id);
    if (!raw || raw.state !== "created" || Date.parse(raw.expiresAt) <= Date.now()) return;
    if (!authenticated.value) legacy.beginSignIn();
    let account = profile();
    if (account?.email !== raw.email) account = undefined;
    if (!account) {
      await transaction((_d, db) => {
        account = {
          id: `account-${crypto.randomUUID()}`,
          name: raw.email.split("@")[0] || "受邀成员",
          email: raw.email,
          initials: "邀",
          title: "受邀成员",
          issuer: "https://identity.review.invalid",
          subject: crypto.randomUUID(),
          verified: true,
          systemRoles: [],
        };
        db.accounts.push(account);
      });
    }
    if (account) await selectAccount(account.id, true);
  }
  function continueInvitation(task: Task) {
    const target = database.value.tenants.find((x) => x.id === task.tenant);
    const member = membership(database.value, task.tenant);
    if (!target || member?.state !== "active") return;
    syncOrganizations();
    chooseOrganization(target.name);
    go("modules");
  }
  function acceptInvitation() {
    const invitation = incomingInvitation.value;
    if (
      !invitation ||
      ["expired", "withdrawn", "used", "identity_mismatch", "suspended"].includes(scene.value)
    )
      return;
    request(
      ["接受企业邀请", "Accept organization invitation"],
      {
        kind: "accept-invite",
        ids: [invitation.id],
        values: { name: invitation.targetName, role: invitation.role },
      },
      "account",
    );
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      announce(["编号已复制", "Reference copied"], [value, value], "success");
    } catch {
      announce(["请手动复制编号", "Copy the reference manually"], [value, value]);
    }
  }
  async function reset() {
    dialog.value = null;
    localStorage.removeItem(databaseKey);
    database.value = fresh();
    localStorage.setItem(databaseKey, JSON.stringify(database.value));
    storageFailed.value = false;
    legacy.setReviewIdentity(base);
    role.value = "owner";
    syncOrganizations();
    enter();
    sessionStorage.removeItem(draftKey.value);
    loadDrafts();
  }
  async function download(task: Task) {
    let file: string | undefined;
    await transaction((d, db) => {
      const original = db.tasks.find((x) => x.id === task.id);
      if (
        !original ||
        !canReadTask(original, db) ||
        !can("export", db) ||
        blocked.value ||
        scene.value === "expired" ||
        original.downloadExpired
      ) {
        announce(
          ["当前不能下载", "Download is not available"],
          [
            "重新核对当前权限与文件有效期，不沿用旧链接。",
            "Recheck current access and validity; old links are not reused.",
          ],
          "error",
        );
        return;
      }
      const ids = original.items.filter((x) => x.status === "succeeded").map((x) => x.id);
      const rows = d.customers.filter((x) => ids.includes(x.id) && readable(x, "export", db));
      if (!ids.length || rows.length !== ids.length) {
        announce(
          ["导出范围已变化或文件未就绪", "Export scope changed or file is not ready"],
          [
            "请重新核对原记录和当前范围，不提供旧文件。",
            "Review the original record and current scope; the old file is not provided.",
          ],
          "error",
        );
        return;
      }
      file = [
        "ID,Name,Assignment",
        ...rows.map((x) =>
          [x.id, `"${x.name.replaceAll('"', '""')}"`, owns(x.owner) ? "self" : "assigned"].join(
            ",",
          ),
        ),
      ].join("\n");
    });
    if (file !== undefined) {
      const url = URL.createObjectURL(
        new Blob(["\ufeff" + file], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `review-customers-${task.id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      announce(
        ["审阅文件已生成", "Review file generated"],
        [
          "仅包含本次已完成且当前有导出权限的集合。",
          "Contains only completed targets currently within export scope.",
        ],
        "success",
      );
    }
  }
  async function requestInline(title: Text, effect: Effect, permission = 'write') {
    const previous = dialog.value;
    request(title, effect, permission, true);
    if (dialog.value && dialog.value !== previous && dialog.value.inline) await confirm();
  }
  function failedEffect(task: Task): Effect | undefined {
    if (!['batch', 'invite'].includes(task.effect.kind) || !canReadTask(task)) return;
    const ids = task.items.filter(item => item.status === 'failed').map(item => item.id);
    if (!ids.length) return;
    const values = { ...task.effect.values };
    if (task.effect.kind === 'batch') values.versions = JSON.stringify(Object.fromEntries(
      data.value.customers.filter(row => ids.includes(row.id)).map(row => [row.id, row.version]),
    ));
    return { ...task.effect, ids, values };
  }
  return {
    legacy,
    role,
    effectiveRole,
    page,
    scenario,
    scene,
    taskMode,
    query: computed(() => route.query),
    authenticated,
    active,
    data,
    drafts,
    notice,
    dialog,
    busy,
    storageFailed,
    selected,
    readback,
    supportReference,
    contextKey,
    allowed,
    blocked,
    pagePermission,
    taskTenantName,
    visibleTasks,
    currentTask,
    incomingInvitation,
    accounts: computed(() => database.value.accounts),
    draft,
    go,
    setScene,
    enter,
    selectRole,
    selectAccount,
    chooseOrganization,
    verifyInvitedAccount,
    acceptInvitation,
    openInvitation,
    continueInvitation,
    hasConsoleMenu,
    race,
    lateRead,
    deferRead,
    deliverRead,
    changeAssignment,
    can,
    owns,
    readable,
    roleIds,
    memberAccess: (member: Member, resource: Resource, action: ScopeAction) =>
      moduleActive(action.startsWith("marketing") ? "marketing" : "crm") &&
      permits(
        grantsFor(member, database.value.spaces[tenantId.value]?.roles ?? []),
        action,
        resource,
        member.accountId,
      ),
    hasRole,
    scope,
    moduleActive,
    request,
    requestInline,
    failedEffect,
    inlineResult: computed(() => {
      const id = draft<Record<string, string>>('inline-results', {})[page.value.id];
      return visibleTasks.value.find(task => task.id === id);
    }),
    confirm,
    queryTask,
    copy,
    reset,
    download,
    announce,
  };
}
let shared: ReturnType<typeof reactive<ReturnType<typeof createState>>> | undefined;
export function useFullReviewState() {
  return (shared ??= reactive(createState()));
}
