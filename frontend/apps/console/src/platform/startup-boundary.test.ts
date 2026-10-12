import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startApplication } from './startup-boundary';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div><div id="__app-loading__">Loading</div><style data-app-loading="inject-style"></style>';
  document.documentElement.lang = 'zh-CN';
});

afterEach(() => {
  document.body.replaceChildren();
  document.querySelector('#cs-startup-style')?.remove();
  localStorage.clear();
});

describe('application startup recovery', () => {
  it('replaces a rejected dependency initialization with business copy and removes the loading cover', async () => {
    const start = vi.fn(async () => { throw new Error('Mock API STORAGE_UNAVAILABLE'); });
    await expect(startApplication(start)).resolves.toBe(false);
    expect(start).toHaveBeenCalledOnce();
    expect(document.querySelector('h1')?.textContent).toBe('暂时无法打开工作空间');
    expect(document.body.textContent).not.toMatch(/Mock|API|STORAGE_UNAVAILABLE|Loading/);
    expect(document.querySelector('#__app-loading__')).toBeNull();
    expect(document.querySelector('[data-app-loading^="inject"]')).toBeNull();
    expect(document.activeElement).toBe(document.querySelector('h1'));
  });

  it('offers a fresh startup attempt without deleting existing work', async () => {
    localStorage.setItem('customer-work', 'retained');
    const retry = vi.fn();
    await startApplication(async () => { throw new DOMException('Full', 'QuotaExceededError'); }, { retry });
    document.querySelector('button')?.click();
    expect(retry).toHaveBeenCalledOnce();
    expect(localStorage.getItem('customer-work')).toBe('retained');
  });

  it('uses English when the current document language is English', async () => {
    document.documentElement.lang = 'en-US';
    await startApplication(async () => { throw new Error('Failed to load module'); });
    expect(document.querySelector('h1')?.textContent).toBe('Your workspace could not be opened');
    expect(document.querySelector('button')?.textContent).toBe('Try again');
    expect(document.body.textContent).not.toContain('Failed to load module');
  });

  it('leaves a successfully mounted application intact', async () => {
    const start = vi.fn(async () => { document.querySelector('#app')!.textContent = '工作空间'; });
    await expect(startApplication(start)).resolves.toBe(true);
    expect(document.querySelector('#app')?.textContent).toBe('工作空间');
    expect(document.querySelector('.cs-startup')).toBeNull();
  });
});
