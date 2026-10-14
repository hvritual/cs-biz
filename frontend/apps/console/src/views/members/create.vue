<script setup lang="ts">
import type { CreateMemberInput, Grant, MemberView, Role } from '#/api/mock/types';
import type { FormInstance, FormRules } from 'element-plus';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect, ElStep, ElSteps,
} from 'element-plus';
import { ArrowLeft, ArrowRight, Check } from 'lucide-vue-next';

import { api, ServiceError } from '#/api/mock/service';
import PageHeader from '#/components/PageHeader.vue';
import PageState from '#/components/PageState.vue';
import PermissionSetEditor from '#/components/PermissionSetEditor.vue';
import { useResource } from '#/composables/useResource';
import { $t as t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

const router = useRouter();
const workspace = useWorkspaceStore();

const { data, loading, error, refresh } = useResource<{ members: MemberView[]; roles: Role[] }>(async (context) => {
  const [members, roles] = await Promise.all([
    api.listMembers(context),
    api.listRoles(context),
  ]);
  return { members, roles };
}, { members: [], roles: [] });

const step = ref(0);
const saving = ref(false);
const formError = ref('');
const formRef = ref<FormInstance>();

const form = reactive({
  username: '',
  name: '',
  phone: '',
  email: '',
  title: '',
  department: '',
});

const permissionMode = ref<'import' | 'custom'>('import');
const importMemberId = ref('');
const selectedRoleIds = ref<string[]>([]);
const customGrants = ref<Grant[]>([]);
const customSetName = ref('');
const creationKey = ref(crypto.randomUUID());

const assignableRoles = computed(() => data.value.roles.filter((r) => !r.isOwner));
const importableMembers = computed(() => data.value.members.filter((m) => m.status === 'active' && m.roles.length > 0));
const importSource = computed(() => data.value.members.find((m) => m.id === importMemberId.value) ?? null);

const importedGrantsSnapshot = ref('');

function grantsFingerprint(grants: Grant[]): string {
  return grants.map((g) => `${g.action}:${g.scope}`).sort().join('|');
}

watch(importMemberId, (id) => {
  const source = data.value.members.find((m) => m.id === id);
  if (source) {
    selectedRoleIds.value = [...source.roleIds];
    importedGrantsSnapshot.value = grantsFingerprint(
      source.roles.flatMap((r) => r.grants),
    );
  } else {
    selectedRoleIds.value = [];
    importedGrantsSnapshot.value = '';
  }
});

const loadedRoleIds = ref<string[]>([]);
watch(selectedRoleIds, (ids) => {
  const key = [...ids].sort().join(',');
  const prevKey = [...loadedRoleIds.value].sort().join(',');
  if (key === prevKey) return;
  loadedRoleIds.value = [...ids];
  const merged = data.value.roles
    .filter((r) => ids.includes(r.id))
    .flatMap((r) => r.grants);
  const seen = new Set<string>();
  customGrants.value = merged.filter((g) => {
    const k = `${g.action}:${g.scope}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  customSetName.value = ids.length === 1
    ? (data.value.roles.find((r) => r.id === ids[0])?.name ?? '')
    : '';
});

const matchedExistingRole = computed(() => {
  if (permissionMode.value !== 'custom' || customGrants.value.length === 0) return null;
  const fp = grantsFingerprint(customGrants.value);
  return data.value.roles.find((r) => grantsFingerprint(r.grants) === fp) ?? null;
});

const rules = computed<FormRules>(() => ({
  username: [{ required: true, whitespace: true, message: t('members.usernameRequired'), trigger: 'blur' }],
  name: [{ required: true, whitespace: true, message: t('members.nameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('members.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('members.emailInvalid'), trigger: ['blur', 'change'] },
  ],
  phone: [{
    pattern: /^1[3-9]\d{9}$/,
    message: t('members.phoneInvalid'),
    trigger: 'blur',
    validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
      if (!value) { callback(); return; }
      if (!/^1[3-9]\d{9}$/.test(value)) callback(new Error(t('members.phoneInvalid')));
      else callback();
    },
  }],
}));

async function goNext() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  step.value = 1;
}

function goBack() {
  if (step.value === 0) {
    router.push('/members');
  } else {
    step.value = 0;
  }
}

function resolveRoleIds(): string[] {
  if (permissionMode.value === 'import') {
    return [...selectedRoleIds.value];
  }
  if (matchedExistingRole.value) {
    return [...new Set([...selectedRoleIds.value, matchedExistingRole.value.id])].sort();
  }
  return [...selectedRoleIds.value];
}

async function submit() {
  if (saving.value || !workspace.context || workspace.loading) return;
  const captured = workspace.capture();
  const input: CreateMemberInput = {
    username: form.username.trim(),
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    title: form.title.trim(),
    department: form.department.trim(),
    roleIds: resolveRoleIds(),
  };

  if (permissionMode.value === 'custom' && !matchedExistingRole.value) {
    const setName = customSetName.value.trim();
    if (!setName) { formError.value = t('members.setNameRequired'); return; }
    if (customGrants.value.length === 0) { formError.value = t('members.setGrantsRequired'); return; }
    try {
      const created = await api.createRole(captured.context, { name: setName, description: '', grants: customGrants.value.map((g) => ({ ...g })) });
      input.roleIds = [...new Set([...input.roleIds, created.id])].sort();
    } catch (cause) {
      if (captured.isCurrent()) formError.value = errorMessage(cause);
      return;
    }
  }

  const key = creationKey.value;
  saving.value = true;
  formError.value = '';
  try {
    await api.createMember(captured.context, input, key);
    if (!captured.isCurrent()) return;
    ElMessage.success(t('members.created'));
    await refresh();
    router.push('/members');
  } catch (cause) {
    if (cause instanceof ServiceError && cause.status >= 400 && cause.status < 500
      && cause.status !== 408 && !['IDEMPOTENCY_CONFLICT','REQUEST_CANCELLED','STORAGE_UNAVAILABLE'].includes(cause.code)) {
      // don't clear idempotency on validation errors
    }
    if (captured.isCurrent()) formError.value = errorMessage(cause);
  } finally {
    if (captured.isCurrent()) saving.value = false;
  }
}

watch(() => workspace.generation, () => {
  saving.value = false;
  formError.value = '';
});
</script>

<template>
  <div class="page cl-wizard-page">
    <PageHeader :title="t('members.wizardTitle')" :description="t('members.description')">
      <ElButton @click="goBack"><ArrowLeft :size="15" />{{ t('members.backToList') }}</ElButton>
    </PageHeader>

    <PageState :loading="loading" :error="error" :empty="false" @retry="refresh">
      <div class="cl-wizard-steps">
        <ElSteps :active="step" finish-status="success" align-center>
          <ElStep :title="t('members.stepBasic')" />
          <ElStep :title="t('members.stepPermission')" />
        </ElSteps>
      </div>

      <ElAlert v-if="formError" :title="formError" type="error" :closable="false" show-icon class="form-notice" />

      <div v-if="step === 0" class="cl-wizard-body">
        <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving" @submit.prevent="goNext">
          <div class="cl-wizard-grid">
            <ElFormItem :label="t('members.username')" prop="username">
              <ElInput v-model="form.username" :maxlength="60" />
            </ElFormItem>
            <ElFormItem :label="t('members.name')" prop="name">
              <ElInput v-model="form.name" :maxlength="80" />
            </ElFormItem>
            <ElFormItem :label="t('members.phone')" prop="phone">
              <ElInput v-model="form.phone" :maxlength="20" />
            </ElFormItem>
            <ElFormItem :label="t('members.email')" prop="email">
              <ElInput v-model="form.email" type="email" :maxlength="160" />
            </ElFormItem>
            <ElFormItem :label="t('members.jobTitle')" prop="title">
              <ElInput v-model="form.title" :maxlength="80" />
            </ElFormItem>
            <ElFormItem :label="t('members.department')" prop="department">
              <ElInput v-model="form.department" :maxlength="80" />
            </ElFormItem>
          </div>
          <div class="cl-wizard-actions">
            <ElButton @click="router.push('/members')">{{ t('common.cancel') }}</ElButton>
            <ElButton type="primary" @click="goNext">{{ t('members.next') }}<ArrowRight :size="15" /></ElButton>
          </div>
        </ElForm>
      </div>

      <div v-else class="cl-wizard-body">
        <div class="cl-tab-switcher">
          <button type="button" :class="{ active: permissionMode === 'import' }" @click="permissionMode = 'import'">{{ t('members.importFromMember') }}</button>
          <button type="button" :class="{ active: permissionMode === 'custom' }" @click="permissionMode = 'custom'">{{ t('members.customPermission') }}</button>
        </div>

        <div v-if="permissionMode === 'import'" class="cl-import-panel">
          <p class="muted">{{ t('members.importFromMemberHelp') }}</p>
          <ElSelect v-model="importMemberId" :placeholder="t('members.selectMember')" filterable style="width:100%;max-width:400px">
            <ElOption v-for="member in importableMembers" :key="member.id" :value="member.id" :label="member.user.name">
              <span>{{ member.user.name }}</span>
              <span class="muted" style="margin-left:8px;font-size:12px">{{ member.user.email }}</span>
            </ElOption>
          </ElSelect>
          <div v-if="importSource" class="cl-imported-tags">
            <p class="cl-imported-label">{{ t('members.importedFrom', { name: importSource.user.name }) }}</p>
            <div class="cl-role-tags">
              <span v-for="role in importSource.roles" :key="role.id" class="cl-role-chip">{{ role.name }}</span>
            </div>
          </div>
        </div>

        <div v-else class="cl-custom-panel">
          <p class="muted">{{ t('members.customPermissionHelp') }}</p>
          <ElFormItem :label="t('members.selectPermissions')">
            <ElSelect v-model="selectedRoleIds" multiple :placeholder="t('members.selectPermissions')" style="width:100%">
              <ElOption v-for="role in assignableRoles" :key="role.id" :value="role.id" :label="role.name" />
            </ElSelect>
          </ElFormItem>
          <p class="muted" style="font-size:12px">{{ t('members.permissionHelp') }}</p>

          <div class="cl-editor-section">
            <div class="cl-editor-head">
              <strong>{{ t('members.createNewSet') }}</strong>
              <p class="muted">{{ t('members.inlineSetHelp') }}</p>
            </div>
            <ElFormItem :label="t('members.setName')" class="cl-inline-set-name">
              <ElInput v-model="customSetName" :maxlength="60" />
            </ElFormItem>
            <PermissionSetEditor v-model="customGrants" />
            <ElAlert v-if="matchedExistingRole" :title="t('members.reuseExisting', { name: matchedExistingRole.name })" type="info" :closable="false" show-icon />
          </div>
        </div>

        <div class="cl-wizard-actions">
          <ElButton @click="step = 0"><ArrowLeft :size="15" />{{ t('members.prev') }}</ElButton>
          <ElButton type="primary" :disabled="selectedRoleIds.length === 0 && permissionMode === 'import'" :loading="saving" @click="submit">
            <Check :size="15" />{{ t('members.save') }}
          </ElButton>
        </div>
      </div>
    </PageState>
  </div>
</template>

<style scoped>
.cl-wizard-page { max-width: 800px; margin: 0 auto; }
.cl-wizard-steps { padding: 24px 40px 0; }
.cl-wizard-body { padding: 24px 40px 32px; }
.cl-wizard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
.cl-wizard-actions { display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid var(--biz-border); margin-top: 24px; }
.form-notice { margin: 0 40px 16px; }
.cl-tab-switcher { display: inline-flex; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 20px; }
.cl-tab-switcher button { background: var(--color-surface); border: 0; padding: 7px 20px; font-size: 13px; cursor: pointer; color: var(--color-text-secondary); transition: all .15s; }
.cl-tab-switcher button + button { border-left: 1px solid var(--color-border); }
.cl-tab-switcher button.active { background: var(--color-primary); color: var(--color-on-primary); font-weight: 600; }
.cl-import-panel, .cl-custom-panel { display: grid; gap: 16px; }
.cl-imported-tags { margin-top: 8px; }
.cl-imported-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.cl-role-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.cl-role-chip { display: inline-block; padding: 2px 10px; font-size: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface-soft); color: var(--color-text-secondary); }
.cl-editor-section { display: grid; gap: var(--space-3); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--biz-border); }
.cl-editor-head strong { font-size: 13px; }
.cl-editor-head p { margin: 2px 0 0; font-size: 12px; line-height: 1.6; }
.cl-inline-set-name { margin-bottom: var(--space-3); }
@media (max-width: 600px) {
  .cl-wizard-grid { grid-template-columns: 1fr; }
  .cl-wizard-steps, .cl-wizard-body { padding-inline: 16px; }
  .form-notice { margin-inline: 16px; }
}
</style>
