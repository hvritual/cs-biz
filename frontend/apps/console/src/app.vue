<script lang="ts" setup>
import { useElementPlusDesignTokens } from '@vben/hooks';
import { ElConfigProvider } from 'element-plus';
import { elementLocale } from '#/locales';
import { useAppearanceStore, useWorkspaceStore } from '#/store';

const appearance = useAppearanceStore();
const workspace = useWorkspaceStore();
useElementPlusDesignTokens();
</script>

<template>
  <ElConfigProvider :locale="elementLocale" :size="appearance.settings.density === 'compact' ? 'small' : 'default'">
    <RouterView :key="workspace.generation" />
  </ElConfigProvider>
</template>
