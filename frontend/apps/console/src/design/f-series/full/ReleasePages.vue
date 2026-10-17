<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElCheckbox, ElDialog, ElInput, ElOption, ElSelect, ElTag } from "element-plus";
import { l } from "./copy";
import { useFullReviewState } from "./state";
const s = useFullReviewState();
const evidence = ref("");
const validation = ref("");
const plan = computed(() =>
  s.draft("release-plan", {
    target: "nonproduction-review",
    version: "review-r003",
    range: "审阅环境全量",
    note: "",
    confirmed: false,
  }),
);
const recovery = computed(() =>
  s.draft("recovery-plan", {
    target: "nonproduction-review",
    version: "review-previous",
    backup: "review-backup-003",
    note: "",
    confirmed: false,
  }),
);
const checks = computed(() => [
  {
    id: "version",
    title: l("固定应用、Consumer 与结构版本", "Fixed application, Consumer, and schema versions"),
    state: "ready",
    help: l(
      "核对真实制品摘要与兼容源，不以名称代替固定版本。",
      "Check actual artifact digests and compatibility sources, not version names alone.",
    ),
  },
  {
    id: "migration",
    title: l("迁移与备份恢复", "Migration, backup, and restore"),
    state: s.scene === "failed" ? "failed" : "ready",
    help: l(
      "真实迁移、恢复与读回记录必须绑定目标版本。",
      "Actual migration, restore, and readback must match the target versions.",
    ),
  },
  {
    id: "security",
    title: l("隔离、撤权与并发", "Isolation, revocation, and concurrency"),
    state: s.scene === "partial" ? "missing" : "ready",
    help: l(
      "需要真实业务接口和数据库正反例，预览不能替代。",
      "Real business interfaces and database positive/negative tests are required; previews are insufficient.",
    ),
  },
  {
    id: "transport",
    title: l("全部受保护入口与后台处理", "All protected entrypoints and background handling"),
    state: "ready",
    help: l(
      "完整入口、内部调用、后台处理、装配及回退证据。",
      "Complete entrypoint, internal call, background, assembly, and rollback coverage.",
    ),
  },
  {
    id: "observability",
    title: l("采集故障与非敏感排障", "Collection failures and safe diagnostics"),
    state: s.scene === "unavailable" ? "missing" : "ready",
    help: l(
      "默认终端日志、可选远端采集、故障降级与查询权限。",
      "Default terminal logs, optional remote collection, failure behavior, and query access.",
    ),
  },
  {
    id: "production",
    title: l("生产目标、阈值与执行授权", "Production target, thresholds, and execution authority"),
    state: "missing",
    help: l(
      "目标、容量与服务目标、恢复要求、留存/费用预算及操作者仍待确认。",
      "Target, capacity, service objectives, recovery, retention/cost budget, and operator remain unconfirmed.",
    ),
  },
]);
function stateText(id: string) {
  const labels: Record<string, string> = {
    ready: l("样例材料可审阅", "Example evidence ready for review"),
    missing: l("待补齐", "Missing"),
    failed: l("存在失败记录", "Failure recorded"),
    unknown: l("结果待确认", "Outcome unknown"),
    pending: l("尚在推进", "In progress"),
    paused: l("已暂停", "Paused"),
  };
  return labels[id] || id;
}
const stages = computed(() =>
  [
    l("制品与目标核对", "Artifact and target review"),
    l("迁移与兼容核对", "Migration and compatibility review"),
    l("首批范围观察", "Initial scope observation"),
    l("后续范围核对", "Further scope review"),
    l("最终结果读回", "Final outcome readback"),
  ].map((title, index) => ({
    title,
    state:
      s.scene === "failed" && index === 2
        ? "failed"
        : s.scene === "unknown" && index >= 2
          ? "unknown"
          : s.scene === "pending" && index >= 2
            ? "pending"
            : s.scene === "partial" && index >= 3
              ? "missing"
              : s.scene === "paused" && index >= 2
                ? "paused"
                : "ready",
  })),
);
function submit() {
  validation.value = "";
  const p = s.page.id === "recovery" ? recovery.value : plan.value;
  if (!p.version.trim() || !p.target || !p.confirmed) {
    validation.value = l(
      "请核对固定版本、目标及影响确认。",
      "Review the fixed version, target, and impact confirmation.",
    );
    return;
  }
  s.request(
    s.page.id === "recovery"
      ? ["核对恢复审阅方案", "Review recovery plan"]
      : ["核对发布审阅方案", "Review release plan"],
    {
      kind: s.page.id === "recovery" ? "recovery" : "release",
      ids: [p.target],
      values: {
        target: p.target,
        version: p.version,
        confirmation: l(
          "已核对审阅范围与风险，不是实际生产授权",
          "Review scope and risks checked; not actual production authority",
        ),
        note: p.note,
        ...(s.page.id === "recovery"
          ? { backup: recovery.value.backup }
          : { range: plan.value.range }),
      },
    },
    "ops",
  );
}
</script>
<template>
  <div class="full-stack">
    <aside class="full-message" role="note">
      <strong>{{ l("运维证据与方案审阅视图", "Operator evidence and plan review") }}</strong>
      <p>
        {{
          l(
            "这里展示拟议资格、进度与恢复信息，操作只保存审阅记录。没有连接部署、数据库或备份系统，不形成新增生产控制台交付承诺。",
            "This presents proposed qualification, progress, and recovery. Actions save review records only. No deployment, database, or backup system is connected; no new production-control-console commitment is created.",
          )
        }}
      </p>
    </aside>
    <section v-if="s.page.id === 'qualification'" class="full-card">
      <h2>
        {{ l("先核对资格，再决定目标环境", "Review qualification before choosing an environment") }}
      </h2>
      <p>
        {{
          l(
            "样例材料用于页面审阅，不是真实生产证据。生产条件缺失不阻塞已获准的非生产工作。",
            "Example evidence is for page review, not production proof. Missing production conditions do not block authorized nonproduction work.",
          )
        }}
      </p>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("资格项目", "Qualification item") }}</th>
              <th>{{ l("当前呈现", "Displayed state") }}</th>
              <th>{{ l("核对", "Review") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in checks" :key="row.id">
              <td>{{ row.title }}</td>
              <td>
                <ElTag :type="row.state === 'ready' ? 'info' : 'warning'">{{
                  stateText(row.state)
                }}</ElTag>
              </td>
              <td>
                <ElButton link @click="evidence = row.id">{{
                  l("查看所需依据", "Inspect required evidence")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="full-actions">
        <ElButton type="primary" data-primary @click="s.go('release')">{{
          l("核对非生产审阅计划", "Review nonproduction plan")
        }}</ElButton
        ><ElButton @click="s.go('telemetry')">{{
          l("核对观测与降级", "Review observability and degradation")
        }}</ElButton>
      </div>
    </section>
    <section v-else-if="s.page.id === 'release'" class="full-card">
      <h2>{{ l("目标、固定版本与阶段范围", "Target, fixed version, and stage scope") }}</h2>
      <div class="full-form">
        <label
          >{{ l("目标环境", "Target environment")
          }}<ElSelect v-model="plan.target" :aria-label="l('发布审阅目标', 'Release review target')"
            ><ElOption
              value="nonproduction-review"
              :label="l('非生产审阅环境', 'Nonproduction review environment')" /><ElOption
              value="production"
              disabled
              :label="
                l('生产目标尚未命名或授权', 'Production target not named or authorized')
              " /></ElSelect></label
        ><label
          >{{ l("固定候选版本", "Fixed candidate version")
          }}<ElInput
            v-model="plan.version"
            :aria-label="l('发布候选版本', 'Release candidate version')" /></label
        ><label
          >{{ l("阶段范围", "Stage scope")
          }}<ElInput
            v-model="plan.range"
            :aria-label="l('发布阶段范围', 'Release stage scope')" /></label
        ><label
          >{{ l("核对记录", "Review notes")
          }}<ElInput
            v-model="plan.note"
            type="textarea"
            :rows="3"
            :aria-label="l('发布核对记录', 'Release review notes')" /></label
        ><ElCheckbox v-model="plan.confirmed">{{
          l(
            "已核对目标、版本、观察与恢复方案；本次仅记录审阅计划",
            "Target, version, observation, and recovery reviewed; this records a review plan only",
          )
        }}</ElCheckbox>
      </div>
      <div class="full-message">
        <p>
          {{
            l(
              "生产阈值、容量、恢复点/恢复时间、采样/留存与发布/回滚操作者需实际负责人确认。勾选不能替代授权。",
              "Production thresholds, capacity, recovery objectives, sampling/retention, and release/recovery operators require actual owner confirmation. This checkbox does not grant authority.",
            )
          }}
        </p>
      </div>
      <p v-if="validation" class="full-error-text" role="alert">{{ validation }}</p>
      <div class="full-actions">
        <ElButton @click="s.go('qualification')">{{
          l("返回资格材料", "Back to qualification")
        }}</ElButton
        ><ElButton type="primary" data-primary :disabled="s.blocked" @click="submit">{{
          l("核对计划与影响", "Review plan and effects")
        }}</ElButton>
      </div>
    </section>
    <section v-else-if="s.page.id === 'rollout'" class="full-card">
      <h2>{{ l("保留阶段范围与未知结果", "Retain stage scope and unknown outcomes") }}</h2>
      <p>
        {{
          l(
            "这是进度呈现样例。受理不等于部署完成；部分生效、失败或未知时先读回目标环境。",
            "This is a progress example. Acceptance is not deployment completion; read back partial, failed, or unknown stages first.",
          )
        }}
      </p>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("阶段", "Stage") }}</th>
              <th>{{ l("状态", "State") }}</th>
              <th>{{ l("依据", "Evidence") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in stages" :key="index">
              <td>{{ index + 1 }} · {{ row.title }}</td>
              <td>{{ stateText(row.state) }}</td>
              <td>
                <ElButton link @click="evidence = 'stage-' + index">{{
                  l("核对本阶段事实", "Review stage facts")
                }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="full-actions">
        <ElButton @click="s.go('tasks')">{{
          l("查看原审阅操作", "View original review activity")
        }}</ElButton
        ><ElButton type="primary" data-primary @click="s.go('recovery')">{{
          l("核对恢复或回滚方案", "Review recovery or rollback plan")
        }}</ElButton
        ><ElButton @click="s.go('qualification')">{{
          l("回到资格缺口", "Return to qualification gaps")
        }}</ElButton>
      </div>
    </section>
    <section v-else class="full-card">
      <h2>
        {{
          l(
            "先读回，再核对兼容性与恢复影响",
            "Read back first, then review compatibility and recovery",
          )
        }}
      </h2>
      <div class="full-form">
        <label
          >{{ l("恢复目标", "Recovery target")
          }}<ElSelect
            v-model="recovery.target"
            :aria-label="l('恢复审阅目标', 'Recovery review target')"
            ><ElOption
              value="nonproduction-review"
              :label="l('非生产审阅环境', 'Nonproduction review environment')" /><ElOption
              value="production"
              disabled
              :label="
                l('生产环境需独立真实授权', 'Production requires separate actual authority')
              " /></ElSelect></label
        ><label
          >{{ l("目标恢复版本", "Target recovery version")
          }}<ElInput
            v-model="recovery.version"
            :aria-label="l('恢复目标版本', 'Recovery target version')" /></label
        ><label
          >{{ l("备份材料编号", "Backup evidence reference")
          }}<ElInput
            v-model="recovery.backup"
            :aria-label="l('备份材料编号', 'Backup evidence reference')" /></label
        ><label
          >{{ l("当前事实、数据兼容与接管记录", "Current facts, compatibility, and handoff notes")
          }}<ElInput
            v-model="recovery.note"
            type="textarea"
            :rows="4"
            :aria-label="l('恢复核对记录', 'Recovery review notes')" /></label
        ><ElCheckbox v-model="recovery.confirmed">{{
          l(
            "已核对当前版本、已生效范围、数据兼容及影响",
            "Current version, applied scope, data compatibility, and effects reviewed",
          )
        }}</ElCheckbox>
      </div>
      <div class="full-message warning">
        <strong>{{
          l("回滚不能替代业务结果核对", "Rollback does not replace business outcome checks")
        }}</strong>
        <p>
          {{
            l(
              "恢复代码或数据不保证撤销外部触达、扣费或其他副作用。结果未知先查原记录，无明确授权不执行。",
              "Restoring code or data does not guarantee reversal of outreach, charges, or other effects. Query unknowns first; do not execute without authority.",
            )
          }}
        </p>
      </div>
      <p v-if="validation" class="full-error-text" role="alert">{{ validation }}</p>
      <div class="full-actions">
        <ElButton @click="s.go('rollout')">{{
          l("取消并返回阶段状态", "Cancel and return to stages")
        }}</ElButton
        ><ElButton type="primary" data-primary :disabled="s.blocked" @click="submit">{{
          l("核对恢复方案", "Review recovery plan")
        }}</ElButton>
      </div>
    </section>
    <ElDialog
      :model-value="!!evidence"
      :title="l('资格与阶段依据', 'Qualification and stage evidence')"
      width="560px"
      @close="evidence = ''"
      ><template v-if="checks.find((x) => x.id === evidence)"
        ><h3>{{ checks.find((x) => x.id === evidence)?.title }}</h3>
        <p>{{ checks.find((x) => x.id === evidence)?.help }}</p></template
      >
      <p v-else>
        {{
          l(
            "实际记录必须包含固定候选、目标、操作者、时间、已生效范围、未知部分及读回结果。当前只展示审阅结构。",
            "Actual records require a fixed candidate, target, operator, time, applied scope, unknowns, and readback. This shows the review structure only.",
          )
        }}
      </p>
      <p>
        {{
          l(
            "原始记录和独立核验是必需项；缺失材料不能用绿色状态或按钮点击替代。",
            "Original evidence and independent verification are required; green states and clicks do not replace missing evidence.",
          )
        }}
      </p>
      <template #footer
        ><ElButton type="primary" @click="evidence = ''">{{
          l("返回当前页面", "Return to page")
        }}</ElButton></template
      ></ElDialog
    >
  </div>
</template>
