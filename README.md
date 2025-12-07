# Genealogia Resta

Applicazione web per la gestione e visualizzazione avanzata di alberi genealogici. 
Il progetto permette di visualizzare la discendenza in formato schematico/ortogonale, importare file GEDCOM e gestire i membri della famiglia tramite un pannello di amministrazione.

## Funzionalità

- **Visualizzazione Albero**: Grafico interattivo basato su D3.js con linee ortogonali professionali.
- **Navigazione**: Possibilità di fare "focus" su specifici rami e tornare alla vista completa.
- **Importazione GEDCOM**: Algoritmo intelligente per unire (merge) nuovi dati o sostituire l'albero esistente.
- **Gestione Utenti**: Pannello admin per approvare o rifiutare le registrazioni.
- **Privacy**: I dati sensibili sono salvati nel LocalStorage del browser.

## Tecnologie

- React 18
- TypeScript
- D3.js (Visualizzazione Dati)
- Lucide React (Icone)
- Tailwind CSS (Styling)

## Installazione e Sviluppo

1. Clona il repository:
   ```bash
   git clone https://github.com/tuo-username/genealogia-resta.git
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Crea un file `.env` nella root del progetto per le credenziali Admin (opzionale, vedi `constants.ts`):
   ```env
   VITE_ADMIN_EMAIL=tua@email.com
   VITE_ADMIN_PASSWORD=tua_password_sicura
   ```

4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Struttura del Progetto

- `/components`: Componenti React (FamilyTree, PersonEditor, etc.)
- `/services`: Logica di business (Parsing GEDCOM, Storage locale)
- `/types`: Definizioni TypeScript

## Licenza

Privata / Uso famigliare.
