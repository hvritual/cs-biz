<script setup lang="ts">
import { ElButton } from 'element-plus';
import { useRouter } from 'vue-router';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store';
const workspace = useWorkspaceStore();
const router = useRouter();
async function switchAccount() { await workspace.logout(); }
</script>
<template>
  <main class="no-console">
    <section class="no-console-panel">
      <h1>{{ $t('states.noConsoleTitle') }}</h1>
      <p>{{ $t('states.noConsoleDescription') }}</p>
      <div class="no-console-actions">
        <ElButton v-if="workspace.canUseMarketing" type="primary" @click="router.push('/marketing')">{{ $t('states.goMarketing') }}</ElButton>
        <ElButton @click="switchAccount">{{ $t('shell.switchAccount') }}</ElButton>
      </div>
    </section>
  </main>
</template>
<style scoped>
.no-console { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: var(--biz-page); color: var(--biz-text); }
.no-console-panel { width: 100%; max-width: 540px; border: 1px solid var(--biz-border); border-radius: 14px; background: var(--biz-surface); padding: 36px; }
.no-console h1 { font-size: 24px; font-weight: 650; margin: 0 0 12px; }
.no-console p { font-size: 14px; line-height: 1.8; color: var(--biz-muted); }
.no-console-actions { display: flex; gap: 12px; margin-top: 26px; }
</style>
