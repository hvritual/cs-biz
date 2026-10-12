<script setup lang="ts">
import type { MemberView, Role } from '#/api/mock/types';
import type { FormInstance, FormRules } from 'element-plus';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import {
  ElButton, ElCheckbox, ElDrawer, ElForm, ElFormItem, ElInput, ElMessage,
  ElMessageBox, ElOption, ElPagination, ElSelect, ElTable, ElTableColumn, ElTag,
} from 'element-plus';
import { Plus, Download, UserPlus, Check, Lock, Delete, Search, RefreshCw } from '@vben/icons';

import { api, ServiceError } from '#/api/mock/service';
import PageState from '#/components/PageState.vue';
import { useResource } from '#/composables/useResource';
import { $t as t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage, formatDate } from '#/utils/format';
import { clearPendingCommand, readPendingCommand, writePendingCommand } from '#/utils/pending-command';

const workspace = useWorkspaceStore();
const { data, loading, error, refresh } = useResource<{ members: MemberView[]; roles: Role[] }>(async (context) => {
  const [members, roles] = await Promise.all([
    api.listMembers(context),
    workspace.can('tenant.member.manage') ? api.listRoles(context) : Promise.resolve([]),
  ]);
  return { members, roles };
}, { members: [], roles: [] });

const query = ref('');
const role = ref('all');
const status = ref('all');
const drawer = ref(false);
const editing = ref<MemberView | null>(null);
const saving = ref(false);
const changingMember = ref('');
const formError = ref('');
const formRef = ref<FormInstance>();
const creationKey = ref('');
let confirmationOpen = false;
const form = reactive({ name: '', email: '', title: '', roleIds: [], department: '' });

const canManage = computed(() => workspace.can('tenant.member.manage'));
const assignableRoles = computed(() => data.value.roles.filter((r) => !r.isOwner));

const departments = computed(() => {
  // For now, return empty array since department is not in the Membership type
  // This can be extended later when department is added to the data model
  return [] as string[];
});

const visibleMembers = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  return data.value.members.filter((member) => {
    const memberRole = member.roles[0]?.name || '';
    return (status.value === 'all' || member.status === status.value)
      && (role.value === 'all' || memberRole.includes(role.value))
      && (!text || `${member.user.name} ${member.user.email}`.toLocaleLowerCase().includes(text));
  });
});

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return visibleMembers.value.slice(start, start + pageSize.value);
});

const currentPage = ref(1);
const pageSize = ref(10);

const stats = computed(() => {
  const total = data.value.members.length;
  const active = data.value.members.filter((m) => m.status === 'active').length;
  const deptCount = 12; // Hardcoded for now, can be calculated from actual department data
  const roleCount = data.value.roles.length;
  const packageUsed = total;
  const packageTotal = 500;
  const packagePercent = Math.round((packageUsed / packageTotal) * 100);
  return { total, active, deptCount, roleCount, packageUsed, packageTotal, packagePercent };
});

const rules = computed<FormRules>(() => ({
  name: [{ required: true, whitespace: true, message: t('members.nameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('members.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('members.emailInvalid'), trigger: ['blur', 'change'] },
  ],
  department: [{ required: true, message: t('members.departmentRequired'), trigger: 'change' }],
  roleIds: [{ type: 'array', required: true, min: 1, message: t('members.rolesRequired'), trigger: 'change' }],
}));

function openCreate() {
  if (!canManage.value || !workspace.context || workspace.loading) return;
  const pending = readPendingCommand(workspace.requestContext(), 'member.create');
  editing.value = null;
  Object.assign(form, pending ? { ...pending.input, roleIds: [...pending.input.roleIds] } : { name: '', email: '', title: '', roleIds: [], department: '' });
  creationKey.value = pending?.key ?? crypto.randomUUID();
  formError.value = '';
  drawer.value = true;
}

function openEdit(member: MemberView) {
  editing.value = member;
  Object.assign(form, {
    name: member.user.name,
    email: member.user.email,
    title: member.user.title,
    roleIds: [...member.roleIds],
    department: (member as any).department || '',
  });
  formError.value = '';
  drawer.value = true;
}

async function saveMember() {
  if (saving.value || !canManage.value || !workspace.context || workspace.loading) return;
  const captured = workspace.capture();
  const memberId = editing.value?.id;
  const input = { name: form.name.trim(), email: form.email.trim(), title: form.title?.trim(), roleIds: [...form.roleIds] };
  const key = creationKey.value;
  saving.value = true;
  formError.value = '';
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !captured.isCurrent() || !canManage.value) return;
    if (memberId) {
      await api.updateMembership(captured.context, memberId, { roleIds: input.roleIds });
    } else {
      writePendingCommand(captured.context, 'member.create', input, key);
      await api.createMember(captured.context, input, key);
      clearPendingCommand(captured.context, 'member.create', key);
    }
    if (!captured.isCurrent()) return;
    drawer.value = false;
    ElMessage.success(t(memberId ? 'members.updated' : 'members.created'));
    await refresh();
  } catch (cause) {
    if (!memberId && cause instanceof ServiceError && cause.status >= 400 && cause.status < 500 && cause.status !== 408 && !['IDEMPOTENCY_CONFLICT', 'REQUEST_CANCELLED', 'STORAGE_UNAVAILABLE'].includes(cause.code)) {
      clearPendingCommand(captured.context, 'member.create', key);
    }
    if (captured.isCurrent()) formError.value = errorMessage(cause);
  } finally {
    if (captured.isCurrent()) saving.value = false;
  }
}

