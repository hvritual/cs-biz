<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElInput, ElTag } from "element-plus";
import { l, statusTitle } from "./copy";
import { useFullReviewState } from "./state";
const s = useFullReviewState();
const router = useRouter();
const filter = computed(() => s.draft("campaign-filter", { text: "" }));
const rows = computed(() =>
  s.scene === "empty"
    ? []
    : s.data.campaigns.filter((x) => (x.name + x.id).includes(filter.value.text)),
);
const current = computed(() =>
  s.scene === "not_found"
    ? undefined
    : s.query.target
      ? s.data.campaigns.find((x) => x.id === s.query.target)
      : s.data.campaigns[0],
);
const canExecute = computed(
  () =>
    !!current.value &&
    s.owns(current.value.owner) &&
    current.value.state === "draft" &&
    s.can("write") &&
    !s.blocked,
);
function activate() {
  if (!current.value) return;
  s.request(
    ["启动营销活动", "Activate marketing campaign"],
    {
      kind: "campaign",
      ids: [current.value.id],
      values: { name: current.value.name, state: "active", version: String(current.value.version) },
    },
    "write",
  );
}
</script>
<template>
  <div class="full-stack">
    <section class="full-card">
      <h3>
        {{ l("营销使用权与后台菜单分开", "Marketing capability is separate from console menus") }}
      </h3>
      <p v-if="!s.hasConsoleMenu">
        {{
          l(
            "本能力样例有营销读取、本人活动执行权限，没有后台成员管理菜单。营销入口可以使用，后台深链仍须拒绝。",
            "This fixture grants campaign reading and activation of your own campaigns, without a console member-management menu. Marketing works while console deep links remain denied.",
          )
        }}
      </p>
      <p v-else>
        {{
          l(
            "当前后台导航与营销动作分别核对；没有菜单的合法营销成员仍可使用营销入口。",
            "Console navigation and marketing actions are checked separately. Authorized marketing members can use this entry without console menus.",
          )
        }}
      </p>
      <ElButton v-if="!s.hasConsoleMenu" @click="router.push('/members')">{{
        l("核对后台深链拒绝", "Check console deep-link denial")
      }}</ElButton>
    </section>
    <section v-if="s.page.id === 'campaigns'" class="full-card">
      <div class="full-toolbar">
        <ElInput
          v-model="filter.text"
          clearable
          :aria-label="l('筛选营销活动', 'Filter campaigns')"
          :placeholder="l('搜索活动名称或编号', 'Search campaign name or reference')"
        /><ElTag>{{
          l("读取当前企业 · 执行本人负责", "Read organization · Execute owned campaigns")
        }}</ElTag>
      </div>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("活动", "Campaign") }}</th>
              <th>{{ l("编号", "Reference") }}</th>
              <th>{{ l("负责关系", "Ownership") }}</th>
              <th>{{ l("状态", "Status") }}</th>
              <th>{{ l("操作", "Action") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ row.id }}</td>
              <td>
                {{
                  s.owns(row.owner)
                    ? l("本人负责", "Owned by me")
                    : l("其他成员负责", "Owned by another member")
                }}
              </td>
              <td>
                <ElTag :type="row.state === 'active' ? 'success' : 'info'">{{
                  row.state === "active" ? l("已启用", "Active") : statusTitle("draft")
                }}</ElTag>
              </td>
              <td>
                <ElButton type="primary" link @click="s.go('campaign', { target: row.id })">{{
                  l("查看活动", "View campaign")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!rows.length" class="full-empty">
        <h3>{{ l("当前没有符合条件的活动", "No matching campaigns") }}</h3>
        <ElButton @click="filter.text = ''">{{ l("清除筛选", "Clear filter") }}</ElButton>
      </div>
    </section>
    <section v-else-if="current" class="full-card">
      <div class="full-toolbar">
        <ElTag :type="current.state === 'active' ? 'success' : 'info'">{{
          current.state === "active" ? l("已启用", "Active") : statusTitle("draft")
        }}</ElTag
        ><span class="full-muted"
          >{{ current.id }} · {{ l("版本", "Version") }} {{ current.version }}</span
        >
      </div>
      <h2>{{ current.name }}</h2>
      <dl class="full-facts">
        <dt>{{ l("当前企业", "Organization") }}</dt>
        <dd>{{ s.legacy.organization }}</dd>
        <dt>{{ l("负责关系", "Ownership") }}</dt>
        <dd>
          {{
            s.owns(current.owner)
              ? l("本人负责", "Owned by me")
              : l("其他成员负责", "Owned by another member")
          }}
        </dd>
        <dt>{{ l("待确认效果", "Proposed effect") }}</dt>
        <dd>
          {{
            l(
              "草稿 → 启用；只变更此活动状态并保留原操作回执。",
              "Draft → active; update this campaign state and retain its original receipt.",
            )
          }}
        </dd>
        <dt>{{ l("外部影响", "External effects") }}</dt>
        <dd>
          {{
            l(
              "不发送信息、不发券、不触达客户、不扣费。",
              "No messaging, vouchers, customer outreach, or charging.",
            )
          }}
        </dd>
      </dl>
      <div v-if="!canExecute" class="full-message">
        <p>
          {{
            current.state === "active"
              ? l(
                  "该活动已经启用，不重复提交。",
                  "This campaign is already active and will not be submitted again.",
                )
              : l(
                  "此活动不在当前执行范围内，或当前身份没有执行权限。",
                  "This campaign is outside your execution scope or your identity has no execution grant.",
                )
          }}
        </p>
      </div>
      <div class="full-actions">
        <ElButton @click="s.go('campaigns')">{{ l("返回活动列表", "Back to campaigns") }}</ElButton
        ><ElButton type="primary" data-primary :disabled="!canExecute" @click="activate">{{
          l("核对并启动活动", "Review and activate campaign")
        }}</ElButton
        ><ElButton @click="s.go('tasks')">{{
          l("查看原操作结果", "View original activity results")
        }}</ElButton>
      </div>
    </section>
    <section v-else class="full-state">
      <h2>{{ l("没有可访问的活动", "No accessible campaign") }}</h2>
      <p>
        {{
          l(
            "不会据此透露其他企业的活动是否存在。",
            "This does not reveal whether a campaign exists in another organization.",
          )
        }}
      </p>
      <ElButton @click="s.go('campaigns')">{{
        l("返回可访问列表", "Return to accessible list")
      }}</ElButton>
    </section>
  </div>
</template>
