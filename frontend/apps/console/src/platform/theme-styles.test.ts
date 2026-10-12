import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateCSSVariables } from '@vben-core/shared/utils';

const styleId = 'cs-biz-theme-regression';

afterEach(() => {
  vi.useRealTimers();
  document.querySelectorAll(`#${styleId}`).forEach((style) => style.remove());
});

describe('theme variable publication', () => {
  it('keeps one stylesheet when startup updates happen before the next task, so a later brand color wins', () => {
    vi.useFakeTimers();
    updateCSSVariables({ '--primary-500': '175 77% 26%' }, styleId);
    updateCSSVariables({ '--primary-500': '175 77% 26%' }, styleId);
    vi.runAllTimers();
    updateCSSVariables({ '--primary-500': '262 83% 58%' }, styleId);
    vi.runAllTimers();
    expect(document.querySelectorAll(`#${styleId}`)).toHaveLength(1);
    expect(getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim()).toBe('262 83% 58%');
  });
});
