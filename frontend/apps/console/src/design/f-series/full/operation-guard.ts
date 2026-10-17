import type { Effect } from './model';

// Different UI entrypoints can change the same business field.
export function conflictDomain(kind: Effect['kind']): string {
  return kind === 'customer' || kind === 'batch' ? 'customer-note' : kind;
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
