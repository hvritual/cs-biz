import { ref } from 'vue';
import { defineStore } from 'pinia';
import { loadLocaleMessages } from '@vben/locales';
import { updatePreferences } from '@vben/preferences';
import { ServiceError } from '#/api/mock/service';

export const APPEARANCE_COLORS = ['#0f766e', '#4f46e5', '#2563eb', '#7c3aed', '#c2410c', '#475569'] as const;
export type AppearanceSettings = {
  mode: 'light' | 'dark' | 'auto'; color: string;
  density: 'comfortable' | 'compact'; locale: 'zh-CN' | 'en-US';
};
const defaults: AppearanceSettings = {
  mode: 'light', color: APPEARANCE_COLORS[0], density: 'comfortable', locale: 'zh-CN',
};

function normalize(value: Partial<AppearanceSettings>): AppearanceSettings {
  return {
    mode: ['light', 'dark', 'auto'].includes(value.mode || '') ? value.mode! : defaults.mode,
    color: APPEARANCE_COLORS.includes(value.color as typeof APPEARANCE_COLORS[number]) ? value.color! : defaults.color,
    density: value.density === 'compact' ? 'compact' : 'comfortable',
    locale: value.locale === 'en-US' ? 'en-US' : 'zh-CN',
  };
}

export const useAppearanceStore = defineStore('workspace-appearance', () => {
  const settings = ref<AppearanceSettings>({ ...defaults });
  let scope = 'cs-biz:appearance:v1:guest';
  let changes = 0;
  let languageQueue: Promise<unknown> = Promise.resolve();

  async function apply(value: AppearanceSettings) {
    const version = ++changes;
    settings.value = value;
    updatePreferences({
      app: { locale: value.locale, compact: value.density === 'compact' },
      theme: { mode: value.mode, colorPrimary: value.color, fontSize: 14 },
    });
    document.documentElement.dataset.density = value.density;
    const loading = languageQueue.then(async () => {
      if (version === changes) await loadLocaleMessages(value.locale);
    });
    languageQueue = loading.catch(() => undefined);
    await loading;
  }

  async function restoreScope(userId?: string, tenantId?: string, brandColor?: string) {
    scope = `cs-biz:appearance:v1:${userId || 'guest'}:${tenantId || 'account'}`;
    let saved: Partial<AppearanceSettings> = {};
    let raw: string | null;
    try {
      raw = localStorage.getItem(scope);
    } catch { throw new ServiceError('STORAGE_UNAVAILABLE', 507); }
    if (raw) {
      try { saved = JSON.parse(raw) as Partial<AppearanceSettings>; }
      catch { /* Display defaults when an old preference record cannot be read. */ }
    }
    await apply(normalize({ color: brandColor || defaults.color, ...saved }));
  }

  async function update(patch: Partial<AppearanceSettings>) {
    const next = normalize({ ...settings.value, ...patch });
    try { localStorage.setItem(scope, JSON.stringify(next)); }
    catch { throw new ServiceError('STORAGE_UNAVAILABLE', 507); }
    await apply(next);
  }

  return { settings, colors: APPEARANCE_COLORS, update, restoreScope };
});
