<script setup lang="ts">
import type { User } from '#/api/mock/types';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowRight } from 'lucide-vue-next';
import { ElButton } from 'element-plus';
import { api } from '#/api/mock/service';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

const workspace = useWorkspaceStore();
const route = useRoute();
const profiles = ref<User[]>([]);
const profilesError = ref('');
const busy = ref<string | null>(null);
const error = ref('');
function loadProfiles() {
  profilesError.value = '';
  try { profiles.value = api.listUsers(); }
  catch (cause) { profiles.value = []; profilesError.value = errorMessage(cause); }
}
loadProfiles();
async function enter(id: string) {
  if (busy.value) return;
  busy.value = id; error.value = '';
  try {
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//') ? route.query.redirect : '';
    await workspace.selectAccount(id, redirect);
  } catch (cause) { error.value = errorMessage(cause); }
  finally { busy.value = null; }
}
</script>

<template>
  <main class="account-page"><div class="account-brand">CS Biz</div><section class="account-surface"><h1>{{ $t('auth.welcome') }}</h1><p>{{ $t('auth.description') }}</p><div v-if="profilesError" class="form-error" role="alert"><p>{{ profilesError }}</p><ElButton type="primary" @click="loadProfiles">{{ $t('common.tryAgain') }}</ElButton></div><div v-if="error" class="form-error" role="alert">{{ error }}</div><div class="account-list"><button v-for="profile in profiles" :key="profile.id" class="account-choice" :disabled="!!busy" :data-testid="`account-${profile.id}`" @click="enter(profile.id)"><span class="account-avatar">{{ profile.initials }}</span><span class="account-info"><strong>{{ profile.name }}</strong><small>{{ profile.email }}</small></span><span class="account-enter">{{ busy === profile.id ? $t('auth.entering') : $t('auth.enter') }}<ArrowRight :size="16" /></span></button></div></section><p class="account-footer">{{ $t('auth.footer') }}</p></main>
</template>

<style scoped>
.account-page { min-height: 100vh; padding: 36px 24px; background: var(--biz-page); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.account-brand { font-size: 30px; font-weight: 700; letter-spacing: -1px; color: var(--biz-text); margin-bottom: 28px; }
.account-surface { width: 100%; max-width: 490px; background: var(--biz-surface); padding: 32px; border: 1px solid var(--biz-border); border-radius: 12px; }
.account-surface h1 { font-size: 26px; font-weight: 600; margin: 0 0 8px; }
.account-surface>p { color: var(--biz-muted); line-height: 1.7; margin: 0 0 25px; }
.account-list { display: grid; gap: 8px; }
.account-choice { padding: 14px 10px; display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; border-radius: 8px; background: transparent; color: var(--biz-text); border: 1px solid transparent; }
.account-choice:hover, .account-choice:focus-visible { background: var(--biz-subtle); border-color: var(--biz-border); }
.account-avatar { flex-shrink: 0; width: 38px; height: 38px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); display: grid; place-items: center; border-radius: 50%; font-weight: 550; }
.account-info { flex: 1; min-width: 0; }
.account-info strong { display: block; font-size: 14px; font-weight: 550; }
.account-info small { display: block; color: var(--biz-muted); font-size: 12px; margin-top: 4px; overflow-wrap: anywhere; }
.account-enter { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--el-color-primary); }
.account-footer { margin: 24px 0 0; font-size: 13px; color: var(--biz-muted); text-align: center; }
@media (max-width: 480px) { .account-page { padding: 24px 16px; } .account-surface { padding: 26px 18px; } .account-enter { font-size: 0; } }
</style>
