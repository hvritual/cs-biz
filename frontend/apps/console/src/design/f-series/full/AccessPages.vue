<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElInput,
  ElOption,
  ElSelect,
  ElTag,
} from "element-plus";
import { l, roleTitle, statusTitle } from "./copy";
import { useFullReviewState } from "./state";
import BulkPicker from './BulkPicker.vue';
import inviteTemplate from './assets/invitations.xlsx?url';
import targetTemplate from './assets/targets.xlsx?url';
import { parseRoleTable, roleTableExample, roleTableExampleEn } from './role-table';
const s = useFullReviewState();
const validation = ref("");
const quickInviteIds = computed({ get: () => s.draft('r004-invite-selection-' + s.contextKey, { ids: [] as string[] }).ids, set: ids => { s.draft('r004-invite-selection-' + s.contextKey, { ids: [] as string[] }).ids = ids; } });
const quickInviteReady = ref(false); const assignmentReady = ref(false);
const roleTable = ref(''); const roleTableError = ref(''); const memberRoleText = ref('');
const quickInviteRecords = computed(() => ['a','b','c','d','e','f'].map(letter => {
  const email = `new-${letter}@example.test`;
  return { id: email, name: l('待邀候选', 'Invitation candidate') + ' ' + letter.toUpperCase(), eligible: !s.data.members.some(member => member.email === email && member.state !== 'removed') && !s.data.invites.some(invite => invite.email === email && invite.state === 'created' && Date.parse(invite.expiresAt) > Date.now()) };
}));
const quickAssignmentRecords = computed(() => assignmentResources.value.map(row => ({ id: row.id, name: row.name, eligible: s.readable(row, row.id.startsWith('M-') ? 'marketingExecute' : 'update') })));
async function submitQuickInvites() {
  if (!quickInviteReady.value) return;
  await s.requestInline(['创建选定成员邀请', 'Create selected invitations'], { kind: 'invite', ids: [...quickInviteIds.value], values: { role: invite.value.role } }, 'access');
}
function applyRoleTable(value: string) {
  roleTable.value = value;
  try { Object.assign(roleForm.value, parseRoleTable(value)); roleTableError.value = ''; }
  catch (error) { roleTableError.value = l(error instanceof Error ? error.message : '请核对角色配置表。', 'Use the complete 13-column table, one role row, Allowed/Not allowed and the scope names in the example. Only Explicit targets accepts reference lists; formulas and legacy scopes are rejected.'); }
}
function applyMemberRoles(value: string) {
  memberRoleText.value = value;
  const names = [...new Set(value.split(/[\n,;|]/).map(v => v.trim()).filter(Boolean))];
  const matched = names.map(name => s.data.roles.find(role => role.name === name || role.id === name));
  validation.value = matched.some(role => !role) ? l('存在无法匹配的角色，请使用下方实际角色名称。', 'Some roles cannot be matched. Use the role names shown below.') : '';
  memberRole.value = matched.filter((role): role is NonNullable<typeof role> => !!role).map(role => role.id);
}
const detail = ref("");
const memberRole = ref<string[]>(["reader"]);
const memberAssignments = ref<string[]>([]);
const memberVersion = ref(0); const resourceVersions = ref<Record<string, number>>({});
watch(
  () => [s.contextKey, s.page.id, s.query.target],
  () => {
    detail.value = "";
    memberRole.value = [];
    memberAssignments.value = [];
    validation.value = "";
    roleTable.value = ''; roleTableError.value = ''; memberRoleText.value = '';
  },
);
watch(detail, () => { memberRoleText.value = ''; validation.value = ''; });
const filters = computed(() => s.draft("member-filter", { text: "", state: "all" }));
const invite = computed(() =>
  s.draft("invite-create", {
    text: "new-a@example.test\nnew-b@example.test\nNEW-A@example.test\ninvalid\nlin@example.test\nnew-c@example.test",
    role: "reader",
    parsed: false,
    excluded: [] as string[],
  }),
);
const members = computed(() =>
  s.scene === "empty"
    ? []
    : s.data.members.filter(
        (x) =>
          (x.name + x.email).toLowerCase().includes(filters.value.text.toLowerCase()) &&
          (filters.value.state === "all" || filters.value.state === x.state),
      ),
);
const assignmentResources = computed(() => [...s.data.customers, ...s.data.campaigns]);
const focused = computed(() => s.data.members.find((x) => x.id === detail.value));
const assignmentChanged = computed(() => !!focused.value && (focused.value.version !== memberVersion.value || assignmentResources.value.some(row => resourceVersions.value[row.id] !== row.version)));
function reviewMemberVersions() {
  memberVersion.value = focused.value?.version || 0;
  resourceVersions.value = Object.fromEntries(assignmentResources.value.map(row => [row.id, row.version]));
}
function openMember(id: string) {
  const member = s.data.members.find(row => row.id === id); if (!member) return;
  detail.value = id; memberRole.value = [...s.roleIds(member)];
  memberAssignments.value = assignmentResources.value.filter(row => row.assignedTo?.includes(member.accountId)).map(row => row.id);
  reviewMemberVersions();
}
const inviteRows = computed(() => (s.scene === "empty" ? [] : s.data.invites));
const roleRows = computed(() => (s.scene === "empty" ? [] : s.data.roles));
const targetRole = computed(() => s.data.roles.find((x) => x.id === s.query.target));
const roleForm = computed(() =>
  s.draft(`role-${s.query.target || "new"}`, {
    name: targetRole.value?.name || "",
    menu: targetRole.value?.menu || false,
    read: targetRole.value?.read || "tenant",
    update: targetRole.value?.update || "none",
    export: targetRole.value?.export || "none",
    marketingRead: targetRole.value?.marketingRead || "none",
    marketingExecute: targetRole.value?.marketingExecute || "none",
    access: targetRole.value?.access || false,
    targets: JSON.parse(JSON.stringify(targetRole.value?.targets || {})) as Partial<
      Record<"read" | "update" | "export" | "marketingRead" | "marketingExecute", string[]>
    >,
    version: targetRole.value?.version || 0,
  }),
);
const analyzed = computed(() => {
  const seen = new Set<string>();
  const rows: { email: string; state: string }[] = [];
  for (const original of invite.value.text
    .split(/[\n,;]/)
    .map((x) => x.trim())
    .filter(Boolean)) {
    const email = original.toLowerCase();
    let state = "ready";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) state = "invalid";
    else if (seen.has(email)) state = "duplicate";
    else if (!email.endsWith("@example.test")) state = "unavailable";
    else if (
      s.data.members.some(
        (x) =>
          x.email === email &&
          x.state !== "removed" &&
          (x.state !== "invited" ||
            s.data.invites.some(
              (i) =>
                i.membershipId === x.id &&
                i.state === "created" &&
                Date.parse(i.expiresAt) > Date.now(),
            )),
      )
    )
      state = "member";
    else if (
      s.data.invites.some(
        (x) => x.email === email && x.state === "created" && Date.parse(x.expiresAt) > Date.now(),
      )
    )
      state = "invited";
    else if (s.scene === "ambiguous" && rows.filter((x) => x.state === "ambiguous").length === 0)
      state = "ambiguous";
    seen.add(email);
    rows.push({ email, state });
  }
  return rows;
});
const inviteSelected = computed(() =>
  analyzed.value
    .filter((x) => x.state === "ready" && !invite.value.excluded.includes(x.email))
    .map((x) => x.email),
);
const activeOwners = computed(
  () => s.data.members.filter((x) => s.hasRole(x, "owner") && x.state === "active").length,
);
function changeMember(id: string, state?: string, role?: string | string[]) {
  const row = s.data.members.find((x) => x.id === id);
  if (!row) return;
  (s.taskMode && role ? s.requestInline : s.request)(
    [
      role ? `调整 ${row.name} 的角色` : `调整 ${row.name} 的成员状态`,
      role ? `Change ${row.name}'s role` : `Change ${row.name}'s membership`,
    ],
    {
      kind: "member",
      ids: [id],
      values: {
        ...(state ? { state } : {}),
        ...(role ? { roles: JSON.stringify(Array.isArray(role) ? role : [role]) } : {}),
        version: String(s.taskMode && role && detail.value === id ? memberVersion.value : row.version),
      },
    },
    "access",
  );
}
function roleName(id: string) {
  return s.data.roles.find((role) => role.id === id)?.name || roleTitle(id);
}
function changeAssignments() {
  const member = focused.value;
  if (!member || (s.taskMode && assignmentChanged.value)) return;
  const previous = assignmentResources.value
    .filter((row) => row.assignedTo?.includes(member.accountId))
    .map((row) => row.id);
  const add = memberAssignments.value.filter((id) => !previous.includes(id));
  const remove = previous.filter((id) => !memberAssignments.value.includes(id));
  if (!add.length && !remove.length) return;
  const changed = [...add, ...remove];
  (s.taskMode ? s.requestInline : s.request)(
    ["核对资源指派变化", "Review resource assignments"],
    {
      kind: "assignment",
      ids: [member.id],
      values: {
        version: String(s.taskMode ? memberVersion.value : member.version),
        add: JSON.stringify(add),
        remove: JSON.stringify(remove),
        versions: JSON.stringify(
          Object.fromEntries(
            assignmentResources.value
              .filter((row) => changed.includes(row.id))
              .map((row) => [row.id, s.taskMode ? resourceVersions.value[row.id] : row.version]),
          ),
        ),
      },
    },
    "access",
  );
}
function createInvites() {
  validation.value = "";
  if (!inviteSelected.value.length) {
    validation.value = l("没有可创建邀请的地址。", "There are no eligible invitation addresses.");
    return;
  }
  s.request(
    ["创建选定成员邀请", "Create selected invitations"],
    { kind: "invite", ids: [...inviteSelected.value], values: { role: invite.value.role } },
    "access",
  );
}
function saveRole() {
  validation.value = "";
  if (s.taskMode && (!roleTable.value.trim() || roleTableError.value)) return;
  if (!roleForm.value.name.trim()) {
    validation.value = l("请填写角色名称。", "Enter a role name.");
    return;
  }
  (s.taskMode ? s.requestInline : s.request)(
    ["核对角色权限变化", "Review role permission changes"],
    {
      kind: "role",
      ids: [targetRole.value?.id || `R-${s.data.revision + 1}`],
      values: {
        name: roleForm.value.name,
        menu: roleForm.value.menu ? "yes" : "no",
        read: roleForm.value.read,
        update: roleForm.value.update,
        export: roleForm.value.export,
        marketingRead: roleForm.value.marketingRead,
        marketingExecute: roleForm.value.marketingExecute,
        access: roleForm.value.access ? "yes" : "no",
        ...Object.fromEntries(
          ["read", "update", "export", "marketingRead", "marketingExecute"].map((action) => [
            action + "Targets",
            JSON.stringify(
              roleForm.value.targets[action as keyof typeof roleForm.value.targets] || [],
            ),
          ]),
        ),
        version: String(roleForm.value.version),
      },
    },
    "access",
  );
}
function withdraw(id: string) {
  const row = s.data.invites.find((x) => x.id === id);
  if (row)
    s.request(
      ["撤回邀请", "Withdraw invitation"],
      {
        kind: "invite-state",
        ids: [id],
        values: { state: "withdrawn", version: String(row.version) },
      },
      "access",
    );
}
function reinvite(email: string, role: string) {
  s.request(
    ["创建新的有效邀请", "Create a new valid invitation"],
    { kind: "invite", ids: [email], values: { role } },
    "access",
  );
}
function delivery(id: string) {
  const row = s.data.invites.find((x) => x.id === id);
  if (!row) return;
  s.announce(
    ["投递状态核对", "Delivery status review"],
    [
      `${id} · ${row.delivery === "pending" ? "投递结果待确认，不会重新创建邀请。" : row.delivery === "delivered" ? "已投递，尚不代表受邀者已加入。" : "投递未完成，请先由获准人员核对投递记录。"}`,
      `${id} · ${row.delivery === "pending" ? "Delivery is unconfirmed; the invitation is not recreated." : row.delivery === "delivered" ? "Delivered does not mean accepted." : "Delivery did not complete; authorized staff should inspect the delivery record."}`,
    ],
  );
}
function parsedState(id: string) {
  const map: Record<string, readonly [string, string]> = {
    ready: ["可选定", "Eligible"],
    invalid: ["格式错误", "Invalid format"],
    duplicate: ["重复地址", "Duplicate"],
    member: ["已是企业成员", "Already a member"],
    invited: ["已有有效邀请", "Active invitation exists"],
    unavailable: ["不在受控测试投递范围", "Outside controlled test delivery"],
    ambiguous: [
      "需受邀人验证身份，不按邮箱合并",
      "Identity verification required; no email-based merge",
    ],
  };
  return map[id] ? l(...map[id]) : id;
}
</script>
<template>
  <div class="full-stack">
    <template v-if="s.page.id === 'members'">
      <div class="full-grid three">
        <section class="full-card">
          <span>{{ l("当前筛选成员", "Members in current filter") }}</span
          ><strong class="full-value">{{ members.length }}</strong>
        </section>
        <section class="full-card">
          <span>{{ l("在任企业负责人", "Active owners") }}</span
          ><strong class="full-value">{{ activeOwners }}</strong>
        </section>
        <section class="full-card">
          <span>{{ l("待加入成员", "Invited members") }}</span
          ><strong class="full-value">{{
            s.data.members.filter((x) => x.state === "invited").length
          }}</strong>
        </section>
      </div>
      <section class="full-card">
        <div class="full-toolbar">
          <ElInput
            v-model="filters.text"
            clearable
            :aria-label="l('筛选成员', 'Filter members')"
            :placeholder="l('姓名或邮箱', 'Name or email')"
          /><ElSelect v-model="filters.state" :aria-label="l('成员状态', 'Membership status')"
            ><ElOption value="all" :label="l('全部状态', 'All states')" /><ElOption
              v-for="id in ['active', 'invited', 'suspended', 'removed']"
              :key="id"
              :value="id"
              :label="statusTitle(id)" /></ElSelect
          ><ElButton type="primary" data-primary @click="s.go('invite-create')">{{
            l("邀请成员", "Invite members")
          }}</ElButton>
        </div>
        <div class="full-table-wrap">
          <table class="full-table">
            <thead>
              <tr>
                <th>{{ l("成员", "Member") }}</th>
                <th>{{ l("账号", "Account") }}</th>
                <th>{{ l("角色", "Role") }}</th>
                <th>{{ l("状态", "Status") }}</th>
                <th>{{ l("操作", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in members" :key="row.id">
                <td>{{ row.name }}</td>
                <td>{{ row.email }}</td>
                <td>{{ s.roleIds(row).map(roleName).join(" + ") }}</td>
                <td>
                  <ElTag :type="row.state === 'active' ? 'success' : 'info'">{{
                    statusTitle(row.state)
                  }}</ElTag>
                </td>
                <td>
                  <ElButton
                    link
                    @click="openMember(row.id)"
                    >{{ l("查看详情", "View details") }}</ElButton
                  ><ElButton
                    v-if="row.state === 'active'"
                    link
                    @click="changeMember(row.id, 'suspended')"
                    >{{ l("停用", "Suspend") }}</ElButton
                  ><ElButton
                    v-if="row.state === 'suspended'"
                    link
                    @click="changeMember(row.id, 'active')"
                    >{{ l("恢复成员", "Reactivate") }}</ElButton
                  ><ElButton
                    v-if="row.state !== 'removed' && row.state !== 'invited'"
                    link
                    type="danger"
                    @click="changeMember(row.id, 'removed')"
                    >{{ l("移除", "Remove") }}</ElButton
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!members.length" class="full-empty">
          {{ l("当前筛选没有成员", "No members match the current filter") }}
        </p>
        <div v-if="focused" class="full-row-detail"><p v-if="s.taskMode && assignmentChanged" class="full-message" role="alert">{{ l('成员或资源已有变化。核对当前角色、指派及差异后再确认。', 'The member or resources changed. Review the current roles, assignments and differences before confirming.') }}<ElButton @click="reviewMemberVersions">{{ l('保留输入并核对当前成员与资源', 'Keep input and review current member and resources') }}</ElButton></p>
          <h3>{{ focused.name }} · {{ l("成员详情", "Member details") }}</h3>
          <dl class="full-facts">
            <dt>{{ l("当前角色", "Current role") }}</dt>
            <dd>{{ s.roleIds(focused).map(roleName).join(" + ") }}</dd>
            <dt>{{ l("当前状态与版本", "State and version") }}</dt>
            <dd>{{ statusTitle(focused.state) }} · {{ focused.version }}</dd>
          </dl>
          <div class="full-actions">
            <label v-if="s.taskMode" class="inline-edit">{{ l('本次完整角色集合（每行一个名称）', 'Complete role set for this change (one name per line)') }}<ElInput :model-value="memberRoleText" type="textarea" :rows="2" :aria-label="l('本次成员角色集合', 'Member role set for this change')" @input="applyMemberRoles"/><small>{{ s.data.roles.map(role => role.name).join(' · ') }}</small><p>{{ l('调整后角色：', 'Roles after this change: ') }}{{ memberRole.map(roleName).join(' + ') || l('不可为空', 'Must not be empty') }}</p><p v-if="validation" role="alert" class="full-error-text">{{ validation }}</p></label>
            <ElCheckboxGroup
              v-show="!s.taskMode"
              v-model="memberRole"
              :aria-label="l('调整成员角色', 'Change member roles')"
            >
              <ElCheckbox
                v-for="item in s.data.roles"
                :key="item.id"
                :value="item.id"
                :aria-label="l('成员角色', 'Member role') + ' ' + item.name"
                >{{ item.name }}</ElCheckbox
              >
            </ElCheckboxGroup>
            <ElButton
              :disabled="!memberRole.length || (s.taskMode && (!memberRoleText.trim() || !!validation || memberVersion !== focused.version))"
              @click="changeMember(focused.id, undefined, memberRole)"
              >{{ s.taskMode ? l('确认角色调整', 'Confirm role change') : l("核对角色调整", "Review role assignment") }}</ElButton
            ><ElButton @click="changeMember(focused.id, undefined, 'reader')">{{
              l("调整为只读成员", "Make read-only")
            }}</ElButton
            ><ElButton
              :disabled="
                focused.state !== 'active' || s.hasRole(focused, 'owner') || !s.can('owner')
              "
              @click="changeMember(focused.id, undefined, 'owner')"
              >{{ l("指定为另一位负责人", "Assign another owner") }}</ElButton
            ><ElButton @click="detail = ''">{{ l("关闭详情", "Close details") }}</ElButton>
          </div>
          <h4>{{ l("当前角色的逐动作合并结果", "Current grants combined per action") }}</h4>
          <p>
            {{
              l(
                "同一动作取角色范围并集；读取、修改与导出不能互相拼接。撤掉一个角色后重新按剩余角色核对。",
                "Roles are unioned within each action. Read, update and export never combine across actions. Removing a role recalculates the remaining grants.",
              )
            }}
          </p>
          <div class="full-table-wrap">
            <table class="full-table" data-member-access>
              <thead>
                <tr>
                  <th>{{ l("客户", "Customer") }}</th>
                  <th>{{ l("负责与指派来源", "Ownership and assignment") }}</th>
                  <th>{{ l("读取", "Read") }}</th>
                  <th>{{ l("修改", "Update") }}</th>
                  <th>{{ l("导出", "Export") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="customer in s.data.customers" :key="customer.id">
                  <td>{{ customer.id }} · {{ customer.name }}</td>
                  <td>
                    {{
                      customer.owner === focused.accountId
                        ? l("本人负责", "Owned by member")
                        : l("其他成员负责", "Owned by another member")
                    }}
                    ·
                    {{
                      customer.assignedTo?.includes(focused.accountId)
                        ? l("已明确指派", "Assigned to member")
                        : l("未指派", "Not assigned")
                    }}
                  </td>
                  <td v-for="action in ['read', 'update', 'export'] as const" :key="action">
                    {{
                      s.memberAccess(focused, customer, action)
                        ? l("允许", "Allowed")
                        : l("拒绝", "Denied")
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <h4>{{ l("明确指派的资源", "Explicitly assigned resources") }}</h4>
          <p>
            {{
              l(
                "指派不改变负责人，仅让具有 assigned 动作范围的角色使用；指定集合 explicit 在角色中逐动作配置。只可指派当前有权修改的对象，撤销后立即重新核对读取、批量、导出和下载。",
                "Assignment does not change ownership. It is used only by grants with assigned scope; explicit sets are configured per action on roles. Assign only targets in your current update scope. Revocation immediately rechecks reads, batches, exports and downloads.",
              )
            }}
          </p>
          <BulkPicker v-if="s.taskMode" :key="s.contextKey + focused.id" v-model="memberAssignments" :records="quickAssignmentRecords" :scope="focused.name + l(' · 资源指派', ' · Resource assignments')" :template-url="targetTemplate" allow-empty @valid="assignmentReady = $event" />
          <p v-if="s.taskMode" class="inline-impact">{{ l('原指派：', 'Previous assignments: ') }}{{ assignmentResources.filter(row => row.assignedTo?.includes(focused!.accountId)).map(row => row.id).join(' · ') || '—' }} → {{ memberAssignments.join(' · ') || l('全部撤销', 'Remove all') }} · {{ l('不改变负责人；只替换本成员的指派集合。', 'Ownership stays unchanged. Only this member’s assignments are replaced.') }}</p>
          <ElCheckboxGroup v-if="!s.taskMode"
            v-model="memberAssignments"
            :aria-label="l('成员客户指派', 'Member customer assignments')"
            ><ElCheckbox
              v-for="customer in assignmentResources"
              :key="customer.id"
              :value="customer.id"
              :disabled="
                !s.readable(customer, customer.id.startsWith('M-') ? 'marketingExecute' : 'update')
              "
              :aria-label="l('指派资源', 'Assign resource') + ' ' + customer.id"
              >{{ customer.id }} · {{ customer.name }}</ElCheckbox
            ></ElCheckboxGroup
          >
          <ElButton :disabled="focused.state !== 'active' || (s.taskMode && (!assignmentReady || assignmentChanged))" @click="changeAssignments">{{
            s.taskMode ? l('确认替换指派集合', 'Confirm replacement assignments') : l("核对资源指派", "Review assignments")
          }}</ElButton>
          <p class="full-muted">
            {{
              l(
                "停用、移除、自降级及角色调整都保护最后一位在任负责人。",
                "Suspension, removal, self-demotion, and role changes all protect the last active owner.",
              )
            }}
          </p>
        </div>
      </section>
    </template>
    <section v-else-if="s.page.id === 'invitations'" class="full-card">
      <div class="full-toolbar">
        <ElButton type="primary" data-primary @click="s.go('invite-create')">{{
          l("邀请成员", "Invite members")
        }}</ElButton
        ><ElButton @click="s.go('members')">{{ l("查看成员", "View members") }}</ElButton>
      </div>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("受邀地址", "Invited address") }}</th>
              <th>{{ l("角色", "Role") }}</th>
              <th>{{ l("邀请状态", "Invitation status") }}</th>
              <th>{{ l("投递状态", "Delivery status") }}</th>
              <th>{{ l("操作", "Actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in inviteRows" :key="row.id">
              <td>{{ row.email }}</td>
              <td>{{ roleTitle(row.role) }}</td>
              <td>{{ statusTitle(row.state) }}</td>
              <td>
                {{
                  s.scene === "delivery_failed"
                    ? statusTitle("delivery_failed")
                    : s.taskMode && row.delivery === 'pending'
                      ? l('等待投递', 'Awaiting delivery')
                      : statusTitle(row.delivery)
                }}
              </td>
              <td>
                <ElButton link @click="s.openInvitation(row.id)">{{
                  l("受邀者入口", "Invitee entry")
                }}</ElButton
                ><ElButton link @click="delivery(row.id)">{{
                  l("核对投递", "Check delivery")
                }}</ElButton
                ><ElButton
                  v-if="row.state === 'created'"
                  link
                  type="danger"
                  @click="withdraw(row.id)"
                  >{{ l("撤回", "Withdraw") }}</ElButton
                ><ElButton
                  v-if="
                    row.state === 'expired' ||
                    row.state === 'withdrawn' ||
                    Date.parse(row.expiresAt) <= Date.now()
                  "
                  link
                  @click="reinvite(row.email, row.role)"
                  >{{ l("核对重新邀请", "Review a new invitation") }}</ElButton
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!inviteRows.length" class="full-empty">
        {{ l("尚无邀请记录", "No invitations yet") }}
      </p>
      <p class="full-muted">
        {{
          l(
            "创建、投递和接受是不同结果。过期邀请不复活，重新邀请需核对新的记录。",
            "Creation, delivery, and acceptance are separate outcomes. Expired invitations stay expired; a new invitation needs its own review.",
          )
        }}
      </p>
      <ElButton v-if="inviteRows[0]" link @click="s.openInvitation(inviteRows[0].id)">{{
        l("查看受邀者加入旅程", "Review the invitee journey")
      }}</ElButton>
    </section>
    <section v-else-if="s.page.id === 'invite-create' && s.taskMode" class="full-card">
      <h2>{{ l('选好成员，再创建邀请', 'Choose people, then create invitations') }}</h2>
      <p class="full-muted">{{ l('筛选来源是本轮隔离的待邀候选名单；创建、投递和加入分别显示，不发送真实邮件。', 'Filters use this review’s isolated candidate list. Creation, delivery and joining are separate; no real email is sent.') }}</p>
      <BulkPicker :key="s.contextKey" v-model="quickInviteIds" :records="quickInviteRecords" :scope="s.legacy.organization + l(' · 本次邀请范围', ' · Invitation scope')" column="邮箱" :template-url="inviteTemplate" @valid="quickInviteReady = $event" />
      <label class="inline-edit">{{ l('加入后的角色', 'Role after joining') }}<ElSelect v-model="invite.role" :aria-label="l('本次邀请角色', 'Role for these invitations')"><ElOption value="reader" :label="l('只读成员', 'Read-only member')"/><ElOption value="operator" :label="l('业务成员', 'Business member')"/></ElSelect></label>
      <div class="inline-impact"><strong>{{ l('确认前核对影响', 'Review effects before confirming') }}</strong><p>{{ s.legacy.organization }} · {{ quickInviteIds.length }} {{ l('个地址', 'addresses') }} · {{ roleTitle(invite.role) }}</p><p>{{ l('创建邀请不等于已送达或已加入；72小时单次为待审建议。', 'Creating an invitation does not mean delivery or joining. The 72-hour single-use policy remains a proposal.') }}</p></div>
      <ElButton type="primary" :disabled="!quickInviteReady || s.blocked" :loading="s.busy" @click="submitQuickInvites">{{ l('确认创建邀请', 'Confirm invitation creation') }}</ElButton>
    </section>
    <section v-else-if="s.page.id === 'invite-create'" class="full-card">
      <h2>{{ l("粘贴地址，核对后创建邀请", "Paste addresses, then review invitations") }}</h2>
      <div class="full-form">
        <label
          >{{ l("邀请地址，每行一个", "Invitation addresses, one per line")
          }}<ElInput
            v-model="invite.text"
            type="textarea"
            :rows="6"
            :aria-label="l('批量邀请地址', 'Bulk invitation addresses')"
            @input="invite.parsed = false" /></label
        ><label
          >{{ l("加入后的角色", "Role after joining")
          }}<ElSelect v-model="invite.role" :aria-label="l('邀请角色', 'Invitation role')"
            ><ElOption value="reader" :label="l('只读成员', 'Read-only member')" /><ElOption
              value="operator"
              :label="l('业务成员', 'Business member')" /></ElSelect
        ></label>
      </div>
      <div class="full-actions">
        <ElButton type="primary" @click="invite.parsed = true">{{
          l("解析并核对地址", "Parse and review addresses")
        }}</ElButton
        ><ElButton @click="s.go('invitations')">{{
          l("返回邀请记录", "Back to invitations")
        }}</ElButton>
      </div>
      <template v-if="invite.parsed"
        ><div class="full-message">
          <strong>{{ l("最终可选定", "Eligible selection") }} {{ inviteSelected.length }}</strong>
          <p>
            {{
              l(
                "解析只选定，不会发送或创建邀请。有效期72小时与单次使用是待审建议。",
                "Parsing selects only; it does not create or send invitations. The 72-hour single-use policy remains a proposal.",
              )
            }}
          </p>
        </div>
        <div class="full-table-wrap">
          <table class="full-table">
            <thead>
              <tr>
                <th>{{ l("选定", "Select") }}</th>
                <th>{{ l("地址", "Address") }}</th>
                <th>{{ l("核对结果", "Review result") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in analyzed" :key="index">
                <td>
                  <ElCheckbox
                    :model-value="row.state === 'ready' && !invite.excluded.includes(row.email)"
                    :disabled="row.state !== 'ready'"
                    :aria-label="l('选定邀请', 'Select invitation') + ' ' + row.email"
                    @change="
                      (value) => {
                        invite.excluded = value
                          ? invite.excluded.filter((x) => x !== row.email)
                          : [...invite.excluded, row.email];
                      }
                    "
                  />
                </td>
                <td>{{ row.email }}</td>
                <td>{{ parsedState(row.state) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="validation" class="full-error-text" role="alert">{{ validation }}</p>
        <div class="full-actions">
          <ElButton
            type="primary"
            data-primary
            :disabled="!inviteSelected.length || s.blocked"
            @click="createInvites"
            >{{ l("核对最终邀请范围", "Review final invitation scope") }}</ElButton
          >
        </div></template
      >
    </section>
    <section v-else-if="s.page.id === 'roles'" class="full-card">
      <div class="full-toolbar">
        <ElButton type="primary" data-primary @click="s.go('role-edit')">{{
          l("新建角色", "Create role")
        }}</ElButton
        ><ElButton @click="s.go('members')">{{ l("查看成员授权", "View member access") }}</ElButton>
      </div>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("角色", "Role") }}</th>
              <th>{{ l("后台导航", "Console navigation") }}</th>
              <th>{{ l("读取客户", "Read customers") }}</th>
              <th>{{ l("修改客户", "Update customers") }}</th>
              <th>{{ l("操作", "Action") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in roleRows" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ row.menu ? l("可见", "Visible") : l("隐藏", "Hidden") }}</td>
              <td>{{ statusTitle(row.read) }}</td>
              <td>{{ statusTitle(row.update) }}</td>
              <td>
                <ElButton link type="primary" @click="s.go('role-edit', { target: row.id })">{{
                  l("查看并配置", "View and configure")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!roleRows.length" class="full-empty">{{ l("尚无角色", "No roles yet") }}</p>
      <p>
        {{
          l(
            "同一个成员可以读取全部客户，但只修改本人负责客户。每个动作单独核对范围，不因能看到后台菜单而获得业务执行权。",
            "A member can read all customers while updating only their own. Scope is checked per action; console visibility does not grant business execution.",
          )
        }}
      </p>
    </section>
    <section
      v-else-if="s.page.id === 'role-edit' && (!s.query.target || targetRole)"
      class="full-card"
    >
      <h2>{{ l("按动作核对权限与范围", "Review permissions and scope per action") }}</h2>
      <template v-if="s.taskMode"><ElButton @click="applyRoleTable(l(roleTableExample, roleTableExampleEn))">{{ l('使用完整示例配置', 'Use complete example settings') }}</ElButton><label class="inline-edit">{{ l('完整角色权限表（可从Excel一次粘贴）', 'Complete role permissions table (paste once from Excel)') }}<ElInput :model-value="roleTable" type="textarea" :rows="5" :aria-label="l('完整角色权限表', 'Complete role permissions table')" :placeholder="l(roleTableExample, roleTableExampleEn)" @input="applyRoleTable"/></label><p class="full-muted">{{ l('按示例13列粘贴表头和一行配置。范围用不允许、当前企业全部、本人负责、明确指派、指定对象；对象编号用竖线分隔。', 'Paste the 13-column header and one configuration row shown in the example. Use Not allowed, All in organization, Owned by me, Assigned, or Explicit targets; separate explicit references with a vertical bar.') }}</p><p v-if="roleTableError" role="alert" class="full-error-text">{{ roleTableError }}</p><div v-if="roleTable && !roleTableError" class="inline-impact"><h3>{{ targetRole?.name || l('新角色', 'New role') }} → {{ roleForm.name }}</h3><p>{{ l('后台入口', 'Console entry') }}: {{ targetRole?.menu ? l('允许', 'Allowed') : l('不允许', 'Not allowed') }} → {{ roleForm.menu ? l('允许', 'Allowed') : l('不允许', 'Not allowed') }} · {{ l('成员管理', 'Member management') }}: {{ targetRole?.access ? l('允许', 'Allowed') : l('不允许', 'Not allowed') }} → {{ roleForm.access ? l('允许', 'Allowed') : l('不允许', 'Not allowed') }}</p><p v-for="action in ['read','update','export','marketingRead','marketingExecute'] as const" :key="action">{{ ({ read: l('客户读取', 'Customer read'), update: l('客户修改', 'Customer update'), export: l('客户导出', 'Customer export'), marketingRead: l('营销读取', 'Marketing read'), marketingExecute: l('营销执行', 'Marketing execute') })[action] }}: {{ targetRole ? statusTitle(targetRole[action]) : l('新角色', 'New role') }} [{{ targetRole?.targets?.[action]?.join(' · ') || '—' }}] → {{ statusTitle(roleForm[action]) }} [{{ roleForm.targets[action]?.join(' · ') || '—' }}]</p></div></template>
      <div v-show="!s.taskMode" class="full-form">
        <label
          >{{ l("角色名称", "Role name")
          }}<ElInput
            v-model="roleForm.name"
            :aria-label="l('角色名称', 'Role name')"
            maxlength="60" /></label
        ><ElCheckbox v-model="roleForm.menu">{{
          l("允许后台导航入口", "Allow console navigation entry")
        }}</ElCheckbox
        ><label
          >{{ l("客户读取范围", "Customer read scope")
          }}<ElSelect v-model="roleForm.read" :aria-label="l('客户读取范围', 'Customer read scope')"
            ><ElOption value="none" :label="statusTitle('none')" /><ElOption
              value="tenant"
              :label="statusTitle('tenant')" /><ElOption
              value="self"
              :label="statusTitle('self')" /></ElSelect></label
        ><label
          >{{ l("客户修改范围", "Customer update scope")
          }}<ElSelect
            v-model="roleForm.update"
            :aria-label="l('客户修改范围', 'Customer update scope')"
            ><ElOption value="assigned" :label="statusTitle('assigned')" /><ElOption
              value="explicit"
              :label="statusTitle('explicit')" /><ElOption
              value="none"
              :label="statusTitle('none')" /><ElOption
              value="self"
              :label="statusTitle('self')" /><ElOption
              value="tenant"
              :label="statusTitle('tenant')" /><ElOption
              value="legacy"
              :label="
                l('旧分组范围（含义未确认，不可授予）', 'Legacy group (unconfirmed; cannot grant)')
              " /><ElOption
              value="unknown"
              :label="
                l('未知权限（不可授予）', 'Unknown permission (cannot grant)')
              " /></ElSelect></label
        ><label
          >{{ l("客户导出范围", "Customer export scope")
          }}<ElSelect
            v-model="roleForm.export"
            :aria-label="l('客户导出范围', 'Customer export scope')"
            ><ElOption
              v-for="id in ['none', 'self', 'assigned', 'explicit', 'tenant']"
              :key="id"
              :value="id"
              :label="statusTitle(id)" /></ElSelect></label
        ><label
          >{{ l("营销读取范围", "Campaign read scope")
          }}<ElSelect
            v-model="roleForm.marketingRead"
            :aria-label="l('营销读取范围', 'Campaign read scope')"
            ><ElOption
              v-for="id in ['none', 'self', 'assigned', 'explicit', 'tenant']"
              :key="id"
              :value="id"
              :label="statusTitle(id)" /></ElSelect></label
        ><label
          >{{ l("营销执行范围", "Campaign execute scope")
          }}<ElSelect
            v-model="roleForm.marketingExecute"
            :aria-label="l('营销执行范围', 'Campaign execute scope')"
            ><ElOption
              v-for="id in ['none', 'self', 'assigned', 'explicit', 'tenant']"
              :key="id"
              :value="id"
              :label="statusTitle(id)" /></ElSelect></label
        ><template
          v-for="entry in [
            ['read', '客户读取指定对象', 'Customer read targets'],
            ['update', '客户修改指定对象', 'Customer update targets'],
            ['export', '客户导出指定对象', 'Customer export targets'],
            ['marketingRead', '营销读取指定对象', 'Campaign read targets'],
            ['marketingExecute', '营销执行指定对象', 'Campaign execute targets'],
          ] as const"
          :key="entry[0]"
        >
          <label v-if="roleForm[entry[0]] === 'explicit'"
            >{{ l(entry[1], entry[2])
            }}<ElSelect
              v-model="roleForm.targets[entry[0]]"
              multiple
              :aria-label="l(entry[1], entry[2])"
              ><ElOption
                v-for="target in entry[0].startsWith('marketing')
                  ? s.data.campaigns
                  : s.data.customers"
                :key="target.id"
                :value="target.id"
                :label="target.id + ' · ' + target.name" /></ElSelect
          ></label>
          <p v-if="roleForm[entry[0]] === 'assigned'">
            {{
              l(
                "明确指派来源：成员详情中确认的资源指派；与负责关系独立，撤销后该动作立即失效。",
                "Assigned scope uses confirmed resource assignments in member details, independently of ownership. Revoking an assignment removes this action immediately.",
              )
            }}
          </p> </template
        ><ElCheckbox v-model="roleForm.access">{{
          l(
            "允许当前范围内的成员与角色管理",
            "Allow member and role management within current scope",
          )
        }}</ElCheckbox>
        <p>
          {{
            l(
              "负责人身份按成员转交单独确认，不能在这里删除最后一位负责人。",
              "Ownership transfer is confirmed separately through memberships; the last owner cannot be removed here.",
            )
          }}
        </p>
      </div>
      <div class="full-message">
        <strong>{{ l("当前可委派上限", "Current delegation ceiling") }}</strong>
        <p>
          {{
            l(
              "按当前账户已授角色逐动作求并集，新增授权必须包含于该动作的当前可委派范围。指定集合必须明确选定；不能用有限集合推定未来所有负责或指派对象。超出范围、未知权限或旧分组含义不清时拒绝。",
              "Current grants are unioned per action. New grants must fit that action’s delegation ceiling. Explicit targets must be selected; finite sets cannot imply authority over future owned or assigned objects. Wider, unknown and unconfirmed legacy grants are rejected.",
            )
          }}
        </p>
      </div>
      <p v-if="validation" class="full-error-text" role="alert">{{ validation }}</p>
      <div class="full-actions">
        <ElButton @click="s.go('roles')">{{ l("取消并返回", "Cancel and return") }}</ElButton
        ><ElButton
          v-if="targetRole && roleForm.version !== targetRole.version"
          @click="roleForm.version = targetRole.version"
          >{{ l("保留配置并核对当前版本", "Keep settings and review current version") }}</ElButton
        ><ElButton type="primary" data-primary :disabled="s.blocked || (s.taskMode && (!roleTable.trim() || !!roleTableError))" @click="saveRole">{{
          s.taskMode ? l('确认角色配置', 'Confirm role configuration') : l("核对权限变化", "Review permission changes")
        }}</ElButton>
      </div>
    </section>
    <section v-else-if="s.page.id === 'role-edit'" class="full-state">
      <h2>{{ l("找不到此角色", "Role not found") }}</h2>
      <ElButton @click="s.go('roles')">{{ l("返回角色列表", "Back to roles") }}</ElButton>
    </section>
    <section v-else class="full-card">
      <h2>{{ l("企业当前可用模块", "Modules active for this organization") }}</h2>
      <div v-if="s.active && s.scene !== 'empty'" class="full-grid">
        <div v-for="module in ['crm', 'marketing']" :key="module" class="full-card">
          <h3>
            {{
              module === "crm" ? l("客户管理", "Customer management") : l("营销活动", "Marketing")
            }}
          </h3>
          <ElTag
            :type="s.moduleActive(module) && s.scene !== 'module_closed' ? 'success' : 'info'"
            >{{
              s.moduleActive(module) && s.scene !== "module_closed"
                ? l("已开通", "Enabled")
                : l("尚未开通或已到期", "Not enabled or expired")
            }}</ElTag
          >
          <p>
            {{
              l(
                "具体动作仍按当前成员权限和范围判断。模块开通不自动授予业务权限。",
                "Each action requires current member scope. Module activation does not grant business permissions.",
              )
            }}
          </p>
          <ElButton
            :disabled="!s.moduleActive(module) || s.scene === 'module_closed'"
            @click="s.go(module === 'crm' ? 'customers' : 'campaigns')"
            >{{ l("进入模块", "Open module") }}</ElButton
          >
        </div>
      </div>
      <div v-else class="full-empty">
        <h3>{{ l("尚未开通商业模块", "No business modules enabled") }}</h3>
        <p>
          {{
            l(
              "企业基础设置仍可使用。请联系平台管理员核对开通安排。",
              "Basic organization settings remain available. Ask a platform administrator about activation.",
            )
          }}
        </p>
      </div>
    </section>
  </div>
</template>
