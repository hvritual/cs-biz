<script setup lang="ts">
import type { ActivationRequest, PlatformTenant } from '#/api/mock/types';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { ElButton, ElInput, ElMessage, ElMessageBox, ElTable, ElTableColumn } from 'element-plus';

import { api } from '#/api/mock/service';
import PageHeader from '#/components/PageHeader.vue';
import PageState from '#/components/PageState.vue';
import StatStrip from '#/components/StatStrip.vue';
import { $t as t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage, formatDate } from '#/utils/format';

const workspace = useWorkspaceStore();
const tenants = ref<PlatformTenant[]>([]);
const requests = ref<ActivationRequest[]>([]);
const query = ref('');
const loading = ref(false);
const error = ref<unknown>(null);
const changingTenant = ref('');
let controller: AbortController | undefined;
let sequence = 0;
let alive = true;
let confirmationOpen = false;
const isOperator = computed(() => workspace.user?.platformRole === 'operator');
const visibleTenants = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  return tenants.value.filter((tenant) => !text || `${tenant.name} ${tenant.contact} ${tenant.email}`.toLocaleLowerCase().includes(text));
});
const sortedRequests = computed(() => [...requests.value].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)));
const statistics = computed(() => [
  { label: t('platform.tenantCount'), value: tenants.value.length },
  { label: t('platform.activeCount'), value: tenants.value.filter(moduleEnabled).length },
  { label: t('platform.pendingCount'), value: requests.value.filter((request) => request.status === 'pending').length },
]);

function moduleEnabled(tenant: PlatformTenant) {
  return tenant.entitlements.some((entitlement) => entitlement.moduleCode === 'crm' && entitlement.status === 'active');
}

function tenantFor(id: string) {
  return tenants.value.find((tenant) => tenant.id === id);
}

async function refresh() {
  const currentRequest = ++sequence;
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  const subjectId = workspace.user?.id;
  const generation = workspace.generation;
  const current = () => alive && sequence === currentRequest && !signal.aborted && subjectId === workspace.user?.id && generation === workspace.generation;
  error.value = null;
  if (!isOperator.value) {
    tenants.value = [];
    requests.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [nextTenants, nextRequests] = await Promise.all([api.platformListTenants({ signal }), api.getActivationRequests({ signal })]);
    if (!current()) return;
    tenants.value = nextTenants;
    requests.value = nextRequests;
  } catch (cause) {
    if (current()) { tenants.value = []; requests.value = []; error.value = cause; }
  } finally {
    if (current()) loading.value = false;
  }
}

async function changeModule(tenant: PlatformTenant, enabled: boolean) {
  if (changingTenant.value || !isOperator.value) return;
  const subjectId = workspace.user?.id;
  const generation = workspace.generation;
  const current = () => alive && subjectId === workspace.user?.id && generation === workspace.generation && isOperator.value;
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm(t(enabled ? 'platform.enableDescription' : 'platform.pauseDescription', { tenant: tenant.name }), t(enabled ? 'platform.enableTitle' : 'platform.pauseTitle'), { confirmButtonText: t(enabled ? 'platform.enable' : 'platform.pause'), cancelButtonText: t('common.cancel'), type: enabled ? 'info' : 'warning' });
  } catch { return; }
  finally { confirmationOpen = false; }
  if (!current()) return;
  changingTenant.value = tenant.id;
  try {
    await api.platformSetModule(tenant.id, 'crm', enabled);
    if (!current()) return;
    ElMessage.success(t(enabled ? 'platform.enabled' : 'platform.paused', { tenant: tenant.name }));
    await refresh();
  } catch (cause) {
    if (current()) ElMessage.error(errorMessage(cause));
  } finally {
    if (current()) changingTenant.value = '';
  }
}

async function approveRequest(request: ActivationRequest) {
  const tenant = tenantFor(request.tenantId);
  if (tenant) await changeModule(tenant, true);
}

const unsubscribe = api.subscribe((event) => {
  if (isOperator.value && !changingTenant.value && (event.type === 'access' || event.type === 'data' || event.type === 'reset')) void refresh();
});
watch(() => [workspace.user?.id, workspace.generation], () => {
  if (confirmationOpen) ElMessageBox.close();
  tenants.value = [];
  requests.value = [];
  query.value = '';
  changingTenant.value = '';
  void refresh();
}, { immediate: true, flush: 'sync' });
onBeforeUnmount(() => { alive = false; sequence++; controller?.abort(); unsubscribe(); if (confirmationOpen) ElMessageBox.close(); });
</script>

