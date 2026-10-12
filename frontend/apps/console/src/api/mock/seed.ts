import type { Grant, MockDatabase, Role } from './types';

import { PERMISSIONS } from './types';

const ownerGrants: Grant[] = PERMISSIONS.map(({ code }) => ({ action: code, scope: 'all' }));
const viewerGrants: Grant[] = [
  { action: 'workspace.read', scope: 'all' },
  { action: 'crm.customer.read', scope: 'all' },
  { action: 'tenant.profile.read', scope: 'all' },
  { action: 'tenant.module.read', scope: 'all' },
];

function rolesFor(tenantId: string): Role[] {
  return [
    { id: `${tenantId}-owner`, tenantId, name: '企业负责人', description: '管理企业、成员与工作空间', grants: ownerGrants.map((grant) => ({ ...grant })), isSystem: true, isOwner: true },
    { id: `${tenantId}-viewer`, tenantId, name: '客户观察员', description: '查看全部客户及企业基本资料', grants: viewerGrants.map((grant) => ({ ...grant })), isSystem: false, isOwner: false },
    { id: `${tenantId}-specialist`, tenantId, name: '客户负责人', description: '建立客户并维护自己负责的客户', grants: [
      { action: 'crm.customer.create', scope: 'own' },
      { action: 'crm.customer.update', scope: 'own' },
      { action: 'crm.customer.archive', scope: 'own' },
    ], isSystem: false, isOwner: false },
  ];
}

