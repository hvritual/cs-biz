<script setup lang="ts">
import type { MemberView, Role } from '#/api/mock/types';
import type { FormInstance, FormRules } from 'element-plus';
import coffeeBanner from '#/assets/coffee-banner.webp';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ElAlert, ElButton, ElDrawer, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox,
  ElOption, ElPagination, ElSelect, ElTable, ElTableColumn, ElTag,
} from 'element-plus';
import { Download, Plus, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-vue-next';

import { api } from '#/api/mock/service';
import PageState from '#/components/PageState.vue';
import { useResource } from '#/composables/useResource';
import { $t as t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage, formatDate } from '#/utils/format';

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();
const { data, loading, error, refresh } = useResource<{ members: MemberView[]; roles: Role[] }>(async (context) => {
  const [members, roles] = await Promise.all([
    api.listMembers(context),
    workspace.can('tenant.member.manage') ? api.listRoles(context) : Promise.resolve([]),
  ]);
  return { members, roles };
}, { members: [], roles: [] });

type MemberFilter = { search: string; department: string; role: string; status: string };
const draft = reactive<MemberFilter>({ search: '', department: 'all', role: 'all', status: 'all' });
const applied = ref<MemberFilter>({ ...draft });
const page = ref(1);
const pageSize = ref(10);
const selected = ref<MemberView[]>([]);
const detail = ref<MemberView | null>(null);
const detailTab = ref('profile');
function memberReadScope(member: MemberView) {
  const scopes = member.roles.flatMap((role) => role.grants)
    .filter((grant) => grant.action === 'crm.customer.read')
    .map((grant) => grant.scope);
  if (scopes.includes('all')) return t('members.allData');
  if (scopes.includes('group')) return t('members.groupData');
  return t('members.ownData');
}
const drawer = ref(false);
const editing = ref<MemberView | null>(null);
const saving = ref(false);
const changingMember = ref('');
const batchBusy = ref(false);
const formError = ref('');
const formRef = ref<FormInstance>();
let confirmationOpen = false;
const form = reactive({ roleIds: [] as string[] });
const canManage = computed(() => workspace.can('tenant.member.manage'));
const assignableRoles = computed(() => data.value.roles.filter((item) => !item.isOwner));
const departments = computed(() => [...new Set(data.value.members.map((m) => m.department || t('members.unassigned')))].sort());
const visibleMembers = computed(() => {
  const filter = applied.value;
  const text = filter.search.trim().toLocaleLowerCase();
  return data.value.members.filter((member) =>
    (filter.status === 'all' || member.status === filter.status)
    && (filter.department === 'all' || (member.department || t('members.unassigned')) === filter.department)
    && (filter.role === 'all' || member.roleIds.includes(filter.role))
    && (!text || (member.user.name + ' ' + member.user.email + ' ' + member.user.title).toLocaleLowerCase().includes(text)),
  );
});
const paginated = computed(() => visibleMembers.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const stats = computed(() => {
  const total = data.value.members.length;
  const active = data.value.members.filter((m) => m.status === 'active').length;
  return {
    total, active, departments: departments.value.length, roles: data.value.roles.length,
    percent: total ? Math.round(active * 100 / total) : 0,
  };
});
const selectedActionable = computed(() => selected.value.filter((m) => m.canManage));
const rules = computed<FormRules>(() => ({
  roleIds: [{ type: 'array', required: true, min: 1, message: t('members.permissionsRequired'), trigger: 'change' }],
}));
function applyFilters() { applied.value = { ...draft }; page.value = 1; selected.value = []; }
function resetFilters() {
  Object.assign(draft, { search: '', department: 'all', role: 'all', status: 'all' });
  applyFilters();
}
function viewMember(member: MemberView) {
  detail.value = member; detailTab.value = 'profile';
}
function closeDetail() {
  const id = detail.value?.id;
  detail.value = null;
  if (id) document.querySelector<HTMLButtonElement>('[data-view-id="' + id + '"]')?.focus();
}
function openCreate() {
  if (!canManage.value || !workspace.context || workspace.loading) return;
  router.push('/members/create');
}
function openEdit(member: MemberView) {
  if (!member.canManage || !canManage.value) return;
  editing.value = member;
  form.roleIds = [...member.roleIds];
  formError.value = ''; drawer.value = true;
}
async function saveMember() {
  if (saving.value || !canManage.value || !workspace.context || workspace.loading || !editing.value) return;
  const captured = workspace.capture();
  const memberId = editing.value.id;
  saving.value = true; formError.value = '';
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !captured.isCurrent() || !canManage.value) return;
    await api.updateMembership(captured.context, memberId, { roleIds: [...form.roleIds] });
    if (!captured.isCurrent()) return;
    drawer.value = false;
    ElMessage.success(t('members.updated'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) formError.value = errorMessage(cause);
  } finally {
    if (captured.isCurrent()) saving.value = false;
  }
}
async function changeStatus(member: MemberView) {
  if (changingMember.value || batchBusy.value || !member.canManage || !canManage.value) return;
  const captured = workspace.capture();
  const nextStatus = member.status === 'active' ? 'disabled' : 'active';
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm(
      t(nextStatus === 'disabled' ? 'members.pauseDescription' : 'members.resumeDescription', { name: member.user.name }),
      t(nextStatus === 'disabled' ? 'members.pauseTitle' : 'members.resumeTitle'),
      { confirmButtonText: t(nextStatus === 'disabled' ? 'members.pause' : 'members.resume'),
        cancelButtonText: t('common.cancel'), type: nextStatus === 'disabled' ? 'warning' : 'info' },
    );
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!captured.isCurrent() || !canManage.value) return;
  changingMember.value = member.id;
  try {
    await api.updateMembership(captured.context, member.id, { status: nextStatus });
    if (!captured.isCurrent()) return;
    ElMessage.success(t(nextStatus === 'disabled' ? 'members.paused' : 'members.resumed'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) ElMessage.error(errorMessage(cause));
  } finally { if (captured.isCurrent()) changingMember.value = ''; }
}
async function changeBatch(status: 'active' | 'disabled') {
  const candidates = selectedActionable.value.filter((m) => m.status !== status);
  if (!canManage.value || batchBusy.value || candidates.length === 0) return;
  const captured = workspace.capture();
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm(t('members.batchConfirm', { count: candidates.length }),
      t(status === 'active' ? 'members.batchEnable' : 'members.batchDisable'),
      { confirmButtonText: t('members.confirmBatch'), cancelButtonText: t('common.cancel'), type: 'warning' });
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!captured.isCurrent() || !canManage.value) return;
  batchBusy.value = true;
  try {
    const result = await api.bulkUpdateMembershipStatus(captured.context, candidates.map((m) => m.id), status);
    if (!captured.isCurrent()) return;
    ElMessage.success(t('members.batchUpdated', { count: result.updatedCount }));
    selected.value = [];
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) ElMessage.error(errorMessage(cause));
  } finally {
    if (captured.isCurrent()) batchBusy.value = false;
  }
}
function onSelectionChange(rows: MemberView[]) { selected.value = rows; }
function exportMembers() {
  const fields = [['name', 'email', 'department', 'roles', 'status', 'joinedAt'],
    ...visibleMembers.value.map((member) => [member.user.name, member.user.email,
      member.department || '', member.roles.map((r) => r.name).join('/'), member.status, member.joinedAt])];
  const cell = (value: string) => {
    const safe = /^[=+\-@]/.test(value) ? "'" + value : value;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const contents = '\uFEFF' + fields.map((row) => row.map(cell).join(',')).join('\r\n');
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'members.csv'; link.click();
  URL.revokeObjectURL(url);
}
watch([() => route.query.create, canManage], ([value, can]) => {
  if (value === '1' && can) {
    void router.replace({ path: '/members/create' });
  }
}, { immediate: true });
watch(() => route.query.search, (value) => {
  if (typeof value === 'string') { draft.search = value; applyFilters(); }
}, { immediate: true });
watch(() => data.value.members, (members) => {
  if (detail.value) detail.value = members.find((m) => m.id === detail.value?.id) || null;
});
watch(() => workspace.generation, () => {
  if (confirmationOpen) ElMessageBox.close();
  drawer.value = false; editing.value = null; detail.value = null; selected.value = [];
  saving.value = false; changingMember.value = ''; batchBusy.value = false; formError.value = '';
  resetFilters();
});
onBeforeUnmount(() => { if (confirmationOpen) ElMessageBox.close(); });
</script>

<template>
  <div class="page cl-members-page">
    <header class="cl-members-heading">
      <div>
        <p class="cl-breadcrumb">{{ t('shell.enterpriseCenter') }} / {{ t('members.title') }}</p>
        <h1>{{ t('members.title') }}</h1>
        <p class="cl-members-intro">{{ t('members.description') }}</p>
      </div>
      <div class="cl-hero-art">
        <strong>{{ t('members.promoTitle') }}</strong><span>{{ t('members.promoSubtitle') }}</span>
        <img class="cl-hero-image" :src="coffeeBanner" alt="" aria-hidden="true" />
      </div>
    </header>
    <section class="cl-metrics" :aria-label="t('members.summary')">
      <div class="cl-metric-card"><div class="cl-metric-symbol"><Users :size="25" /></div><div>
        <span>{{ t('members.totalMembers') }}</span><strong>{{ stats.total }}</strong><small>{{ t('members.currentMembers') }}</small></div></div>
      <div class="cl-metric-card"><div class="cl-metric-symbol"><Users :size="25" /></div><div>
        <span>{{ t('members.departments') }}</span><strong>{{ stats.departments }}</strong><small>{{ t('members.orgStructure') }}</small></div></div>
      <div class="cl-metric-card"><div class="cl-metric-symbol"><ShieldCheck :size="25" /></div><div>
        <span>{{ t('members.permissionsCount') }}</span><strong>{{ stats.roles }}</strong><small>{{ t('members.permissionConfig') }}</small></div></div>
      <div class="cl-metric-card">
        <div class="cl-usage-ring" :style="{ '--cl-percent': stats.percent + '%' }"><span>{{ stats.percent }}%</span></div>
        <div><span>{{ t('members.activeUsage') }}</span><strong class="cl-count-small">{{ stats.active }} / {{ stats.total }}</strong>
          <small>{{ t('members.activeCaption') }}</small></div>
      </div>
    </section>
    <div class="cl-members-help">{{ t('members.howToManage') }}</div>
    <PageState :loading="loading" :error="error" :empty="data.members.length === 0"
      :empty-title="t('members.emptyTitle')" :empty-description="t('members.emptyDescription')" @retry="refresh">
      <section class="cl-members-filter-panel surface" :aria-label="t('members.filterTitle')">
        <ElInput v-model="draft.search" clearable :placeholder="t('members.search')" :aria-label="t('members.search')"
          class="cl-member-search" @keyup.enter="applyFilters">
          <template #prefix><Search :size="17" /></template>
        </ElInput>
        <label>{{ t('members.department') }}</label>
        <ElSelect v-model="draft.department" :aria-label="t('members.department')" class="cl-member-select">
          <ElOption value="all" :label="t('members.allDepartments')" />
          <ElOption v-for="dept in departments" :key="dept" :value="dept" :label="dept" />
        </ElSelect>
        <label>{{ t('members.permission') }}</label>
        <ElSelect v-model="draft.role" :aria-label="t('members.permission')" class="cl-member-select">
          <ElOption value="all" :label="t('members.allPermissions')" />
          <ElOption v-for="item in data.roles" :key="item.id" :value="item.id" :label="item.name" />
        </ElSelect>
        <label>{{ t('members.status') }}</label>
        <ElSelect v-model="draft.status" :aria-label="t('members.status')" class="cl-member-select">
          <ElOption value="all" :label="t('members.allStatuses')" />
          <ElOption value="active" :label="t('members.active')" />
          <ElOption value="disabled" :label="t('members.disabled')" />
        </ElSelect>
        <ElButton @click="resetFilters">{{ t('members.reset') }}</ElButton>
        <ElButton type="primary" @click="applyFilters">{{ t('members.query') }}</ElButton>
      </section>
      <div class="cl-members-split" :class="{ 'has-detail': detail }">
        <section class="cl-members-list surface">
          <div class="cl-member-toolbar">
            <ElButton v-if="canManage" type="primary" :disabled="loading" @click="openCreate"><Plus :size="16" />{{ t('members.add') }}</ElButton>
            <ElButton v-if="canManage" :disabled="!selectedActionable.some((m) => m.status === 'disabled') || batchBusy" @click="changeBatch('active')">{{ t('members.batchEnable') }}</ElButton>
            <ElButton v-if="canManage" :disabled="!selectedActionable.some((m) => m.status === 'active') || batchBusy" @click="changeBatch('disabled')">{{ t('members.batchDisable') }}</ElButton>
            <ElButton @click="draft.status = 'disabled'; applyFilters()"><RefreshCw :size="15" />{{ t('members.pausedMembers') }}</ElButton>
            <ElButton @click="exportMembers"><Download :size="15" />{{ t('members.export') }}</ElButton>
            <span class="cl-toolbar-selection">{{ t('members.selectedCount', { count: selected.length }) }}</span>
          </div>
          <ElTable class="cl-members-table" :data="paginated" row-key="id" :empty-text="t('members.noResults')"
            @selection-change="onSelectionChange">
            <ElTableColumn v-if="canManage" type="selection" width="44" />
            <ElTableColumn :label="t('members.name')" min-width="115">
              <template #default="{ row }"><div class="cl-member-name">
                <span class="cl-member-avatar">{{ row.user.initials }}</span>
                <strong>{{ row.user.name }}</strong></div></template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.email')" min-width="160">
              <template #default="{ row }"><span class="cl-email-text">{{ row.user.email }}</span></template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.department')" min-width="112">
              <template #default="{ row }">{{ row.department || t('members.unassigned') }}</template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.permission')" min-width="130">
              <template #default="{ row }"><div class="cl-role-tags">
                <ElTag v-for="role in row.roles" :key="role.id" size="small" :type="role.isOwner ? 'danger' : 'info'" effect="light">{{ role.name }}</ElTag>
              </div></template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.dataPermission')" min-width="118">
              <template #default="{ row }">{{ memberReadScope(row) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.status')" min-width="100">
              <template #default="{ row }"><span class="status-pill" :class="row.status === 'active' ? 'positive' : 'neutral'">
                {{ t('members.' + row.status) }}</span></template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.lastLogin')" min-width="124">
              <template #default="{ row }">{{ row.user.lastLoginAt ? formatDate(row.user.lastLoginAt) : '—' }}</template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.joinedAt')" min-width="120">
              <template #default="{ row }">{{ formatDate(row.joinedAt) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="t('members.actions')" width="160" fixed="right">
              <template #default="{ row }"><div class="cl-member-row-actions">
                <ElButton :data-view-id="row.id" link type="primary" @click="viewMember(row)">{{ t('members.view') }}</ElButton>
                <ElButton v-if="canManage && row.canManage" link type="primary" @click="openEdit(row)">{{ t('members.edit') }}</ElButton>
                <ElButton v-if="canManage && row.canManage" link type="primary" :loading="changingMember === row.id"
                  @click="changeStatus(row)">{{ t(row.status === 'active' ? 'members.pause' : 'members.resume') }}</ElButton>
              </div></template>
            </ElTableColumn>
          </ElTable>
          <div class="cl-member-pagination">
            <span>{{ t('members.count', { count: visibleMembers.length }) }}</span>
            <ElPagination v-model:current-page="page" v-model:page-size="pageSize" :total="visibleMembers.length"
              :page-sizes="[5,10,20,50]" layout="prev, pager, next, sizes" background />
          </div>
        </section>
        <aside v-if="detail" class="cl-member-detail surface" :aria-label="t('members.detailTitle')">
          <div class="cl-detail-heading"><h2>{{ t('members.detailTitle') }}</h2>
            <button type="button" :aria-label="t('members.closeDetail')" @click="closeDetail"><X :size="19" /></button></div>
          <div class="cl-detail-person"><span class="cl-member-avatar">{{ detail.user.initials }}</span>
            <strong>{{ detail.user.name }}</strong><p>{{ detail.user.email }}</p></div>
          <div class="cl-detail-tabs">
            <button v-for="tab in [{ id:'profile', text:t('members.profileTab') },{ id:'permissions',text:t('members.permissionsTab') },{ id:'data',text:t('members.dataTab') }]"
              :key="tab.id" type="button" :class="{ active: detailTab === tab.id }" @click="detailTab = tab.id">{{ tab.text }}</button>
          </div>
          <dl v-if="detailTab === 'profile'" class="detail-list">
            <div><dt>{{ t('members.name') }}</dt><dd>{{ detail.user.name }}</dd></div>
            <div><dt>{{ t('members.email') }}</dt><dd>{{ detail.user.email }}</dd></div>
            <div><dt>{{ t('members.department') }}</dt><dd>{{ detail.department || t('members.unassigned') }}</dd></div>
            <div><dt>{{ t('members.status') }}</dt><dd>{{ t('members.' + detail.status) }}</dd></div>
            <div><dt>{{ t('members.joinedAt') }}</dt><dd>{{ formatDate(detail.joinedAt) }}</dd></div>
          </dl>
          <div v-else-if="detailTab === 'permissions'" class="cl-detail-tag-list">
            <ElTag v-for="role in detail.roles" :key="role.id">{{ role.name }}</ElTag>
          </div>
          <div v-else class="cl-detail-summary">
            <p>{{ t('members.dataScopeDescription') }}</p>
            <p>{{ memberReadScope(detail) }}</p>
          </div>
        </aside>
      </div>
      <template #emptyActions><ElButton v-if="canManage" type="primary" @click="openCreate">{{ t('members.add') }}</ElButton></template>
    </PageState>

    <ElDrawer v-model="drawer" :title="t('members.editPermissions')"
      size="500px"
      destroy-on-close :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <ElAlert v-if="formError" :title="formError" type="error" :closable="false" show-icon class="form-notice" />
      <div v-if="editing" class="member-summary"><strong>{{ editing.user.name }}</strong><span class="muted">{{ editing.user.email }}</span></div>
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving" @submit.prevent="saveMember">
        <ElFormItem :label="t('members.permissions')" prop="roleIds">
          <ElSelect v-model="form.roleIds" multiple :placeholder="t('members.selectPermissions')" :aria-label="t('members.permissions')" style="width:100%">
            <ElOption v-for="entry in assignableRoles" :key="entry.id" :value="entry.id" :label="entry.name" />
          </ElSelect>
        </ElFormItem>
        <p class="muted role-help">{{ t('members.permissionHelp') }}</p>
      </ElForm>
      <template #footer><div class="form-actions"><ElButton :disabled="saving" @click="drawer = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="saveMember">{{ t('common.saveChanges') }}</ElButton></div></template>
    </ElDrawer>
  </div>
</template>

<style scoped>
.cl-members-page .cl-members-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:16px; }
.cl-members-heading h1 { font-size:24px; line-height:32px; font-weight:650; margin:12px 0 4px; }
.cl-breadcrumb { font-size:12px; color:var(--color-text-muted); margin:0; }
.cl-members-intro { margin:0; font-size:13px; color:var(--biz-muted); }
.cl-hero-art { position:relative; flex:0 0 32%; max-width:400px; min-height:84px; display:grid; align-content:center; gap:4px; padding:14px 20px; background:linear-gradient(110deg,var(--color-primary-soft),var(--color-surface-soft) 60%,var(--color-primary-soft)); border:1px solid var(--color-border); border-radius:var(--radius-sm); overflow:hidden; }
.cl-hero-art strong,.cl-hero-art span { z-index:1; position:relative; max-width:75%; }
.cl-hero-art strong { color:var(--color-text); font-size:15px; font-weight:650; }
.cl-hero-art span { color:var(--color-text-secondary); font-size:11px; }
.cl-hero-image { position:absolute; right:0; inset-block:0; height:100%; width:43%; object-fit:cover; mask-image:linear-gradient(to right,transparent,black 30%); }
.cl-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.cl-metric-card { display:flex; align-items:center; min-width:0; min-height:112px; gap:var(--space-4); padding:var(--space-4); border:1px solid var(--color-border); background:var(--color-surface); border-radius:var(--radius-md); }
.cl-metric-card>div:last-child { display:grid; min-width:0; gap:2px; }
.cl-metric-card span:not(.cl-usage-ring span) { font-size:13px; font-weight:600; }
.cl-metric-card strong { font-size:var(--text-metric); line-height:38px; font-weight:700; color:var(--biz-text); font-variant-numeric:tabular-nums; }
.cl-metric-card small { color:var(--biz-muted); font-size:11px; }
.cl-metric-card .cl-count-small { font-size:18px; }
.cl-metric-symbol { width:48px; height:48px; flex:0 0 48px; display:grid; place-items:center; border-radius:var(--radius-sm); background:var(--color-primary-soft); color:var(--color-primary); }
.cl-usage-ring { display:grid; place-items:center; flex:0 0 68px; width:68px; height:68px; border-radius:50%; background:conic-gradient(var(--color-ring-fill) var(--cl-percent),var(--color-ring-track) 0); }
.cl-usage-ring span { width:55px; height:55px; border-radius:50%; background:var(--biz-surface); display:grid; place-items:center; color:var(--color-ring-label); font-weight:650; }
.cl-members-help { margin:2px 2px 12px; color:var(--color-primary); text-align:right; font-size:var(--text-xs); }
.cl-members-filter-panel { display:flex; align-items:center; gap:9px; padding:12px 14px !important; margin-bottom:14px; }
.cl-members-filter-panel label { flex:none; font-size:12px; white-space:nowrap; }
.cl-members-filter-panel .cl-member-search { flex:1 1 280px; min-width:140px; }
.cl-member-select { flex:0 1 130px; min-width:90px; }
.cl-members-filter-panel .el-input__wrapper, .cl-members-filter-panel .el-select__wrapper { min-height:var(--control-height); border:1px solid var(--color-border-strong); box-shadow:none; border-radius:var(--radius-sm); }
.cl-members-filter-panel .el-button { min-height:34px; padding-inline:12px; }
.cl-members-split { display:flex; align-items:stretch; gap:14px; min-width:0; }
.cl-members-list { min-width:0; flex:1 1 auto; padding:12px 12px 0 !important; }
.cl-member-toolbar { display:flex; align-items:center; gap:8px; min-height:44px; padding-bottom:12px; }
.cl-member-toolbar .el-button { min-height:34px; margin:0; padding-inline:11px; font-size:12px; }
.cl-toolbar-selection { flex:1; text-align:right; color:var(--biz-muted); font-size:12px; }
.cl-members-table { width:100%; }
.cl-members-table .el-table__header-wrapper th { background:var(--color-surface-soft); color:var(--color-text-secondary); font-size:var(--text-xs); font-weight:600; }
.cl-members-table .el-table__body td.el-table__cell { height:var(--table-row-height); padding:10px 0; }
.cl-members-table .cell { padding-left:8px; padding-right:8px; font-size:12px; }
.cl-member-name { display:flex; align-items:center; gap:8px; min-width:0; }
.cl-member-name strong { font-size:12px; font-weight:650; white-space:nowrap; }
.cl-member-avatar { display:grid; place-items:center; flex:0 0 26px; width:26px; height:26px; border-radius:50%; background:var(--color-primary); color:var(--color-on-primary); font-size:12px; }
.cl-email-text { color:var(--color-text-secondary); font-size:var(--text-xs); }
.cl-role-tags { display:flex; flex-wrap:wrap; gap:3px; }
.cl-role-tags .el-tag { max-width:100%; font-size:11px; }
.cl-member-row-actions { display:flex; align-items:center; gap:5px; white-space:nowrap; }
.cl-member-row-actions .el-button { margin:0; font-size:11px; }
.cl-member-pagination { display:flex; justify-content:space-between; align-items:center; min-height:64px; padding:12px 2px; color:var(--biz-muted); font-size:12px; }
.cl-member-detail { flex:0 0 var(--member-detail-width); min-width:var(--member-detail-width); padding:0 18px 20px !important; }
.cl-detail-heading { display:flex; justify-content:space-between; align-items:center; min-height:54px; border-bottom:1px solid var(--biz-border); }
.cl-detail-heading h2 { margin:0; font-size:16px; font-weight:650; }
.cl-detail-heading button { background:none; border:0; color:var(--biz-muted); cursor:pointer; }
.cl-detail-person { display:grid; justify-items:center; gap:6px; padding:20px 0 12px; }
.cl-detail-person .cl-member-avatar { width:44px; height:44px; font-size:18px; }
.cl-detail-person strong { font-size:16px; }
.cl-detail-person p { margin:0; color:var(--biz-muted); font-size:12px; }
.cl-detail-tabs { display:flex; gap:12px; border-bottom:1px solid var(--biz-border); }
.cl-detail-tabs button { background:none; border:0; border-bottom:2px solid transparent; padding:12px 1px; cursor:pointer; font-size:12px; }
.cl-detail-tabs button.active { color:var(--color-primary); border-bottom-color:var(--color-primary); font-weight:600; }
.cl-detail-tag-list { display:flex; flex-wrap:wrap; gap:8px; padding:20px 0; }
.cl-detail-summary { color:var(--biz-text); font-size:13px; }
.form-notice,.member-summary { margin-bottom:20px; }
.member-summary { display:grid; gap:5px; }
.role-help { color:var(--biz-muted); font-size:12px; line-height:1.6; }
.dark .cl-hero-art { background:linear-gradient(110deg, var(--color-workbench), var(--color-surface-soft)); }
.dark .cl-hero-art strong,.dark .cl-hero-art span { color:var(--color-text); }
.dark .cl-metric-symbol { background:var(--color-primary-soft); color:var(--color-primary); }
.dark .cl-members-filter-panel .el-input__wrapper,.dark .cl-members-filter-panel .el-select__wrapper { border-color:var(--color-border-strong); }

</style>
