<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronDown, Languages, MoonStar, Search, Sun } from '@vben/icons';
import { usePreferences } from '@vben/preferences';
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';
import { $t } from '#/locales';
import { canVisitPath } from '#/platform/routing';
import { useAppearanceStore, useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

defineProps<{ area: 'actions' | 'tenant' | 'search' }>();
const workspace = useWorkspaceStore();
const appearance = useAppearanceStore();
const router = useRouter();
const route = useRoute();
const search = ref('');
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
async function languageCommand(value: string) {
  if (value === 'zh-CN' || value === 'en-US') await updateAppearance({ locale: value });
}
async function switchTenant(value: string) {
  try { await workspace.switchTenant(value); }
  catch (cause) { ElMessage.error(errorMessage(cause)); }
}
function runSearch() {
  const text = search.value.trim();
  if (!text) return;
  const path = route.path === '/members' && canVisitPath('/members') ? '/members'
    : canVisitPath('/customers') ? '/customers'
    : canVisitPath('/members') ? '/members' : undefined;
  if (path) void router.push({ path, query: { search: text } });
}
</script>

<template>
  <div v-if="area === 'tenant'" class="cs-tenant-tools">
    <span class="cl-tenant-building" aria-hidden="true">▤</span>
    <span v-if="workspace.isPlatform" class="cs-workspace-context">{{ $t('shell.platformWorkspace') }}</span>
    <ElSelect v-else-if="workspace.tenants.length || workspace.tenant" :model-value="workspace.tenant?.id"
      :disabled="workspace.loading" :aria-label="$t('shell.selectWorkspace')"
      :placeholder="$t('shell.selectWorkspace')" class="cs-tenant-select" @change="switchTenant">
      <ElOption v-if="workspace.tenant && !workspace.tenants.some((item) => item.id === workspace.tenant?.id)"
        :label="workspace.tenant.name" :value="workspace.tenant.id" disabled />
      <ElOption v-for="item in workspace.tenants" :key="item.id" :label="item.name" :value="item.id" />
    </ElSelect>
    <span v-else class="cs-workspace-context">{{ $t('shell.workspace') }}</span>
  </div>
  <div v-else-if="area === 'search'" class="cl-header-search">
    <ElInput v-model="search" clearable :placeholder="$t('shell.search')" :aria-label="$t('shell.search')"
      class="cl-header-search-field" @keyup.enter="runSearch">
      <template #prefix><Search :size="16" aria-hidden="true" /></template>
    </ElInput>
    <button type="button" class="cl-search-apply" :aria-label="$t('shell.searchAction')" @click="runSearch">↵</button>
  </div>
  <div v-else class="cs-shell-actions">
    <button type="button" class="cs-shell-tool" :disabled="workspace.loading"
      :aria-label="$t(isDark ? 'shell.lightMode' : 'shell.darkMode')" :title="$t('shell.theme')"
      @click="updateAppearance({ mode: isDark ? 'light' : 'dark' })">
      <Sun v-if="isDark" :size="18" aria-hidden="true" /><MoonStar v-else :size="18" aria-hidden="true" />
    </button>
    <ElDropdown trigger="click" :disabled="workspace.loading" @command="languageCommand">
      <button type="button" class="cs-shell-tool cs-language-tool" :aria-label="$t('shell.language')">
        <Languages :size="18" aria-hidden="true" /><span>{{ appearance.settings.locale === 'zh-CN' ? '中文' : 'EN' }}</span>
        <ChevronDown :size="12" />
      </button>
      <template #dropdown><ElDropdownMenu>
        <ElDropdownItem command="zh-CN" :disabled="appearance.settings.locale === 'zh-CN'">简体中文</ElDropdownItem>
        <ElDropdownItem command="en-US" :disabled="appearance.settings.locale === 'en-US'">English</ElDropdownItem>
      </ElDropdownMenu></template>
    </ElDropdown>
    <span class="cs-shell-divider"></span>
    <ElDropdown trigger="click" @command="accountCommand">
      <button type="button" class="cs-account-tool" :aria-label="$t('shell.account') + ' · ' + (workspace.user?.name || '')">
        <span class="cs-account-avatar" aria-hidden="true">{{ workspace.user?.initials }}</span>
        <span class="cs-account-name">{{ workspace.user?.name }}</span>
        <ChevronDown :size="14" aria-hidden="true" />
      </button>
      <template #dropdown><ElDropdownMenu>
        <ElDropdownItem command="preferences">{{ $t('shell.preferences') }}</ElDropdownItem>
        <ElDropdownItem command="switch">{{ $t('shell.switchAccount') }}</ElDropdownItem>
        <ElDropdownItem divided command="logout">{{ $t('shell.logout') }}</ElDropdownItem>
      </ElDropdownMenu></template>
    </ElDropdown>
  </div>
</template>
