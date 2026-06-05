import type { Contact } from '../types';

const companies = ['Nimbus', 'Elevate', 'Arcana', 'Pulse', 'Horizon', 'BlueHive', 'NovaGrid', 'Aurora', 'Valence'];
const firstNames = ['Maya', 'Noah', 'Ava', 'Leo', 'Zoey', 'Eli', 'Mia', 'Jude', 'Lina', 'Ezra'];
const lastNames = ['Fox', 'Shaw', 'Brooks', 'Chen', 'Reed', 'Hart', 'Lane', 'Dean', 'Miles', 'Park'];
const stages = ['New lead', 'Qualified', 'Demo scheduled', 'Proposal', 'Negotiation'];

export function createMockContacts(total: number): Contact[] {
  return Array.from({ length: total }, (_, index) => {
    const name = `${firstNames[index % firstNames.length]} ${lastNames[(index + 3) % lastNames.length]}`;
    const company = companies[index % companies.length];
    const stage = stages[index % stages.length];
    const value = 6000 + (index % 15) * 1800;
    const status = index % 5 === 0 ? 'Dormant' : 'Active';
    const lastContacted = new Date(Date.now() - ((index % 72) * 4 + (index % 60)) * 60000).toISOString();
    return {
      id: `c-${index + 1}`,
      name,
      company,
      stage,
      value,
      status,
      lastContacted,
      initials: name
        .split(' ')
        .map((part) => part[0])
        .join('')
    };
  });
}
