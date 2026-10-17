import type { ReviewDatabase } from './model';

/** One-time setup of isolated accounts. Reload never repairs revoked access or user data. */
export function prepareJourneyFixtures(db: ReviewDatabase): ReviewDatabase {
  for (const [kind, name] of [['platform','平台管理员'],['support','支持人员'],['ops','运维人员'],['business','业务成员']] as const) {
    const id = 'journey-' + kind;
    if (db.accounts.some(a => a.id === id)) continue;
    db.accounts.push({id,name,email:kind+'@example.test',initials:name.slice(0,1),title:name,
      issuer:'https://identity.review.invalid',subject:id,verified:true,systemRoles:kind==='business'?[]:[kind]});
    if (kind === 'platform') continue;
    for (const space of Object.values(db.spaces)) {
      space.members.push({id,accountId:id,name,email:kind+'@example.test',role:kind==='business'?'operator':'reader',state:'active',version:1});
      if (kind === 'business') {
        space.customers.push({id:'C-7001',name:'本次服务客户',owner:id,note:'待核对服务安排',version:1});
        space.campaigns.push({id:'M-7001',name:'本人客户服务活动',owner:id,state:'draft',version:1});
      }
    }
  }
  if (!db.accounts.some(a => a.id === 'journey-invitee')) {
    db.accounts.push({id:'journey-invitee',name:'待邀成员',email:'new-a@example.test',initials:'邀',title:'成员',issuer:'https://identity.review.invalid',subject:'journey-invitee',verified:true,systemRoles:[]});
    const other = Object.values(db.spaces)[1];
    other?.members.push({id:'journey-invitee',accountId:'journey-invitee',name:'待邀成员',email:'new-a@example.test',role:'reader',state:'active',version:1});
  }
  return db;
}
