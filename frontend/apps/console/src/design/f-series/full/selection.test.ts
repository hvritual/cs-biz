import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Blob as NodeBlob } from 'node:buffer';
import { resolve } from 'node:path';
import { vi } from 'vitest';
import { analyzeSelection, parseWorkbookRows, readXlsx } from './selection';

describe('review bulk selection contract', () => {
  const records = [
    { id: '0012', name: '青禾', eligible: true },
    { id: '0013', name: '同名', eligible: true },
    { id: '0014', name: '同名', eligible: true },
    { id: '0015', name: '只读', eligible: false },
  ];
  it('keeps text identifiers and deduplicates aliases by final target, without admitting scope failures', () => {
    const rows = analyzeSelection(['0012', '青禾', '0015', 'missing'], records, {});
    expect(rows.map(r => r.state)).toEqual(['ready', 'duplicate', 'outside', 'unavailable']);
    expect(rows.filter(r => r.state === 'ready').map(r => r.id)).toEqual(['0012']);
  });
  it('requires an exact visible candidate to resolve ambiguous names', () => {
    expect(analyzeSelection(['同名'], records, {})[0]?.state).toBe('ambiguous');
    expect(analyzeSelection(['同名'], records, { '0': '0014' })[0]?.id).toBe('0014');
    expect(analyzeSelection(['同名'], records, { '0': 'cross-tenant' })[0]?.state).toBe('ambiguous');
  });
  it('rejects formulas, duplicate columns, and numeric identifiers that could have lost zeroes', () => {
    expect(() => parseWorkbookRows([['编号', '编号'], ['0012', '0013']], '编号')).toThrow();
    expect(() => parseWorkbookRows([['编号'], ['=HYPERLINK("https://example.test")']], '编号')).toThrow();
    expect(() => parseWorkbookRows([['编号'], [12]], '编号')).toThrow();
    expect(parseWorkbookRows([['编号', '名称'], ['0012', '青禾']], '编号')).toEqual(['0012']);
  });
  it('reads the actual compressed Excel templates locally and rejects corrupt ZIP input', async () => {
    vi.stubGlobal('Blob', NodeBlob);
    const target = new Uint8Array(readFileSync(resolve('apps/console/src/design/f-series/full/assets/targets.xlsx')));
    const invitations = new Uint8Array(readFileSync(resolve('apps/console/src/design/f-series/full/assets/invitations.xlsx')));
    expect(await readXlsx(target)).toEqual(['C-1001', 'C-1006']);
    expect(await readXlsx(invitations, '邮箱')).toEqual(['new-a@example.test', 'new-b@example.test']);
    await expect(readXlsx(new Uint8Array(25))).rejects.toThrow();
    const corrupt = target.slice(); corrupt[80] = corrupt[80]! ^ 1;
    await expect(readXlsx(corrupt)).rejects.toThrow();
    vi.unstubAllGlobals();
  });
});
