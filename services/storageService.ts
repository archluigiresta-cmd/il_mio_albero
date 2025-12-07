import { Person, Gender, User } from '../types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants';

const KEY_DATA = 'genealogy_data_v1';
const KEY_USERS = 'genealogy_users_v1';
const KEY_SESSION = 'genealogy_session_v1';

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

// --- Authentication ---

export const loginUser = (email: string, password: string): { success: boolean, message?: string, user?: User } => {
    // 1. Check Admin Hardcoded
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser: User = { 
            email, 
            fullName: 'Luigi Resta (Admin)', 
            role: 'admin', 
            isApproved: true, 
            registeredAt: new Date().toISOString() 
        };
        localStorage.setItem(KEY_SESSION, JSON.stringify(adminUser));
        return { success: true, user: adminUser };
    }

    // 2. Check Registered Users
    const users = getStoredUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return { success: false, message: "Utente non trovato." };
    }

    if (user.password !== password) {
         return { success: false, message: "Password errata." };
    }
    
    if (!user.isApproved) {
        return { success: false, message: "Account in attesa di approvazione dall'amministratore." };
    }

    // Success
    // (In una app reale non salveremmo la password in sessione, qui puliamo l'oggetto)
    const sessionUser = { ...user };
    delete sessionUser.password; 
    
    localStorage.setItem(KEY_SESSION, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
};

export const registerUser = (email: string, password: string, fullName: string) => {
    const users = getStoredUsers();
    
    if (users.find(u => u.email === email) || email === ADMIN_EMAIL) {
        return { success: false, message: "Email già registrata." };
    }

    const newUser: User = {
        email,
        fullName,
        password,
        role: 'user',
        isApproved: false,
        registeredAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    return { success: true, message: "Registrazione inviata correttamente. Attendi l'attivazione da parte dell'amministratore." };
};

export const logout = () => {
    localStorage.removeItem(KEY_SESSION);
};

export const getSession = (): User | null => {
    try {
        const s = localStorage.getItem(KEY_SESSION);
        return s ? JSON.parse(s) : null;
    } catch {
        return null;
    }
};