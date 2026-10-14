import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@vben/locales', () => ({ loadLocaleMessages: vi.fn(async () => undefined) }));
vi.mock('@vben/preferences', () => ({ updatePreferences: vi.fn() }));

import { useAppearanceStore } from '../store/appearance';

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('appearance persistence', () => {
  it('preserves the prior preference and reports a write failure instead of claiming it was saved', async () => {
    const appearance = useAppearanceStore();
    await appearance.restoreScope('chen', 'qinghe');
    await appearance.update({ mode: 'light', color: '#0f766e' });
    const before = { ...appearance.settings };
    const storage = localStorage;
    vi.stubGlobal('localStorage', {
      getItem: storage.getItem.bind(storage),
      setItem: () => { throw new DOMException('Full', 'QuotaExceededError'); },
    });
    await expect(appearance.update({ mode: 'dark' }))
      .rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE', status: 507 });
    expect(appearance.settings).toEqual(before);
    expect(JSON.parse(storage.getItem('cs-biz:appearance:v1:chen:qinghe')!).mode).toBe('light');
  });

  it('does not hide an inaccessible preference store while restoring a workspace', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
    });
    await expect(useAppearanceStore().restoreScope('chen', 'qinghe'))
      .rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE', status: 507 });
  });
});
