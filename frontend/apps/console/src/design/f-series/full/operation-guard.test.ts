import { describe, expect, it } from 'vitest';
import { conflictDomain, preserveSelectionVersions } from './operation-guard';

describe('unresolved writes and selection versions', () => {
  it('groups the two customer-note write entrypoints without blocking independent export', () => {
    expect(conflictDomain('batch')).toBe(conflictDomain('customer'));
    expect(conflictDomain('export')).not.toBe(conflictDomain('customer'));
  });
  it('retains the observed version through record refresh, adding only explicitly new targets', () => {
    expect(preserveSelectionVersions(['C1', 'C2'], ['C1'], {C1:1}, [{id:'C1',version:2},{id:'C2',version:3}])).toEqual({C1:1,C2:3});
    expect(preserveSelectionVersions(['C2'], ['C1'], {C1:1}, [{id:'C2',version:3}])).toEqual({C2:3});
  });
});
