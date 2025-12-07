// CONFIGURAZIONE APP
// Nota per GitHub: In produzione, utilizzare variabili d'ambiente per proteggere le credenziali.

// Tenta di leggere da variabili d'ambiente (supporto Vite/Create-React-App)
// Se non definite, usa credenziali di default per sviluppo locale.
export const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'admin@example.com';
export const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

export const APP_NAME = 'Genealogia Resta';
export const PLACEHOLDER_IMAGE = 'https://picsum.photos/200';

// Messaggio di avviso per console
console.log(`Configurazione caricata. Admin Email: ${ADMIN_EMAIL}`);