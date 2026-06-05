export type Role = 'admin' | 'sales';
export type ContactStatus = 'Active' | 'Dormant';

export interface Contact {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: number;
  status: ContactStatus;
  initials: string;
  lastContacted: string;
}
