<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElAlert, ElButton } from 'element-plus';
import { ArrowRight, Building2, LogOut } from 'lucide-vue-next';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

const workspace = useWorkspaceStore();
const route = useRoute();
const router = useRouter();
const choices = computed(() => workspace.tenants);
const busy = ref('');
const error = ref('');

async function choose(tenantId: string) {
  if (busy.value || workspace.loading) return;
  busy.value = tenantId;
  error.value = '';
  try {
    const preferred = typeof route.query.redirect === 'string' ? route.query.redirect : undefined;
    await workspace.switchTenant(tenantId, preferred);
    if (workspace.context?.tenantId !== tenantId) {
      throw new Error($t('auth.tenantSelectionFailed'));
    }
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    busy.value = '';
  }
}

async function switchAccount() {
  await router.replace({ path: '/auth/login', query: { choose: '1' } });
}
</script>

<template>
  <main class="tenant-entry" data-tenant-entry>
    <div class="tenant-entry-brand">CS Biz</div>
    <section class="tenant-entry-panel">
      <h1>{{ choices.length ? $t('auth.chooseTenant') : $t('auth.noTenantTitle') }}</h1>
      <p class="tenant-entry-description">
        {{ choices.length ? $t('auth.chooseTenantDescription') : $t('auth.noTenantDescription') }}
      </p>
      <ElAlert v-if="error" type="error" :title="error" show-icon :closable="false" />
      <div v-if="choices.length" class="tenant-entry-list">
        <button
          v-for="tenant in choices" :key="tenant.id"
          type="button" class="tenant-entry-option" :disabled="!!busy || workspace.loading"
          :data-testid="`tenant-choice-${tenant.id}`" @click="choose(tenant.id)"
        >
          <span class="tenant-entry-icon"><Building2 :size="20" /></span>
          <span class="tenant-entry-name"><strong>{{ tenant.name }}</strong><small>{{ tenant.shortName }}</small></span>
          <span class="tenant-entry-action">{{ busy === tenant.id ? $t('auth.entering') : $t('auth.enter') }} <ArrowRight :size="16" /></span>
        </button>
      </div>
      <ElButton class="tenant-entry-switch" plain @click="switchAccount">
        <LogOut :size="16" />{{ $t('auth.switchAccount') }}
      </ElButton>
    </section>
  </main>
</template>

<style scoped>
.tenant-entry { min-height: 100vh; padding: 40px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--biz-page); color: var(--biz-text); }
.tenant-entry-brand { font-size: 28px; font-weight: 700; letter-spacing: -.04em; margin-bottom: 28px; }
.tenant-entry-panel { background: var(--biz-surface); border: 1px solid var(--biz-border); border-radius: 14px; padding: 32px; max-width: 560px; width: 100%; }
.tenant-entry-panel h1 { font-size: 24px; font-weight: 600; margin: 0 0 10px; }
.tenant-entry-description { color: var(--biz-muted); line-height: 1.7; font-size: 14px; margin: 0 0 24px; }
.tenant-entry-list { display: grid; gap: 10px; margin-top: 16px; }
.tenant-entry-option { min-height: 76px; width: 100%; background: var(--biz-surface); color: var(--biz-text); display: flex; align-items: center; gap: 14px; padding: 12px 16px; border: 1px solid var(--biz-border); border-radius: 12px; text-align: left; cursor: pointer; }
.tenant-entry-option:hover, .tenant-entry-option:focus-visible { border-color: var(--el-color-primary); background: var(--biz-subtle); }
.tenant-entry-option:disabled { opacity: .65; cursor: wait; }
.tenant-entry-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.tenant-entry-name { flex: 1; display: grid; gap: 5px; min-width: 0; }
.tenant-entry-name strong { font-size: 15px; }
.tenant-entry-name small { font-size: 12px; color: var(--biz-muted); }
.tenant-entry-action { display: flex; gap: 6px; align-items: center; color: var(--el-color-primary); font-size: 13px; }
.tenant-entry-switch { margin-top: 24px; display: flex; gap: 8px; }
</style>
