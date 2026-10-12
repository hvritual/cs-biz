<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElButton, ElDrawer, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElPagination, ElSelect, ElTable, ElTableColumn } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Plus, Search } from 'lucide-vue-next';

import { api, ServiceError } from '#/api/mock/service';
import type { CustomerInput, CustomerKind, CustomerOwner, CustomerStatus, CustomerView } from '#/api/mock/types';
import PageHeader from '#/components/PageHeader.vue';
import PageState from '#/components/PageState.vue';
import StatStrip from '#/components/StatStrip.vue';
import { useResource } from '#/composables/useResource';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage, formatDate, formatNumber } from '#/utils/format';
import { clearPendingCommand, readPendingCommand, writePendingCommand } from '#/utils/pending-command';

const workspace = useWorkspaceStore();
const { data, loading, error, refresh } = useResource((ctx) => api.listCustomers(ctx), [] as CustomerView[]);
const search = ref('');
const status = ref<CustomerStatus | 'all'>('all');
const page = ref(1);
const pageSize = ref(10);
const filtered = computed(() => data.value.filter((row) => {
  const query = search.value.trim().toLocaleLowerCase();
  return (status.value === 'all' || row.status === status.value) && (!query || `${row.company} ${row.contact} ${row.phone}`.toLocaleLowerCase().includes(query));
}));
const rows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const stats = computed(() => [
  { label: $t('customers.total'), value: formatNumber(data.value.length) },
  ...(['active', 'prospect', 'paused'] as const).map((value) => ({ label: $t(`customers.status.${value}`), value: formatNumber(data.value.filter((row) => row.status === value).length) })),
]);
watch([search, status, pageSize], () => { page.value = 1; });
watch(() => filtered.value.length, (length) => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / pageSize.value))); });

const editing = ref(false);
const selected = ref<CustomerView | null>(null);
const detail = ref<CustomerView | null>(null);
const formRef = ref<FormInstance>();
const saving = ref(false);
const formError = ref('');
const owners = ref<CustomerOwner[]>([]);
const ownersLoading = ref(false);
const ownersError = ref('');
let editorVersion = 0;
let createKey = '';
let confirmationOpen = false;
const form = reactive<CustomerInput>({ company: '', kind: 'company', contact: '', phone: '', ownerId: '', status: 'prospect', notes: '' });
const kinds: CustomerKind[] = ['company', 'retail', 'hospitality', 'studio'];
const statuses: CustomerStatus[] = ['active', 'prospect', 'paused'];
const rules = computed<FormRules>(() => ({
  company: [{ required: true, whitespace: true, message: $t('customers.validation.company'), trigger: 'blur' }, { max: 100, message: $t('customers.validation.length'), trigger: 'blur' }],
  contact: [{ required: true, whitespace: true, message: $t('customers.validation.contact'), trigger: 'blur' }],
  phone: [{ required: true, message: $t('customers.validation.phone'), trigger: 'blur' }, { pattern: /^[+\d][\d\s()-]{5,24}$/, message: $t('customers.validation.phoneFormat'), trigger: 'blur' }],
  ownerId: [{ required: true, message: $t('customers.validation.owner'), trigger: 'change' }],
}));
async function loadOwners() {
  if (!editing.value || !workspace.context) return;
  const captured = workspace.capture();
  const version = editorVersion;
  const action = selected.value ? 'crm.customer.update' : 'crm.customer.create';
  const isCurrent = () => editing.value && version === editorVersion && captured.isCurrent();
  ownersLoading.value = true;
  ownersError.value = '';
  try {
    const result = await api.listCustomerOwners(captured.context, action);
    if (!isCurrent()) return;
    owners.value = result;
  } catch (cause) {
    if (isCurrent()) ownersError.value = errorMessage(cause);
  } finally {
    if (isCurrent()) ownersLoading.value = false;
  }
}

