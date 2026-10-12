<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';
import { ArrowUpRight, Building2, ContactRound, LayoutGrid, ShieldCheck, Users } from 'lucide-vue-next';
import { api } from '#/api/mock/service';
import type { CustomerView } from '#/api/mock/types';
import PageHeader from '#/components/PageHeader.vue';
import PageState from '#/components/PageState.vue';
import StatStrip from '#/components/StatStrip.vue';
import { useResource } from '#/composables/useResource';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { formatDate, formatNumber } from '#/utils/format';

const workspace = useWorkspaceStore();
const router = useRouter();
const hasCustomers = computed(() => workspace.can('crm.customer.read'));
const { data, loading, error, refresh } = useResource(async (ctx) => hasCustomers.value ? api.listCustomers(ctx) : [], [] as CustomerView[]);
const recent = computed(() => [...data.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5));
const stats = computed(() => [
  { label: $t('customers.total'), value: hasCustomers.value ? formatNumber(data.value.length) : '—' },
  { label: $t('customers.status.active'), value: hasCustomers.value ? formatNumber(data.value.filter((c) => c.status === 'active').length) : '—' },
  { label: $t('customers.status.prospect'), value: hasCustomers.value ? formatNumber(data.value.filter((c) => c.status === 'prospect').length) : '—' },
  { label: $t('overview.activeApps'), value: formatNumber(workspace.context?.entitlements.filter((a) => a.status === 'active').length ?? 0) },
]);
const shortcuts = computed(() => [
  { path: '/customers', label: $t('menu.customers'), description: $t('overview.customerShortcut'), icon: ContactRound, show: workspace.can('crm.customer.read') },
  { path: '/members', label: $t('menu.members'), description: $t('overview.memberShortcut'), icon: Users, show: workspace.can('tenant.member.read') },
  { path: '/applications', label: $t('menu.applications'), description: $t('overview.appShortcut'), icon: LayoutGrid, show: workspace.can('tenant.module.read') },
  { path: '/settings', label: $t('menu.settings'), description: $t('overview.profileShortcut'), icon: Building2, show: workspace.can('tenant.profile.read') },
].filter((item) => item.show));
</script>

<template>
  <main class="page">
    <PageHeader :title="$t('overview.greeting', { name: workspace.user?.name ?? '' })" :description="$t('overview.description', { tenant: workspace.tenant?.name ?? '' })">
      <ElButton v-if="hasCustomers" type="primary" @click="router.push('/customers')">{{ $t('overview.viewCustomers') }}<ArrowUpRight :size="17" /></ElButton>
    </PageHeader>
    <StatStrip :items="stats" />
    <div class="split-layout">
      <section class="surface"><h2 class="section-title">{{ $t('overview.recentCustomers') }}</h2>
        <PageState :loading="loading" :error="error" :empty="!recent.length" :empty-title="hasCustomers ? $t('customers.emptyTitle') : $t('overview.startTitle')" :empty-description="hasCustomers ? $t('customers.emptyDescription') : $t('overview.startDescription')" @retry="refresh">
          <template #emptyActions><ElButton v-if="!hasCustomers" @click="router.push('/applications')">{{ $t('overview.viewApps') }}</ElButton></template>
          <div v-for="customer in recent" :key="customer.id" class="list-row"><div class="row-icon"><ContactRound :size="20" /></div><div class="list-row-main"><h3>{{ customer.company }}</h3><p>{{ customer.contact }} · {{ customer.ownerName }}</p></div><div class="recent-meta"><span class="status-pill" :class="customer.status === 'active' ? 'positive' : customer.status === 'prospect' ? 'warning' : 'neutral'">{{ $t(`customers.status.${customer.status}`) }}</span><p class="muted">{{ formatDate(customer.updatedAt) }}</p></div></div>
        </PageState>
      </section>
      <div class="overview-side">
        <section class="surface"><h2 class="section-title">{{ $t('overview.shortcuts') }}</h2><button v-for="item in shortcuts" :key="item.path" class="shortcut-row" @click="router.push(item.path)"><component :is="item.icon" :size="20" /><span><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span><ArrowUpRight :size="17" /></button></section>
        <section class="workspace-summary"><ShieldCheck :size="22" /><div><h2>{{ $t('overview.workspaceTitle') }}</h2><p>{{ workspace.tenant?.name }}</p><p>{{ $t('overview.workspaceDescription') }}</p></div></section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.overview-side { display: flex; flex-direction: column; gap: 24px; }
.recent-meta { text-align: right; flex-shrink: 0; }
.recent-meta p { font-size: 12px; margin: 4px 0 0; }
.shortcut-row { width: 100%; display: flex; align-items: center; gap: 14px; padding: 16px 0; color: var(--biz-text); background: none; text-align: left; border-bottom: 1px solid var(--biz-border); cursor: pointer; }
.shortcut-row:last-child { border-bottom: 0; padding-bottom: 4px; }
.shortcut-row>svg:first-child { color: var(--el-color-primary); }
.shortcut-row>svg:last-child { color: var(--biz-muted); }
.shortcut-row span { flex: 1; }
.shortcut-row strong { display: block; font-size: 14px; font-weight: 550; }
.shortcut-row small { display: block; font-size: 12px; color: var(--biz-muted); margin-top: 5px; }
.shortcut-row:hover strong { color: var(--el-color-primary); }
.workspace-summary { padding: 4px 8px; display: flex; gap: 12px; color: var(--biz-muted); }
.workspace-summary h2 { margin: 0 0 8px; font-size: 14px; font-weight: 550; color: var(--biz-text); }
.workspace-summary p { margin: 4px 0; font-size: 13px; line-height: 1.7; }
</style>