export function createSeedDatabase(): MockDatabase {
  return {
    schemaVersion: 1,
    users: [
      { id: 'chen', name: '陈予安', email: 'yuan.chen@example.test', initials: '陈', title: '企业负责人' },
      { id: 'zhou', name: '周远', email: 'yuan.zhou@example.test', initials: '周', title: '客户顾问' },
      { id: 'yu', name: '陈雨', email: 'yu.chen@example.test', initials: '雨', title: '运营分析' },
      { id: 'shen', name: '沈南', email: 'nan.shen@example.test', initials: '沈', title: '客户顾问' },
      { id: 'platform', name: '张衡', email: 'heng.zhang@example.test', initials: '张', title: '平台运营', platformRole: 'operator' },
    ],
    tenants: [
      { id: 'qinghe', name: '青禾咖啡', shortName: '青禾', contact: '陈予安', phone: '13800002026', email: 'team@qinghe.example.test', brandColor: '#0f766e', status: 'active', createdAt: '2026-03-18T02:00:00.000Z' },
      { id: 'yunlan', name: '云岚生活', shortName: '云岚', contact: '陈予安', phone: '13900002026', email: 'team@yunlan.example.test', brandColor: '#4f46e5', status: 'active', createdAt: '2026-08-06T02:00:00.000Z' },
    ],
    memberships: [
      { id: 'qinghe-chen', tenantId: 'qinghe', userId: 'chen', status: 'active', roleIds: ['qinghe-owner'], joinedAt: '2026-03-18T02:00:00.000Z' },
      { id: 'qinghe-zhou', tenantId: 'qinghe', userId: 'zhou', status: 'active', roleIds: ['qinghe-viewer', 'qinghe-specialist'], joinedAt: '2026-04-09T02:00:00.000Z' },
      { id: 'qinghe-yu', tenantId: 'qinghe', userId: 'yu', status: 'active', roleIds: ['qinghe-viewer'], joinedAt: '2026-06-12T02:00:00.000Z' },
      { id: 'qinghe-shen', tenantId: 'qinghe', userId: 'shen', status: 'disabled', roleIds: ['qinghe-viewer'], joinedAt: '2026-05-21T02:00:00.000Z' },
      { id: 'yunlan-chen', tenantId: 'yunlan', userId: 'chen', status: 'active', roleIds: ['yunlan-owner'], joinedAt: '2026-08-06T02:00:00.000Z' },
      { id: 'yunlan-zhou', tenantId: 'yunlan', userId: 'zhou', status: 'active', roleIds: ['yunlan-viewer'], joinedAt: '2026-08-12T02:00:00.000Z' },
    ],
    roles: [...rolesFor('qinghe'), ...rolesFor('yunlan')],
    customers: [
      { id: 'qh-yunshan', tenantId: 'qinghe', company: '云杉科技', kind: 'company', contact: '许清', phone: '13800001001', ownerId: 'chen', status: 'active', notes: '研发中心与园区咖啡空间，周一下午适合沟通。', updatedAt: '2026-10-12T01:20:00.000Z' },
      { id: 'qh-xinghe', tenantId: 'qinghe', company: '星河书店', kind: 'retail', contact: '林溪', phone: '13800001002', ownerId: 'zhou', status: 'active', notes: '城西门店正在筹备秋季读书会。', updatedAt: '2026-10-11T08:10:00.000Z' },
      { id: 'qh-muhe', tenantId: 'qinghe', company: '木禾设计', kind: 'studio', contact: '程朵', phone: '13800001003', ownerId: 'chen', status: 'active', notes: '设计团队工作室，偏好中浅烘焙咖啡。', updatedAt: '2026-10-11T02:30:00.000Z' },
      { id: 'qh-yuanshan', tenantId: 'qinghe', company: '远山酒店', kind: 'hospitality', contact: '陆宁', phone: '13800001004', ownerId: 'chen', status: 'active', notes: '大堂与早餐区由同一运营团队负责。', updatedAt: '2026-10-10T07:45:00.000Z' },
      { id: 'qh-mingchuan', tenantId: 'qinghe', company: '明川文创', kind: 'studio', contact: '贺川', phone: '13800001005', ownerId: 'chen', status: 'active', notes: '计划在冬季市集设置移动咖啡空间。', updatedAt: '2026-10-10T03:00:00.000Z' },
      { id: 'qh-qingniao', tenantId: 'qinghe', company: '青鸟联合办公', kind: 'company', contact: '季然', phone: '13800001006', ownerId: 'zhou', status: 'prospect', notes: '新办公空间即将开放，已预约现场交流。', updatedAt: '2026-10-09T09:15:00.000Z' },
      { id: 'qh-haian', tenantId: 'qinghe', company: '海岸艺术中心', kind: 'studio', contact: '苏墨', phone: '13800001007', ownerId: 'chen', status: 'prospect', notes: '展览期间人流集中，正在确认服务需求。', updatedAt: '2026-10-08T06:20:00.000Z' },
      { id: 'qh-hetian', tenantId: 'qinghe', company: '禾田生活', kind: 'retail', contact: '唐禾', phone: '13800001008', ownerId: 'chen', status: 'paused', notes: '门店调整期间暂停合作，预计月底重新联系。', updatedAt: '2026-10-07T02:40:00.000Z' },
      { id: 'yl-shanlan', tenantId: 'yunlan', company: '山岚民宿', kind: 'hospitality', contact: '温岚', phone: '13900001001', ownerId: 'chen', status: 'active', notes: '山景客房与庭院早餐空间。', updatedAt: '2026-10-09T02:00:00.000Z' },
      { id: 'yl-yunqi', tenantId: 'yunlan', company: '云栖花园', kind: 'retail', contact: '顾桐', phone: '13900001002', ownerId: 'chen', status: 'prospect', notes: '花园商店正在规划周末咖啡活动。', updatedAt: '2026-10-08T03:00:00.000Z' },
      { id: 'yl-bailu', tenantId: 'yunlan', company: '白露文化', kind: 'studio', contact: '白露', phone: '13900001003', ownerId: 'chen', status: 'active', notes: '文化活动与内容创作团队。', updatedAt: '2026-10-06T06:00:00.000Z' },
      { id: 'yl-jianshan', tenantId: 'yunlan', company: '见山工坊', kind: 'studio', contact: '宋见', phone: '13900001004', ownerId: 'chen', status: 'paused', notes: '工作空间翻新，暂缓日常补给。', updatedAt: '2026-10-05T05:00:00.000Z' },
    ],
    entitlements: {
      qinghe: [{ moduleCode: 'crm', status: 'active', activatedAt: '2026-03-18T02:00:00.000Z' }],
      yunlan: [{ moduleCode: 'crm', status: 'inactive' }],
    },
    accessVersions: { qinghe: 1, yunlan: 1 },
    activationRequests: [],
    idempotency: {},
  };
}
