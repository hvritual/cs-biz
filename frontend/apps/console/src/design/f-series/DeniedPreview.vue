<script setup lang="ts">
import { preferences } from '@vben/preferences';
import { ElButton } from 'element-plus';
import { useRouter } from 'vue-router';
import PageHeader from '#/components/PageHeader.vue';
import { text, type CopyKey } from './copy';
const router = useRouter();
const returnPath = sessionStorage.getItem('cs-biz:f-series:review-return') || '/__design/f-series';
const t = (key: CopyKey) => text(key, preferences.app.locale === 'en-US');
</script>
<template>
  <section class="denied-preview">
    <aside role="note">{{ t('banner') }}</aside>
    <PageHeader :title="t('deniedPage')" :description="t('deniedHelp')" />
    <ElButton type="primary" @click="router.push(returnPath)">{{ t('returnWorkspace') }}</ElButton>
  </section>
</template>
<style scoped>
.denied-preview { padding:var(--content-padding); }
aside { border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:12px 16px; color:var(--color-text-secondary); font-size:12px; margin-bottom:24px; }
</style>
