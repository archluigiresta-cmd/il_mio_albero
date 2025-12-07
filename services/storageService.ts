import { Person, Gender, User } from '../types';

const KEY_DATA = 'genealogy_data_v1';
const KEY_USERS = 'genealogy_users_v1';

// --- Data Management ---

const sanitizePerson = (p: any): Person => {
  return {
    id: p.id || `@I${Date.now()}@`,
    firstName: p.firstName || 'Sconosciuto',
    lastName: p.lastName || '',
    gender: p.gender || Gender.Unknown,
    isLiving: p.isLiving !== undefined ? p.isLiving : true,
    email: p.email || '',
    prefix: p.prefix || '',
    suffix: p.suffix || '',
    birthDate: p.birthDate || '',
    birthPlace: p.birthPlace || '',
    deathDate: p.deathDate || '',
    deathPlace: p.deathPlace || '',
    notes: p.notes || '',
    spouseIds: Array.isArray(p.spouseIds) ? p.spouseIds : [],
    childrenIds: Array.isArray(p.childrenIds) ? p.childrenIds : [],
    fatherId: p.fatherId,
    motherId: p.motherId
  };
};

export const getStoredPeople = (): Person[] => {
  try {
    const data = localStorage.getItem(KEY_DATA);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(sanitizePerson);

  } catch (e) {
    console.error("Errore lettura dati:", e);
    return [];
  }
};

export const savePeople = (people: Person[]) => {
  try {
    localStorage.setItem(KEY_DATA, JSON.stringify(people));
  } catch (e) {
    console.error("Errore salvataggio:", e);
    alert("Memoria locale piena. Impossibile salvare ulteriori modifiche.");
  }
};

export const hardReset = () => {
    localStorage.clear();
    window.location.reload();
}

// --- User Management ---

export const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(KEY_USERS);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (e) {
    console.error("Errore lettura utenti:", e);
    return [];
  }
};

const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error("Errore salvataggio utenti:", e);
  }
};

export const approveUser = (email: string) => {
    const users = getStoredUsers();
    const updated = users.map(u => u.email === email ? { ...u, isApproved: true } : u);
    saveUsers(updated);
};

export const deleteUser = (email: string) => {
    const users = getStoredUsers();
    const updated = users.filter(u => u.email !== email);
    saveUsers(updated);
};