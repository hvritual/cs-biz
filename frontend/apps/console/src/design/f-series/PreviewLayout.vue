<script setup lang="ts">
import { ChevronDown, Languages, MoonStar, Sun } from '@vben/icons';
import { preferences, usePreferences } from '@vben/preferences';
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElOption, ElSelect } from 'element-plus';
import BasicLayout from '#/layouts/basic.vue';
import { $t } from '#/locales';
import { useAppearanceStore } from '#/store';
import { text, type CopyKey } from './copy';
import { useFSeriesDesignState } from './state';
const { workspace, activeTenant, identity, chooseOrganization, signOut } = useFSeriesDesignState();
const appearance = useAppearanceStore();
const { isDark } = usePreferences();
const t = (key: CopyKey) => text(key, preferences.app.locale === 'en-US');
function choose(value: string) {
  const target = workspace.tenants.find(item => item.id === value);
  if (target) chooseOrganization(target.name);
}
async function language(value: string) {
  if (value === 'zh-CN' || value === 'en-US') await appearance.update({ locale: value });
}
</script>
<template>
  <BasicLayout>
    <template #header-tenant>
      <div class="cs-tenant-tools"><span class="cl-tenant-building" aria-hidden="true">▤</span>
        <ElSelect :model-value="activeTenant" :disabled="identity!=='active'" :aria-label="$t('shell.selectWorkspace')" :placeholder="$t('shell.selectWorkspace')" class="cs-tenant-select" @change="choose">
          <ElOption v-for="org in workspace.tenants" :key="org.id" :label="org.name" :value="org.id" />
        </ElSelect>
      </div>
    </template>
    <template #header-search><div class="cl-header-search" role="note">{{ t(identity==='active'?'active':'signedOut') }}</div></template>
    <template #header-actions>
      <div class="cs-shell-actions">
        <button type="button" class="cs-shell-tool" :aria-label="$t(isDark ? 'shell.lightMode':'shell.darkMode')" @click="appearance.update({mode:isDark?'light':'dark'})"><Sun v-if="isDark" :size="18" /><MoonStar v-else :size="18" /></button>
        <ElDropdown trigger="click" @command="language"><button type="button" class="cs-shell-tool cs-language-tool" :aria-label="$t('shell.language')"><Languages :size="18" /><span>{{ appearance.settings.locale==='zh-CN'?'中文':'EN' }}</span><ChevronDown :size="12" /></button>
          <template #dropdown><ElDropdownMenu><ElDropdownItem command="zh-CN" :disabled="appearance.settings.locale==='zh-CN'">简体中文</ElDropdownItem><ElDropdownItem command="en-US" :disabled="appearance.settings.locale==='en-US'">English</ElDropdownItem></ElDropdownMenu></template>
        </ElDropdown>
        <span class="cs-shell-divider"></span>
        <button type="button" class="cs-account-tool" :disabled="identity==='signed_out'" :aria-label="t('signout')" @click="signOut"><span class="cs-account-avatar" aria-hidden="true">陈</span><span class="cs-account-name">{{ t('signout') }}</span></button>
      </div>
    </template>
  </BasicLayout>
</template>
