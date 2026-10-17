<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElButton, ElInput } from 'element-plus';
import { l, statusTitle } from './copy';
import { useFullReviewState } from './state';
import type { Task } from './model';
const props = defineProps<{ task: Task }>();
const s = useFullReviewState();
const expanded = ref(true); const retry = ref(false);
const note = ref(props.task.effect.values.note || '');
const summary = computed(() => [
  [l('总数', 'Total'), props.task.items.length],
  [l('已完成', 'Succeeded'), props.task.items.filter(i => i.status === 'succeeded').length],
  [l('失败', 'Failed'), props.task.items.filter(i => i.status === 'failed').length],
  [l('处理中', 'Pending'), props.task.items.filter(i => i.status === 'pending').length],
  [l('待核实', 'Unknown'), props.task.items.filter(i => i.status === 'unknown').length],
]);
const failed = computed(() => s.failedEffect(props.task));
async function confirmRetry() {
  const effect = s.failedEffect(props.task); if (!effect) return;
  if (effect.kind === 'batch') effect.values.note = note.value;
  await s.requestInline([l('仅处理明确失败项目', 'Process confirmed failures only'), 'Process confirmed failures only'], effect, effect.kind === 'invite' ? 'access' : 'write');
  retry.value = false;
}
</script>
<template>
  <section class="full-card local-outcome" role="status" :aria-label="l('本次操作结果', 'Current operation results')" data-local-outcome>
    <div class="full-toolbar"><div><span class="full-muted">{{ l('本次操作结果', 'Current operation results') }}</span><h3>{{ l(task.title, task.titleEn) }}</h3></div><code>{{ task.id }}</code><ElButton link @click="expanded = !expanded">{{ l('逐项结果', 'Item results') }}</ElButton></div>
    <div class="outcome-counts"><div v-for="row in summary" :key="String(row[0])"><span>{{ row[0] }}</span><strong>{{ row[1] }}</strong></div></div>
    <p class="full-muted">{{ s.taskTenantName(task) }} · {{ l('成功项保持原结果；待核实先查原操作，不重复提交。', 'Completed items are retained. Query unknown outcomes before submitting again.') }}</p>
    <table v-if="expanded" class="full-table"><thead><tr><th>{{ l('对象', 'Target') }}</th><th>{{ l('结果', 'Result') }}</th><th>{{ l('原因与下一步', 'Reason and next action') }}</th></tr></thead><tbody><tr v-for="item in task.items" :key="item.id"><td>{{ item.label }}</td><td>{{ statusTitle(item.status) }}</td><td>{{ item.reason || (item.status === 'succeeded' ? l('已保留，不再执行', 'Retained, not repeated') : item.status === 'failed' ? l('请核对当前对象及输入，只处理明确失败项', 'Review current targets and inputs; process only confirmed failures') : l('先查询原操作', 'Query the original operation first')) }}<ElButton v-if="['pending', 'unknown'].includes(item.status)" link @click="s.queryTask(task.id, item.id)">{{ l('查询此项原结果', 'Query this original item') }}</ElButton></td></tr></tbody></table>
    <div v-if="retry && failed" class="full-message"><h3>{{ l('仅核对明确失败项目', 'Review confirmed failures only') }}</h3><p>{{ failed.ids.join(' · ') }}</p><ElInput v-if="failed.kind === 'batch'" v-model="note" :aria-label="l('失败项服务备注', 'Service note for failed items')"/><p>{{ l('已完成和待核实项目不会进入此集合，提交时重验当前权限与版本。', 'Completed and unknown items are excluded. Current permission and versions are checked on submission.') }}</p><ElButton type="primary" @click="confirmRetry">{{ l('确认仅处理失败项', 'Confirm failed items only') }}</ElButton></div>
    <div class="full-actions"><ElButton v-if="task.effect.kind === 'accept-invite' && task.status === 'succeeded'" type="primary" @click="s.continueInvitation(task)">{{ l('进入该企业', 'Enter this organization') }}</ElButton><ElButton v-if="task.items.some(i => ['pending', 'unknown'].includes(i.status))" type="primary" @click="s.queryTask(task.id)">{{ l('查询原操作结果', 'Query original outcome') }}</ElButton><ElButton v-if="failed" @click="retry = !retry">{{ l('仅核对明确失败项目', 'Review confirmed failures only') }}</ElButton><ElButton v-if="task.effect.kind === 'export'" :disabled="!task.items.some(i => i.status === 'succeeded')" type="primary" @click="s.download(task)">{{ l('按当前权限下载文件', 'Download with current permission') }}</ElButton><ElButton link @click="s.go('task', { record: task.id })">{{ l('查看完整原记录', 'View original record') }}</ElButton></div>
  </section>
</template>
