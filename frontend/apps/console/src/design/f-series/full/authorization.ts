import type { Member, Resource, Role, ScopeAction } from "./model";
export const scopeActions = [
  "read",
  "update",
  "export",
  "marketingRead",
  "marketingExecute",
] as const;
export function roleIds(member: Member): string[] {
  return member.roles ?? [member.role];
}
export function hasRole(member: Member, id: string) {
  return roleIds(member).includes(id);
}
export function grantsFor(member: Member | undefined, roles: Role[]): Role[] {
  if (member?.state !== "active") return [];
  const ids = roleIds(member);
  // Missing grants fail closed as a whole; no old role fallback.
  if (ids.some((id) => !roles.some((role) => role.id === id))) return [];
  return roles.filter((role) => ids.includes(role.id));
}
export function permits(
  grants: Role[],
  action: ScopeAction,
  resource: Resource,
  account: string,
): boolean {
  return grants.some(
    (grant) =>
      grant[action] === "tenant" ||
      (grant[action] === "self" && resource.owner === account) ||
      (grant[action] === "assigned" && !!resource.assignedTo?.includes(account)) ||
      (grant[action] === "explicit" && !!grant.targets?.[action]?.includes(resource.id)),
  );
}
export function scopeSummary(grants: Role[], action: ScopeAction) {
  const scopes = [
    ...new Set(grants.map((grant) => grant[action]).filter((scope) => scope !== "none")),
  ];
  return scopes.includes("tenant")
    ? "tenant"
    : scopes.length > 1
      ? "combined"
      : (scopes[0] ?? "none");
}
export function delegationAllowed(
  target: Role,
  ceilings: Role[],
  resources: Resource[],
  grantor: string,
): boolean {
  if (!ceilings.some((role) => role.access)) return false;
  return scopeActions.every((action) => {
    const scope = target[action];
    if (scope === "none") return true;
    if (!["self", "assigned", "explicit", "tenant"].includes(scope)) return false;
    if (scope === "explicit") {
      const ids = target.targets?.[action] ?? [];
      return (
        ids.length > 0 &&
        ids.every((id) => {
          const row = resources.find(
            (resource) =>
              resource.id === id &&
              resource.id.startsWith(action.startsWith("marketing") ? "M-" : "C-"),
          );
          return !!row && permits(ceilings, action, row, grantor);
        })
      );
    }
    // Open-ended self/assigned must have the same symbolic authority or tenant;
    // a finite explicit set can never prove authority over future objects.
    return ceilings.some((ceiling) => ceiling[action] === "tenant" || ceiling[action] === scope);
  });
}
