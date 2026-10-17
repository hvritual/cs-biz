import type { Effect } from './model';

// Different UI entrypoints can change the same business field.
export function conflictDomain(kind: Effect['kind']): string {
  return kind === 'customer' || kind === 'batch' ? 'customer-note' : kind;
}
export function conflictTenant(effect: Effect, workspace: string): string {
  if (effect.kind === 'module') return effect.values.tenant || '';
  if (effect.kind === 'tenant') return `tenant-${effect.values.code}`;
  if (effect.kind === 'nominate') return effect.ids[0] || '';
  return workspace;
}
interface RetryTrace { id: string; sequence: number; effect: {values: Record<string, string>}; items: {id: string; status: string}[] }
function descendants<T extends RetryTrace>(origin: RetryTrace, records: readonly T[]): T[] {
  const seen=new Set([origin.id]); const result:T[]=[];
  for(let changed=true;changed;) {
    changed=false;
    for(const record of records) if(!seen.has(record.id)&&seen.has(record.effect.values.retryOf||'')) {
      seen.add(record.id);result.push(record);changed=true;
    }
  }
  return result;
}
export function retryableFailedIds(origin: RetryTrace, records: readonly RetryTrace[]): string[] {
  const related=descendants(origin,records);
  return origin.items.filter(item=>item.status==='failed'&&!related.some(record=>record.items.some(result=>result.id===item.id&&result.status!=='failed'))).map(item=>item.id);
}
export function latestRecovery<T extends RetryTrace>(origin: RetryTrace, id: string, records: readonly T[]): T|undefined {
  return descendants(origin,records).filter(record=>record.items.some(item=>item.id===id)).sort((a,b)=>b.sequence-a.sequence)[0];
}

export function preserveSelectionVersions(
  ids: string[], previousIds: string[], previous: Record<string, number>,
  records: { id: string; version: number }[],
): Record<string, number> {
  return Object.fromEntries(ids.map(id => [id,
    previousIds.includes(id) && previous[id] !== undefined
      ? previous[id] : records.find(row => row.id === id)?.version ?? -1,
  ]));
}
