<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElDialog, ElTag } from "element-plus";
import { ArrowRight, Building2, KeyRound, Laptop, ShieldCheck } from "lucide-vue-next";
import { l, roleTitle, statusTitle } from "./copy";
import { useFullReviewState } from "./state";
const s = useFullReviewState();
const recovery = ref(false);
const revoke = ref("");
const account = computed(() => (s.authenticated ? s.legacy.workspace.user : null));
const sessions = computed(() => s.draft("sessions", { otherRevoked: false }));
const incoming = computed(() => s.incomingInvitation);
const invitationBlocked = computed(
  () =>
    !incoming.value ||
    incoming.value.state !== "created" ||
    Date.parse(incoming.value.expiresAt) <= Date.now() ||
    ["expired", "withdrawn", "used", "identity_mismatch", "suspended"].includes(s.scene),
);
const loginFailed = computed(() =>
  ["login_failed", "transaction_expired", "identity_mismatch"].includes(s.scene),
);
const organizations = computed(() =>
  s.scene === "zero"
    ? []
    : s.scene === "one"
      ? s.legacy.workspace.tenants.slice(0, 1)
      : s.legacy.workspace.tenants,
);
function login() {
  if (loginFailed.value) return;
  s.legacy.beginSignIn();
  s.go("organizations");
}
function freshLogin() {
  s.legacy.signOut();
  s.setScene("normal");
}
function choose(name: string) {
  if (s.scene === "switch_failed") {
    s.legacy.switchFailed();
    return;
  }
  s.legacy.chooseOrganization(name);
  s.go("campaigns");
}
function logout() {
  s.legacy.signOut();
  s.go("identity");
}
function confirmRevoke() {
  if (revoke.value === "other") sessions.value.otherRevoked = true;
  else {
    if (revoke.value === "all") sessions.value.otherRevoked = true;
    logout();
  }
  revoke.value = "";
}
</script>
<template>
  <div class="full-stack">
    <section v-if="s.page.id === 'identity'" class="full-card">
      <div class="full-grid">
        <div>
          <KeyRound :size="30" />
          <h2 style="margin-top: 16px">
            {{ l("使用组织账号安全进入", "Continue with your organization account") }}
          </h2>
          <p>
            {{
              l(
                "登录后读取当前可访问的企业。企业身份与平台管理身份分别核对，不会按相同邮箱自动合并。",
                "After signing in, load your accessible organizations. Organization and platform access are checked separately; matching email addresses do not merge identities.",
              )
            }}
          </p>
          <div class="full-actions">
            <ElButton
              type="primary"
              size="large"
              data-primary
              :disabled="loginFailed"
              @click="login"
              >{{ l("继续使用组织账号", "Continue with organization account")
              }}<ArrowRight :size="16" /></ElButton
            ><ElButton v-if="loginFailed" type="primary" @click="freshLogin">{{
              l("重新发起登录", "Start a new sign-in")
            }}</ElButton>
          </div>
          <ElButton link type="primary" style="margin-top: 18px" @click="recovery = true">{{
            l("忘记密码或需要恢复验证方式", "Forgot password or need to recover verification")
          }}</ElButton>
        </div>
        <div class="full-card">
          <h3>{{ l("账号与企业分开保护", "Account and organization access are separate") }}</h3>
          <p>
            {{
              l(
                "登录不会自动创建企业、授予企业负责人身份或开通营销服务。",
                "Signing in does not create an organization, assign ownership, or enable marketing.",
              )
            }}
          </p>
          <p>
            {{
              l(
                "推荐会话：空闲30分钟，最长8小时。普通退出会结束当前浏览器的所有标签页。",
                "Proposed session: 30-minute idle, 8-hour maximum. Signing out ends all tabs in the current browser.",
              )
            }}
          </p>
          <ElTag>{{ l("本版策略待审", "Policy pending review") }}</ElTag>
        </div>
      </div>
    </section>
    <section v-else-if="s.page.id === 'organizations'" class="full-card">
      <h2>{{ l("选择本标签页要使用的企业", "Choose an organization for this tab") }}</h2>
      <p>
        {{
          l(
            "企业选择只作用于当前标签页；其他标签页的操作目标不会随之改变。",
            "Your selection applies only to this tab. Other tabs retain their own targets.",
          )
        }}
      </p>
      <div v-if="organizations.length" class="full-grid">
        <button
          v-for="org in organizations"
          :key="org.id"
          type="button"
          class="full-choice"
          :aria-label="l('进入', 'Open') + ' ' + org.name"
          @click="choose(org.name)"
        >
          <span
            ><Building2 :size="22" /><strong style="display: block; margin-top: 12px">{{
              org.name
            }}</strong
            ><small>{{ org.id }}</small></span
          ><ArrowRight :size="19" />
        </button>
      </div>
      <div v-else class="full-empty">
        <h3>{{ l("尚未加入企业", "No organization membership") }}</h3>
        <p>
          {{
            l(
              "联系负责人邀请加入。账号与登录设备管理仍可使用。",
              "Ask an owner for an invitation. Account and session management remain available.",
            )
          }}
        </p>
        <ElButton @click="s.go('invitation-accept')">{{
          l("核对已有邀请", "Review an invitation")
        }}</ElButton>
      </div>
      <div class="full-actions">
        <ElButton @click="s.go('sessions')">{{
          l("管理账号与登录设备", "Manage account and sessions")
        }}</ElButton
        ><ElButton @click="logout">{{ l("切换账号", "Switch account") }}</ElButton
        ><ElButton v-if="s.scene === 'switch_failed'" @click="s.setScene('normal')">{{
          l("重新读取企业列表", "Reload organizations")
        }}</ElButton>
      </div>
    </section>
    <section v-else-if="s.page.id === 'sessions'" class="full-card">
      <h2>{{ account?.name || l("组织账号", "Organization account") }}</h2>
      <p>{{ account?.email }}</p>
      <p>
        {{
          l(
            "即使尚未加入企业，也可以管理自己的登录会话。密码与多重验证由组织账号服务管理。",
            "You can manage your own sessions without organization membership. Your organization identity service manages password and multifactor recovery.",
          )
        }}
      </p>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("登录设备", "Device") }}</th>
              <th>{{ l("状态", "Status") }}</th>
              <th>{{ l("操作", "Action") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Laptop :size="16" /> {{ l("当前浏览器", "Current browser") }}</td>
              <td>{{ l("包括此浏览器全部标签页", "Includes all tabs in this browser") }}</td>
              <td>
                <ElButton link @click="revoke = 'current'">{{
                  l("退出当前浏览器", "Sign out of this browser")
                }}</ElButton>
              </td>
            </tr>
            <tr v-if="s.scene !== 'empty'">
              <td>{{ l("另一台已登录设备", "Another signed-in device") }}</td>
              <td>
                {{
                  sessions.otherRevoked ? l("已撤销", "Revoked") : l("会话有效", "Session active")
                }}
              </td>
              <td>
                <ElButton link :disabled="sessions.otherRevoked" @click="revoke = 'other'">{{
                  l("撤销此设备会话", "Revoke this device")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="full-actions">
        <ElButton type="danger" plain @click="revoke = 'all'">{{
          l("退出所有设备", "Sign out everywhere")
        }}</ElButton
        ><ElButton @click="recovery = true">{{
          l("恢复密码或验证方式", "Recover password or verification")
        }}</ElButton
        ><ElButton @click="s.go('organizations')">{{
          l("返回企业选择", "Back to organizations")
        }}</ElButton>
      </div>
    </section>
    <section v-else class="full-card">
      <template v-if="incoming"
        ><h2>{{ l("加入企业", "Join organization") }} · {{ incoming.targetName }}</h2>
        <dl class="full-facts">
          <dt>{{ l("受邀账号", "Invited account") }}</dt>
          <dd>{{ incoming.email }}</dd>
          <dt>{{ l("加入后的角色", "Role after joining") }}</dt>
          <dd>{{ roleTitle(incoming.role) }}</dd>
          <dt>{{ l("邀请状态", "Invitation state") }}</dt>
          <dd>{{ statusTitle(incoming.state) }}</dd>
          <dt>{{ l("有效期至", "Valid until") }}</dt>
          <dd>{{ incoming.expiresAt }}</dd>
        </dl>
        <p>
          {{
            l(
              "必须使用受邀地址已经验证的组织账号。接受时绑定供应端与主体，其他同邮箱身份不会自动合并。负责人邀请被接受后才激活指定负责人。",
              "Use an organization identity with the verified invited address. Acceptance binds issuer and subject; matching emails are not merged. A nominated owner activates only after accepting.",
            )
          }}
        </p>
        <div class="full-actions">
          <ElButton :disabled="invitationBlocked" @click="s.verifyInvitedAccount">{{
            l("验证受邀组织账号", "Verify invited organization account")
          }}</ElButton
          ><ElButton
            type="primary"
            data-primary
            :disabled="invitationBlocked || !s.authenticated"
            @click="s.acceptInvitation"
            >{{ l("核对并接受邀请", "Review and accept invitation") }}</ElButton
          ><ElButton @click="s.go('tasks')">{{
            l("查询本人原接受记录", "Query my original acceptance record")
          }}</ElButton>
        </div></template
      >
      <template v-else
        ><h2>{{ l("邀请不可访问", "Invitation unavailable") }}</h2>
        <p>
          {{
            l(
              "请核对原邀请记录；不回退到其他邀请。",
              "Check the original invitation; another invitation is not substituted.",
            )
          }}
        </p>
        <ElButton @click="s.go('identity')">{{
          l("返回登录入口", "Back to sign-in")
        }}</ElButton></template
      >
    </section>
    <ElDialog
      v-model="recovery"
      :title="l('前往组织账号服务恢复', 'Recover through organization identity service')"
      width="540px"
      ><p>
        {{
          l(
            "密码重置、验证码及多重验证恢复在组织账号服务完成，本系统不收集这些信息。完成后必须重新登录并核对企业权限。",
            "Password reset, verification codes, and multifactor recovery are handled by your organization identity service. This application does not collect them. Sign in and recheck organization access afterward.",
          )
        }}
      </p>
      <div class="full-message">
        <ShieldCheck :size="20" />
        <p>
          {{
            l(
              "审阅交接场景：组织账号服务 → 恢复完成或取消 → 重新验证。此处不会打开真实账号恢复操作。",
              "Review handoff: organization identity service → recovery or cancellation → fresh verification. No live account recovery is opened here.",
            )
          }}
        </p>
      </div>
      <template #footer
        ><ElButton @click="recovery = false">{{ l("取消并返回", "Cancel and return") }}</ElButton
        ><ElButton
          type="primary"
          @click="
            recovery = false;
            logout();
          "
          >{{ l("已完成恢复，重新登录", "Recovery complete, sign in again") }}</ElButton
        ></template
      ></ElDialog
    >
    <ElDialog
      :model-value="!!revoke"
      :title="l('核对会话撤销范围', 'Review session revocation scope')"
      width="520px"
      @close="revoke = ''"
      ><p>
        {{
          revoke === "all"
            ? l(
                "将撤销此账号的全部设备会话。",
                "All device sessions for this account will be revoked.",
              )
            : revoke === "current"
              ? l(
                  "当前浏览器的所有标签页将退出，其他设备保持原状态。",
                  "All tabs in this browser will sign out; other devices keep their state.",
                )
              : l(
                  "只撤销选定设备，不退出当前浏览器。",
                  "Only the selected device is revoked; this browser stays signed in.",
                )
        }}
      </p>
      <template #footer
        ><ElButton @click="revoke = ''">{{ l("取消", "Cancel") }}</ElButton
        ><ElButton type="danger" @click="confirmRevoke">{{
          l("确认撤销", "Confirm revocation")
        }}</ElButton></template
      ></ElDialog
    >
  </div>
</template>
