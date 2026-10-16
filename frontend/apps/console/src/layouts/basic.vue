<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { updatePreferences, usePreferences } from '@vben/preferences';
import brandMark from '#/assets/brand-mark.png';
import { Building2, ChevronLeft, ChevronRight, Home, Layers3, Settings, Users } from 'lucide-vue-next';
import { $t } from '#/locales';
import { getWorkspaceHome, canVisitPath } from '#/platform/routing';
import { useWorkspaceStore } from '#/store';
import EnterpriseCenterOverlay from '#/components/EnterpriseCenterOverlay.vue';
import WorkspaceShellTools from '#/components/WorkspaceShellTools.vue';

const router = useRouter();
const route = useRoute();
const workspace = useWorkspaceStore();
const { sidebarCollapsed } = usePreferences();
const flyout = ref(false);
const collapsed = computed(() => sidebarCollapsed.value);
const inEnterprise = computed(() => ['/members', '/roles', '/applications', '/personal'].includes(route.path));
const domains = computed(() => {
  const accessVersion = workspace.context?.accessVersion;
  void accessVersion;
  return [
  { key: 'home', icon: Home, title: $t('menu.overview'), path: '/overview', enabled: canVisitPath('/overview') },
  { key: 'customers', icon: Users, title: $t('menu.customers'), path: '/customers', enabled: canVisitPath('/customers') },
  { key: 'enterprise', icon: Building2, title: $t('shell.enterpriseCenter'), path: '/members', enabled: !workspace.isPlatform && (canVisitPath('/members') || canVisitPath('/roles') || canVisitPath('/settings') || canVisitPath('/applications')) },
  { key: 'platform', icon: Layers3, title: $t('menu.platform'), path: '/platform', enabled: workspace.isPlatform },
  { key: 'settings', icon: Settings, title: $t('menu.settings'), path: '/settings', enabled: canVisitPath('/settings') },
].filter((item) => item.enabled);
});
function activeDomain(key: string, path: string) {
  return key === 'enterprise' ? inEnterprise.value : route.path === path;
}
function openDomain(key: string, path: string) {
  if (key === 'enterprise') {
    flyout.value = !flyout.value;
    return;
  }
  flyout.value = false;
  if (canVisitPath(path)) void router.push(path);
}
function closeFlyout() {
  flyout.value = false;
  document.querySelector<HTMLButtonElement>('[data-domain="enterprise"]')?.focus();
}
function collapseRail() {
  flyout.value = false;
  updatePreferences({ sidebar: { collapsed: !collapsed.value } });
}
watch(() => route.fullPath, () => { flyout.value = false; });
watch(() => workspace.generation, () => { flyout.value = false; });
</script>

<template>
  <div class="cl-desktop-shell" :class="{ 'is-collapsed': collapsed, 'is-platform': workspace.isPlatform }">
    <header class="cl-global-header">
      <button type="button" class="cl-brand" aria-label="CoffeeLink" @click="router.push(getWorkspaceHome())">
        <span class="cl-brand-icon cs-brand-mark" aria-hidden="true"><img :src="brandMark" alt="" /></span>
        <span class="cl-brand-words"><strong>CoffeeLink</strong><small>{{ $t('shell.productSubtitle') }}</small></span>
      </button>
      <slot name="header-tenant"><WorkspaceShellTools area="tenant" /></slot>
      <slot name="header-search"><WorkspaceShellTools area="search" /></slot>
      <slot name="header-actions"><WorkspaceShellTools area="actions" /></slot>
    </header>
    <nav class="cl-primary-rail" :class="{ 'is-collapsed': collapsed }" :aria-label="$t('shell.primaryNavigation')">
      <div class="cl-primary-links" role="menu">
        <slot name="primary-links">
        <button
          v-for="item in domains" :key="item.key" type="button" role="menuitem"
          class="cl-primary-link" :data-domain="item.key" :class="{ 'is-active': activeDomain(item.key, item.path) }"
          :title="item.title" :aria-label="item.title"
          :aria-current="activeDomain(item.key, item.path) && item.key !== 'enterprise' ? 'page' : undefined"
          :aria-expanded="item.key === 'enterprise' ? flyout : undefined"
          @click="openDomain(item.key, item.path)"
        >
          <component :is="item.icon" :size="20" aria-hidden="true" />
          <span v-if="!collapsed" class="cl-primary-text">{{ item.title }}</span>
        </button>
        </slot>
      </div>
      <button class="cl-rail-toggle" type="button"
        :aria-label="$t(collapsed ? 'shell.expandSidebar' : 'shell.collapseSidebar')" @click="collapseRail">
        <ChevronRight v-if="collapsed" :size="17" />
        <ChevronLeft v-else :size="17" />
      </button>
    </nav>
    <main class="cl-desktop-main" id="main-content"><RouterView /></main>
    <EnterpriseCenterOverlay
      :visible="flyout" :collapsed="collapsed" :active-path="route.path"
      @close="closeFlyout" @navigate="flyout = false"
    />
    <div v-if="workspace.loading" class="cs-workspace-loading" role="status" aria-live="polite">
      <span class="cs-loading-spinner" aria-hidden="true"></span>{{ $t('shell.loadingWorkspace') }}
    </div>
  </div>
</template>
