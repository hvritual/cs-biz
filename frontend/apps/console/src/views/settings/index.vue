<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Building2 } from 'lucide-vue-next';
import { api } from '#/api/mock/service';
import PageHeader from '#/components/PageHeader.vue';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage, formatDate } from '#/utils/format';

const workspace = useWorkspaceStore();
const form = reactive({ name: '', contact: '', phone: '', email: '' });
const formRef = ref<FormInstance>();
const saving = ref(false);
const error = ref('');
const editable = computed(() => workspace.can('tenant.profile.update'));
watch(() => workspace.tenant?.id, () => {
  if (workspace.tenant) Object.assign(form, { name: workspace.tenant.name, contact: workspace.tenant.contact, phone: workspace.tenant.phone, email: workspace.tenant.email });
}, { immediate: true });
watch(() => workspace.generation, () => { error.value = ''; saving.value = false; });
const rules = computed<FormRules>(() => ({
  name: [{ required: true, whitespace: true, message: $t('settings.validation.name'), trigger: 'blur' }],
  contact: [{ required: true, whitespace: true, message: $t('settings.validation.contact'), trigger: 'blur' }],
  email: [{ required: true, message: $t('settings.validation.email'), trigger: 'blur' }, { type: 'email', message: $t('errors.INVALID_EMAIL'), trigger: 'blur' }],
  phone: [{ required: true, message: $t('settings.validation.phone'), trigger: 'blur' }, { pattern: /^[+\d][\d\s()-]{5,24}$/, message: $t('customers.validation.phoneFormat'), trigger: 'blur' }],
}));
async function save() {
  if (saving.value || !editable.value || !workspace.context) return;
  const captured = workspace.capture(); saving.value = true; error.value = '';
  const input = { name: form.name.trim(), contact: form.contact.trim(), phone: form.phone.trim(), email: form.email.trim() };
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !captured.isCurrent()) return;
    await api.updateTenant(captured.context, input);
    if (!captured.isCurrent()) return;
    ElMessage.success($t('settings.saved'));
    await workspace.refreshAccess();
  } catch (cause) { if (captured.isCurrent()) error.value = errorMessage(cause); }
  finally { saving.value = false; }
}
</script>

<template>
  <main class="page"><PageHeader :title="$t('settings.title')" :description="$t('settings.description')" />
    <section class="surface profile-surface"><div class="profile-heading"><div class="profile-logo"><Building2 :size="28" /></div><div><h2>{{ workspace.tenant?.name }}</h2><p>{{ $t('settings.since', { date: workspace.tenant ? formatDate(workspace.tenant.createdAt) : '' }) }}</p></div></div>
      <div v-if="error" class="form-error" role="alert">{{ error }}</div>
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="!editable || saving" @submit.prevent="save"><div class="form-grid"><ElFormItem :label="$t('settings.name')" prop="name" class="full-width"><ElInput v-model="form.name" maxlength="100" data-testid="tenant-name" /></ElFormItem><ElFormItem :label="$t('settings.contact')" prop="contact"><ElInput v-model="form.contact" maxlength="80" /></ElFormItem><ElFormItem :label="$t('settings.phone')" prop="phone"><ElInput v-model="form.phone" maxlength="25" /></ElFormItem><ElFormItem :label="$t('settings.email')" prop="email" class="full-width"><ElInput v-model="form.email" maxlength="160" /></ElFormItem></div></ElForm>
      <div v-if="editable" class="profile-footer"><ElButton type="primary" :loading="saving" @click="save">{{ $t('settings.save') }}</ElButton></div><p v-else class="muted">{{ $t('settings.readonly') }}</p>
    </section>
  </main>
</template>

<style scoped>
.profile-surface { max-width: 780px; }
.profile-heading { display: flex; align-items: center; gap: 16px; padding: 0 0 26px; margin-bottom: 24px; border-bottom: 1px solid var(--biz-border); }
.profile-logo { width: 58px; height: 58px; border-radius: var(--radius-md); color: var(--el-color-primary); background: var(--el-color-primary-light-9); display: grid; place-items: center; }
.profile-heading h2 { margin: 0 0 5px; font-size: 19px; font-weight: 550; }
.profile-heading p { margin: 0; color: var(--biz-muted); font-size: 13px; }
.profile-footer { border-top: 1px solid var(--biz-border); padding-top: 22px; display: flex; justify-content: flex-end; }
</style>
