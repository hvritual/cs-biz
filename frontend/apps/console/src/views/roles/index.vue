<script setup lang="ts">
import type { Role, RoleInput } from '#/api/mock/types';
import type { FormInstance, FormRules } from 'element-plus';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ElAlert, ElButton, ElDrawer, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElTable, ElTableColumn } from 'element-plus';

import { api } from '#/api/mock/service';
import PageHeader from '#/components/PageHeader.vue';
import PageState from '#/components/PageState.vue';
import PermissionSetEditor from '#/components/PermissionSetEditor.vue';
import { useResource } from '#/composables/useResource';
import { $t as t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

const workspace = useWorkspaceStore();
const route = useRoute();
const router = useRouter();
const { data, loading, error, refresh } = useResource<Role[]>((context) => api.listRoles(context), []);
const query = ref('');
const drawer = ref(false);
const editing = ref<Role | null>(null);
const saving = ref(false);
const deleting = ref('');
const formError = ref('');
const formRef = ref<FormInstance>();
let confirmationOpen = false;
const form = reactive<RoleInput>({ name: '', description: '', grants: [], menuGrants: [] });
const canManage = computed(() => workspace.can('tenant.role.manage'));
const readonly = computed(() => !canManage.value || Boolean(editing.value?.isSystem));
const visibleRoles = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  return data.value.filter((role) => !text || `${role.name} ${role.description}`.toLocaleLowerCase().includes(text));
});
const rules = computed<FormRules>(() => ({ name: [{ required: true, whitespace: true, message: t('roles.nameRequired'), trigger: 'blur' }] }));

function openRole(role?: Role) {
  editing.value = role ?? null;
  Object.assign(form, role ? { name: role.name, description: role.description, grants: role.grants.map((grant) => ({ ...grant })), menuGrants: [...role.menuGrants] } : { name: '', description: '', grants: [], menuGrants: [] });
  formError.value = '';
  drawer.value = true;
}

async function saveRole() {
  if (saving.value || readonly.value || !workspace.context || workspace.loading) return;
  const captured = workspace.capture();
  const roleId = editing.value?.id;
  const input: RoleInput = { name: form.name.trim(), description: form.description.trim(), grants: form.grants.map((grant) => ({ ...grant })), menuGrants: [...(form.menuGrants ?? [])] };
  saving.value = true;
  formError.value = '';
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !captured.isCurrent() || readonly.value) return;
    if (input.grants.length === 0 && !input.menuGrants?.length) { formError.value = t('roles.grantsRequired'); return; }
    if (roleId) await api.updateRole(captured.context, roleId, input);
    else await api.createRole(captured.context, input);
    if (!captured.isCurrent()) return;
    drawer.value = false;
    ElMessage.success(t(roleId ? 'roles.updated' : 'roles.created'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) formError.value = errorMessage(cause);
  } finally {
    if (captured.isCurrent()) saving.value = false;
  }
}

async function removeRole(role: Role) {
  if (deleting.value || !canManage.value || role.isSystem) return;
  const captured = workspace.capture();
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm(t('roles.deleteDescription', { name: role.name }), t('roles.deleteTitle'), { confirmButtonText: t('roles.delete'), cancelButtonText: t('common.cancel'), type: 'warning' });
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!captured.isCurrent()) return;
  deleting.value = role.id;
  try {
    await api.deleteRole(captured.context, role.id);
    if (!captured.isCurrent()) return;
    ElMessage.success(t('roles.deleted'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) ElMessage.error(errorMessage(cause));
  } finally {
    if (captured.isCurrent()) deleting.value = '';
  }
}

watch([() => route.query.create, canManage], ([value, can]) => {
  if (value === '1' && can) {
    openRole();
    void router.replace({ path: '/roles' });
  }
}, { immediate: true });
watch(() => workspace.generation, () => { if (confirmationOpen) ElMessageBox.close(); drawer.value = false; editing.value = null; saving.value = false; deleting.value = ''; formError.value = ''; query.value = ''; });
onBeforeUnmount(() => { if (confirmationOpen) ElMessageBox.close(); });
</script>

