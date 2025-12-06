export enum Gender {
  Male = 'M',
  Female = 'F',
  Unknown = 'U'
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  
  // New Fields
  prefix?: string;
  suffix?: string;
  isLiving?: boolean;
  email?: string;

  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  photoUrl?: string;
  notes?: string;
  
  // Relations
  fatherId?: string;
  motherId?: string;
  spouseIds: string[];
  childrenIds: string[];
}

export interface User {
  email: string;
  passwordHash: string; // Storing plain for this demo, usually hashed
  fullName: string;
  role: 'admin' | 'user';
  isApproved: boolean;
  registeredAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface GedcomRecord {
  tag: string;
  value: string;
  xref_id?: string;
  children: GedcomRecord[];
}