function openEditor(customer?: CustomerView) {
  if (!workspace.context || (!customer && !workspace.can('crm.customer.create'))) return;
  if (customer && !customer.canUpdate) return;
  editorVersion += 1;
  selected.value = customer ?? null;
  detail.value = null;
  const pending = !customer ? readPendingCommand<CustomerInput>(workspace.requestContext(), 'customer.create') : null;
  Object.assign(form, customer ? {
    company: customer.company, kind: customer.kind, contact: customer.contact, phone: customer.phone,
    ownerId: customer.ownerId, status: customer.status, notes: customer.notes,
  } : pending?.input ?? { company: '', kind: 'company', contact: '', phone: '', ownerId: workspace.user?.id ?? '', status: 'prospect', notes: '' });
  createKey = pending?.key ?? crypto.randomUUID();
  formError.value = '';
  formRef.value?.clearValidate();
  owners.value = customer ? [{ id: customer.ownerId, name: customer.ownerName }] : workspace.user ? [{ id: workspace.user.id, name: workspace.user.name }] : [];
  editing.value = true;
  void loadOwners();
}

async function save() {
  if (saving.value || ownersLoading.value || ownersError.value || !workspace.context) return;
  const captured = workspace.capture();
  const customerId = selected.value?.id;
  const commandKey = createKey;
  const input = { ...form, company: form.company.trim(), contact: form.contact.trim(), phone: form.phone.trim(), notes: form.notes.trim() };
  saving.value = true;
  formError.value = '';
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !captured.isCurrent()) return;
    if (!customerId) writePendingCommand(captured.context, 'customer.create', input, commandKey);
    const result = customerId ? await api.updateCustomer(captured.context, customerId, input) : await api.createCustomer(captured.context, input, commandKey);
    if (!customerId) clearPendingCommand(captured.context, 'customer.create', commandKey);
    if (!captured.isCurrent()) return;
    editing.value = false;
    if (detail.value?.id === result.id) detail.value = result;
    ElMessage.success($t(customerId ? 'customers.updated' : 'customers.created'));
    await refresh();
  } catch (cause) {
    if (!customerId && cause instanceof ServiceError && cause.status >= 400 && cause.status < 500 && cause.status !== 408 && !['IDEMPOTENCY_CONFLICT', 'REQUEST_CANCELLED'].includes(cause.code)) clearPendingCommand(captured.context, 'customer.create', commandKey);
    if (captured.isCurrent()) formError.value = errorMessage(cause);
  } finally {
    saving.value = false;
  }
}

async function archive(customer: CustomerView) {
  if (!customer.canArchive) return;
  const captured = workspace.capture();
  confirmationOpen = true;
  try {
    await ElMessageBox.confirm($t('customers.archiveConfirm', { name: customer.company }), $t('customers.archiveTitle'), {
      confirmButtonText: $t('customers.archive'), cancelButtonText: $t('common.cancel'), type: 'warning',
    });
    if (!captured.isCurrent()) return;
    await api.archiveCustomer(captured.context, customer.id);
    if (!captured.isCurrent()) return;
    detail.value = null;
    ElMessage.success($t('customers.archived'));
    await refresh();
  } catch (cause) {
    if (cause !== 'cancel' && cause !== 'close' && captured.isCurrent()) ElMessage.error(errorMessage(cause));
  } finally {
    confirmationOpen = false;
  }
}

watch(() => workspace.generation, () => { if (confirmationOpen) ElMessageBox.close(); editing.value = false; detail.value = null; selected.value = null; saving.value = false; search.value = ''; status.value = 'all'; page.value = 1; });
watch(editing, (value) => { if (!value) { editorVersion += 1; owners.value = []; ownersLoading.value = false; ownersError.value = ''; } }, { flush: 'sync' });
onBeforeUnmount(() => { editorVersion += 1; if (confirmationOpen) ElMessageBox.close(); });
watch(data, () => { if (detail.value) detail.value = data.value.find((row) => row.id === detail.value?.id) ?? null; });
</script>