<template>
  <div class="page">
    <PageHeader :title="t('platform.title')" :description="t('platform.description')"><ElButton :loading="loading" @click="refresh">{{ t('common.refresh') }}</ElButton></PageHeader>
    <PageState :loading="loading" :error="error" :empty="tenants.length === 0" :empty-title="t('platform.emptyTitle')" :empty-description="t('platform.emptyDescription')" @retry="refresh">
      <StatStrip :items="statistics" />
      <section class="surface table-surface">
        <div class="toolbar"><ElInput v-model="query" class="tenant-search" clearable :placeholder="t('platform.search')" :aria-label="t('platform.search')" /></div>
        <ElTable :data="visibleTenants" row-key="id" :empty-text="t('platform.noResults')">
          <ElTableColumn :label="t('platform.tenant')" min-width="190"><template #default="{ row }"><div class="tenant-cell"><span class="tenant-avatar" aria-hidden="true">{{ row.shortName.slice(0, 1) }}</span><div><div class="tenant-name">{{ row.name }}</div><div class="muted tenant-email">{{ row.email }}</div></div></div></template></ElTableColumn>
          <ElTableColumn :label="t('platform.contact')" min-width="150"><template #default="{ row }"><div>{{ row.contact }}</div><div class="muted tenant-email">{{ row.phone }}</div></template></ElTableColumn>
          <ElTableColumn :label="t('platform.members')" min-width="90"><template #default="{ row }">{{ row.memberCount }}</template></ElTableColumn>
          <ElTableColumn :label="t('platform.customers')" min-width="90"><template #default="{ row }">{{ row.customerCount }}</template></ElTableColumn>
          <ElTableColumn :label="t('platform.crmStatus')" min-width="130"><template #default="{ row }"><span class="status-pill" :class="moduleEnabled(row) ? 'positive' : 'neutral'">{{ t(moduleEnabled(row) ? 'applications.active' : 'applications.inactive') }}</span></template></ElTableColumn>
          <ElTableColumn :label="t('platform.createdAt')" min-width="150"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></ElTableColumn>
          <ElTableColumn :label="t('common.actions')" width="150" fixed="right"><template #default="{ row }"><ElButton link :type="moduleEnabled(row) ? 'danger' : 'primary'" :loading="changingTenant === row.id" :disabled="Boolean(changingTenant) && changingTenant !== row.id" @click="changeModule(row, !moduleEnabled(row))">{{ t(moduleEnabled(row) ? 'platform.pause' : 'platform.enable') }}</ElButton></template></ElTableColumn>
        </ElTable>
        <div class="tenant-count muted">{{ t('platform.count', { count: visibleTenants.length }) }}</div>
      </section>
      <section class="surface table-surface request-surface">
        <div class="request-heading"><h2 class="section-title">{{ t('platform.requests') }}</h2><p class="muted">{{ t('platform.requestsDescription') }}</p></div>
        <ElTable :data="sortedRequests" row-key="id" :empty-text="t('platform.noRequests')">
          <ElTableColumn :label="t('platform.tenant')" min-width="170"><template #default="{ row }">{{ tenantFor(row.tenantId)?.name ?? '—' }}</template></ElTableColumn>
          <ElTableColumn :label="t('platform.application')" min-width="140"><template #default>{{ t('applications.crmName') }}</template></ElTableColumn>
          <ElTableColumn :label="t('platform.requestedAt')" min-width="160"><template #default="{ row }">{{ formatDate(row.requestedAt) }}</template></ElTableColumn>
          <ElTableColumn :label="t('platform.requestStatus')" min-width="130"><template #default="{ row }"><span class="status-pill" :class="row.status === 'approved' ? 'positive' : 'warning'">{{ t(row.status === 'approved' ? 'platform.approved' : 'platform.pending') }}</span></template></ElTableColumn>
          <ElTableColumn :label="t('platform.resolvedAt')" min-width="150"><template #default="{ row }">{{ row.resolvedAt ? formatDate(row.resolvedAt) : '—' }}</template></ElTableColumn>
          <ElTableColumn :label="t('common.actions')" width="150" fixed="right"><template #default="{ row }"><ElButton v-if="row.status === 'pending'" link type="primary" :loading="changingTenant === row.tenantId" :disabled="Boolean(changingTenant) && changingTenant !== row.tenantId" @click="approveRequest(row)">{{ t('platform.approve') }}</ElButton><span v-else class="muted">{{ t('platform.processed') }}</span></template></ElTableColumn>
        </ElTable>
      </section>
    </PageState>
  </div>
</template>

<style scoped>
.tenant-search { width: 340px; max-width: 100%; }
.tenant-cell { display: flex; align-items: center; gap: 12px; padding: 9px 0; }
.tenant-avatar { display: grid; place-items: center; flex: 0 0 36px; width: 36px; height: 36px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-weight: 600; }
.tenant-name { font-weight: 500; }
.tenant-email { margin-top: 4px; font-size: 12px; }
.tenant-count { padding: 20px 0 0; font-size: 13px; }
.request-surface { margin-top: 28px; }
.request-heading { margin-bottom: 20px; }
.request-heading p { margin: 7px 0 0; font-size: 13px; line-height: 1.6; }
@media (max-width: 600px) { .tenant-search { width: 100%; } }
</style>
