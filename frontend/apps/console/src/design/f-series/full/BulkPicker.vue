<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ElButton, ElInput, ElOption, ElSelect, ElTag } from 'element-plus';
import { analyzeSelection, readXlsx, type SelectionRecord } from './selection';
import { l } from './copy';
const props = defineProps<{ modelValue: string[]; records: SelectionRecord[]; scope: string; column?: string; templateUrl: string; allowEmpty?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]]; valid: [value: boolean] }>();
const method = ref('filter');
const query = ref(''); const text = ref(''); const fileError = ref(''); const filename = ref('');
const imported = ref<string[]>([]); const excluded = ref<string[]>([]); const resolved = ref<Record<string, string>>({});
const details = ref(false); const page = ref(1); const loading = ref(false); let importGeneration = 0;
const filtered = computed(() => props.records.filter(r => (r.id + r.name).toLowerCase().includes(query.value.toLowerCase())));
const inputs = computed(() => method.value === 'excel' ? imported.value : text.value.split(/[\n,;\t]/).map(s => s.trim()).filter(Boolean));
const analyzed = computed(() => analyzeSelection(inputs.value, props.records, resolved.value));
const finalRows = computed(() => analyzed.value.filter(r => r.state === 'ready' && !excluded.value.includes(r.key)));
const pending = computed(() => method.value !== 'filter' && analyzed.value.some(r => !['ready', 'duplicate'].includes(r.state) && !excluded.value.includes(r.key)));
const selected = computed(() => props.modelValue.map(id => props.records.find(r => r.id === id)).filter((r): r is SelectionRecord => !!r));
const valid = computed(() => !pending.value && !fileError.value && !loading.value && (props.allowEmpty || selected.value.length > 0) && selected.value.length === props.modelValue.length && selected.value.every(r => r.eligible));
watch(valid, value => emit('valid', value), { immediate: true });
watch([text, imported], () => { excluded.value = []; resolved.value = {}; }, { deep: true, flush: 'sync' });
watch(finalRows, rows => { if (method.value !== 'filter') emit('update:modelValue', rows.map(r => r.id)); }, { deep: true });
watch(method, () => { importGeneration++; fileError.value = ''; loading.value = false; });
onBeforeUnmount(() => { importGeneration++; });
function clearSelection() {
  importGeneration++; loading.value = false; fileError.value = ''; filename.value = '';
  text.value = ''; imported.value = []; excluded.value = []; resolved.value = {};
  emit('update:modelValue', []);
}
function addFiltered() {
  emit('update:modelValue', [...new Set([...props.modelValue, ...filtered.value.filter(r => r.eligible).map(r => r.id)])]);
}
function remove(id: string) {
  excluded.value.push(...analyzed.value.filter(r => r.id === id).map(r => r.key));
  emit('update:modelValue', props.modelValue.filter(v => v !== id));
}
function exclude(key: string) { excluded.value = [...excluded.value, key]; }
async function upload(event: Event) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0];
  if (!file) return;
  const generation = ++importGeneration;
  filename.value = file.name; loading.value = true; fileError.value = '';
  try {
    if (!/\.xlsx$/i.test(file.name) || file.size > 2 * 1024 * 1024) throw new Error(l('请选择2MiB以内的xlsx文件。', 'Choose an xlsx file up to 2MiB.'));
    const values = await readXlsx(new Uint8Array(await file.arrayBuffer()), props.column || '编号');
    if (generation !== importGeneration || method.value !== 'excel') return;
    imported.value = values;
  } catch (error) {
    if (generation === importGeneration) {
      const reason = error instanceof Error ? error.message : '无法读取此文件。';
      const row = reason.match(/第(\d+)行/);
      const english = row ? `Row ${row[1]}: ID/email must be non-empty text. Numeric references, formulas and extra columns are rejected.`
        : /1000/.test(reason) ? 'Import at most 1000 rows. Split the workbook into smaller files.'
        : /公式/.test(reason) ? 'Formulas are unsupported. Replace them with text values before importing.'
        : /列/.test(reason) ? 'Use the standard template with one unique ID/email text column and optional name column.'
        : /大|MiB|限制|大小/.test(reason) ? 'File exceeds the import limits: 2MiB compressed, 8MiB expanded, 1000 rows.'
        : 'The xlsx file is invalid, encrypted or unsupported. Download the standard template, save a plain xlsx workbook and import again.';
      fileError.value = l(reason, english);
    }
  }
  finally { if (generation === importGeneration) loading.value = false; input.value = ''; }
}
function stateLabel(state: string) {
  const labels: Record<string, [string, string]> = { ready: ['已匹配', 'Matched'], duplicate: ['已去重', 'Deduplicated'], unavailable: ['未匹配或不可访问', 'Unmatched or inaccessible'], ambiguous: ['请选择明确对象', 'Choose exact target'], outside: ['不在本次操作范围', 'Outside this action scope'] };
  return labels[state] ? l(...labels[state]) : state;
}
</script>
<template>
  <section class="bulk-picker" :aria-label="l('选取工作区', 'Selection workspace')" data-bulk-picker>
    <div class="bulk-methods" role="group" :aria-label="l('选取方式', 'Selection method')">
      <ElButton v-for="entry in [['filter', '筛选', 'Filter'], ['paste', '粘贴', 'Paste'], ['excel', 'Excel', 'Excel']]" :key="entry[0]" :type="method === entry[0] ? 'primary' : 'default'" :aria-pressed="method === entry[0]" @click="method = entry[0]!">{{ l(entry[1]!, entry[2]!) }}</ElButton>
      <span class="full-muted">{{ l('选取不会执行操作', 'Selecting does not execute an action') }}</span>
    </div>
    <div v-if="method === 'filter'" class="full-stack">
      <ElInput v-model="query" clearable :aria-label="l('筛选待选对象', 'Filter selectable targets')" :placeholder="l('输入名称或编号，随后明确选取匹配结果', 'Enter name or reference, then explicitly select matches')" @input="page = 1" />
      <div class="bulk-candidates"><span v-for="row in filtered.slice((page - 1) * 6, page * 6)" :key="row.id">{{ row.name }} <code>{{ row.id }}</code><small v-if="!row.eligible">{{ l('本次不可选', 'Unavailable for this action') }}</small></span></div>
      <div class="full-actions"><ElButton :disabled="!filtered.some(r => r.eligible)" @click="addFiltered">{{ l('选取当前匹配结果', 'Select current matches') }} ({{ filtered.filter(r => r.eligible).length }})</ElButton><ElButton v-if="page > 1" @click="page--">{{ l('上一页', 'Previous') }}</ElButton><ElButton v-if="filtered.length > page * 6" @click="page++">{{ l('下一页', 'Next') }}</ElButton></div>
    </div>
    <ElInput v-else-if="method === 'paste'" v-model="text" type="textarea" :rows="3" maxlength="64000" :aria-label="l('快速粘贴', 'Rapid paste')" :placeholder="l('每行一个编号、邮箱或可见名称，自动匹配并去重', 'One reference, email, or visible name per line; matched and deduplicated automatically')" />
    <div v-else class="bulk-file">
      <label>{{ l('导入Excel（仅在此浏览器读取）', 'Import Excel (read in this browser only)') }}<input type="file" accept=".xlsx" :aria-label="l('导入Excel', 'Import Excel')" @change="upload" /></label>
      <a :href="templateUrl" download>{{ l('下载Excel模板', 'Download Excel template') }}</a>
      <p class="full-muted">{{ l('第一张表使用“', 'First sheet: “') }}{{ column || '编号' }}{{ l('”文本列，可另有“名称”。最多1000行、2MiB；保留前导零；公式和数值编号须先改为文本值。', '” text column, optional “名称”. Up to 1000 rows and 2MiB. Keep leading zeroes; convert formulas and numeric references to text values first.') }}</p>
      <p v-if="filename">{{ filename }} · {{ loading ? l('正在检查', 'Checking') : l('已检查', 'Checked') }}</p>
    </div>
    <p v-if="fileError" class="full-error-text" role="alert">{{ fileError }}</p>
    <ElButton v-if="allowEmpty" :disabled="!modelValue.length" @click="clearSelection">{{ l('清空本次指派集合', 'Clear this assignment selection') }}</ElButton>
    <div class="bulk-selection-bar" role="status"><ElTag>{{ l('已选', 'Selected') }} {{ selected.length }}</ElTag><strong>{{ scope }}</strong><ElButton link type="primary" @click="details = !details">{{ l('查看已选', 'View selected') }}</ElButton><span class="full-muted">{{ l('翻页或修改筛选保留当前集合；提交仅作用于已选项。', 'Paging or filtering preserves this set. Submission affects selected items only.') }}</span></div>
    <div v-if="details" class="bulk-selected" :aria-label="l('已选明细', 'Selected details')"><p v-if="!selected.length">{{ l('尚未选择对象', 'No targets selected') }}</p><div v-for="row in selected" :key="row.id"><span>{{ row.name }} · {{ row.id }}</span><ElButton link type="danger" :aria-label="l('移除选取', 'Remove selection') + ' ' + row.id" @click="remove(row.id)">{{ l('排除', 'Exclude') }}</ElButton></div></div>
    <div v-if="method !== 'filter' && analyzed.length" class="full-table-wrap"><table class="full-table"><thead><tr><th>{{ l('输入', 'Input') }}</th><th>{{ l('核对结果', 'Validation') }}</th><th>{{ l('处理', 'Action') }}</th></tr></thead><tbody><tr v-for="row in analyzed" :key="row.key"><td>{{ row.input }}</td><td>{{ excluded.includes(row.key) ? l('已排除', 'Excluded') : stateLabel(row.state) }}</td><td><ElSelect v-if="row.state === 'ambiguous' && !excluded.includes(row.key)" v-model="resolved[row.key]" :aria-label="l('明确对象', 'Exact target') + ' ' + row.input"><ElOption v-for="match in row.matches" :key="match.id" :value="match.id" :label="`${match.name} · ${match.id}`" /></ElSelect><ElButton v-if="!['ready', 'duplicate'].includes(row.state) && !excluded.includes(row.key)" link @click="exclude(row.key)">{{ l('排除此行', 'Exclude row') }}</ElButton></td></tr></tbody></table></div>
    <p v-if="pending" class="full-error-text" role="alert">{{ l('请明确选择或排除未解决行，再确认提交。', 'Resolve or exclude unresolved rows before confirming.') }}</p>
  </section>
</template>
