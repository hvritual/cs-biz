<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElOption, ElRadioButton, ElRadioGroup, ElSelect } from 'element-plus';
import { Check, Monitor, Moon, Sun } from 'lucide-vue-next';
import PageHeader from '#/components/PageHeader.vue';
import { $t } from '#/locales';
import { useAppearanceStore, useWorkspaceStore } from '#/store';
import { errorMessage } from '#/utils/format';

const appearance = useAppearanceStore();
const workspace = useWorkspaceStore();
const saving = ref(false);
const modes = computed(() => [{ value: 'light' as const, label: $t('personal.light'), icon: Sun }, { value: 'dark' as const, label: $t('personal.dark'), icon: Moon }, { value: 'auto' as const, label: $t('personal.system'), icon: Monitor }]);
const colors = appearance.colors;
async function change(patch: Partial<typeof appearance.settings>) {
  saving.value = true;
  try { await appearance.update(patch); }
  catch (cause) { ElMessage.error(errorMessage(cause)); }
  finally { saving.value = false; }
}
</script>

<template>
  <main class="page"><PageHeader :title="$t('personal.title')" :description="$t('personal.description')" />
    <section class="surface preferences-surface">
      <div class="preference-section"><div class="preference-label"><h2>{{ $t('personal.appearance') }}</h2><p>{{ $t('personal.appearanceDescription') }}</p></div><div class="theme-options"><button v-for="mode in modes" :key="mode.value" class="theme-option" :class="{ selected: appearance.settings.mode === mode.value }" :aria-pressed="appearance.settings.mode === mode.value" :disabled="saving" :data-testid="`theme-${mode.value}`" @click="change({ mode: mode.value })"><component :is="mode.icon" :size="24" /><span>{{ mode.label }}</span><Check v-if="appearance.settings.mode === mode.value" class="selected-check" :size="15" /></button></div></div>
      <div class="preference-section"><div class="preference-label"><h2>{{ $t('personal.color') }}</h2><p>{{ $t('personal.colorDescription') }}</p></div><div class="color-options"><button v-for="(color, index) in colors" :key="color" class="color-option" :style="{ backgroundColor: color }" :aria-label="$t(`personal.colors.${index}`)" :aria-pressed="appearance.settings.color === color" :disabled="saving" :data-testid="`color-${index}`" @click="change({ color })"><Check v-if="appearance.settings.color === color" :size="18" /></button></div></div>
      <div class="preference-section preference-inline"><div class="preference-label"><h2>{{ $t('personal.language') }}</h2><p>{{ $t('personal.languageDescription') }}</p></div><ElSelect :model-value="appearance.settings.locale" :aria-label="$t('personal.language')" :disabled="saving" data-testid="locale-select" @update:model-value="(value: 'zh-CN' | 'en-US') => change({ locale: value })"><ElOption label="简体中文" value="zh-CN" /><ElOption label="English" value="en-US" /></ElSelect></div>
      <div class="preference-section preference-inline"><div class="preference-label"><h2>{{ $t('personal.density') }}</h2><p>{{ $t('personal.densityDescription') }}</p></div><ElRadioGroup :model-value="appearance.settings.density" :disabled="saving" @update:model-value="(value) => change({ density: value as 'comfortable' | 'compact' })"><ElRadioButton value="comfortable">{{ $t('personal.comfortable') }}</ElRadioButton><ElRadioButton value="compact">{{ $t('personal.compact') }}</ElRadioButton></ElRadioGroup></div>
      <p class="preference-note">{{ $t('personal.savedFor', { name: workspace.user?.name ?? '', tenant: workspace.tenant?.name ?? $t('shell.platformWorkspace') }) }}</p>
    </section>
  </main>
</template>

<style scoped>
.preferences-surface { max-width: 900px; }
.preference-section { padding: 4px 0 26px; margin-bottom: 24px; border-bottom: 1px solid var(--biz-border); }
.preference-label h2 { font-size: 16px; font-weight: 550; margin: 0 0 6px; }
.preference-label p { color: var(--biz-muted); margin: 0; font-size: 13px; line-height: 1.7; }
.theme-options { display: flex; gap: 16px; margin-top: 20px; }
.theme-option { flex: 1; max-width: 170px; padding: 22px 14px; display: flex; flex-direction: column; gap: 12px; align-items: center; background: var(--biz-surface); color: var(--biz-muted); border: 1px solid var(--biz-border); border-radius: 8px; position: relative; cursor: pointer; }
.theme-option.selected { color: var(--el-color-primary); border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.selected-check { position: absolute; top: 10px; right: 10px; }
.color-options { display: flex; gap: 14px; margin-top: 18px; }
.color-option { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: #fff; cursor: pointer; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 10%); }
.color-option[aria-pressed='true'] { outline: 2px solid var(--el-color-primary); outline-offset: 4px; }
.preference-inline { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.preference-inline .el-select { width: 185px; flex-shrink: 0; }
.preference-note { font-size: 12px; color: var(--biz-muted); line-height: 1.7; margin: 0; }
@media (max-width: 640px) { .theme-options { gap: 10px; } .theme-option { padding: 18px 6px; } .preference-inline { align-items: flex-start; flex-direction: column; gap: 16px; } }
</style>
