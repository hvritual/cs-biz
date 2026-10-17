import { describe, expect, it } from 'vitest';
import { conflictDomain, conflictTenant, preserveSelectionVersions, retryableFailedIds } from './operation-guard';

describe('unresolved writes and selection versions', () => {
  it('does not replay original failures already recovered or unresolved in a descendant operation', () => {
    const root={id:'root',sequence:1,effect:{values:{}},items:[{id:'A',status:'failed'},{id:'B',status:'succeeded'},{id:'C',status:'unknown'}]};
    const child={id:'retry',sequence:2,effect:{values:{retryOf:'root'}},items:[{id:'A',status:'failed'}]};
    const grandchild={id:'retry2',sequence:3,effect:{values:{retryOf:'retry'}},items:[{id:'A',status:'succeeded'}]};
    expect(retryableFailedIds(root,[root,child])).toEqual(['A']);
    expect(retryableFailedIds(root,[root,child,grandchild])).toEqual([]);
    expect(retryableFailedIds(root,[root,{...child,items:[{id:'A',status:'unknown'}]}])).toEqual([]);
  });
  it('uses the platform operation target rather than the unrelated current workspace', () => {
    expect(conflictTenant({kind:'module',ids:['crm'],values:{tenant:'T2'}},'T1')).toBe('T2');
    expect(conflictTenant({kind:'tenant',ids:['new'],values:{code:'new'}},'T1')).toBe('tenant-new');
    expect(conflictTenant({kind:'nominate',ids:['T2'],values:{}},'T1')).toBe('T2');
    expect(conflictTenant({kind:'batch',ids:['C1'],values:{}},'T1')).toBe('T1');
  });
  it('groups the two customer-note write entrypoints without blocking independent export', () => {
    expect(conflictDomain('batch')).toBe(conflictDomain('customer'));
    expect(conflictDomain('export')).not.toBe(conflictDomain('customer'));
  });
  it('retains the observed version through record refresh, adding only explicitly new targets', () => {
    expect(preserveSelectionVersions(['C1', 'C2'], ['C1'], {C1:1}, [{id:'C1',version:2},{id:'C2',version:3}])).toEqual({C1:1,C2:3});
    expect(preserveSelectionVersions(['C2'], ['C1'], {C1:1}, [{id:'C2',version:3}])).toEqual({C2:3});
  });
});
