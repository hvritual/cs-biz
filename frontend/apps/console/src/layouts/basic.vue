<script setup lang="ts">
import { watch } from 'vue';
import { BasicLayout } from '@vben/layouts';
import { preferences, updatePreferences } from '@vben/preferences';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '#/locales';
import { getWorkspaceHome } from '#/platform/routing';
import { useWorkspaceStore } from '#/store';
import WorkspaceShellTools from '#/components/WorkspaceShellTools.vue';

const workspace = useWorkspaceStore();
const router = useRouter();
const route = useRoute();
watch(() => route.fullPath, () => {
  if (preferences.app.isMobile) updatePreferences({ sidebar: { collapsed: true } });
}, { flush: 'post' });
</script>

<template>
  <BasicLayout
    class="coffeelink-shell"
    :sidebar-collapse-label="$t('shell.collapseSidebar')"
    :sidebar-expand-label="$t('shell.expandSidebar')"
    @click-logo="router.push(getWorkspaceHome())"
  >
    <template #logo-text>
      <div class="cl-logo">
        <div class="cl-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <div class="cl-logo-text">
          <div class="cl-logo-title">CoffeeLink</div>
          <div class="cl-logo-subtitle">咖啡机物联云平台</div>
        </div>
      </div>
    </template>
    <template #header-left-1>
      <WorkspaceShellTools area="tenant" />
    </template>
    <template #header-center>
      <WorkspaceShellTools area="search" />
    </template>
    <template #user-dropdown>
      <WorkspaceShellTools area="actions" />
    </template>
    <template #extra>
      <div v-if="workspace.loading" class="cl-loading-overlay" role="status" aria-live="polite">
        <span class="cl-loading-spinner" aria-hidden="true"></span>
        {{ $t('shell.loadingWorkspace') }}
      </div>
    </template>
  </BasicLayout>
</template>

<style scoped>
.cl-logo { display: flex; align-items: center; gap: 10px; padding-left: 4px; }
.cl-logo-icon { width: 32px; height: 32px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
.cl-logo-text { display: flex; flex-direction: column; }
.cl-logo-title { font-size: 16px; font-weight: 700; color: #111827; line-height: 1.2; }
.cl-logo-subtitle { font-size: 11px; color: #6b7280; line-height: 1.2; }
.cl-loading-overlay { position: fixed; inset: 64px 0 0 220px; z-index: 190; display: flex; align-items: center; justify-content: center; gap: 12px; background: rgba(255, 255, 255, 0.94); color: #374151; }
.cl-loading-spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: cl-spin 0.75s linear infinite; }
@keyframes cl-spin { to { transform: rotate(360deg); } }
@media (max-width: 767px) { .cl-loading-overlay { left: 0; } }
@media (prefers-reduced-motion: reduce) { .cl-loading-spinner { animation: none; } }
</style>
