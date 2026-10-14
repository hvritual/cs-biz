import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    const key = `errors.${error.code}`;
    const params = 'params' in error && typeof error.params === 'object' ? error.params : {};
    const translated = $t(key, (params ?? {}) as Record<string, string | number>);
    if (translated !== key) return translated;
  }
  return $t('errors.GENERAL');
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return $t('common.noDate');
  return new Intl.DateTimeFormat(preferences.app.locale, {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: preferences.app.timezone,
  }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(preferences.app.locale).format(value);
}
