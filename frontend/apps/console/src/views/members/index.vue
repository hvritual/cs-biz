<script setup lang="ts">
import type { CreateMemberInput, MemberView, Role } from '#/api/mock/types';
import type { FormInstance, FormRules } from 'element-plus';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import { ElAlert, ElButton, ElDrawer, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElSelect, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { api, ServiceError } from '#/api/mock/service';
import PageHeader from '#/components/PageHeader.vue';
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
const status = ref('all');
const drawer = ref(false);
const editing = ref<MemberView | null>(null);
const saving = ref(false);
const changingMember = ref('');
const formError = ref('');
const formRef = ref<FormInstance>();
const creationKey = ref('');
let confirmationOpen = false;
const form = reactive<CreateMemberInput>({ name: '', email: '', title: '', roleIds: [] });
const canManage = computed(() => workspace.can('tenant.member.manage'));
const assignableRoles = computed(() => data.value.roles.filter((role) => !role.isOwner));
const visibleMembers = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  return data.value.members.filter((member) =>
    (status.value === 'all' || member.status === status.value)
    && (!text || `${member.user.name} ${member.user.email} ${member.user.title}`.toLocaleLowerCase().includes(text)),
  );
});
const rules = computed<FormRules>(() => ({
  name: [{ required: true, whitespace: true, message: t('members.nameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('members.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('members.emailInvalid'), trigger: ['blur', 'change'] },
  ],
  roleIds: [{ type: 'array', required: true, min: 1, message: t('members.rolesRequired'), trigger: 'change' }],
}));

function openCreate() {
  if (!canManage.value || !workspace.context || workspace.loading) return;
  const pending = readPendingCommand<CreateMemberInput>(workspace.requestContext(), 'member.create');
  editing.value = null;
  Object.assign(form, pending ? { ...pending.input, roleIds: [...pending.input.roleIds] } : { name: '', email: '', title: '', roleIds: [] });
  creationKey.value = pending?.key ?? crypto.randomUUID();
  formError.value = '';
  drawer.value = true;
}

function openEdit(member: MemberView) {
  editing.value = member;
  Object.assign(form, { name: member.user.name, email: member.user.email, title: member.user.title, roleIds: [...member.roleIds] });
  formError.value = '';
  drawer.value = true;
}

async function saveMember() {
  if (saving.value || !canManage.value || !workspace.context || workspace.loading) return;
  const captured = workspace.capture();
  const memberId = editing.value?.id;
  const input: CreateMemberInput = {
    name: form.name.trim(),
    email: form.email.trim(),
    title: form.title?.trim(),
    roleIds: [...form.roleIds],
  };
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
      t(nextStatus === 'disabled' ? 'members.pauseDescription' : 'members.resumeDescription', { name: member.user.name }),
      t(nextStatus === 'disabled' ? 'members.pauseTitle' : 'members.resumeTitle'),
      { confirmButtonText: t(nextStatus === 'disabled' ? 'members.pause' : 'members.resume'), cancelButtonText: t('common.cancel'), type: nextStatus === 'disabled' ? 'warning' : 'info' },
    );
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!captured.isCurrent()) return;
  changingMember.value = member.id;
  try {
    await api.updateMembership(captured.context, member.id, { status: nextStatus });
    if (!captured.isCurrent()) return;
    ElMessage.success(t(nextStatus === 'disabled' ? 'members.paused' : 'members.resumed'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) ElMessage.error(errorMessage(cause));
  } finally {
    if (captured.isCurrent()) changingMember.value = '';
  }
}

watch(() => workspace.generation, () => {
  if (confirmationOpen) ElMessageBox.close();
  drawer.value = false;
  editing.value = null;
  saving.value = false;
  changingMember.value = '';
  formError.value = '';
  query.value = '';
  status.value = 'all';
});
onBeforeUnmount(() => { if (confirmationOpen) ElMessageBox.close(); });
</script>