<template>
  <div class="page">
    <PageHeader :title="t('roles.title')" :description="t('roles.description')"><ElButton v-if="canManage" type="primary" :disabled="loading" @click="openRole()">{{ t('roles.create') }}</ElButton></PageHeader>
    <PageState :loading="loading" :error="error" :empty="data.length === 0" :empty-title="t('roles.emptyTitle')" :empty-description="t('roles.emptyDescription')" @retry="refresh">
      <section class="surface table-surface">
        <div class="toolbar"><ElInput v-model="query" class="role-search" clearable :placeholder="t('roles.search')" :aria-label="t('roles.search')" /></div>
        <ElTable :data="visibleRoles" row-key="id" :empty-text="t('roles.noResults')">
          <ElTableColumn :label="t('roles.name')" min-width="190"><template #default="{ row }"><span class="role-name">{{ row.name }}</span></template></ElTableColumn>
          <ElTableColumn :label="t('roles.roleDescription')" min-width="290"><template #default="{ row }"><span class="muted">{{ row.description || '—' }}</span></template></ElTableColumn>
          <ElTableColumn :label="t('roles.type')" min-width="130"><template #default="{ row }"><span class="status-pill" :class="row.isSystem ? 'neutral' : 'positive'">{{ t(row.isSystem ? 'roles.defaultRole' : 'roles.customRole') }}</span></template></ElTableColumn>
          <ElTableColumn :label="t('roles.grantCount')" min-width="125"><template #default="{ row }">{{ t('roles.actionCount', { count: row.grants.length }) }}</template></ElTableColumn>
          <ElTableColumn :label="t('common.actions')" width="165" fixed="right"><template #default="{ row }"><div class="action-cell"><ElButton link type="primary" @click="openRole(row)">{{ t(canManage && !row.isSystem ? 'common.edit' : 'common.view') }}</ElButton><ElButton v-if="canManage && !row.isSystem" link type="danger" :loading="deleting === row.id" :disabled="Boolean(deleting) && deleting !== row.id" @click="removeRole(row)">{{ t('roles.delete') }}</ElButton></div></template></ElTableColumn>
        </ElTable>
        <div class="role-count muted">{{ t('roles.count', { count: visibleRoles.length }) }}</div>
      </section>
      <template #emptyActions><ElButton v-if="canManage" type="primary" @click="openRole()">{{ t('roles.create') }}</ElButton></template>
    </PageState>
    <ElDrawer v-model="drawer" :title="t(editing ? (readonly ? 'roles.view' : 'roles.edit') : 'roles.create')" size="min(920px, 100vw)" destroy-on-close :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <ElAlert v-if="formError" :title="formError" type="error" :closable="false" show-icon class="form-notice" />
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving || readonly" @submit.prevent="saveRole">
        <ElFormItem :label="t('roles.name')" prop="name"><ElInput v-model="form.name" :maxlength="60" /></ElFormItem>
        <ElFormItem :label="t('roles.roleDescription')" prop="description"><ElInput v-model="form.description" type="textarea" :rows="2" :maxlength="240" /></ElFormItem>
      </ElForm>
      <h2 class="section-title permissions-title">{{ t('roles.permissions') }}</h2>
      <p class="muted role-help">{{ t('roles.scopeHelp') }}</p>
      <PermissionSetEditor v-model="form.grants" v-model:menu-grants="form.menuGrants" :disabled="saving || readonly" />
      <template #footer><div class="form-actions"><ElButton :disabled="saving" @click="drawer = false">{{ t(readonly ? 'common.close' : 'common.cancel') }}</ElButton><ElButton v-if="!readonly" type="primary" :loading="saving" @click="saveRole">{{ t('roles.save') }}</ElButton></div></template>
    </ElDrawer>
  </div>
</template>

<style scoped>
.role-search { width: 320px; max-width: 100%; }
.role-name { font-weight: 500; }
.role-count { padding: 20px 0 0; font-size: 13px; }
.form-notice { margin-bottom: 24px; }
.permissions-title { margin-top: 28px; }
.role-help { margin: 8px 0 16px; font-size: 13px; line-height: 1.6; }
@media (max-width: 600px) { .role-search { width: 100%; } }
</style>
