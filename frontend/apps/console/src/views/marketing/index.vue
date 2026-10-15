<script setup lang="ts">
import type { Campaign } from '#/api/mock/types';
import { ref } from 'vue';
import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';
import { api } from '#/api/mock/service';
import { useResource } from '#/composables/useResource';
import { useWorkspaceStore } from '#/store';
import { $t } from '#/locales';
import { errorMessage } from '#/utils/format';

const workspace = useWorkspaceStore();
const { data, loading, error, refresh } = useResource<Campaign[]>((context) => api.listCampaigns(context), []);
const executing = ref('');
const actionError = ref('');
async function execute(campaign: Campaign) {
  if (!workspace.can('marketing.campaign.execute') || executing.value) return;
  const request = workspace.capture();
  executing.value = campaign.id;
  actionError.value = '';
  try {
    await api.executeCampaign(request.context, campaign.id, crypto.randomUUID());
    if (!request.isCurrent()) return;
    ElMessage.success($t('marketing.completed'));
    await refresh();
  } catch (cause) { if (request.isCurrent()) actionError.value = errorMessage(cause); }
  finally { if (request.isCurrent()) executing.value = ''; }
}
</script>
<template>
  <main class="marketing-page" data-testid="marketing-workspace">
    <header class="marketing-header">
      <div><p class="marketing-brand">CS Biz</p><h1>{{ $t('marketing.title') }}</h1>
        <p>{{ $t('marketing.description') }}</p></div>
      <ElButton @click="workspace.logout()">{{ $t('shell.switchAccount') }}</ElButton>
    </header>
    <section class="marketing-panel">
      <h2>{{ $t('marketing.campaigns') }}</h2>
      <p v-if="actionError" role="alert">{{ actionError }}</p>
      <p v-if="error" role="alert">{{ errorMessage(error) }}</p>
      <ElButton v-if="error" @click="refresh()">{{ $t('common.tryAgain') }}</ElButton>
      <ElTable v-else :data="data" :v-loading="loading" data-testid="marketing-campaigns" row-key="id">
        <ElTableColumn prop="name" :label="$t('marketing.name')" />
        <ElTableColumn prop="executions" :label="$t('marketing.executions')" width="130" />
        <ElTableColumn :label="$t('marketing.actions')" width="160">
          <template #default="{ row }">
            <ElButton v-if="workspace.can('marketing.campaign.execute') && row.ownerId === workspace.user?.id"
              link type="primary" :loading="executing === row.id" @click="execute(row)">{{ $t('marketing.execute') }}</ElButton>
            <ElButton v-else-if="workspace.can('marketing.campaign.execute') && workspace.context?.dataScopes.some((g) => g.action === 'marketing.campaign.execute' && g.scope === 'all')"
              link type="primary" :loading="executing === row.id" @click="execute(row)">{{ $t('marketing.execute') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <p v-if="!loading && !error && data.length === 0">{{ $t('marketing.empty') }}</p>
    </section>
  </main>
</template>
<style scoped>
.marketing-page { min-height: 100vh; background: var(--biz-page); color: var(--biz-text); padding: 36px max(32px, calc((100% - 1050px)/2)); }
.marketing-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
.marketing-brand { font-size: 13px; font-weight: 700; color: var(--el-color-primary); margin: 0 0 16px; }
.marketing-header h1 { font-size: 28px; font-weight: 650; margin: 0 0 8px; }
.marketing-header p { color: var(--biz-muted); line-height: 1.7; }
.marketing-panel { background: var(--biz-surface); border: 1px solid var(--biz-border); border-radius: 14px; padding: 26px; }
.marketing-panel h2 { font-size: 18px; margin: 0 0 20px; }
</style>
