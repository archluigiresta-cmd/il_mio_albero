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
  
  // Fields
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

export interface GedcomRecord {
  tag: string;
  value: string;
  xref_id?: string;
  children: GedcomRecord[];
}

export interface User {
  email: string;
  password?: string; // Semplificazione per prototipo locale
  fullName: string;
  role: 'admin' | 'user';
  isApproved: boolean;
  registeredAt: string;
}