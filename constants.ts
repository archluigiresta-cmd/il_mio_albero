// CONFIGURAZIONE APP
// Nota per GitHub: In produzione, utilizzare variabili d'ambiente per proteggere le credenziali.

export const APP_VERSION = '1.5.0';

// Credenziali Admin Hardcoded (come richiesto)
export const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'arch.luigiresta@gmail.com';
export const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

export const APP_NAME = 'Genealogia Resta';
export const PLACEHOLDER_IMAGE = 'https://picsum.photos/200';

// Messaggio di avviso per console
console.log(`Configurazione caricata [v${APP_VERSION}]. Admin Email: ${ADMIN_EMAIL}`);