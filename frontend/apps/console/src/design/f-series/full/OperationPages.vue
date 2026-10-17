<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElInput, ElOption, ElSelect, ElTag } from "element-plus";
import { l, statusTitle } from "./copy";
import { useFullReviewState } from "./state";
import LocalOutcome from './LocalOutcome.vue';
const s = useFullReviewState();
const inspected = ref("");
const filter = computed(() => s.draft("task-filter", { text: "", state: "all" }));
const tasks = computed(() =>
  s.scene === "empty"
    ? []
    : s.visibleTasks.filter(
        (x) =>
          (x.id + x.title).includes(filter.value.text) &&
          (filter.value.state === "all" || x.status === filter.value.state),
      ),
);
const task = computed(() => (s.scene === "not_found" ? undefined : s.currentTask));
const deliveryRows = computed(() => [
  {
    id: "EV-REVIEW-001",
    cause: "ACT-REVIEW-001",
    state:
      s.scene === "deadletter"
        ? "deadletter"
        : s.scene === "retrying"
          ? "retrying"
          : s.scene === "pending"
            ? "queued"
            : "complete",
    attempt: s.scene === "retrying" ? 2 : 1,
  },
  {
    id: "EV-REVIEW-002",
    cause: "ACT-REVIEW-002",
    state: s.scene === "unknown" ? "unknown" : "deadletter",
    attempt: 3,
  },
]);
function returnToOrigin() {
  if (!task.value) return;
  if (task.value.effect.kind === "accept-invite") {
    s.continueInvitation(task.value);
    return;
  }
  const found = task.value.origin;
  const id = task.value.effect.ids[0] || "";
  if (found === "campaign") s.go("campaign", { target: id });
  else if (["customer", "customer-edit"].includes(found)) s.go("customer", { target: id });
  else if (found === "invite-create") s.go("invitations");
  else if (["tenant-create", "tenant", "module-grant"].includes(found)) s.go("tenants");
  else if (found === "role-edit") s.go("roles");
  else if (found === "members") s.go("members");
  else if (["release", "recovery"].includes(found)) s.go("rollout", { record: task.value.id });
  else s.go("customers");
}
function failedOnly() {
  if (!task.value) return;
  const ids = task.value.items.filter((x) => x.status === "failed").map((x) => x.id);
  if (!ids.length) return;
  if (task.value.effect.kind === "invite") {
    const form = s.draft("invite-create", {
      text: "",
      role: "reader",
      parsed: false,
      excluded: [] as string[],
    });
    form.text = ids.join("\n");
    form.role = task.value.effect.values.role || "reader";
    form.parsed = false;
    s.go("invite-create");
  } else if (task.value.effect.kind === "batch") {
    const form = s.draft("customer-batch", {
      text: "",
      parsed: false,
      note: "",
      excluded: [] as string[],
      resolved: {} as Record<string, string>,
    });
    form.text = ids.join("\n");
    form.note = task.value.effect.values.note || "";
    form.parsed = false;
    s.go("batch");
  }
}
</script>
<template>
  <div class="full-stack">
    <section v-if="s.page.id === 'tasks'" class="full-card">
      <div class="full-toolbar">
        <ElInput
          v-model="filter.text"
          clearable
          :aria-label="l('搜索操作记录', 'Search activities')"
          :placeholder="l('操作编号或名称', 'Activity reference or name')"
        /><ElSelect v-model="filter.state" :aria-label="l('操作结果筛选', 'Activity result filter')"
          ><ElOption value="all" :label="l('全部结果', 'All outcomes')" /><ElOption
            v-for="id in ['pending', 'unknown', 'partial', 'succeeded', 'failed']"
            :key="id"
            :value="id"
            :label="statusTitle(id)"
        /></ElSelect>
      </div>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("操作", "Activity") }}</th>
              <th>{{ l("原操作编号", "Original reference") }}</th>
              <th>{{ l("结果", "Outcome") }}</th>
              <th>{{ l("项目数", "Items") }}</th>
              <th>{{ l("操作", "Action") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tasks" :key="row.id">
              <td>{{ l(row.title, row.titleEn) }}</td>
              <td>
                <code>{{ row.id }}</code>
              </td>
              <td>
                <ElTag
                  :type="
                    row.status === 'succeeded'
                      ? 'success'
                      : row.status === 'failed'
                        ? 'danger'
                        : 'warning'
                  "
                  >{{ statusTitle(row.status) }}</ElTag
                >
              </td>
              <td>{{ row.items.length }}</td>
              <td>
                <ElButton link type="primary" @click="s.go('task', { record: row.id })">{{
                  l("查看原记录", "View original record")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!tasks.length" class="full-empty">
        <h3>{{ l("当前没有可读取的操作记录", "No readable activities in this context") }}</h3>
        <p>
          {{
            l(
              "仅展示当前账号、企业和权限允许的记录。可以返回业务页面发起一次审阅操作。",
              "Only records permitted for this account and organization are shown. Return to a business page to perform a review action.",
            )
          }}
        </p>
        <ElButton @click="s.go('campaigns')">{{ l("返回营销入口", "Back to marketing") }}</ElButton>
      </div>
    </section>
    <template v-else-if="s.page.id === 'task'">
      <LocalOutcome v-if="s.taskMode && task && s.inlineResult?.id !== task.id" :key="task.id" :task="task" />
      <section v-if="task" class="full-card">
        <div class="full-toolbar">
          <ElTag
            :type="
              task.status === 'succeeded'
                ? 'success'
                : task.status === 'failed'
                  ? 'danger'
                  : 'warning'
            "
            >{{ statusTitle(task.status) }}</ElTag
          ><code>{{ task.id }}</code
          ><ElButton link @click="s.copy(task.id)">{{
            l("复制操作编号", "Copy activity reference")
          }}</ElButton>
        </div>
        <h2>{{ l(task.title, task.titleEn) }}</h2>
        <dl class="full-facts">
          <dt>{{ l("操作目标企业", "Target organization") }}</dt>
          <dd>{{ s.taskTenantName(task) }}</dd>
          <dt>{{ l("效果边界", "Effect boundary") }}</dt>
          <dd>
            {{
              ["release", "recovery"].includes(task.effect.kind)
                ? l(
                    "仅记录审阅计划，不改变任何环境。",
                    "Records a review plan only; no environment changes.",
                  )
                : task.effect.kind === "invite"
                  ? l(
                      "邀请创建不等于投递成功或成员已加入。",
                      "Invitation creation does not mean delivery or membership.",
                    )
                  : task.effect.kind === "campaign"
                    ? l(
                        "只改变此活动状态，不含外部触达或扣费。",
                        "Only campaign state changes; no outreach or charging.",
                      )
                    : l("仅作用于下方明确列出的对象。", "Affects only the explicit targets below.")
            }}
          </dd>
          <dt>{{ l("安全排障编号", "Support reference") }}</dt>
          <dd>{{ task.trace }}</dd>
        </dl>
        <div class="full-message">
          <strong>{{
            l("以原操作记录和逐项结果为准", "Use original records and per-item outcomes")
          }}</strong>
          <p>
            {{
              l(
                "结果待确认时先查询，不新建第二次操作；取消等待不会撤销已经提交的内容。Trace只用于诊断。",
                "Query unknown outcomes before creating another action. Cancelling the wait does not undo submitted work. Traces are diagnostic only.",
              )
            }}
          </p>
        </div>
        <div class="full-table-wrap">
          <table class="full-table">
            <thead>
              <tr>
                <th>{{ l("目标", "Target") }}</th>
                <th>{{ l("结果", "Outcome") }}</th>
                <th>{{ l("原因或下一步", "Reason or next step") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in task.items" :key="item.id">
                <td>{{ item.label }}</td>
                <td>{{ statusTitle(item.status) }}</td>
                <td>
                  <span v-if="item.reason">{{ item.reason }}</span
                  ><ElButton
                    v-if="['unknown', 'pending'].includes(item.status)"
                    link
                    type="primary"
                    @click="s.queryTask(task.id, item.id)"
                    >{{ l("查询此项原结果", "Query this original item") }}</ElButton
                  ><span v-else-if="item.status === 'succeeded'">{{
                    l("已保留，不重复执行", "Retained; not repeated")
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="full-actions">
          <ElButton type="primary" data-primary @click="s.queryTask(task.id)">{{
            l("查询原操作结果", "Query original outcome")
          }}</ElButton
          ><ElButton @click="returnToOrigin">{{
            l("返回原业务对象", "Return to original business target")
          }}</ElButton
          ><ElButton
            v-if="
              !s.taskMode && task.items.some((x) => x.status === 'failed') &&
              ['invite', 'batch'].includes(task.effect.kind)
            "
            @click="failedOnly"
            >{{ l("仅核对明确失败项目", "Review confirmed failures only") }}</ElButton
          ><ElButton
            v-if="task.effect.kind === 'export'"
            :disabled="!task.items.some((x) => x.status === 'succeeded')"
            @click="s.download(task)"
            >{{ l("按当前权限下载文件", "Download with current permission") }}</ElButton
          ><ElButton @click="s.go('tasks')">{{ l("返回操作列表", "Back to activities") }}</ElButton>
        </div>
      </section>
      <section v-else class="full-state">
        <h2>{{ l("没有可读取的原操作", "No readable original activity") }}</h2>
        <p>
          {{
            l(
              "核对当前企业、账号及原编号。不能使用其他企业的记录，也不会自动重做。",
              "Check organization, account, and original reference. Other organizations’ records are not used and nothing is automatically repeated.",
            )
          }}
        </p>
        <ElButton @click="s.go('tasks')">{{ l("返回操作记录", "Back to activities") }}</ElButton>
      </section>
    </template>
    <section v-else class="full-card">
      <h2>{{ l("按关联链核对后台处理", "Inspect related background processing") }}</h2>
      <p>
        {{
          l(
            "只展示安全事件编号、重试状态和因果关系。运维身份不隐含读取客户字段的权限，业务效果必须由原操作记录确认。",
            "Only safe event references, retry status, and causality are shown. Operator identity does not grant customer-data access; original activity records confirm business effects.",
          )
        }}
      </p>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("事件编号", "Event reference") }}</th>
              <th>{{ l("关联操作", "Related activity") }}</th>
              <th>{{ l("处理状态", "Processing state") }}</th>
              <th>{{ l("尝试次数", "Attempts") }}</th>
              <th>{{ l("操作", "Action") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in deliveryRows" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.cause }}</td>
              <td>{{ statusTitle(row.state) }}</td>
              <td>{{ row.attempt }}</td>
              <td>
                <ElButton link @click="inspected = row.id">{{
                  l("查看处理依据", "Inspect processing evidence")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="inspected" class="full-row-detail">
        <h3>{{ inspected }}</h3>
        <dl class="full-facts">
          <dt>{{ l("关联链", "Correlation") }}</dt>
          <dd>correlation-review-003</dd>
          <dt>{{ l("触发原因", "Cause") }}</dt>
          <dd>causation-review-003</dd>
          <dt>{{ l("受控错误分类", "Safe error category") }}</dt>
          <dd>
            {{
              s.scene === "unknown"
                ? l("外部结果尚未确认", "External effect unconfirmed")
                : l("下游暂不可用", "Downstream temporarily unavailable")
            }}
          </dd>
        </dl>
        <p>
          {{
            l(
              "先查询业务效果，再由获准人员按运行手册接管。这里不提供盲目重投按钮，不把事件处理完成等同客户侧效果完成。",
              "Check business effects before authorized staff follow the runbook. No blind redrive is offered, and event completion does not prove customer-side completion.",
            )
          }}
        </p>
        <ElButton @click="s.go('diagnostics')">{{
          l("进入受控诊断", "Open authorized diagnostics")
        }}</ElButton
        ><ElButton @click="inspected = ''">{{ l("关闭详情", "Close details") }}</ElButton>
      </div>
    </section>
  </div>
</template>
