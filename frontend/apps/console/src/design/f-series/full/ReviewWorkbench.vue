<script setup lang="ts">
import { computed, nextTick, watch } from "vue";
import { ElButton, ElDialog, ElOption, ElSelect, ElTag } from "element-plus";
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw } from "lucide-vue-next";
import PageHeader from "#/components/PageHeader.vue";
import { reviewPages } from "./catalog";
import { l, pair, roles, roleTitle, statusTitle } from "./copy";
import { useFullReviewState } from "./state";
import IdentityPages from "./IdentityPages.vue";
import PlatformPages from "./PlatformPages.vue";
import AccessPages from "./AccessPages.vue";
import MarketingPages from "./MarketingPages.vue";
import CustomerPages from "./CustomerPages.vue";
import OperationPages from "./OperationPages.vue";
import ObservabilityPages from "./ObservabilityPages.vue";
import ReleasePages from "./ReleasePages.vue";
import LocalOutcome from './LocalOutcome.vue';
import TaskGuide from './TaskGuide.vue';
import "./review.css";
const s = useFullReviewState();
watch(() => s.inlineResult?.id, async value => {
  if (!value || !s.taskMode) return;
  await nextTick();
  document.querySelector('[data-local-outcome]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
});
watch(
  () => [s.page.id, s.scene],
  () => {
    if (s.page.id === "sessions" && s.scene === "expired") s.legacy.signOut();
  },
  { immediate: true },
);
const component = computed(
  () =>
    ({
      identity: IdentityPages,
      platform: PlatformPages,
      access: AccessPages,
      marketing: MarketingPages,
      customers: CustomerPages,
      operations: OperationPages,
      observability: ObservabilityPages,
      release: ReleasePages,
    })[s.page.group],
);
const hardDenied = computed(
  () =>
    !s.allowed ||
    ["forbidden", "revoked", "suspended", "module_closed", "no_function"].includes(s.scene),
);
const onlyState = computed(() => ["loading", "offline"].includes(s.scene));
const count = reviewPages.reduce((n, p) => n + p.scenarios.length, 0);
const effectLabels: Record<string, readonly [string, string]> = {
  retryOf: ['恢复来源原操作', 'Recovery source operation'],
  originalPlanId: s.journeyMode ? ['原发布计划', 'Original release plan'] : ['原发布模拟计划', 'Original release simulation'],
  name: ["名称", "Name"],
  code: ["唯一标识", "Unique code"],
  owner: ["指定负责人", "Nominated owner"],
  note: ["服务备注", "Service note"],
  role: ["目标角色", "Target role"],
  roles: ["调整后的全部角色", "All roles after this change"],
  add: ["新增指派对象", "Newly assigned targets"],
  remove: ["撤销指派对象", "Assignments removed"],
  export: ["客户导出范围", "Customer export scope"],
  marketingRead: ["营销读取范围", "Campaign read scope"],
  marketingExecute: ["营销执行范围", "Campaign execute scope"],
  access: ["成员与角色管理", "Member and role management"],
  readTargets: ["客户读取指定对象", "Customer read targets"],
  updateTargets: ["客户修改指定对象", "Customer update targets"],
  exportTargets: ["客户导出指定对象", "Customer export targets"],
  marketingReadTargets: ["营销读取指定对象", "Campaign read targets"],
  marketingExecuteTargets: ["营销执行指定对象", "Campaign execute targets"],
  state: ["目标状态", "Target state"],
  read: ["客户读取范围", "Customer read scope"],
  update: ["客户修改范围", "Customer update scope"],
  menu: ["后台导航", "Console navigation"],
  version: ["当前记录版本", "Current record version"],
  tenant: ["目标企业", "Target organization"],
  target: ["目标环境", "Target environment"],
  confirmation: ["影响确认", "Impact confirmation"],
};
function effectValue(key: string, value: string): string {
  if (key === "roles")
    return (JSON.parse(value) as string[])
      .map((id) => s.data.roles.find((role) => role.id === id)?.name || roleTitle(id))
      .join(" + ");
  if (key.endsWith("Targets") || ["add", "remove"].includes(key))
    return (JSON.parse(value) as string[]).join(" · ") || l("无", "None");
  if (["read", "update", "export", "marketingRead", "marketingExecute", "state"].includes(key))
    return statusTitle(value);
  if (["menu", "access"].includes(key))
    return value === "yes" ? l("允许", "Allowed") : l("不允许", "Not allowed");
  return value || "—";
}
function back() {
  s.setScene("normal");
}
</script>
<template>
  <section
    class="full-review"
    :data-design-preview="s.taskMode ? 'f-series-r004' : 'f-series-r003'"
    :data-page="s.page.id"
    :data-scene="s.scene"
  >
    <aside v-if="!s.journeyMode" class="full-review-boundary" role="note">
      <BookOpen :size="16" /><span>{{
        l(
          "完整交互审阅 · 所有操作仅影响当前审阅记录，不发送邀请、不触达客户、不改变线上环境。",
          "Interactive design review · Actions affect review records only. No invitations, customer outreach, or live environment changes.",
        )
      }}</span
      ><ElTag v-if="!s.journeyMode" size="small"
        >{{ reviewPages.length }} {{ l("页", "pages") }} · {{ count }}
        {{ l("状态", "states") }}</ElTag
      >
    </aside>
    <details v-if="!s.journeyMode" :open="!s.taskMode" class="review-fixtures"><summary>{{ l('审阅账号与异常样例', 'Review accounts and exception fixtures') }}</summary>
    <div class="full-review-tools" :aria-label="l('审阅工具', 'Review controls')">
      <label
        >{{ l("页面", "Page")
        }}<ElSelect
          :model-value="s.page.id"
          :aria-label="l('审阅页面', 'Review page')"
          @change="s.go($event)"
          ><ElOption
            v-for="item in reviewPages"
            :key="item.id"
            :value="item.id"
            :label="`${item.screen} · ${pair(item.title)}`" /></ElSelect
      ></label>
      <label
        >{{ l("场景", "Scenario")
        }}<ElSelect
          :model-value="s.scene"
          :aria-label="l('审阅场景', 'Review scenario')"
          @change="s.setScene($event)"
          ><ElOption
            v-for="item in s.page.scenarios"
            :key="item.id"
            :value="item.id"
            :label="pair(item.title)" /></ElSelect
      ></label>
      <label
        >{{ l("审阅账号", "Review account")
        }}<ElSelect
          :model-value="s.legacy.workspace.user?.id"
          :aria-label="l('审阅账号', 'Review account')"
          @change="s.selectAccount($event)"
          ><ElOption
            v-for="item in s.accounts"
            :key="item.id"
            :value="item.id"
            :label="`${item.name} · ${item.email}`" /></ElSelect
      ></label>
      <label
        >{{ l("能力样例", "Capability fixture")
        }}<ElSelect
          :model-value="s.role"
          :aria-label="l('审阅角色', 'Review role')"
          @change="s.selectRole($event)"
          ><ElOption
            v-for="item in roles"
            :key="item.id"
            :value="item.id"
            :label="pair(item.title)" /></ElSelect
      ></label>
      <label
        >{{ l("提交时的执行结局／查询可见性", "Execution outcome at submission / query visibility")
        }}<ElSelect v-model="s.readback" :aria-label="l('原记录查询场景', 'Readback fixture')"
          ><ElOption value="succeeded" :label="l('已完成', 'Completed')" /><ElOption
            value="unknown"
            :label="l('仍待确认', 'Still unknown')" /><ElOption
            value="failed"
            :label="l('明确失败', 'Confirmed failed')" /><ElOption
            value="denied"
            :label="l('当前无读取权限', 'Read access revoked')" /></ElSelect
      ></label>
      <label v-if="s.taskMode">{{ l('本次提交结果样例', 'Submission outcome fixture') }}<ElSelect v-model="s.execution" :aria-label="l('本次提交结果样例', 'Submission outcome fixture')"><ElOption value="scenario" :label="l('按当前页面场景', 'Follow current page scenario')"/><ElOption v-for="value in ['succeeded','failed','partial','pending','unknown']" :key="value" :value="value" :label="statusTitle(value)"/></ElSelect></label>
      <ElButton
        v-if="s.active && ['customers', 'customer', 'customer-edit', 'task'].includes(s.page.id)"
        @click="s.changeAssignment"
        >{{ l("负责关系并发变化（审阅）", "Concurrent assignment change (review)") }}</ElButton
      ><ElButton v-if="s.active && s.can('read')" @click="s.deferRead">{{
        l("挂起读取（审阅）", "Hold read (review)")
      }}</ElButton
      ><ElButton v-if="s.race" @click="s.deliverRead">{{
        l("交付旧响应（审阅）", "Deliver old response (review)")
      }}</ElButton>
      <ElButton :icon="RotateCcw" @click="s.reset">{{
        l("重置全部审阅样例", "Reset all review fixtures")
      }}</ElButton>
    </div>
    </details>
    <p v-if="s.lateRead" class="full-muted">
      {{ l("最近核对的读取结果", "Last checked read result") }}: {{ s.lateRead }}
    </p>
    <PageHeader
      :title="pair(s.page.title)"
      :description="s.journeyMode && !s.authenticated ? l('使用组织账号登录', 'Sign in with your organization account') : `${s.legacy.organization || l('账号工作区', 'Account workspace')} · ${roleTitle(s.effectiveRole || s.role)}${s.taskMode ? '' : ' · ' + s.page.screen}`"
      ><ElButton v-if="!s.active && !s.journeyMode" type="primary" @click="s.selectRole(s.role)"
        >{{ l("使用当前审阅身份", "Use current review identity")
        }}<ArrowRight :size="15" /></ElButton
    ></PageHeader>
    <TaskGuide v-if="s.taskMode && !s.journeyMode" />
    <div v-if="s.notice" class="full-message" :class="s.notice.kind" role="status" data-notice>
      <strong>{{ pair(s.notice.title) }}</strong>
      <p>{{ pair(s.notice.help) }}</p>
    </div>
    <div
      v-if="s.scene !== 'normal'"
      class="full-message"
      :class="s.scenario.kind"
      role="status"
      data-scenario-feedback
    >
      <strong>{{ pair(s.scenario.title) }}</strong>
      <p>{{ pair(s.scenario.help) }}</p>
      <ElButton
        v-if="['csrf', 'conflict', 'scope_denied', 'missing_evidence'].includes(s.scene) || (s.taskMode && s.scene === 'failed')"
        @click="s.setScene('normal')"
        >{{ l("保留输入并重新核对", "Keep input and review again") }}</ElButton
      >
      <ElButton v-if="s.taskMode && ['unavailable', 'unknown', 'partial'].includes(s.scene) && ['modules','customers','tasks','delivery','diagnostics','audit','telemetry'].includes(s.page.id)" @click="back">{{ l('重新读取当前记录', 'Reload current records') }}</ElButton>
    </div>
    <section v-if="hardDenied" class="full-state" role="alert">
      <h2>{{ l("当前访问受到限制", "Current access is restricted") }}</h2>
      <p>
        {{
          l(
            "请核对账号、当前企业、已生效模块及该动作的授权范围。不会使用旧权限继续操作。",
            "Review your account, organization, active modules, and this action’s scope. Previous access will not be reused.",
          )
        }}
      </p>
      <ElButton v-if="!s.authenticated" type="primary" @click="s.go('identity')">{{
        l("重新登录", "Sign in again")
      }}</ElButton
      ><ElButton v-else @click="s.go('organizations')">{{
        l("核对企业与账号", "Review organization and account")
      }}</ElButton
      ><ElButton v-if="s.allowed" @click="back">{{
        l("重新核对当前权限", "Recheck current access")
      }}</ElButton>
    </section>
    <section v-else-if="onlyState" class="full-state" :aria-busy="s.scene === 'loading'">
      <div v-if="s.scene === 'loading'" class="full-skeleton"><span /><span /><span /></div>
      <h2>{{ pair(s.scenario.title) }}</h2>
      <p>{{ pair(s.scenario.help) }}</p>
      <ElButton @click="back">{{ l("重新读取当前记录", "Reload current records") }}</ElButton
      ><ElButton @click="s.go('tasks')">{{
        l("查看原操作记录", "Open original activities")
      }}</ElButton>
    </section>
    <component :is="component" v-else :key="s.page.group" />
    <LocalOutcome v-if="s.taskMode && s.inlineResult" :key="s.inlineResult.id" :task="s.inlineResult" />
    <details v-if="!s.journeyMode" class="full-help">
      <summary>{{ l("操作与审阅说明", "Task and review guidance") }}</summary>
      <p>
        {{
          l(
            "先核对当前企业、对象和动作范围，再填写并确认影响。未知结果请先查原记录；有权限问题联系企业负责人，有采集或环境问题交给获准运维人员。",
            "Check organization, target, and action scope before confirming effects. Query original records for unknown outcomes. Ask an owner about access, or authorized operators about collection and environments.",
          )
        }}
      </p>
      <p>
        {{
          l(
            "本版策略仍待确认：会话空闲30分钟/最长8小时；邀请72小时单次；同动作范围并集且委派不扩权；营销启动不含外部触达或扣费。生产目标、阈值与执行授权另行确认。",
            "Proposals pending review: 30-minute idle / 8-hour absolute session; 72-hour single-use invitation; same-action scope union without wider delegation; activation excludes outreach and charging. Production targets, thresholds, and execution authority require separate confirmation.",
          )
        }}
      </p>
    </details>
    <ElDialog
      :model-value="!!s.dialog && !s.dialog.inline"
      :title="s.dialog ? pair(s.dialog.title) : ''"
      width="580px"
      :close-on-click-modal="false"
      @close="s.dialog = null"
    >
      <template v-if="s.dialog"
        ><div class="full-confirm-context">
          <CheckCircle2 :size="20" />
          <div>
            <strong>{{
              s.dialog.permission === "platform"
                ? l("平台工作区", "Platform workspace")
                : s.legacy.organization || l("账号工作区", "Account workspace")
            }}</strong>
            <p>{{ roleTitle(s.role) }}</p>
          </div>
        </div>
        <p>
          {{
            l(
              "请核对以下目标和变化。确认只影响列出的对象，取消不会提交。",
              "Review these targets and changes. Confirmation affects only the listed records; cancellation submits nothing.",
            )
          }}
        </p>
        <ul class="full-targets">
          <li v-for="id in s.dialog.effect.ids" :key="id">{{ id }}</li>
        </ul>
        <dl class="full-facts">
          <template
            v-for="(value, key) in Object.fromEntries(
              Object.entries(s.dialog.effect.values).filter(([key]) => key !== 'versions'),
            )"
            :key="key"
            ><dt>{{ effectLabels[key] ? pair(effectLabels[key]) : key }}</dt>
            <dd>{{ effectValue(String(key), value) }}</dd></template
          >
        </dl>
        <p class="full-muted">
          {{
            l(
              "请求结果不明确时，保留原操作编号查询；不会根据超时盲目重做。",
              "If the outcome is uncertain, query its original reference instead of blindly repeating it.",
            )
          }}
        </p></template
      >
      <template #footer
        ><ElButton @click="s.dialog = null">{{ l("取消", "Cancel") }}</ElButton
        ><ElButton type="primary" :loading="s.busy" data-confirm-submit @click="s.confirm">{{
          l("确认提交", "Confirm submission")
        }}</ElButton></template
      >
    </ElDialog>
  </section>
</template>
