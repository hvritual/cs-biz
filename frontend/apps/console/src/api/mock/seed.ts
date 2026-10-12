import type { Grant, MockDatabase, Role } from './types';

import { PERMISSIONS } from './types';

const ownerGrants: Grant[] = PERMISSIONS.map(({ code }) => ({ action: code, scope: 'all' }));
const viewerGrants: Grant[] = [
  { action: 'workspace.read', scope: 'all' },
  { action: 'crm.customer.read', scope: 'all' },
  { action: 'tenant.profile.read', scope: 'all' },
  { action: 'tenant.module.read', scope: 'all' },
];
const operatorGrants: Grant[] = [
  { action: 'workspace.read', scope: 'all' },
  { action: 'crm.customer.read', scope: 'all' },
  { action: 'crm.customer.create', scope: 'own' },
  { action: 'crm.customer.update', scope: 'own' },
  { action: 'tenant.member.read', scope: 'all' },
  { action: 'tenant.profile.read', scope: 'all' },
  { action: 'tenant.module.read', scope: 'all' },
];
const departmentGrants: Grant[] = [
  { action: 'workspace.read', scope: 'all' },
  { action: 'crm.customer.read', scope: 'department' },
  { action: 'tenant.member.read', scope: 'department' },
  { action: 'tenant.profile.read', scope: 'all' },
  { action: 'tenant.module.read', scope: 'all' },
];

const DEPARTMENTS = [
  '产品研发部', '运营管理部', '市场部', '客户成功部', '技术支持部', '财务部',
  '人事部', '售后服务部', '华东运营组', '华南运营组', '华北运营组', '西南运营组',
];

function rolesFor(tenantId: string): Role[] {
  const extra = (name: string, description: string, grants: Grant[]): Role => ({
    id: `${tenantId}-${name}`, tenantId, name, description,
    grants: grants.map((grant) => ({ ...grant })), isSystem: false, isOwner: false,
  });
  return [
    { id: `${tenantId}-owner`, tenantId, name: '超级管理员', description: '拥有所有权限，管理企业、成员与系统配置', grants: ownerGrants.map((grant) => ({ ...grant })), isSystem: true, isOwner: true },
    { id: `${tenantId}-operator`, tenantId, name: '运营管理员', description: '管理客户与日常运营，查看成员信息', grants: operatorGrants.map((grant) => ({ ...grant })), isSystem: true, isOwner: false },
    { id: `${tenantId}-member`, tenantId, name: '普通成员', description: '查看分配的客户与基本信息', grants: viewerGrants.map((grant) => ({ ...grant })), isSystem: true, isOwner: false },
    extra('区域经理', '管理区域内的客户与运营团队', departmentGrants),
    extra('设备运维工程师', '处理设备告警与巡检工单', departmentGrants),
    extra('客服专员', '处理客户咨询与服务工单', viewerGrants),
    extra('财务专员', '查看账单、套餐与结算数据', viewerGrants),
    extra('市场专员', '维护市场活动与线索数据', viewerGrants),
    extra('数据分析师', '查看经营报表与设备数据看板', viewerGrants),
    extra('仓储管理员', '管理设备库存与出入库记录', viewerGrants),
    extra('培训专员', '维护培训资料与成员学习记录', viewerGrants),
    extra('审计专员', '查看操作日志与审计记录', viewerGrants),
  ];
}

const SURNAMES = ['张', '李', '王', '刘', '陈', '赵', '孙', '周', '吴', '郑', '林', '徐', '黄', '何', '高', '马', '朱', '胡', '郭', '罗'];
const GIVEN_NAMES = ['三', '四', '五', '佳', '晨', '六', '七', '八', '悦', '明', '芳', '娜', '伟', '强', '磊', '洋', '勇', '艳', '娟', '敏'];
const PINYIN_EMAILS = ['zhangsan', 'lisi', 'wangwu', 'liujia', 'chenchen', 'zhaoliu', 'sunqi', 'zhouba'];
const FIRST_LOGINS = [
  '2026-09-08T14:05:00.000Z', '2026-09-07T11:23:00.000Z', '2026-09-06T18:40:00.000Z', '2026-09-08T09:12:00.000Z',
  '2026-09-07T16:30:00.000Z', '2026-09-06T08:21:00.000Z', '2026-09-08T15:20:00.000Z', '2026-09-07T10:11:00.000Z',
  '2026-09-06T14:05:00.000Z', '2026-09-08T11:23:00.000Z',
];
const MEMBER_COUNT = 367;

function lastLoginFor(index: number) {
  if (index < FIRST_LOGINS.length) return FIRST_LOGINS[index];
  const day = 8 - (index % 9);
  const hour = 8 + (index % 10);
  const minute = (index * 7) % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `2026-09-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`;
}

