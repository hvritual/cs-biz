<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElButton } from 'element-plus';
import { Compass, Shield } from 'lucide-vue-next';
import { ServiceError } from '#/api/mock/service';
import { $t } from '#/locales';
import { getWorkspaceHome } from '#/platform/routing';
import { useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();
const busy = ref(false);
const actionError = ref('');
const forbidden = computed(() => route.name === 'Forbidden' || !!workspace.error);
const unavailable = computed(() => !!workspace.error && (!(workspace.error instanceof ServiceError) || workspace.error.status >= 500));
const title = computed(() => unavailable.value ? $t('common.unableToLoad') : forbidden.value ? $t('states.forbiddenTitle') : $t('states.notFoundTitle'));
async function home() { await router.replace(getWorkspaceHome()); }
async function retry() {
  busy.value = true; actionError.value = '';
  try { await workspace.refreshAccess(); }
  catch (cause) { actionError.value = errorMessage(cause); }
  finally { busy.value = false; }
}
async function switchAccount() {
  busy.value = true; actionError.value = '';
  try { await workspace.logout(); await router.replace('/auth/login'); }
  catch (cause) { actionError.value = errorMessage(cause); }
  finally { busy.value = false; }
}
</script>

<template>
  <main class="state-page"><component :is="forbidden ? Shield : Compass" :size="48" :stroke-width="1.3" /><h1>{{ title }}</h1><p>{{ workspace.error ? errorMessage(workspace.error) : $t(forbidden ? 'states.forbiddenDescription' : 'states.notFoundDescription') }}</p><p v-if="actionError" class="form-error" role="alert">{{ actionError }}</p><div class="form-actions"><ElButton v-if="unavailable" type="primary" :loading="busy" @click="retry">{{ $t('common.tryAgain') }}</ElButton><ElButton v-else-if="!workspace.error" type="primary" @click="home">{{ $t('states.backHome') }}</ElButton><ElButton :disabled="busy" @click="switchAccount">{{ $t('shell.switchAccount') }}</ElButton></div></main>
</template>

<style scoped>
.state-page { min-height: 65vh; padding: 64px 24px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; color: var(--biz-muted); gap: 18px; }
.state-page h1 { font-size: 25px; line-height: 1.5; color: var(--biz-text); font-weight: 600; margin: 4px 0 0; }
.state-page p { max-width: 430px; font-size: 14px; line-height: 1.8; margin: 0 0 8px; }
</style>
