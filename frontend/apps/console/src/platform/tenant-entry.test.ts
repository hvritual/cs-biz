import { describe, expect, it } from 'vitest';
import { resolveTenantEntry } from './tenant-entry';

describe('tenant entry (authenticated account only)', () => {
  it('does not fabricate a tenant when none is active', () => {
    expect(resolveTenantEntry([], undefined, true, false)).toEqual({ mode: 'none' });
  });
  it('enters the only eligible tenant', () => {
    expect(resolveTenantEntry(['a'], undefined, true, false)).toEqual({ mode: 'direct', tenantId: 'a' });
  });
  it('requires explicit choice for a fresh multi-tenant account entry', () => {
    expect(resolveTenantEntry(['a', 'b'], undefined, true, false)).toEqual({ mode: 'choose' });
    expect(resolveTenantEntry(['a', 'b'], undefined, false, false)).toEqual({ mode: 'choose' });
  });
  it('revalidates stale remembered tenant rather than silently choosing another', () => {
    expect(resolveTenantEntry(['b'], 'a', false, true)).toEqual({ mode: 'remembered', tenantId: 'a' });
  });
  it('limits first-choice fallback to the old S01 preselected preview session', () => {
    expect(resolveTenantEntry(['a', 'b'], undefined, false, true)).toEqual({ mode: 'preview-default', tenantId: 'a' });
  });
});
