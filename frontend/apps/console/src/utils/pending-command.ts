import { ServiceError } from '#/api/mock/service';
import type { RequestContext } from '#/api/mock/types';

interface PendingCommand<T> { key: string; input: T }
type Operation = 'customer.create' | 'member.create';

function storageKey(context: RequestContext, operation: Operation) {
  return `cs-biz:pending:v1:${context.subjectId}:${context.tenantId}:${operation}`;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function readPendingCommand<T>(context: RequestContext, operation: Operation): PendingCommand<T> | null {
  try {
    const stored = sessionStorage.getItem(storageKey(context, operation));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PendingCommand<T>;
    return typeof parsed.key === 'string' && parsed.key.length >= 6 && !!parsed.input && typeof parsed.input === 'object' ? parsed : null;
  } catch { return null; }
}

/** Persist before issuing the command; keep the original payload if its outcome is unknown. */
export function writePendingCommand<T>(context: RequestContext, operation: Operation, input: T, key: string) {
  const existing = readPendingCommand<T>(context, operation);
  if (existing && (existing.key !== key || canonical(existing.input) !== canonical(input))) throw new ServiceError('IDEMPOTENCY_CONFLICT', 409);
  try { sessionStorage.setItem(storageKey(context, operation), JSON.stringify({ key, input })); }
  catch { throw new ServiceError('STORAGE_UNAVAILABLE', 503); }
}

export function clearPendingCommand(context: RequestContext, operation: Operation, key: string) {
  if (readPendingCommand(context, operation)?.key !== key) return;
  try { sessionStorage.removeItem(storageKey(context, operation)); }
  catch { /* A replay remains safe because the service retains the same command result. */ }
}