async function changeStatus(member: MemberView) {
  if (changingMember.value || !member.canManage || !canManage.value) return;
  const captured = workspace.capture();
  const nextStatus = member.status === 'active' ? 'disabled' : 'active';
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm(
      t(nextStatus === 'disabled' ? 'members.disableDescription' : 'members.enableDescription', { name: member.user.name }),
      t(nextStatus === 'disabled' ? 'members.disableTitle' : 'members.enableTitle'),
      { confirmButtonText: t(nextStatus === 'disabled' ? 'members.batchDisable' : 'members.batchEnable'), cancelButtonText: t('common.cancel'), type: nextStatus === 'disabled' ? 'warning' : 'info' },
    );
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!captured.isCurrent()) return;
  changingMember.value = member.id;
  try {
    await api.updateMembership(captured.context, member.id, { status: nextStatus });
    if (!captured.isCurrent()) return;
    ElMessage.success(t(nextStatus === 'disabled' ? 'members.disabled_status' : 'members.enabled_status'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) ElMessage.error(errorMessage(cause));
  } finally {
    if (captured.isCurrent()) changingMember.value = '';
  }
}

function resetFilters() {
  query.value = '';
  role.value = 'all';
  status.value = 'all';
  currentPage.value = 1;
}

watch(() => workspace.generation, () => {
  if (confirmationOpen) ElMessageBox.close();
  drawer.value = false;
  editing.value = null;
  saving.value = false;
  changingMember.value = '';
  formError.value = '';
  query.value = '';
  role.value = 'all';
  status.value = 'all';
  currentPage.value = 1;
});

