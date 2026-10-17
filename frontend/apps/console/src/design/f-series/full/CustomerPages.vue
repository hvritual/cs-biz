<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
} from "element-plus";
import { l } from "./copy";
import { useFullReviewState } from "./state";
const s = useFullReviewState();
const validation = ref("");
const filter = computed(() => s.draft("customer-filter", { text: "", page: 1, ownership: "all" }));
const current = computed(() =>
  s.scene === "not_found"
    ? undefined
    : s.query.target
      ? s.data.customers.find((x) => x.id === s.query.target)
      : s.data.customers[0],
);
const form = computed(() =>
  s.draft(`customer-${s.query.target || "C-1001"}`, {
    note: current.value?.note || "",
    version: current.value?.version || 1,
  }),
);
const bulk = computed(() =>
  s.draft("customer-batch", {
    text: "C-1001\nC-1002\n星河中心\nC-1005\nC-1006\nC-1001\nUNMATCHED",
    parsed: false,
    note: "下次服务前电话确认",
    excluded: [] as string[],
    resolved: {} as Record<string, string>,
  }),
);
const exportForm = computed(() => s.draft("export", { ids: [] as string[], format: "csv" }));
const rows = computed(() =>
  s.scene === "empty"
    ? []
    : s.data.customers.filter(
        (x) =>
          (x.name + x.id).toLowerCase().includes(filter.value.text.toLowerCase()) &&
          (filter.value.ownership !== "self" || s.owns(x.owner)),
      ),
);
const visible = computed(() =>
  rows.value.slice((filter.value.page - 1) * 4, filter.value.page * 4),
);
const eligibleExport = computed(() =>
  exportForm.value.ids.filter((id) =>
    s.data.customers.some((x) => x.id === id && s.readable(x, "export")),
  ),
);
const analyzed = computed(() => {
  const seen = new Set<string>();
  return bulk.value.text
    .split(/[\n,;]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((input, index) => {
      const key = String(index);
      let matches = s.data.customers.filter(
        (x) => x.id.toLowerCase() === input.toLowerCase() || x.name === input,
      );
      let state = "ready";
      if (seen.has(input.toLowerCase())) state = "duplicate";
      else if (!matches.length) state = "unavailable";
      else if (matches.length > 1 && !bulk.value.resolved[key]) state = "ambiguous";
      if (bulk.value.resolved[key])
        matches = matches.filter((x) => x.id === bulk.value.resolved[key]);
      if (state === "ready" && matches.some((x) => !s.readable(x, "update"))) state = "outside";
      seen.add(input.toLowerCase());
      return { key, input, matches, state, id: matches[0]?.id || "" };
    });
});
const selectedBatch = computed(() => [
  ...new Set(
    analyzed.value
      .filter((x) => x.state === "ready" && !bulk.value.excluded.includes(x.key))
      .map((x) => x.id),
  ),
]);
const unresolved = computed(() =>
  analyzed.value.some(
    (x) => ["ambiguous", "unavailable"].includes(x.state) && !bulk.value.excluded.includes(x.key),
  ),
);
function edit() {
  if (current.value) s.go("customer-edit", { target: current.value.id });
}
function save() {
  validation.value = "";
  if (!form.value.note.trim()) {
    validation.value = l("请填写服务备注。", "Enter a service note.");
    return;
  }
  if (current.value)
    s.request(
      ["核对客户修改", "Review customer update"],
      {
        kind: "customer",
        ids: [current.value.id],
        values: {
          name: current.value.name,
          note: form.value.note,
          version: String(form.value.version),
        },
      },
      "write",
    );
}
function toExport() {
  exportForm.value.ids = [...s.selected];
  s.go("export");
}
function submitBatch() {
  if (!selectedBatch.value.length || unresolved.value) return;
  s.request(
    ["核对批量修改范围", "Review batch update scope"],
    {
      kind: "batch",
      ids: [...selectedBatch.value],
      values: {
        note: bulk.value.note,
        versions: JSON.stringify(
          Object.fromEntries(
            s.data.customers
              .filter((x) => selectedBatch.value.includes(x.id))
              .map((x) => [x.id, x.version]),
          ),
        ),
      },
    },
    "write",
  );
}
function submitExport() {
  validation.value = "";
  if (!exportForm.value.ids.length || eligibleExport.value.length !== exportForm.value.ids.length) {
    validation.value = l(
      "请排除不在导出范围内的对象，不能用读取权限代替导出权限。",
      "Exclude targets outside export scope; read permission does not grant export permission.",
    );
    return;
  }
  s.request(
    ["核对客户导出", "Review customer export"],
    {
      kind: "export",
      ids: [...exportForm.value.ids],
      values: { name: l("选定集合，不含筛选之外对象", "Explicit selection only") },
    },
    "export",
  );
}
function reviewAgain() {
  if (current.value) form.value.version = current.value.version;
  s.setScene("normal");
}
function rowState(id: string) {
  const map: Record<string, readonly [string, string]> = {
    ready: ["可修改", "Writable"],
    duplicate: ["已去重", "Deduplicated"],
    unavailable: ["未匹配或不可访问", "Unmatched or inaccessible"],
    ambiguous: ["需要精确选择", "Exact selection required"],
    outside: ["可读但不可修改", "Readable, not writable"],
  };
  return map[id] ? l(...map[id]) : id;
}
</script>
<template>
  <div class="full-stack">
    <template v-if="s.page.id === 'customers'">
      <div class="full-grid three">
        <section class="full-card">
          <span>{{ l("当前筛选客户", "Customers in current filter") }}</span
          ><strong class="full-value">{{ rows.length }}</strong>
        </section>
        <section class="full-card">
          <span>{{ l("筛选内本人负责", "Owned by me in filter") }}</span
          ><strong class="full-value">{{ rows.filter((x) => s.owns(x.owner)).length }}</strong>
        </section>
        <section class="full-card">
          <span>{{ l("当前显式选定", "Explicit selection") }}</span
          ><strong class="full-value">{{ s.selected.length }}</strong>
        </section>
      </div>
      <section class="full-card">
        <div class="full-toolbar">
          <ElInput
            v-model="filter.text"
            clearable
            :aria-label="l('筛选客户', 'Filter customers')"
            :placeholder="l('客户名称或精确编号', 'Customer name or exact reference')"
            @input="
              filter.page = 1;
              s.selected = [];
            "
          /><ElSelect
            v-model="filter.ownership"
            :aria-label="l('负责关系筛选', 'Ownership filter')"
            @change="
              filter.page = 1;
              s.selected = [];
            "
            ><ElOption value="all" :label="l('当前企业全部', 'All in organization')" /><ElOption
              value="self"
              :label="l('本人负责', 'Owned by me')" /></ElSelect
          ><ElButton @click="s.go('batch')">{{
            l("文本批量选定", "Select by pasted text")
          }}</ElButton
          ><ElButton
            type="primary"
            :disabled="!s.selected.length || !s.can('export')"
            @click="toExport"
            >{{ l("导出选定集合", "Export selected set") }}</ElButton
          >
        </div>
        <p class="full-muted">
          {{
            l(
              "当前角色逐动作核对读取、修改与导出范围；负责、明确指派和指定集合分别判断。查看不等于选定，全选只作用于当前页。",
              "Current grants are evaluated per action using ownership, assignments and explicit sets. Viewing does not select; select-all affects only the current page.",
            )
          }}
        </p>
        <ElCheckboxGroup v-model="s.selected"
          ><div class="full-table-wrap">
            <table class="full-table">
              <thead>
                <tr>
                  <th>
                    <ElCheckbox
                      :model-value="
                        visible.length > 0 && visible.every((x) => s.selected.includes(x.id))
                      "
                      :aria-label="l('选定当前页', 'Select current page')"
                      @change="
                        (value) =>
                          (s.selected = value
                            ? [...new Set([...s.selected, ...visible.map((x) => x.id)])]
                            : s.selected.filter((id) => !visible.some((x) => x.id === id)))
                      "
                    />
                  </th>
                  <th>{{ l("客户", "Customer") }}</th>
                  <th>{{ l("编号", "Reference") }}</th>
                  <th>{{ l("负责关系", "Ownership") }}</th>
                  <th>{{ l("服务备注", "Service note") }}</th>
                  <th>{{ l("操作", "Action") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in visible" :key="row.id">
                  <td>
                    <ElCheckbox
                      :value="row.id"
                      :aria-label="l('选定客户', 'Select customer') + ' ' + row.id"
                    />
                  </td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.id }}</td>
                  <td>
                    {{
                      s.owns(row.owner)
                        ? l("本人负责", "Owned by me")
                        : l("其他成员负责", "Owned by another member")
                    }}
                  </td>
                  <td>{{ row.note || "—" }}</td>
                  <td>
                    <ElButton link type="primary" @click="s.go('customer', { target: row.id })">{{
                      l("查看详情", "View details")
                    }}</ElButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div></ElCheckboxGroup
        >
        <div v-if="!rows.length" class="full-empty">
          <p>{{ l("当前筛选没有客户", "No customers match this filter") }}</p>
          <ElButton
            @click="
              filter.text = '';
              filter.ownership = 'all';
              filter.page = 1;
            "
            >{{ l("清除筛选", "Clear filters") }}</ElButton
          >
        </div>
        <div class="full-pagination">
          <span class="full-muted">{{
            l("只统计当前可读取范围", "Counts include readable scope only")
          }}</span
          ><ElPagination
            v-model:current-page="filter.page"
            :total="rows.length"
            :page-size="4"
            layout="prev, pager, next"
          />
        </div>
      </section>
    </template>
    <section v-else-if="s.page.id === 'customer'" class="full-card">
      <template v-if="current"
        ><h2>{{ current.name }}</h2>
        <dl class="full-facts">
          <dt>{{ l("客户编号", "Customer reference") }}</dt>
          <dd>{{ current.id }}</dd>
          <dt>{{ l("负责关系", "Ownership") }}</dt>
          <dd>
            {{
              s.owns(current.owner)
                ? l("本人负责", "Owned by me")
                : l("其他成员负责", "Owned by another member")
            }}
          </dd>
          <dt>{{ l("当前版本", "Current version") }}</dt>
          <dd>{{ current.version }}</dd>
          <dt>{{ l("服务备注", "Service note") }}</dt>
          <dd>{{ current.note || "—" }}</dd>
        </dl>
        <p v-if="!s.readable(current, 'update') || !s.can('write')" class="full-message">
          {{
            l(
              "可以读取此客户，但不能因此获得修改权限。",
              "You can read this customer, but that does not grant update permission.",
            )
          }}
        </p>
        <div class="full-actions">
          <ElButton @click="s.go('customers')">{{
            l("返回并保留筛选", "Return with filters preserved")
          }}</ElButton
          ><ElButton
            type="primary"
            data-primary
            :disabled="!s.readable(current, 'update') || !s.can('write') || s.blocked"
            @click="edit"
            >{{ l("修改客户", "Edit customer") }}</ElButton
          >
        </div></template
      ><template v-else
        ><h2>{{ l("客户记录不可访问", "Customer record unavailable") }}</h2>
        <p>
          {{
            l(
              "没有可访问的记录，不透露其他企业是否存在该客户。",
              "No accessible record; this does not disclose customers in other organizations.",
            )
          }}
        </p>
        <ElButton @click="s.go('customers')">{{
          l("返回客户列表", "Back to customers")
        }}</ElButton></template
      >
    </section>
    <section v-else-if="s.page.id === 'customer-edit'" class="full-card">
      <h2>{{ current?.name }}</h2>
      <div class="full-form">
        <label
          >{{ l("服务备注", "Service note")
          }}<ElInput
            v-model="form.note"
            type="textarea"
            :rows="4"
            :aria-label="l('客户服务备注', 'Customer service note')"
            maxlength="300"
        /></label>
      </div>
      <p>
        {{
          l(
            "仅修改此客户备注，不变更负责关系、企业归属或其他客户。",
            "Only this customer’s note changes; ownership, organization, and other customers do not change.",
          )
        }}
      </p>
      <p v-if="validation" class="full-error-text" role="alert">{{ validation }}</p>
      <div class="full-actions">
        <ElButton @click="s.go('customer', { target: current?.id || '' })">{{
          l("取消修改", "Cancel edit")
        }}</ElButton
        ><ElButton
          v-if="
            ['conflict', 'owner_changed', 'csrf'].includes(s.scene) ||
            (current && form.version !== current.version)
          "
          @click="reviewAgain"
          >{{ l("保留输入并核对最新版本", "Keep input and review latest version") }}</ElButton
        ><ElButton
          type="primary"
          data-primary
          :disabled="!current || !s.readable(current, 'update') || !s.can('write') || s.blocked"
          @click="save"
          >{{ l("核对修改影响", "Review update effects") }}</ElButton
        >
      </div>
    </section>
    <section v-else-if="s.page.id === 'batch'" class="full-card">
      <h2>{{ l("先匹配，再确认逐项修改", "Match first, then confirm each target") }}</h2>
      <div class="full-form">
        <label
          >{{ l("客户编号或名称，每行一个", "Customer references or names, one per line")
          }}<ElInput
            v-model="bulk.text"
            type="textarea"
            :rows="6"
            :aria-label="l('批量客户输入', 'Bulk customer input')"
            @input="
              bulk.parsed = false;
              bulk.resolved = {};
              bulk.excluded = [];
            " /></label
        ><label
          >{{ l("统一服务备注", "Service note for selected targets")
          }}<ElInput v-model="bulk.note" :aria-label="l('批量服务备注', 'Batch service note')"
        /></label>
      </div>
      <div class="full-actions">
        <ElButton type="primary" @click="bulk.parsed = true">{{
          l("匹配并核对范围", "Match and review scope")
        }}</ElButton
        ><ElButton @click="s.go('customers')">{{
          l("返回客户列表", "Back to customers")
        }}</ElButton>
      </div>
      <template v-if="bulk.parsed"
        ><div class="full-message">
          <strong
            >{{ l("最终可修改集合", "Final writable selection") }}
            {{ selectedBatch.length }}</strong
          >
          <p>
            {{
              l(
                "只在当前企业的可读取范围匹配；未匹配与不可访问使用相同反馈。同名项需要明确选择，选定不会执行。",
                "Match only within readable scope in this organization. Unmatched and inaccessible entries share one response. Resolve same-name matches explicitly; selection does not execute.",
              )
            }}
          </p>
        </div>
        <div class="full-table-wrap">
          <table class="full-table">
            <thead>
              <tr>
                <th>{{ l("输入", "Input") }}</th>
                <th>{{ l("核对结果", "Review result") }}</th>
                <th>{{ l("匹配或排除", "Resolve or exclude") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in analyzed" :key="row.key">
                <td>{{ row.input }}</td>
                <td>
                  {{
                    bulk.excluded.includes(row.key) ? l("已排除", "Excluded") : rowState(row.state)
                  }}
                </td>
                <td>
                  <ElSelect
                    v-if="row.state === 'ambiguous'"
                    v-model="bulk.resolved[row.key]"
                    :aria-label="l('消歧', 'Resolve match') + ' ' + row.input"
                    ><ElOption
                      v-for="candidate in row.matches"
                      :key="candidate.id"
                      :value="candidate.id"
                      :label="`${candidate.id} · ${candidate.note} · ${s.owns(candidate.owner) ? l('本人负责', 'Owned by me') : l('其他成员负责', 'Owned by another member')}`" /></ElSelect
                  ><ElButton
                    v-if="['ambiguous', 'unavailable'].includes(row.state)"
                    link
                    @click="bulk.excluded = [...new Set([...bulk.excluded, row.key])]"
                    >{{ l("排除此项", "Exclude item") }}</ElButton
                  ><span v-if="row.state === 'ready'">{{ row.id }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="full-actions">
          <ElButton
            @click="
              bulk.excluded = analyzed
                .filter((x) => ['ambiguous', 'unavailable'].includes(x.state))
                .map((x) => x.key)
            "
            >{{ l("排除无法处理项目", "Exclude unresolved items") }}</ElButton
          ><ElButton
            type="primary"
            data-primary
            :disabled="
              !selectedBatch.length ||
              unresolved ||
              !bulk.note.trim() ||
              !s.can('write') ||
              s.blocked
            "
            @click="submitBatch"
            >{{ l("核对选定集合与影响", "Review selected targets and effects") }}</ElButton
          >
        </div></template
      >
    </section>
    <section v-else class="full-card">
      <h2>{{ l("核对本次导出集合", "Review this export selection") }}</h2>
      <p>
        {{
          l(
            "导出使用自己的动作权限与范围，读取客户不代表能导出。只导出本次明确选定且仍有权导出的对象，不扩成全部筛选。",
            "Export has its own permission and scope. Reading does not grant export. Include only this explicitly selected, currently exportable set, never the entire filter.",
          )
        }}
      </p>
      <div v-if="!exportForm.ids.length" class="full-empty">
        <p>
          {{
            l(
              "尚未选择客户。请返回列表明确选定。",
              "No customers selected. Return to the list to choose targets.",
            )
          }}
        </p>
        <ElButton @click="s.go('customers')">{{
          l("返回选定客户", "Back to select customers")
        }}</ElButton>
      </div>
      <ul v-else class="full-targets">
        <li v-for="id in exportForm.ids" :key="id">
          {{ id }} ·
          {{
            eligibleExport.includes(id)
              ? l("当前可导出", "Currently exportable")
              : l("不在导出范围", "Outside export scope")
          }}
        </li>
      </ul>
      <p v-if="validation" class="full-error-text" role="alert">{{ validation }}</p>
      <div class="full-actions">
        <ElButton
          v-if="eligibleExport.length !== exportForm.ids.length"
          @click="exportForm.ids = [...eligibleExport]"
          >{{ l("排除不可导出项目", "Exclude unexportable targets") }}</ElButton
        ><ElButton @click="s.go('customers')">{{ l("取消并返回", "Cancel and return") }}</ElButton
        ><ElButton
          type="primary"
          data-primary
          :disabled="!exportForm.ids.length || !s.can('export') || s.blocked"
          @click="submitExport"
          >{{ l("核对并创建导出记录", "Review and create export record") }}</ElButton
        >
      </div>
      <p class="full-muted">
        {{
          l(
            "文件只有明确完成后才可下载，下载时重新核对权限和有效期。",
            "Files are downloadable only after confirmed completion, with permission and validity checked again.",
          )
        }}
      </p>
    </section>
  </div>
</template>
