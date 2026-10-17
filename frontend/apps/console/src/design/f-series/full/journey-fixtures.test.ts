import { describe, expect, it } from 'vitest';
import { seedDatabase } from './model';
import { prepareJourneyFixtures } from './journey-fixtures';

function sample() {
  return seedDatabase({id:'owner',name:'Owner',email:'owner@example.test',initials:'O',title:'Owner'}, [{id:'org',name:'Test'}]);
}
describe('isolated role journey preparation', () => {
  it('gives each system account only its own stored system role', () => {
    const db = prepareJourneyFixtures(sample());
    expect(db.accounts.find(a => a.email === 'platform@example.test')?.systemRoles).toEqual(['platform']);
    expect(db.accounts.find(a => a.email === 'support@example.test')?.systemRoles).toEqual(['support']);
    expect(db.accounts.find(a => a.email === 'business@example.test')?.systemRoles).toEqual([]);
  });
  it('preserves changed grants, revocation and business data on reload', () => {
    const db = prepareJourneyFixtures(sample());
    const member = db.spaces.org!.members.find(m => m.accountId === 'journey-business')!;
    member.state = 'suspended';
    db.spaces.org!.customers.find(c => c.id === 'C-7001')!.note = 'User change';
    prepareJourneyFixtures(db);
    expect(member.state).toBe('suspended');
    expect(db.spaces.org!.customers.find(c => c.id === 'C-7001')!.note).toBe('User change');
    expect(db.accounts.filter(a => a.id === 'journey-business')).toHaveLength(1);
  });
});