<template>
  <main class="page customers-page">
    <PageHeader :title="$t('customers.title')" :description="$t('customers.description')">
      <ElButton v-if="workspace.can('crm.customer.create')" type="primary" data-testid="create-customer" @click="openEditor()"><Plus :size="17" />{{ $t('customers.new') }}</ElButton>
    </PageHeader>
    <StatStrip :items="stats" />
    <section class="surface table-surface" :aria-label="$t('customers.title')">
      <div class="toolbar">
        <ElInput v-model="search" :placeholder="$t('customers.search')" :aria-label="$t('customers.search')" clearable data-testid="customer-search"><template #prefix><Search :size="17" /></template></ElInput>
        <ElSelect v-model="status" :placeholder="$t('customers.allStatus')" :aria-label="$t('customers.filterStatus')" data-testid="customer-status-filter"><ElOption :label="$t('customers.allStatus')" value="all" /><ElOption v-for="item in statuses" :key="item" :label="$t(`customers.status.${item}`)" :value="item" /></ElSelect>
      </div>
      <PageState :loading="loading" :error="error" :empty="!filtered.length" :empty-title="search || status !== 'all' ? $t('customers.noMatches') : $t('customers.emptyTitle')" :empty-description="search || status !== 'all' ? $t('customers.noMatchesDescription') : $t('customers.emptyDescription')" @retry="refresh">
        <template #emptyActions><ElButton v-if="search || status !== 'all'" @click="search = ''; status = 'all'">{{ $t('common.clearFilters') }}</ElButton></template>
        <ElTable :data="rows" row-key="id" data-testid="customer-table">
          <ElTableColumn :label="$t('customers.company')" min-width="200"><template #default="{ row }"><div class="entity-name">{{ row.company }}</div><div v-if="row.kind" class="entity-description">{{ $t(`customers.kind.${row.kind}`) }}</div></template></ElTableColumn>
          <ElTableColumn prop="contact" :label="$t('customers.contact')" min-width="104" />
          <ElTableColumn prop="phone" :label="$t('customers.phone')" min-width="148" />
          <ElTableColumn prop="ownerName" :label="$t('customers.owner')" min-width="96" />
          <ElTableColumn :label="$t('customers.cooperation')" min-width="114"><template #default="{ row }"><span v-if="row.status" class="status-pill" :class="row.status === 'active' ? 'positive' : row.status === 'prospect' ? 'warning' : 'neutral'">{{ $t(`customers.status.${row.status}`) }}</span></template></ElTableColumn>
          <ElTableColumn :label="$t('customers.updatedAt')" min-width="124"><template #default="{ row }">{{ formatDate(row.updatedAt) }}</template></ElTableColumn>
          <ElTableColumn :label="$t('common.actions')" min-width="110" fixed="right"><template #default="{ row }"><ElButton link type="primary" @click="detail = row">{{ $t('common.view') }}</ElButton><ElButton v-if="row.canUpdate" link type="primary" @click="openEditor(row)">{{ $t('common.edit') }}</ElButton></template></ElTableColumn>
        </ElTable>
        <div class="table-footer"><p>{{ $t('customers.count', { count: filtered.length }) }}</p><ElPagination v-model:current-page="page" v-model:page-size="pageSize" :total="filtered.length" :page-sizes="[5, 10, 20]" layout="sizes, prev, pager, next" background /></div>
      </PageState>
    </section>
    <ElDrawer v-model="editing" :title="selected ? $t('customers.edit') : $t('customers.new')" size="450px" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving" destroy-on-close data-testid="customer-editor">
      <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving" @submit.prevent="save">
        <ElFormItem :label="$t('customers.company')" prop="company"><ElInput v-model="form.company" :placeholder="$t('customers.companyPlaceholder')" maxlength="100" data-testid="customer-company" /></ElFormItem>
        <ElFormItem :label="$t('customers.type')" prop="kind"><ElSelect v-model="form.kind"><ElOption v-for="kind in kinds" :key="kind" :label="$t(`customers.kind.${kind}`)" :value="kind" /></ElSelect></ElFormItem>
        <ElFormItem :label="$t('customers.contact')" prop="contact"><ElInput v-model="form.contact" :placeholder="$t('customers.contactPlaceholder')" maxlength="80" data-testid="customer-contact" /></ElFormItem>
        <ElFormItem :label="$t('customers.phone')" prop="phone"><ElInput v-model="form.phone" :placeholder="$t('customers.phonePlaceholder')" maxlength="25" data-testid="customer-phone" /></ElFormItem>
        <ElFormItem :label="$t('customers.owner')" prop="ownerId"><ElSelect v-model="form.ownerId" :loading="ownersLoading" :disabled="ownersLoading || !!ownersError" data-testid="customer-owner"><ElOption v-if="form.ownerId && !owners.some((owner) => owner.id === form.ownerId)" :label="selected?.ownerName || data.find((customer) => customer.ownerId === form.ownerId)?.ownerName || $t('customers.previousOwner')" :value="form.ownerId" disabled /><ElOption v-for="owner in owners" :key="owner.id" :label="owner.name" :value="owner.id" /></ElSelect><div v-if="ownersError" class="form-error" role="alert">{{ ownersError }} <ElButton link type="primary" @click="loadOwners">{{ $t('common.tryAgain') }}</ElButton></div></ElFormItem>
        <ElFormItem :label="$t('customers.cooperation')" prop="status"><ElSelect v-model="form.status"><ElOption v-for="item in statuses" :key="item" :label="$t(`customers.status.${item}`)" :value="item" /></ElSelect></ElFormItem>
        <ElFormItem :label="$t('customers.notes')" prop="notes"><ElInput v-model="form.notes" type="textarea" :rows="3" maxlength="1000" show-word-limit :placeholder="$t('customers.notesPlaceholder')" /></ElFormItem>
      </ElForm>
      <template #footer><div class="form-actions"><ElButton :disabled="saving" @click="editing = false">{{ $t('common.cancel') }}</ElButton><ElButton type="primary" :loading="saving" :disabled="ownersLoading || !!ownersError" data-testid="save-customer" @click="save">{{ $t('customers.save') }}</ElButton></div></template>
    </ElDrawer>
    <ElDrawer :model-value="!!detail" :title="$t('customers.details')" size="450px" @close="detail = null">
      <template v-if="detail"><h2 class="section-title">{{ detail.company }}</h2><span class="status-pill" :class="detail.status === 'active' ? 'positive' : detail.status === 'prospect' ? 'warning' : 'neutral'">{{ $t(`customers.status.${detail.status}`) }}</span>
        <dl class="detail-list"><div><dt>{{ $t('customers.type') }}</dt><dd>{{ $t(`customers.kind.${detail.kind}`) }}</dd></div><div><dt>{{ $t('customers.contact') }}</dt><dd>{{ detail.contact }}</dd></div><div><dt>{{ $t('customers.phone') }}</dt><dd>{{ detail.phone }}</dd></div><div><dt>{{ $t('customers.owner') }}</dt><dd>{{ detail.ownerName }}</dd></div><div><dt>{{ $t('customers.updatedAt') }}</dt><dd>{{ formatDate(detail.updatedAt) }}</dd></div><div><dt>{{ $t('customers.notes') }}</dt><dd>{{ detail.notes || $t('customers.noNotes') }}</dd></div></dl>
      </template>
      <template #footer><div v-if="detail" class="form-actions"><ElButton v-if="detail.canArchive" type="danger" plain @click="archive(detail)">{{ $t('customers.archive') }}</ElButton><ElButton v-if="detail.canUpdate" type="primary" @click="openEditor(detail)">{{ $t('customers.edit') }}</ElButton></div></template>
    </ElDrawer>
  </main>
</template>