watch(visibleMembers, () => { currentPage.value = 1; });
onBeforeUnmount(() => { if (confirmationOpen) ElMessageBox.close(); });
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-heading">
        <div class="breadcrumb muted">企业中心 / 成员管理</div>
        <h1>{{ t('members.title') }}</h1>
        <p>{{ t('members.description') }}</p>
      </div>
    </div>

    <div class="stats-banner">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background: #eff6ff; color: #2563eb;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ t('members.totalMembers') }}</div>
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-desc">{{ t('members.currentMembers') }} <span class="text-primary">{{ t('members.pendingMembers') }}</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0fdf4; color: #16a34a;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ t('members.departments') }}</div>
            <div class="stat-value">{{ stats.deptCount }}</div>
            <div class="stat-desc">{{ t('members.orgStructure') }} <span class="text-success">{{ t('members.enabledDepts') }}</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fef3c7; color: #d97706;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ t('members.roles_count') }}</div>
            <div class="stat-value">{{ stats.roleCount }}</div>
            <div class="stat-desc">{{ t('members.roleConfig') }} <span class="text-warning">{{ t('members.builtinAndCustom') }}</span></div>
          </div>
        </div>
        <div class="stat-card package-card">
          <div class="package-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" stroke-width="6"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#16a34a" stroke-width="6" stroke-dasharray="201" :stroke-dashoffset="201 - (201 * stats.packagePercent / 100)" stroke-linecap="round" transform="rotate(-90 40 40)"/>
              <text x="40" y="44" text-anchor="middle" font-size="16" font-weight="600" fill="#16a34a">{{ stats.packagePercent }}%</text>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ t('members.packageUsage') }}</div>
            <div class="stat-value">{{ stats.packageUsed }} <span class="stat-total">/ {{ stats.packageTotal }}</span></div>
            <div class="stat-desc">{{ t('members.used') }} / {{ t('members.totalQuota') }}</div>
          </div>
        </div>
      </div>
      <div class="promo-banner">
        <div class="promo-content">
          <h3>{{ t('members.promoTitle') }}</h3>
          <p>{{ t('members.promoSubtitle') }}</p>
        </div>
        <div class="promo-image"></div>
      </div>
    </div>

    <div class="filter-link">
      <a href="#" class="text-primary">{{ t('members.howToManage') }}</a>
    </div>

    <PageState :loading="loading" :error="error" :empty="data.members.length === 0" :empty-title="t('members.emptyTitle')" :empty-description="t('members.emptyDescription')" @retry="refresh">
      <section class="surface table-surface">
        <div class="search-bar">
          <ElInput v-model="query" clearable :placeholder="t('members.search')" class="search-input">
            <template #prefix>
              <Search style="width: 16px; height: 16px; color: #9ca3af;" />
            </template>
          </ElInput>
          <ElSelect v-model="role" class="filter-select">
            <ElOption value="all" :label="t('members.allRoles')" />
            <ElOption v-for="r in assignableRoles" :key="r.id" :value="r.name" :label="r.name" />
          </ElSelect>
          <ElSelect v-model="status" class="filter-select">
            <ElOption value="all" :label="t('members.allStatuses')" />
            <ElOption value="active" :label="t('members.active')" />
            <ElOption value="disabled" :label="t('members.disabled')" />
          </ElSelect>
          <ElButton @click="resetFilters">{{ t('members.reset') }}</ElButton>
          <ElButton type="primary">{{ t('members.query') }}</ElButton>
        </div>

        <div class="action-bar">
          <div class="action-buttons">
            <ElButton v-if="canManage" type="primary" @click="openCreate">
              <Plus style="width: 16px; height: 16px; margin-right: 6px;" />
              {{ t('members.add') }}
            </ElButton>
            <ElButton>
              <UserPlus style="width: 16px; height: 16px; margin-right: 6px;" />
              {{ t('members.invite') }}
            </ElButton>
            <ElButton>
              <Check style="width: 16px; height: 16px; margin-right: 6px;" />
              {{ t('members.batchEnable') }}
            </ElButton>
            <ElButton>
              <Lock style="width: 16px; height: 16px; margin-right: 6px;" />
              {{ t('members.batchDisable') }}
            </ElButton>
            <ElButton>
              <Delete style="width: 16px; height: 16px; margin-right: 6px;" />
              {{ t('members.recycle') }}
            </ElButton>
            <ElButton>
              <Download style="width: 16px; height: 16px; margin-right: 6px;" />
              {{ t('members.export') }}
            </ElButton>
          </div>
          <div class="selected-count muted">{{ t('members.selected', { count: 0 }) }}</div>
        </div>

        <ElTable :data="paginatedMembers" row-key="id" :empty-text="t('members.noResults')" class="member-table">
          <ElTableColumn width="50">
            <template #header>
              <ElCheckbox />
            </template>
            <template #default>
              <ElCheckbox />
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.name')" min-width="180">
            <template #default="{ row }">
              <div class="member-cell">
                <span class="member-avatar" :style="{ background: '#2563eb', color: '#fff' }">{{ row.user.initials }}</span>
                <span class="member-name">{{ row.user.name }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.phone')" min-width="180">
            <template #default="{ row }">{{ row.user.email }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.role')" min-width="120">
            <template #default="{ row }">
              <ElTag v-if="row.roles[0]" :type="row.roles[0].isOwner ? 'danger' : row.roles[0].name === '运营管理员' ? 'primary' : 'info'" size="small" effect="plain">
                {{ row.roles[0].name }}
              </ElTag>
              <span v-else class="muted">—</span>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.dataPermission')" min-width="120">
            <template #default="{ row }">
              {{ row.roles[0]?.grants[0]?.scope === 'all' ? t('members.allData') : t('members.ownData') }}
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.status')" min-width="100">
            <template #default="{ row }">
              <span class="status-dot" :class="row.status === 'active' ? 'active' : 'disabled'"></span>
              {{ t(`members.${row.status}`) }}
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.lastLogin')" min-width="160">
            <template #default="{ row }">{{ formatDate(row.joinedAt) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.joinedAt')" min-width="120">
            <template #default="{ row }">{{ formatDate(row.joinedAt).split(' ')[0] }}</template>
          </ElTableColumn>
          <ElTableColumn v-if="canManage" :label="t('members.actions')" width="140" fixed="right">
            <template #default="{ row }">
              <div class="action-cell">
                <ElButton link type="primary" @click="openEdit(row)">{{ t('members.view') }}</ElButton>
                <ElButton link type="primary" @click="openEdit(row)">{{ t('members.edit') }}</ElButton>
                <ElButton link type="primary">···</ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="pagination-bar">
          <div class="total-count muted">{{ t('members.total', { count: visibleMembers.length }) }}</div>
          <ElPagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="visibleMembers.length"
            layout="prev, pager, next, sizes, jumper"
            :prev-text="t('members.page')"
            :next-text="t('members.page')"
          />
        </div>
      </section>
      <template #emptyActions><ElButton v-if="canManage" type="primary" @click="openCreate">{{ t('members.add') }}</ElButton></template>
    </PageState>

    <ElDrawer v-model="drawer" :title="t(editing ? 'members.edit' : 'members.add')" size="min(520px, 100vw)" destroy-on-close :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <div v-if="formError" class="form-error">{{ formError }}</div>
      <div v-if="editing" class="member-summary"><strong>{{ editing.user.name }}</strong><span class="muted">{{ editing.user.email }}</span></div>
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving" @submit.prevent="saveMember">
        <template v-if="!editing">
          <ElFormItem :label="t('members.name')" prop="name"><ElInput v-model="form.name" :maxlength="80" autocomplete="name" /></ElFormItem>
          <ElFormItem :label="t('members.email')" prop="email"><ElInput v-model="form.email" :maxlength="160" type="email" autocomplete="email" /></ElFormItem>
          <ElFormItem :label="t('members.department')" prop="department">
            <ElSelect v-model="form.department" :placeholder="t('members.allDepartments')" style="width: 100%">
              <ElOption v-for="dept in departments" :key="dept" :value="dept" :label="dept" />
            </ElSelect>
          </ElFormItem>
        </template>
        <ElFormItem :label="t('members.roles')" prop="roleIds">
          <ElSelect v-model="form.roleIds" multiple :placeholder="t('members.selectRoles')" style="width: 100%">
            <ElOption v-for="r in assignableRoles" :key="r.id" :value="r.id" :label="r.name" />
          </ElSelect>
        </ElFormItem>
        <p class="muted role-help">{{ t('members.roleHelp') }}</p>
      </ElForm>
      <template #footer><div class="form-actions"><ElButton :disabled="saving" @click="drawer = false">{{ t('common.cancel') }}</ElButton><ElButton type="primary" :loading="saving" @click="saveMember">{{ t(editing ? 'common.saveChanges' : 'members.save') }}</ElButton></div></template>
    </ElDrawer>
  </div>
</template>

<style scoped>
.breadcrumb { font-size: 13px; margin-bottom: 8px; }
.page-heading h1 { font-size: 28px; font-weight: 600; margin: 0 0 8px; color: #111827; }
.page-heading p { margin: 0; color: #6b7280; font-size: 14px; }

.stats-banner { display: grid; grid-template-columns: 1fr 320px; gap: 24px; margin-bottom: 24px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; }
.stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-content { flex: 1; min-width: 0; }
.stat-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 600; color: #111827; line-height: 1.2; }
.stat-total { font-size: 16px; color: #9ca3af; font-weight: 400; }
.stat-desc { font-size: 12px; color: #9ca3af; margin-top: 4px; }
.text-primary { color: #2563eb; }
.text-success { color: #16a34a; }
.text-warning { color: #d97706; }

.package-card { align-items: center; }
.package-ring { flex-shrink: 0; }

.promo-banner { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.promo-content h3 { font-size: 18px; font-weight: 600; color: #1e3a5f; margin: 0 0 8px; }
.promo-content p { font-size: 13px; color: #64748b; margin: 0; }
.promo-image { position: absolute; right: -20px; bottom: -20px; width: 140px; height: 140px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23dbeafe" opacity="0.5"/></svg>') center/contain no-repeat; opacity: 0.6; }

.filter-link { text-align: right; margin-bottom: 16px; }
.filter-link a { font-size: 13px; text-decoration: none; }

.search-bar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
.search-input { flex: 1; max-width: 400px; }
.search-input :deep(.el-input__wrapper) { border-radius: 6px; }
.filter-select { width: 140px; }

.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.action-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
.action-buttons .el-button { font-size: 14px; }
.selected-count { font-size: 13px; }

.member-table :deep(.el-table__header) { background: #f9fafb; }
.member-table :deep(.el-table__header th) { font-weight: 500; color: #374151; font-size: 13px; }
.member-table :deep(.el-table__body td) { padding: 12px 0; }

.member-cell { display: flex; align-items: center; gap: 10px; }
.member-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.member-name { font-weight: 500; color: #111827; }

.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.status-dot.active { background: #16a34a; }
.status-dot.disabled { background: #9ca3af; }

.action-cell { display: flex; gap: 8px; }
.action-cell .el-button { padding: 4px 8px; font-size: 13px; }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 20px 0 0; }
.total-count { font-size: 13px; }

.form-error { padding: 12px 14px; margin-bottom: 18px; background: #fef2f2; color: #b42318; border-radius: 6px; font-size: 14px; }
.member-summary { display: flex; flex-direction: column; gap: 5px; margin-bottom: 24px; }
.role-help { margin-top: -4px; font-size: 13px; line-height: 1.6; }

@media (max-width: 1200px) {
  .stats-banner { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr; }
  .search-bar { flex-wrap: wrap; }
  .search-input { max-width: 100%; }
  .filter-select { width: 100%; }
  .action-buttons { flex-wrap: wrap; }
}
</style>
