<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ChevronDown, Languages, MoonStar, Sun } from '@vben/icons';
import { usePreferences } from '@vben/preferences';
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage, ElOption, ElSelect } from 'element-plus';
import { $t } from '#/locales';
import { useAppearanceStore, useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

defineProps<{ area: 'actions' | 'tenant' }>();
const workspace = useWorkspaceStore();
const appearance = useAppearanceStore();
const router = useRouter();
const { isDark } = usePreferences();

async function accountCommand(command: string) {
  try {
    if (command === 'preferences') await router.push('/personal');
    if (command === 'switch') await router.push({ path: '/auth/login', query: { choose: '1' } });
    if (command === 'logout') await workspace.logout();
  } catch (cause) { ElMessage.error(errorMessage(cause)); }
}

async function updateAppearance(patch: Parameters<typeof appearance.update>[0]) {
  if (workspace.loading) return;
  try { await appearance.update(patch); }
  catch (cause) { ElMessage.error(errorMessage(cause)); }
}

async function switchTenant(value: string) {
  try { await workspace.switchTenant(value); }
  catch (cause) { ElMessage.error(errorMessage(cause)); }
}

async function languageCommand(value: string) {
  if (value === 'zh-CN' || value === 'en-US') await updateAppearance({ locale: value });
}
</script>

<template>
  <div v-if="area === 'tenant'" class="cs-tenant-tools">
    <template v-if="workspace.isPlatform">
      <span class="cs-workspace-context">{{ $t('shell.platformWorkspace') }}</span>
    </template>
    <ElSelect
      v-else-if="workspace.tenants.length || workspace.tenant"
      :model-value="workspace.tenant?.id"
      :disabled="workspace.loading"
      :aria-label="$t('shell.selectWorkspace')"
      :placeholder="$t('shell.selectWorkspace')"
      class="cs-tenant-select"
      @change="switchTenant"
    >
      <ElOption
        v-if="workspace.tenant && !workspace.tenants.some((item) => item.id === workspace.tenant?.id)"
        :label="workspace.tenant.name"
        :value="workspace.tenant.id"
        disabled
      />
      <ElOption v-for="item in workspace.tenants" :key="item.id" :label="item.name" :value="item.id" />
    </ElSelect>
    <span v-else class="cs-workspace-context">{{ $t('shell.workspace') }}</span>
    <span class="cs-workspace-label">{{ $t('shell.workspace') }}</span>
  </div>
  <div v-else class="cs-shell-actions">
    <button
      type="button" class="cs-shell-tool"
      :disabled="workspace.loading"
      :aria-label="$t(isDark ? 'shell.lightMode' : 'shell.darkMode')"
      :title="$t('shell.theme')"
      @click="updateAppearance({ mode: isDark ? 'light' : 'dark' })"
    >
      <Sun v-if="isDark" :size="18" aria-hidden="true" />
      <MoonStar v-else :size="18" aria-hidden="true" />
    </button>
    <ElDropdown trigger="click" :disabled="workspace.loading" @command="languageCommand">
      <button type="button" class="cs-shell-tool cs-language-tool" :disabled="workspace.loading" :aria-label="$t('shell.language')">
        <Languages :size="18" aria-hidden="true" />
        <span>{{ appearance.settings.locale === 'zh-CN' ? '中' : 'EN' }}</span>
      </button>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="zh-CN" :disabled="workspace.loading || appearance.settings.locale === 'zh-CN'">简体中文</ElDropdownItem>
          <ElDropdownItem command="en-US" :disabled="workspace.loading || appearance.settings.locale === 'en-US'">English</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
    <span class="cs-shell-divider" aria-hidden="true"></span>
    <ElDropdown trigger="click" @command="accountCommand">
      <button type="button" class="cs-account-tool" :aria-label="`${$t('shell.account')} · ${workspace.user?.name || ''}`">
        <span class="cs-account-avatar" aria-hidden="true">{{ workspace.user?.initials }}</span>
        <span class="cs-account-name">{{ workspace.user?.name }}</span>
        <ChevronDown :size="14" aria-hidden="true" />
      </button>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="preferences">{{ $t('shell.preferences') }}</ElDropdownItem>
          <ElDropdownItem command="switch">{{ $t('shell.switchAccount') }}</ElDropdownItem>
          <ElDropdownItem divided command="logout">{{ $t('shell.logout') }}</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </div>
</template>

<style scoped>
.cs-tenant-tools { display:flex; align-items:center; gap:15px; min-width:0; }
.cs-tenant-select { width:153px; }
.cs-tenant-select :deep(.el-select__wrapper) { background:transparent; box-shadow:none; padding:8px; font-size:14px; font-weight:650; }
.cs-workspace-context { padding-left:8px; font-weight:650; }
.cs-workspace-label { padding-left:14px; border-left:1px solid hsl(var(--border)); color:hsl(var(--muted-foreground)); font-size:12px; }
.cs-shell-actions { display:flex; align-items:center; gap:7px; padding-right:10px; }
.cs-shell-tool { display:flex; height:34px; min-width:34px; align-items:center; justify-content:center; gap:7px; border:0; background:transparent; color:hsl(var(--muted-foreground)); border-radius:7px; cursor:pointer; }
.cs-shell-tool:hover,.cs-account-tool:hover { background:hsl(var(--accent)); color:hsl(var(--foreground)); }
.cs-shell-tool:disabled { cursor:wait; opacity:.45; }
.cs-shell-tool:focus-visible,.cs-account-tool:focus-visible { outline:2px solid hsl(var(--primary)); outline-offset:3px; }
.cs-language-tool { padding:0 7px; font-size:12px; }
.cs-shell-divider { height:22px; width:1px; background:hsl(var(--border)); margin:0 6px; }
.cs-account-tool { display:flex; align-items:center; gap:9px; padding:4px 6px; border:0; border-radius:7px; background:transparent; color:hsl(var(--foreground)); cursor:pointer; }
.cs-account-avatar { display:grid; place-items:center; height:30px; width:30px; border-radius:50%; background:hsl(var(--primary) / .1); color:hsl(var(--primary)); font-size:12px; font-weight:650; }
.cs-account-name { font-size:13px; }
@media(max-width:767px) { .cs-workspace-label,.cs-account-name { display:none; } .cs-tenant-select { width:120px; } .cs-shell-actions { gap:1px; padding-right:0; } .cs-shell-divider { margin:0 3px; } .cs-language-tool span { display:none; } }
@media(max-width:380px) { .cs-tenant-select { width:105px; } .cs-shell-actions { gap:0; } .cs-account-tool { gap:3px; } }
</style>
