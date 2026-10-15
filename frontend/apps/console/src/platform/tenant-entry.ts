/**
 * A tenant choice is only meaningful after an independently verified Account session.
 * The current S01 service has no credential authority, so compatibility defaults are
 * confined to its preselected preview account. A deliberate account entry is strict.
 */
export type TenantEntry =
  | { mode: 'none' | 'choose' }
  | { mode: 'direct' | 'remembered' | 'preview-default'; tenantId: string };

export function resolveTenantEntry(
  activeTenantIds: readonly string[],
  rememberedTenant: string | undefined,
  explicitAccountEntry: boolean,
  previewBootstrap: boolean,
): TenantEntry {
  if (rememberedTenant) {
    // A stale saved workspace is intentionally revalidated by the authority
    // adapter; it must not silently switch the user into a different tenant.
    return { mode: 'remembered', tenantId: rememberedTenant };
  }
  if (activeTenantIds.length === 0) return { mode: 'none' };
  if (activeTenantIds.length === 1) return { mode: 'direct', tenantId: activeTenantIds[0]! };
  if (!explicitAccountEntry && previewBootstrap) {
    return { mode: 'preview-default', tenantId: activeTenantIds[0]! };
  }
  return { mode: 'choose' };
}