<template>
  <div class="page">
    <PageHeader :title="t('members.title')" :description="t('members.description')">
      <ElButton v-if="canManage" type="primary" :disabled="loading" @click="openCreate">{{ t('members.add') }}</ElButton>
    </PageHeader>
    <PageState :loading="loading" :error="error" :empty="data.members.length === 0" :empty-title="t('members.emptyTitle')" :empty-description="t('members.emptyDescription')" @retry="refresh">
      <section class="surface table-surface">
        <div class="toolbar">
          <ElInput v-model="query" class="member-search" clearable :placeholder="t('members.search')" :aria-label="t('members.search')" />
          <ElSelect v-model="status" class="member-filter" :aria-label="t('members.status')">
            <ElOption value="all" :label="t('members.allStatuses')" />
            <ElOption value="active" :label="t('members.active')" />
            <ElOption value="disabled" :label="t('members.disabled')" />
          </ElSelect>
        </div>
        <ElTable :data="visibleMembers" row-key="id" :empty-text="t('members.noResults')">
          <ElTableColumn :label="t('members.member')" min-width="230">
            <template #default="{ row }">
              <div class="member-cell">
                <span class="member-avatar" aria-hidden="true">{{ row.user.initials }}</span>
                <div><div class="member-name">{{ row.user.name }}</div><div class="muted member-email">{{ row.user.email }}</div></div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.jobTitle')" min-width="130"><template #default="{ row }">{{ row.user.title || '—' }}</template></ElTableColumn>
          <ElTableColumn :label="t('members.roles')" min-width="220">
            <template #default="{ row }"><div class="role-chips"><ElTag v-for="role in row.roles" :key="role.id" size="small" effect="plain" :type="role.isOwner ? 'success' : 'info'">{{ role.name }}</ElTag></div></template>
          </ElTableColumn>
          <ElTableColumn :label="t('members.status')" min-width="110"><template #default="{ row }"><span v-if="row.status" class="status-pill" :class="row.status === 'active' ? 'positive' : 'neutral'">{{ t(`members.${row.status}`) }}</span></template></ElTableColumn>
          <ElTableColumn :label="t('members.joinedAt')" min-width="150"><template #default="{ row }">{{ formatDate(row.joinedAt) }}</template></ElTableColumn>
          <ElTableColumn v-if="canManage" :label="t('common.actions')" width="190" fixed="right">
            <template #default="{ row }">
              <div v-if="row.canManage" class="action-cell">
                <ElButton link type="primary" @click="openEdit(row)">{{ t('members.editRoles') }}</ElButton>
                <ElButton link :type="row.status === 'active' ? 'danger' : 'primary'" :loading="changingMember === row.id" :disabled="Boolean(changingMember) && changingMember !== row.id" @click="changeStatus(row)">{{ t(row.status === 'active' ? 'members.pause' : 'members.resume') }}</ElButton>
              </div>
              <span v-else class="muted">{{ row.isOwner ? t('members.owner') : '—' }}</span>
            </template>
          </ElTableColumn>
        </ElTable>
        <div class="member-count muted">{{ t('members.count', { count: visibleMembers.length }) }}</div>
      </section>
      <template #emptyActions><ElButton v-if="canManage" type="primary" @click="openCreate">{{ t('members.add') }}</ElButton></template>
    </PageState>

    <ElDrawer v-model="drawer" :title="t(editing ? 'members.editRoles' : 'members.add')" size="min(520px, 100vw)" destroy-on-close :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <ElAlert v-if="formError" :title="formError" type="error" :closable="false" show-icon class="form-notice" />
      <div v-if="editing" class="member-summary"><strong>{{ editing.user.name }}</strong><span class="muted">{{ editing.user.email }}</span></div>
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving" @submit.prevent="saveMember">
        <template v-if="!editing">
          <ElFormItem :label="t('members.name')" prop="name"><ElInput v-model="form.name" :maxlength="80" autocomplete="name" /></ElFormItem>
          <ElFormItem :label="t('members.email')" prop="email"><ElInput v-model="form.email" :maxlength="160" type="email" autocomplete="email" /></ElFormItem>
          <ElFormItem :label="t('members.jobTitle')" prop="title"><ElInput v-model="form.title" :maxlength="80" /></ElFormItem>
        </template>
        <ElFormItem :label="t('members.roles')" prop="roleIds">
          <ElSelect v-model="form.roleIds" multiple :placeholder="t('members.selectRoles')" :aria-label="t('members.roles')" style="width: 100%">
            <ElOption v-for="role in assignableRoles" :key="role.id" :value="role.id" :label="role.name" />
          </ElSelect>
        </ElFormItem>
        <p class="muted role-help">{{ t('members.roleHelp') }}</p>
      </ElForm>
      <template #footer><div class="form-actions"><ElButton :disabled="saving" @click="drawer = false">{{ t('common.cancel') }}</ElButton><ElButton type="primary" :loading="saving" @click="saveMember">{{ t(editing ? 'common.saveChanges' : 'members.save') }}</ElButton></div></template>
    </ElDrawer>
  </div>
</template>

<style scoped>
.member-search { width: 320px; max-width: 100%; }
.member-filter { width: 150px; }
.member-cell { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.member-avatar { display: grid; place-items: center; flex: 0 0 36px; width: 36px; height: 36px; border-radius: 50%; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 14px; font-weight: 600; }
.member-name { margin-bottom: 3px; font-weight: 500; }
.member-email { font-size: 12px; }
.role-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.member-count { padding: 20px 0 0; font-size: 13px; }
.form-notice, .member-summary { margin-bottom: 24px; }
.member-summary { display: flex; flex-direction: column; gap: 5px; }
.role-help { margin-top: -4px; font-size: 13px; line-height: 1.6; }
@media (max-width: 600px) { .member-search, .member-filter { width: 100%; } }
</style>
