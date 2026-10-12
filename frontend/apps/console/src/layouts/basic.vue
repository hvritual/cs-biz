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
    class="cs-workspace-shell"
    :sidebar-collapse-label="$t('shell.collapseSidebar')"
    :sidebar-expand-label="$t('shell.expandSidebar')"
    @click-logo="router.push(getWorkspaceHome())"
  >
    <template #logo-text>
      <span class="cs-wordmark"><span class="cs-brand-mark" aria-hidden="true">C</span>CS Biz</span>
    </template>
    <template #header-left-1>
      <WorkspaceShellTools area="tenant" />
    </template>
    <template #user-dropdown>
      <WorkspaceShellTools area="actions" />
    </template>
    <template #extra>
      <div v-if="workspace.loading" class="cs-workspace-loading" role="status" aria-live="polite">
        <span class="cs-loading-spinner" aria-hidden="true"></span>
        {{ $t('shell.loadingWorkspace') }}
      </div>
    </template>
  </BasicLayout>
</template>

<style scoped>
.cs-wordmark { display:flex; align-items:center; gap:10px; padding-left:7px; font-size:20px; font-weight:750; letter-spacing:-.7px; }
.cs-brand-mark { display:grid; place-items:center; width:29px; height:29px; background:hsl(var(--primary)); color:white; border-radius:8px; font-size:20px; font-weight:800; }
.cs-workspace-loading { position:fixed; inset:64px 0 0 220px; z-index:190; display:flex; align-items:center; justify-content:center; gap:12px; background:hsl(var(--background) / .94); color:hsl(var(--foreground)); }
.cs-loading-spinner { width:20px; height:20px; border:2px solid hsl(var(--border)); border-top-color:hsl(var(--primary)); border-radius:50%; animation:cs-spin .75s linear infinite; }
@keyframes cs-spin { to { transform:rotate(360deg); } }
@media(max-width:767px) { .cs-workspace-loading { left:0; } }
@media(prefers-reduced-motion:reduce) { .cs-loading-spinner { animation:none; } }
</style>
