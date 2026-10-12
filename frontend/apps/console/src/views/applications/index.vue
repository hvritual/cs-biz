<script setup lang="ts">
import type { ActivationRequest, Entitlement } from '#/api/mock/types';

import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { ElAlert, ElButton, ElMessage, ElMessageBox } from 'element-plus';
import { ContactRound } from 'lucide-vue-next';

import { api } from '#/api/mock/service';
import PageHeader from '#/components/PageHeader.vue';
import PageState from '#/components/PageState.vue';
import { useResource } from '#/composables/useResource';
import { $t as t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage, formatDate } from '#/utils/format';

const workspace = useWorkspaceStore();
const router = useRouter();
const { data, loading, error, refresh } = useResource<{ entitlements: Entitlement[]; requests: ActivationRequest[] }>(async (context) => {
  const [entitlements, requests] = await Promise.all([api.listEntitlements(context), api.listActivationRequests(context)]);
  return { entitlements, requests };
}, { entitlements: [], requests: [] });
const requesting = ref(false);
const requestError = ref('');
let confirmationOpen = false;
const entitlement = computed(() => data.value.entitlements.find((entry) => entry.moduleCode === 'crm'));
const enabled = computed(() => entitlement.value?.status === 'active');
const pending = computed(() => data.value.requests.find((request) => request.moduleCode === 'crm' && request.status === 'pending'));
const canRequest = computed(() => workspace.can('tenant.module.request'));
const canEnter = computed(() => enabled.value && workspace.can('crm.customer.read'));

async function requestApplication() {
  if (requesting.value || pending.value || enabled.value || !canRequest.value) return;
  const captured = workspace.capture();
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm(t('applications.requestDescription', { tenant: workspace.tenant?.name ?? '' }), t('applications.requestTitle'), { confirmButtonText: t('applications.submitRequest'), cancelButtonText: t('common.cancel'), type: 'info' });
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!captured.isCurrent()) return;
  requesting.value = true;
  requestError.value = '';
  try {
    const result = await api.requestActivation(captured.context, 'crm');
    if (!captured.isCurrent()) return;
    data.value = { ...data.value, requests: [...data.value.requests.filter((request) => request.id !== result.id), result] };
    ElMessage.success(t('applications.requested'));
    await refresh();
  } catch (cause) {
    if (captured.isCurrent()) requestError.value = errorMessage(cause);
  } finally {
    if (captured.isCurrent()) requesting.value = false;
  }
}

watch(() => workspace.generation, () => { if (confirmationOpen) ElMessageBox.close(); requesting.value = false; requestError.value = ''; });
onBeforeUnmount(() => { if (confirmationOpen) ElMessageBox.close(); });
</script>

<template>
  <div class="page">
    <PageHeader :title="t('applications.title')" :description="t('applications.description')" />
    <PageState :loading="loading" :error="error" :empty="false" @retry="refresh">
      <section class="surface application-surface">
        <div class="application-heading">
          <div class="application-icon"><ContactRound :size="26" :stroke-width="1.7" aria-hidden="true" /></div>
          <div class="application-name"><h2>{{ t('applications.crmName') }}</h2><p class="muted">{{ t('applications.crmDescription') }}</p></div>
          <span class="status-pill" :class="enabled ? 'positive' : pending ? 'warning' : 'neutral'">{{ t(enabled ? 'applications.active' : pending ? 'applications.pending' : 'applications.inactive') }}</span>
        </div>
        <div class="application-features">
          <div><h3>{{ t('applications.customerRecords') }}</h3><p class="muted">{{ t('applications.customerRecordsDescription') }}</p></div>
          <div><h3>{{ t('applications.ownership') }}</h3><p class="muted">{{ t('applications.ownershipDescription') }}</p></div>
          <div><h3>{{ t('applications.relationships') }}</h3><p class="muted">{{ t('applications.relationshipsDescription') }}</p></div>
        </div>
        <div class="application-footer">
          <div class="application-status">
            <template v-if="enabled">
              <strong>{{ t('applications.ready') }}</strong>
              <p v-if="entitlement?.activatedAt" class="muted">{{ t('applications.activatedAt', { date: formatDate(entitlement.activatedAt) }) }}</p>
              <p v-if="!canEnter" class="muted">{{ t('applications.askForAccess') }}</p>
            </template>
            <template v-else-if="pending">
              <strong>{{ t('applications.requestReceived') }}</strong>
              <p class="muted">{{ t('applications.requestedAt', { date: formatDate(pending.requestedAt) }) }}</p>
            </template>
            <template v-else>
              <strong>{{ t('applications.available') }}</strong>
              <p class="muted">{{ t(canRequest ? 'applications.activationDescription' : 'applications.askOwner') }}</p>
            </template>
          </div>
          <ElButton v-if="canEnter" type="primary" @click="router.push('/customers')">{{ t('applications.enter') }}</ElButton>
          <ElButton v-else-if="!enabled && !pending && canRequest" type="primary" :loading="requesting" @click="requestApplication">{{ t('applications.request') }}</ElButton>
          <ElButton v-else-if="pending" @click="refresh">{{ t('applications.checkProgress') }}</ElButton>
        </div>
        <ElAlert v-if="requestError" :title="requestError" type="error" :closable="false" show-icon class="request-error" />
      </section>
    </PageState>
  </div>
</template>

<style scoped>
.application-surface { padding: 28px; }
.application-heading { display: flex; align-items: center; gap: 16px; }
.application-icon { display: grid; place-items: center; flex: 0 0 52px; width: 52px; height: 52px; border: 1px solid var(--el-color-primary-light-8); border-radius: 12px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.application-name { flex: 1; min-width: 0; }
.application-name h2 { margin: 0; font-size: 18px; line-height: 26px; font-weight: 600; }
.application-name p { margin: 5px 0 0; font-size: 14px; line-height: 22px; }
.application-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; margin: 30px 0; padding: 28px 0; border-top: 1px solid var(--el-border-color-extra-light); border-bottom: 1px solid var(--el-border-color-extra-light); }
.application-features h3 { margin: 0 0 8px; font-size: 14px; font-weight: 500; }
.application-features p { margin: 0; font-size: 13px; line-height: 1.7; }
.application-footer { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.application-status strong { font-size: 14px; font-weight: 500; }
.application-status p { margin: 5px 0 0; font-size: 13px; line-height: 1.6; }
.request-error { margin-top: 20px; }
@media (max-width: 760px) { .application-surface { padding: 20px; } .application-heading { flex-wrap: wrap; gap: 12px; } .application-heading > .status-pill { margin-left: 64px; } .application-features { grid-template-columns: 1fr; gap: 22px; margin: 24px 0; padding: 24px 0; } .application-footer { align-items: flex-start; flex-direction: column; gap: 18px; } }
</style>
