<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ChevronDown, HelpCircle, Download, Languages, MoonStar, Sun, Search } from '@vben/icons';
import { usePreferences } from '@vben/preferences';
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';
import { $t } from '#/locales';
import { useAppearanceStore, useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

defineProps<{ area: 'actions' | 'tenant' | 'search' }>();
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
  <div v-if="area === 'tenant'" class="cl-tenant-tools">
    <ElSelect
      v-if="workspace.tenants.length || workspace.tenant"
      :model-value="workspace.tenant?.id"
      :disabled="workspace.loading"
      :aria-label="$t('shell.selectWorkspace')"
      :placeholder="$t('shell.selectWorkspace')"
      class="cl-tenant-select"
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
  </div>
  <div v-else-if="area === 'search'" class="cl-search-bar">
    <ElInput
      :placeholder="$t('shell.search')"
      class="cl-search-input"
      clearable
    >
      <template #prefix>
        <Search style="width: 16px; height: 16px; color: #9ca3af;" />
      </template>
      <template #append>
        <span class="cl-search-shortcut">⌘ K</span>
      </template>
    </ElInput>
  </div>
  <div v-else class="cl-shell-actions">
    <button
      type="button" class="cl-shell-tool"
      :disabled="workspace.loading"
      :aria-label="$t(isDark ? 'shell.lightMode' : 'shell.darkMode')"
      :title="$t('shell.theme')"
      @click="updateAppearance({ mode: isDark ? 'light' : 'dark' })"
    >
      <Sun v-if="isDark" :size="18" aria-hidden="true" />
      <MoonStar v-else :size="18" aria-hidden="true" />
    </button>
    <ElDropdown trigger="click" :disabled="workspace.loading" @command="languageCommand">
      <button type="button" class="cl-shell-tool cl-language-tool" :disabled="workspace.loading" :aria-label="$t('shell.language')">
        <Languages :size="18" aria-hidden="true" />
        <span>{{ appearance.settings.locale === 'zh-CN' ? '中文' : 'EN' }}</span>
        <ChevronDown :size="12" aria-hidden="true" />
      </button>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="zh-CN" :disabled="workspace.loading || appearance.settings.locale === 'zh-CN'">简体中文</ElDropdownItem>
          <ElDropdownItem command="en-US" :disabled="workspace.loading || appearance.settings.locale === 'en-US'">English</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
    <button type="button" class="cl-shell-tool" :aria-label="$t('shell.helpCenter')">
      <HelpCircle :size="18" aria-hidden="true" />
    </button>
    <button type="button" class="cl-shell-tool" :aria-label="$t('shell.downloadCenter')">
      <Download :size="18" aria-hidden="true" />
    </button>
    <span class="cl-shell-divider" aria-hidden="true"></span>
    <ElDropdown trigger="click" @command="accountCommand">
      <button type="button" class="cl-account-tool" :aria-label="`${$t('shell.account')} · ${workspace.user?.name || ''}`">
        <span class="cl-account-avatar" aria-hidden="true">{{ workspace.user?.initials || 'U' }}</span>
        <div class="cl-account-info">
          <span class="cl-account-name">{{ workspace.user?.name || 'User' }}</span>
          <span class="cl-account-email">{{ workspace.user?.email || '' }}</span>
        </div>
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
.cl-tenant-tools { display: flex; align-items: center; }
.cl-tenant-select { width: 200px; }
.cl-tenant-select :deep(.el-select__wrapper) { background: transparent; box-shadow: none; padding: 8px 12px; font-size: 14px; font-weight: 500; }

.cl-search-bar { flex: 1; max-width: 480px; margin: 0 24px; }
.cl-search-input { width: 100%; }
.cl-search-input :deep(.el-input__wrapper) { border-radius: 6px; background: #f3f4f6; box-shadow: none; }
.cl-search-input :deep(.el-input__inner) { font-size: 14px; }
.cl-search-shortcut { font-size: 12px; color: #9ca3af; padding: 0 8px; }

.cl-shell-actions { display: flex; align-items: center; gap: 8px; padding-right: 12px; }
.cl-shell-tool { display: flex; height: 36px; min-width: 36px; align-items: center; justify-content: center; gap: 6px; border: 0; background: transparent; color: #6b7280; border-radius: 6px; cursor: pointer; font-size: 13px; }
.cl-shell-tool:hover, .cl-account-tool:hover { background: #f3f4f6; color: #111827; }
.cl-shell-tool:disabled { cursor: wait; opacity: 0.45; }
.cl-shell-tool:focus-visible, .cl-account-tool:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.cl-language-tool { padding: 0 10px; }
.cl-shell-divider { height: 24px; width: 1px; background: #e5e7eb; margin: 0 8px; }
.cl-account-tool { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border: 0; border-radius: 6px; background: transparent; color: #111827; cursor: pointer; }
.cl-account-avatar { display: grid; place-items: center; height: 32px; width: 32px; border-radius: 50%; background: #2563eb; color: white; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.cl-account-info { display: flex; flex-direction: column; text-align: left; }
.cl-account-name { font-size: 13px; font-weight: 500; line-height: 1.2; }
.cl-account-email { font-size: 11px; color: #9ca3af; line-height: 1.2; }
@media (max-width: 767px) {
  .cl-account-info { display: none; }
  .cl-tenant-select { width: 140px; }
  .cl-search-bar { margin: 0 12px; }
  .cl-shell-actions { gap: 4px; padding-right: 0; }
  .cl-shell-divider { margin: 0 4px; }
  .cl-language-tool span { display: none; }
}
</style>
