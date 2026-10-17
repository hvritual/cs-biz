import { preferences } from "@vben/preferences";
export function l(zh: string, en: string): string {
  return preferences.app.locale === "en-US" ? en : zh;
}
export function pair(value: readonly [string, string]): string {
  return l(value[0], value[1]);
}
export const roles = [
  { id: "owner", title: ["企业负责人", "Organization owner"] },
  { id: "manager", title: ["有委派权限的管理员", "Delegated administrator"] },
  { id: "operator", title: ["业务成员", "Business member"] },
  { id: "reader", title: ["只读成员", "Read-only member"] },
  { id: "platform", title: ["平台管理员", "Platform administrator"] },
  { id: "support", title: ["获准支持人员", "Authorized support"] },
  { id: "ops", title: ["获准运维人员", "Authorized operator"] },
] as const;
export function roleTitle(id: string) {
  const item = roles.find((x) => x.id === id);
  return item ? pair(item.title) : id;
}
export function statusTitle(id: string): string {
  const labels: Record<string, readonly [string, string]> = {
    active: ["在任", "Active"],
    suspended: ["已停用", "Suspended"],
    removed: ["已移除", "Removed"],
    invited: ["待加入", "Invited"],
    draft: ["草稿", "Draft"],
    pending: ["处理中", "Processing"],
    unknown: ["结果待确认", "Outcome unknown"],
    succeeded: ["已完成", "Completed"],
    failed: ["未完成", "Failed"],
    partial: ["部分完成", "Partially completed"],
    cancelled: ["已取消", "Cancelled"],
    created: ["已创建", "Created"],
    delivered: ["已投递", "Delivered"],
    delivery_failed: ["投递失败", "Delivery failed"],
    withdrawn: ["已撤回", "Withdrawn"],
    accepted: ["已接受", "Accepted"],
    expired: ["已过期", "Expired"],
    read: ["读取", "Read"],
    update: ["修改", "Update"],
    execute: ["执行", "Execute"],
    tenant: ["当前企业全部", "All in current organization"],
    self: ["本人负责", "Owned by me"],
    assigned: ["明确指派", "Explicitly assigned"],
    explicit: ["指定集合", "Explicit set"],
    none: ["无", "None"],
    queued: ["等待处理", "Queued"],
    retrying: ["等待重试", "Awaiting retry"],
    deadletter: ["需要人工处理", "Operator attention"],
    complete: ["已完成", "Complete"],
    missing: ["待补齐", "Missing"],
    paused: ["已暂停", "Paused"],
    ready: ["已就绪", "Ready"],
  };
  return labels[id] ? pair(labels[id]) : id;
}