export function createSeedDatabase(): MockDatabase {
  const tenantId = 'shanghai-coffee';

  const users = [
    { id: 'shanghai', name: 'User', email: 'admin@shanghai-coffee.com', initials: 'U', title: '超级管理员', department: DEPARTMENTS[0], lastLoginAt: FIRST_LOGINS[0] },
    { id: 'platform', name: '张衡', email: 'heng.zhang@example.test', initials: '张', title: '平台运营', platformRole: 'operator' as const },
  ];

  for (let i = 0; i < MEMBER_COUNT; i++) {
    const surname = SURNAMES[i % SURNAMES.length];
    const givenName = GIVEN_NAMES[(i * 3 + Math.floor(i / GIVEN_NAMES.length)) % GIVEN_NAMES.length];
    users.push({
      id: `member-${i + 1}`,
      name: surname + givenName,
      email: i < PINYIN_EMAILS.length ? `${PINYIN_EMAILS[i]}@example.com` : `member${i + 1}@example.com`,
      initials: surname,
      title: i % 3 === 0 ? '运营管理员' : '普通成员',
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      lastLoginAt: lastLoginFor(i),
    });
  }

  const memberships = [
    { id: `${tenantId}-shanghai`, tenantId, userId: 'shanghai', status: 'active' as const, roleIds: [`${tenantId}-owner`], joinedAt: '2026-02-18T02:00:00.000Z' },
  ];

  const roleIds = rolesFor(tenantId).map((role) => role.id);
  for (let i = 0; i < MEMBER_COUNT; i++) {
    const userId = `member-${i + 1}`;
    const roleIdsForMember = i === 0
      ? [roleIds[0]]
      : i < 10
        ? [i % 3 === 0 ? roleIds[1] : roleIds[2]]
        : [roleIds[1 + (i % (roleIds.length - 1))]];
    memberships.push({
      id: `${tenantId}-${userId}`,
      tenantId,
      userId,
      status: i >= MEMBER_COUNT - 8 ? 'disabled' as const : 'active' as const,
      roleIds: roleIdsForMember,
      joinedAt: '2026-02-18T02:00:00.000Z',
    });
  }

  return {
    schemaVersion: 2,
    users,
    tenants: [
      {
        id: tenantId,
        name: '上海咖啡科技有限公司',
        shortName: '上海咖啡',
        contact: 'User',
        phone: '13800002026',
        email: 'admin@shanghai-coffee.com',
        brandColor: '#2563eb',
        status: 'active',
        createdAt: '2026-02-18T02:00:00.000Z',
      },
    ],
    memberships,
    roles: rolesFor(tenantId),
    customers: [
      { id: 'sc-starbucks', tenantId, company: '星巴克咖啡', kind: 'company', contact: '王经理', phone: '13800001001', ownerId: 'shanghai', status: 'active', notes: '全国连锁咖啡店，需要大规模设备部署。', updatedAt: '2026-10-12T01:20:00.000Z' },
      { id: 'sc-luckin', tenantId, company: '瑞幸咖啡', kind: 'company', contact: '李总监', phone: '13800001002', ownerId: 'shanghai', status: 'active', notes: '快速扩张中的咖啡品牌，设备需求量大。', updatedAt: '2026-10-11T08:10:00.000Z' },
      { id: 'sc-manner', tenantId, company: 'Manner Coffee', kind: 'company', contact: '陈主管', phone: '13800001003', ownerId: 'shanghai', status: 'active', notes: '精品咖啡连锁，注重设备品质。', updatedAt: '2026-10-11T02:30:00.000Z' },
      { id: 'sc-seesaw', tenantId, company: 'Seesaw Coffee', kind: 'company', contact: '林经理', phone: '13800001004', ownerId: 'shanghai', status: 'active', notes: '高端咖啡品牌，设备维护要求高。', updatedAt: '2026-10-10T07:45:00.000Z' },
      { id: 'sc-grid', tenantId, company: 'Grid Coffee', kind: 'company', contact: '赵主管', phone: '13800001005', ownerId: 'shanghai', status: 'active', notes: '新兴咖啡品牌，正在扩展门店。', updatedAt: '2026-10-10T03:00:00.000Z' },
      { id: 'sc-algebraist', tenantId, company: '代数学家', kind: 'company', contact: '孙经理', phone: '13800001006', ownerId: 'shanghai', status: 'prospect', notes: '精品咖啡品牌，有意向合作。', updatedAt: '2026-10-09T09:15:00.000Z' },
      { id: 'sc-peet', tenantId, company: 'Peet\'s Coffee', kind: 'company', contact: '周总监', phone: '13800001007', ownerId: 'shanghai', status: 'active', notes: '国际咖啡品牌，中国区设备管理。', updatedAt: '2026-10-08T06:20:00.000Z' },
      { id: 'sc-tim', tenantId, company: 'Tim Hortons', kind: 'company', contact: '吴经理', phone: '13800001008', ownerId: 'shanghai', status: 'active', notes: '加拿大咖啡品牌，中国门店设备维护。', updatedAt: '2026-10-07T02:40:00.000Z' },
    ],
    entitlements: {
      [tenantId]: [{ moduleCode: 'crm', status: 'active', activatedAt: '2026-02-18T02:00:00.000Z' }],
    },
    accessVersions: { [tenantId]: 1 },
    activationRequests: [],
    idempotency: {},
  };
}
