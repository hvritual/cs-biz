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
const s = useFullReviewState();
const validation = ref("");
const detail = ref("");
const memberRole = ref<string[]>(["reader"]);
const memberAssignments = ref<string[]>([]);
watch(
  () => [s.contextKey, s.page.id],
  () => {
    detail.value = "";
    memberRole.value = [];
    memberAssignments.value = [];
    validation.value = "";
  },
);
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
  s.request(
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
        version: String(row.version),
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
  if (!member) return;
  const previous = assignmentResources.value
    .filter((row) => row.assignedTo?.includes(member.accountId))
    .map((row) => row.id);
  const add = memberAssignments.value.filter((id) => !previous.includes(id));
  const remove = previous.filter((id) => !memberAssignments.value.includes(id));
  if (!add.length && !remove.length) return;
  const changed = [...add, ...remove];
  s.request(
    ["核对资源指派变化", "Review resource assignments"],
    {
      kind: "assignment",
      ids: [member.id],
      values: {
        version: String(member.version),
        add: JSON.stringify(add),
        remove: JSON.stringify(remove),
        versions: JSON.stringify(
          Object.fromEntries(
            assignmentResources.value
              .filter((row) => changed.includes(row.id))
              .map((row) => [row.id, row.version]),
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
  if (!roleForm.value.name.trim()) {
    validation.value = l("请填写角色名称。", "Enter a role name.");
    return;
  }
  s.request(
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
                    @click="
                      detail = row.id;
                      memberRole = [...s.roleIds(row)];
                      memberAssignments = assignmentResources
                        .filter((customer) => customer.assignedTo?.includes(row.accountId))
                        .map((customer) => customer.id);
                    "
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
        <div v-if="focused" class="full-row-detail">
          <h3>{{ focused.name }} · {{ l("成员详情", "Member details") }}</h3>
          <dl class="full-facts">
            <dt>{{ l("当前角色", "Current role") }}</dt>
            <dd>{{ s.roleIds(focused).map(roleName).join(" + ") }}</dd>
            <dt>{{ l("当前状态与版本", "State and version") }}</dt>
            <dd>{{ statusTitle(focused.state) }} · {{ focused.version }}</dd>
          </dl>
          <div class="full-actions">
            <ElCheckboxGroup
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
              :disabled="!memberRole.length"
              @click="changeMember(focused.id, undefined, memberRole)"
              >{{ l("核对角色调整", "Review role assignment") }}</ElButton
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
          <ElCheckboxGroup
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
          <ElButton :disabled="focused.state !== 'active'" @click="changeAssignments">{{
            l("核对资源指派", "Review assignments")
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
      <div class="full-form">
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
        ><ElButton type="primary" data-primary :disabled="s.blocked" @click="saveRole">{{
          l("核对权限变化", "Review permission changes")
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
