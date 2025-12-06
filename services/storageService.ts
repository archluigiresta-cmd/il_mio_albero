import { Person, User } from '../types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants';

const KEY_DATA = 'genealogy_data_v1';
const KEY_USERS = 'genealogy_users_v1';
const KEY_SESSION = 'genealogy_session_v1';

// --- Data Management (The Tree) ---

export const getStoredPeople = (): Person[] => {
  const data = localStorage.getItem(KEY_DATA);
  return data ? JSON.parse(data) : [];
};

export const savePeople = (people: Person[]) => {
  localStorage.setItem(KEY_DATA, JSON.stringify(people));
};

export const clearData = () => {
    localStorage.removeItem(KEY_DATA);
}

// --- User Management (Auth) ---

export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(KEY_USERS);
  let users: User[] = data ? JSON.parse(data) : [];
  
  // Ensure Admin exists conceptually (though we verify explicitly)
  // We don't necessarily need to store the admin in the user list if we hardcode the check,
  // but it helps for the UI to be consistent.
  return users;
};

export const registerUser = (email: string, password: string, fullName: string): { success: boolean, message: string } => {
  if (email === ADMIN_EMAIL) {
    return { success: false, message: "Non puoi registrare l'email dell'amministratore." };
  }

  const users = getStoredUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, message: "Email già registrata." };
  }

  const newUser: User = {
    email,
    passwordHash: password, // In production, hash this!
    fullName,
    role: 'user',
    isApproved: false,
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  return { success: true, message: "Registrazione avvenuta. Attendi l'approvazione dell'amministratore." };
};

export const loginUser = (email: string, password: string): { success: boolean, user?: User, message?: string } => {
  // 1. Check Admin
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const adminUser: User = {
      email: ADMIN_EMAIL,
      fullName: 'Luigi Resta (Admin)',
      role: 'admin',
      isApproved: true,
      passwordHash: '',
      registeredAt: new Date().toISOString()
    };
    localStorage.setItem(KEY_SESSION, JSON.stringify(adminUser));
    return { success: true, user: adminUser };
  }

  // 2. Check Standard Users
  const users = getStoredUsers();
  const found = users.find(u => u.email === email && u.passwordHash === password);

  if (!found) {
    return { success: false, message: "Credenziali non valide." };
  }

  if (!found.isApproved) {
    return { success: false, message: "Account in attesa di approvazione da parte dell'amministratore." };
  }

  localStorage.setItem(KEY_SESSION, JSON.stringify(found));
  return { success: true, user: found };
};

export const logout = () => {
  localStorage.removeItem(KEY_SESSION);
};

export const getSession = (): User | null => {
  const data = localStorage.getItem(KEY_SESSION);
  return data ? JSON.parse(data) : null;
};

export const approveUser = (email: string) => {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.email === email);
    if(index >= 0) {
        users[index].isApproved = true;
        localStorage.setItem(KEY_USERS, JSON.stringify(users));
    }
};

export const deleteUser = (email: string) => {
    let users = getStoredUsers();
    users = users.filter(u => u.email !== email);
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
}