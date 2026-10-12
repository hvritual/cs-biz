import { describe, expect, it } from 'vitest';
import { NAVIGATION_POLICY, isSafeLocalPath, validateNavigation } from './navigation';

const customers = { ...NAVIGATION_POLICY['crm.customer.list'], viewKey: 'crm.customer.list' };

describe('workspace navigation boundary', () => {
  it('accepts the registered customer page and owns its ordering', () => {
    expect(validateNavigation([{ ...customers, order: 999 }])).toEqual([customers]);
  });

  it('rejects an unknown view and any mismatch with its registered path or title', () => {
    expect(() => validateNavigation([{ ...customers, viewKey: '../../private' }])).toThrow();
    expect(() => validateNavigation([{ ...customers, path: '/platform' }])).toThrow();
    expect(() => validateNavigation([{ ...customers, titleKey: 'untrusted.title' }])).toThrow();
  });

  it('rejects duplicate entries before either can be installed', () => {
    expect(() => validateNavigation([customers, customers])).toThrow();
  });

  it('allows local destinations and rejects origin changes and control characters', () => {
    expect(isSafeLocalPath('/customers?status=active')).toBe(true);
    for (const path of ['https://example.com', '//example.com', '/\\example.com', '/\ncustomers']) {
      expect(isSafeLocalPath(path)).toBe(false);
    }
  });
});
