import { Person, User, Gender } from '../types';

// QUESTO FILE SIMULA IL DATABASE CONDIVISO
// Quando l'admin vuole pubblicare le modifiche per tutti, 
// il contenuto di questo array deve essere aggiornato con l'export JSON.

export const INITIAL_USERS: User[] = [];

export const INITIAL_PEOPLE: Person[] = [
    // Esempio di dato iniziale (puoi sostituirlo con il tuo export)
    {
        id: "@I_ROOT@",
        firstName: "Capostipite",
        lastName: "Resta",
        gender: Gender.Male,
        isLiving: false,
        birthDate: "1800",
        spouseIds: [],
        childrenIds: []
    }
];