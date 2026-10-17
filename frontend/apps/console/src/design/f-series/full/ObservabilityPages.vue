<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElDialog, ElInput, ElOption, ElSelect, ElTag } from "element-plus";
import { l, statusTitle } from "./copy";
import { useFullReviewState } from "./state";
const s = useFullReviewState();
const searched = ref(false);
const handoff = ref(false);
const search = computed(() =>
  s.draft("diagnostic-search", { reference: s.journeyMode ? String(s.query.reference || '') : "trace-review-003", source: "all" }),
);
const auditFilter = computed(() => s.draft("audit-filter", { text: "", result: "all" }));
const audit = computed(() =>
  s.scene === "empty"
    ? []
    : s.data.audits.filter(
        (x) =>
          (x.id + x.action + x.object + x.task).includes(auditFilter.value.text) &&
          (auditFilter.value.result === "all" || x.result === auditFilter.value.result),
      ),
);
const sources = computed(() =>
  s.scene === "no_sample" || s.scene === "not_found" || s.scene === "unavailable"
    ? []
    : [
        {
          stage: l("页面与用户动作", "Page and user action"),
          source: "Browser",
          status: "complete",
          result: l("已记录安全错误或用户操作", "Safe error or user action recorded"),
        },
        {
          stage: l("可信身份与工作区", "Trusted identity and workspace"),
          source: "BFF",
          status: "complete",
          result: l("当前主体与企业分别核对", "Subject and organization checked separately"),
        },
        {
          stage: l("动作与范围校验", "Action and scope checks"),
          source: "Yunka",
          status: "complete",
          result: l("未将排障编号用作权限", "Support reference is not authorization"),
        },
        {
          stage: l("领域记录与存储", "Domain records and storage"),
          source: "Domain",
          status: s.scene === "partial" ? "missing" : "complete",
          result: l("不显示客户字段或查询参数", "No customer fields or query parameters shown"),
        },
        {
          stage: l("后台事件与结果", "Background event and outcome"),
          source: "Worker",
          status: s.scene === "partial" ? "missing" : "complete",
          result: l("效果仍以原操作回执为准", "Original activity receipt confirms effects"),
        },
      ].filter((x) => search.value.source === "all" || search.value.source === x.source).map(x => s.journeyMode ? {...x,status:'missing',result:l('此来源未连接；保留本次原编号，不推断外部效果。','This source is not connected. Retain the original reference; external effects are unverified.')} : x),
);
function lookup() {
  searched.value = true;
  if (s.journeyMode && !s.supportActivities.some(t => [t.id,t.trace].includes(search.value.reference))) {
    searched.value = false;
    s.announce(['当前范围内未找到此编号','Reference unavailable in current scope'],['请核对原编号与当前企业；不会跨企业查询或读取业务私有结果。','Check the original reference and organization. No cross-organization search or private business result is exposed.'],'warning');
    return;
  }
  if (!/^[a-zA-Z0-9-]{6,100}$/.test(search.value.reference)) {
    s.announce(
      ["请输入安全的记录编号", "Enter a valid safe reference"],
      [
        "不能用凭据、客户字段或整段错误堆栈查询。",
        "Do not enter credentials, customer fields, or entire error stacks.",
      ],
      "error",
    );
    searched.value = false;
  }
}
const errorTitle = computed(
  () =>
    ({
      unauthenticated: l("请重新登录", "Please sign in again"),
      forbidden: l("当前没有访问权限", "Access is not granted"),
      not_found: l("记录不可访问", "Record unavailable"),
      server_error: l("暂时无法完成", "Temporarily unable to complete"),
      timeout: l("请求超时，结果需核对", "Request timed out; check outcome"),
      cancelled: l("已停止等待，操作未撤销", "Stopped waiting; action not undone"),
      client_error: l("当前页面无法继续", "This page cannot continue"),
    })[s.scene] || l("操作反馈与恢复", "Action feedback and recovery"),
);
function signIn() {
  const record = s.taskMode && typeof s.query.record === 'string' ? s.query.record : '';
  s.legacy.signOut();
  s.go("identity", record ? { returnRecord: record } : {});
}
function originalRecord() {
  const record = typeof s.query.record === 'string' ? s.query.record : '';
  if (s.taskMode && s.visibleTasks.some(task => task.id === record)) s.go('task', {record});
  else s.go('tasks');
}
</script>
<template>
  <div class="full-stack">
    <section v-if="s.page.id === 'diagnostics'" class="full-card">
      <h2>
        {{
          l("按安全编号查找当前授权范围内的来源", "Search sources within current diagnostic scope")
        }}
      </h2>
      <p>
        {{
          l(
            "查询限定当前企业和获准环境。没有采样、来源丢失与业务未执行是不同事实。",
            "Search is limited to the current organization and authorized environment. Missing samples, missing sources, and unexecuted business actions are different facts.",
          )
        }}
      </p>
      <div class="full-toolbar">
        <ElInput
          v-model="search.reference"
          :aria-label="l('排障或操作编号', 'Support or activity reference')"
          :placeholder="l('输入安全排障编号', 'Enter safe support reference')"
          @keyup.enter="lookup"
        /><ElSelect v-model="search.source" :aria-label="l('诊断来源', 'Diagnostic source')"
          ><ElOption value="all" :label="l('全部可用来源', 'All available sources')" /><ElOption
            v-for="id in ['Browser', 'BFF', 'Yunka', 'Domain', 'Worker']"
            :key="id"
            :value="id"
            :label="id" /></ElSelect
        ><ElButton type="primary" data-primary @click="lookup">{{
          l("查询记录", "Search records")
        }}</ElButton
        ><ElButton @click="s.copy(search.reference)">{{
          l("复制编号", "Copy reference")
        }}</ElButton>
      </div>
      <template v-if="searched"
        ><div class="full-message" role="status">
          <strong>{{
            sources.length
              ? l("已返回获准来源", "Authorized sources returned")
              : l("未找到可用来源记录", "No available source records")
          }}</strong>
          <p>
            {{
              l(
                "来源状态分别保留。排障链无法单独证明外部效果是否生效，必须查询原操作。",
                "Source status is retained separately. This chain cannot prove external effects; query the original activity.",
              )
            }}
          </p>
        </div>
        <div v-if="sources.length" class="full-table-wrap">
          <table class="full-table">
            <thead>
              <tr>
                <th>{{ l("阶段", "Stage") }}</th>
                <th>{{ l("来源", "Source") }}</th>
                <th>{{ l("来源状态", "Source status") }}</th>
                <th>{{ l("可确认事实", "Confirmed fact") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sources" :key="row.source">
                <td>{{ row.stage }}</td>
                <td>{{ row.source }}</td>
                <td>
                  <ElTag :type="row.status === 'complete' ? 'success' : 'warning'">{{
                    row.status === "complete"
                      ? l("来源可用", "Source available")
                      : l("记录缺失", "Record missing")
                  }}</ElTag>
                </td>
                <td>{{ row.result }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="full-actions">
          <ElButton @click="handoff = true">{{
            l("核对支持接管步骤", "Review support handoff")
          }}</ElButton
          ><ElButton @click="s.go('tasks')">{{
            l("按业务权限查询原结果", "Query outcome with business permission")
          }}</ElButton>
        </div></template
      >
      <p v-else class="full-empty">
        {{
          l(
            "输入编号后查询，不跨企业自动搜索。",
            "Enter a reference to search; no automatic cross-organization search.",
          )
        }}
      </p>
    </section>
    <section v-else-if="s.page.id === 'audit'" class="full-card">
      <h2>
        {{ l("审计按当前企业和查询权限隔离", "Audit is scoped to organization and query grants") }}
      </h2>
      <div class="full-toolbar">
        <ElInput
          v-model="auditFilter.text"
          clearable
          :aria-label="l('筛选审计记录', 'Filter audit records')"
          :placeholder="l('操作编号或对象编号', 'Activity or target reference')"
        /><ElSelect v-model="auditFilter.result" :aria-label="l('审计结果', 'Audit result')"
          ><ElOption value="all" :label="l('全部结果', 'All outcomes')" /><ElOption
            v-for="id in ['succeeded', 'failed', 'unknown', 'partial']"
            :key="id"
            :value="id"
            :label="statusTitle(id)"
        /></ElSelect>
      </div>
      <div class="full-table-wrap">
        <table class="full-table">
          <thead>
            <tr>
              <th>{{ l("审计编号", "Audit reference") }}</th>
              <th>{{ l("操作人", "Actor") }}</th>
              <th>{{ l("动作类别", "Action category") }}</th>
              <th>{{ l("目标编号", "Target reference") }}</th>
              <th>{{ l("结果", "Outcome") }}</th>
              <th>{{ l("原操作", "Original activity") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in audit" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.actor }}</td>
              <td>{{ row.action }}</td>
              <td>{{ row.object }}</td>
              <td>{{ statusTitle(row.result) }}</td>
              <td>
                <ElButton link @click="s.go('task', { record: row.task })">{{ row.task }}</ElButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!audit.length" class="full-empty">
        {{ l("当前没有可读取的审计记录", "No readable audit records in this context") }}
      </p>
      <p class="full-muted">
        {{
          l(
            "不包含凭据、验证码、客户敏感字段或内部堆栈；部分来源不可用时不宣称记录完整。",
            "No credentials, verification codes, sensitive customer fields, or internal stacks. Unavailable sources are not treated as complete.",
          )
        }}
      </p>
    </section>
    <section v-else-if="s.page.id === 'telemetry'" class="full-card">
      <h2>
        {{ l("日志默认输出，远端采集可选", "Default terminal logs, optional remote collection") }}
      </h2>
      <div class="full-grid">
        <div class="full-card">
          <h3>{{ l("终端结构化日志", "Structured terminal logs") }}</h3>
          <ElTag type="success">{{ l("保持输出", "Output continues") }}</ElTag>
          <p>
            {{
              l(
                "远端采集关闭或故障不改变业务授权，也不阻塞业务请求。",
                "Disabling or losing remote collection does not change authorization or block business requests.",
              )
            }}
          </p>
        </div>
        <div class="full-card">
          <h3>{{ l("远端采集与可选SLS", "Remote collection and optional SLS") }}</h3>
          <ElTag :type="['unavailable', 'expired'].includes(s.scene) ? 'danger' : 'info'">{{
            s.scene === "disabled"
              ? l("未启用", "Disabled")
              : s.scene === "unavailable"
                ? l("暂不可用", "Unavailable")
                : s.scene === "rate_limited"
                  ? l("正在限流", "Rate limited")
                  : s.scene === "expired"
                    ? l("采集凭据需运维处理", "Collection credential requires operator action")
                    : l((s.journeyMode ? "待配置" : "等待环境策略审阅"), (s.journeyMode ? "Configuration needed" : "Awaiting environment policy review"))
          }}</ElTag>
          <p>
            {{
              l(
                "密钥仅由部署与采集系统管理，此页面不收集或展示密钥。",
                "Deployment and collection systems manage secrets. This page does not collect or display them.",
              )
            }}
          </p>
        </div>
      </div>
      <dl class="full-facts">
        <dt>{{ l("队列与重试", "Queues and retries") }}</dt>
        <dd>
          {{ l("有界，过载时显示降级与丢弃", "Bounded; overload reports degradation and drops") }}
        </dd>
        <dt>{{ l("采样与丢弃", "Sampling and drops") }}</dt>
        <dd>
          {{
            s.scene === "partial" || s.scene === "rate_limited"
              ? l(
                  "部分记录未保留，不能宣称全量可查",
                  "Some records were not retained; complete search is not claimed",
                )
              : l(
                  "策略和生产留存预算待环境负责人确认",
                  "Production policy and retention budget require environment-owner confirmation",
                )
          }}
        </dd>
        <dt>{{ l("业务效果确认", "Business effect verification") }}</dt>
        <dd>
          {{
            l(
              "按原操作记录，不以采集成功判定",
              "Use original activity records, not collection success",
            )
          }}
        </dd>
      </dl>
      <div class="full-actions">
        <ElButton @click="s.go('diagnostics')">{{
          l("核对可用诊断来源", "Inspect available diagnostic sources")
        }}</ElButton
        ><ElButton @click="s.go('qualification')">{{
          l("查看环境资格缺口", "Review qualification gaps")
        }}</ElButton
        ><ElButton @click="handoff = true">{{
          l("查看故障接管步骤", "View incident handoff steps")
        }}</ElButton>
      </div>
    </section>
    <section v-else class="full-state">
      <h2>{{ errorTitle }}</h2>
      <p>{{ l(s.scenario.help[0], s.scenario.help[1]) }}</p>
      <p>
        {{ l("安全排障编号", "Safe support reference") }}: <code>{{ s.supportReference }}</code>
      </p>
      <div class="full-actions">
        <ElButton @click="s.copy(s.supportReference)">{{
          l("复制排障编号", "Copy support reference")
        }}</ElButton
        ><ElButton v-if="s.scene === 'unauthenticated'" type="primary" @click="signIn">{{
          l("重新登录", "Sign in again")
        }}</ElButton
        ><ElButton
          v-else-if="['timeout', 'server_error', 'cancelled'].includes(s.scene)"
          type="primary"
          @click="originalRecord"
          >{{
            l("查询原操作，避免重复提交", "Check original activity before resubmitting")
          }}</ElButton
        ><ElButton v-else @click="s.go('organizations')">{{
          l("返回安全入口", "Return to a safe entry")
        }}</ElButton
        ><ElButton @click="handoff = true">{{
          l("查看处理建议", "View recovery guidance")
        }}</ElButton>
      </div>
      <p class="full-muted">
        {{
          l(
            "页面错误即使尚未发出请求，也可以保留安全编号；不会显示内部错误堆栈。",
            "Even page errors before a request can retain a safe reference, without exposing internal stacks.",
          )
        }}
      </p>
    </section>
    <ElDialog
      v-model="handoff"
      :title="l('支持与运维接管', 'Support and operator handoff')"
      width="560px"
      ><ol>
        <li>
          {{
            l(
              "保留当前企业、原操作编号、安全排障编号和已知结果。",
              "Keep the organization, original activity reference, support reference, and known outcome.",
            )
          }}
        </li>
        <li>
          {{
            l(
              "获准人员按当前环境与企业范围查询，分别记录来源缺失、采样和业务事实。",
              "Authorized staff query within current environment and organization scope, distinguishing missing sources, sampling, and business facts.",
            )
          }}
        </li>
        <li>
          {{
            l(
              "写入或外部效果未知时先查原记录，不根据Trace或超时盲重试。",
              "Query unknown writes and external effects against original records, never retry blindly based on traces or timeouts.",
            )
          }}
        </li>
        <li>
          {{
            l(
              "权限问题由企业授权管理员处理；采集、恢复与环境资格由获准运维人员接管。",
              "Delegated organization administrators handle access; authorized operators handle collection, recovery, and qualification.",
            )
          }}
        </li>
      </ol>
      <template #footer
        ><ElButton type="primary" @click="handoff = false">{{
          l("返回当前任务", "Return to current task")
        }}</ElButton></template
      ></ElDialog
    >
  </div>
</template>
