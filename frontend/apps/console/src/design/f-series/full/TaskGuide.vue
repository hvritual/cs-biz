<script setup lang="ts">
import { computed } from 'vue';
import { pair, l } from './copy';
import { useFullReviewState } from './state';
const s = useFullReviewState();
const labels = computed(() => {
  if (['identity', 'organizations', 'invitation-accept'].includes(s.page.id)) return [l('组织账号', 'Organization account'), l('核对身份与企业', 'Check identity and workspace'), l('进入当前企业', 'Enter workspace')];
  if (s.page.id === 'sessions') return [l('当前登录设备', 'Current signed-in devices'), l('核对退出影响', 'Review sign-out impact'), l('确认并查看状态', 'Confirm and check status')];
  if (['role-edit', 'tenant-create', 'module-grant'].includes(s.page.id)) return [l('填写完整配置', 'Enter complete settings'), l('核对差异并确认', 'Review changes and confirm'), l('本次结果与恢复', 'Results and recovery')];
  if (['modules', 'customer', 'tenant'].includes(s.page.id)) return [l('查看当前权益与详情', 'Review current access and details'), l('核对可用操作', 'Check available actions'), l('进入获准的工作区', 'Open a permitted workspace')];
  if (['customers', 'tenants', 'roles', 'invitations'].includes(s.page.id)) return [l('查找当前记录', 'Find current records'), l('打开允许的对象', 'Open a permitted target'), l('查看详情与可用操作', 'Details and allowed actions')];
  if (['observability', 'operations'].includes(s.page.group)) return [l('当前企业与编号', 'Workspace and reference'), l('查询允许的来源', 'Query permitted sources'), l('结果及安全下一步', 'Result and next action')];
  if (s.page.group === 'release') return [l('同版候选与环境', 'Same-version candidate and target'), l('仅核对模拟方案', 'Review a simulation only'), l('原记录与资格缺口', 'Original record and missing evidence')];
  return [l('选取当前对象', 'Choose current targets'), l('核对影响并确认', 'Review effects and confirm'), l('本次结果与恢复', 'Results and recovery')];
});
</script>
<template>
  <figure class="task-guide" :aria-label="pair(s.page.title) + l('操作指引', ' task guidance')">
    <svg viewBox="0 0 900 64" role="img" :aria-label="pair(s.page.title) + ': ' + labels.join(' → ')"><title>{{ pair(s.page.title) }} · {{ l('操作位置示意', 'Task position guide') }}</title><path d="M32 32H862" stroke="currentColor" stroke-opacity=".18" stroke-width="2"/><g v-for="(label, index) in labels" :key="label" :transform="`translate(${index * 300 + 6}, 0)`"><rect x="0" y="8" width="280" height="48" rx="12" fill="var(--color-surface)" stroke="var(--color-border)"/><circle cx="26" cy="32" r="13" fill="var(--el-color-primary)"/><text x="26" y="37" text-anchor="middle" fill="white" font-size="13">{{ index + 1 }}</text><text x="50" y="37" fill="currentColor" font-size="13">{{ label }}</text></g></svg>
    <figcaption>{{ pair(s.page.title) }} · {{ l('先核对当前账号、企业和对象；只读查询不提交变更。', 'Check account, workspace and targets. Read-only queries do not submit changes.') }}</figcaption>
  </figure>
</template>
