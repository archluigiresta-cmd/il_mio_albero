import { Person, Gender } from '../types';

export const parseGedcom = (content: string): Person[] => {
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  const people: Map<string, any> = new Map();
  const families: Map<string, any> = new Map();
  
  let currentId = null;
  let currentType: 'INDI' | 'FAM' | null = null;

  // 1. Prima passata: Raccogli dati grezzi
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const level = parts[0];
    
    if (level === '0') {
       const idPart = parts[1];
       const tagPart = parts[2];

       if (idPart.startsWith('@') && (tagPart === 'INDI' || tagPart === 'FAM')) {
           currentId = idPart;
           currentType = tagPart;
           if (currentType === 'INDI') people.set(currentId, { id: currentId, spouseIds: [], childrenIds: [] });
           if (currentType === 'FAM') families.set(currentId, { id: currentId, children: [] });
       } else {
           currentId = null;
           currentType = null;
       }
    } 
    else if (currentId && currentType) {
       const tag = parts[1];
       const value = parts.slice(2).join(' ').replace(/\//g, ''); 
       
       if (currentType === 'INDI') {
           const person = people.get(currentId);
           if (tag === 'NAME' && !person.name) person.name = value;
           if (tag === 'SEX') person.gender = value;
           if (tag === 'BIRT') person.readingBirth = true;
           if (tag === 'DEAT') person.readingDeath = true;
           if (tag === 'DATE') {
               if (person.readingBirth) { person.birthDate = value; person.readingBirth = false; }
               if (person.readingDeath) { person.deathDate = value; person.readingDeath = false; }
           }
           if (tag === 'PLAC') {
                if (person.readingBirth) { person.birthPlace = value; }
           }
       }
       
       if (currentType === 'FAM') {
           const fam = families.get(currentId);
           if (tag === 'HUSB') fam.husb = value;
           if (tag === 'WIFE') fam.wife = value;
           if (tag === 'CHIL') fam.children.push(value);
       }
    }
  });

  // 2. Seconda passata: Converti in oggetti Person puliti
  const result: Person[] = [];

  people.forEach(raw => {
     let firstName = 'Sconosciuto';
     let lastName = '';
     
     if (raw.name) {
         const nameParts = raw.name.split(/\s+/);
         if (nameParts.length > 1) {
             lastName = nameParts.pop() || '';
             firstName = nameParts.join(' ');
         } else {
             firstName = raw.name;
         }
     }

     let gender = Gender.Unknown;
     if (raw.gender === 'M') gender = Gender.Male;
     if (raw.gender === 'F') gender = Gender.Female;

     result.push({
         id: raw.id,
         firstName,
         lastName,
         gender,
         birthDate: raw.birthDate,
         deathDate: raw.deathDate,
         isLiving: !raw.deathDate, 
         spouseIds: [],
         childrenIds: [],
         fatherId: undefined,
         motherId: undefined
     });
  });

  // 3. Terza passata: Collega le relazioni
  const personMap = new Map(result.map(p => [p.id, p]));

  families.forEach(fam => {
      const husband = personMap.get(fam.husb);
      const wife = personMap.get(fam.wife);

      if (husband && wife) {
          if (!husband.spouseIds.includes(wife.id)) husband.spouseIds.push(wife.id);
          if (!wife.spouseIds.includes(husband.id)) wife.spouseIds.push(husband.id);
      }

      fam.children.forEach((childId: string) => {
          const child = personMap.get(childId);
          if (child) {
              if (husband) {
                  child.fatherId = husband.id;
                  if (!husband.childrenIds.includes(child.id)) husband.childrenIds.push(child.id);
              }
              if (wife) {
                  child.motherId = wife.id;
                  if (!wife.childrenIds.includes(child.id)) wife.childrenIds.push(child.id);
              }
          }
      });
  });

  return result;
};

// --- LOGICA DI MERGE INTELLIGENTE ---

const generateUniqueId = (prefix: string = 'IMP') => {
    return `@${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@`;
};

const normalizeString = (s?: string) => s ? s.trim().toLowerCase() : '';

export const mergePeople = (existing: Person[], incoming: Person[]): { merged: Person[], stats: { added: number, updated: number } } => {
    const mergedList = [...existing];
    let addedCount = 0;
    let updatedCount = 0;

    // Mappa ID originale import -> Nuovo ID univoco
    // Questo serve perché due file GEDCOM diversi usano gli stessi ID (@I1@, @I2@...)
    const idMapping = new Map<string, string>();

    // 1. Assegna nuovi ID a tutti gli incoming per evitare collisioni tecniche
    incoming.forEach(p => {
        const newId = generateUniqueId();
        idMapping.set(p.id, newId);
    });

    // 2. Crea le copie delle persone entranti con i nuovi ID
    const processedIncoming: Person[] = incoming.map(p => {
        return {
            ...p,
            id: idMapping.get(p.id)!,
            fatherId: p.fatherId ? idMapping.get(p.fatherId) : undefined,
            motherId: p.motherId ? idMapping.get(p.motherId) : undefined,
            spouseIds: p.spouseIds.map(sid => idMapping.get(sid)).filter((x): x is string => !!x),
            childrenIds: p.childrenIds.map(cid => idMapping.get(cid)).filter((x): x is string => !!x),
        };
    });

    // 3. Tenta di trovare corrispondenze semantiche (Stesso nome + Data Nascita simile)
    processedIncoming.forEach(newPerson => {
        const matchIndex = mergedList.findIndex(existingPerson => {
            const sameFirst = normalizeString(existingPerson.firstName) === normalizeString(newPerson.firstName);
            const sameLast = normalizeString(existingPerson.lastName) === normalizeString(newPerson.lastName);
            // Se le date sono presenti, usale per disambiguare
            const sameBirth = existingPerson.birthDate === newPerson.birthDate;
            
            // Logica di match: Nome e Cognome uguali E (Data uguale OPPURE una delle due date è vuota)
            return sameFirst && sameLast && (sameBirth || !existingPerson.birthDate || !newPerson.birthDate);
        });

        if (matchIndex >= 0) {
            // MATCH TROVATO: Aggiorna (Merge)
            const existingPerson = mergedList[matchIndex];
            
            // Aggiorna campi se quelli nuovi sono presenti e quelli vecchi mancano
            const updated: Person = {
                ...existingPerson,
                birthDate: existingPerson.birthDate || newPerson.birthDate,
                birthPlace: existingPerson.birthPlace || newPerson.birthPlace,
                deathDate: existingPerson.deathDate || newPerson.deathDate,
                deathPlace: existingPerson.deathPlace || newPerson.deathPlace,
                notes: (existingPerson.notes || '') + (newPerson.notes ? `\n[Import]: ${newPerson.notes}` : ''),
                // Unisci relazioni senza duplicati
                spouseIds: Array.from(new Set([...existingPerson.spouseIds, ...newPerson.spouseIds])),
                childrenIds: Array.from(new Set([...existingPerson.childrenIds, ...newPerson.childrenIds]))
            };
            
            // Se il nuovo ha genitori definiti e il vecchio no, prendili
            if (!updated.fatherId && newPerson.fatherId) updated.fatherId = newPerson.fatherId;
            if (!updated.motherId && newPerson.motherId) updated.motherId = newPerson.motherId;

            mergedList[matchIndex] = updated;
            
            // Dobbiamo aggiornare la mappa ID per dire che l'ID del nuovo file in realtà punta a questa persona esistente?
            // È complesso perché abbiamo già rimappato le relazioni interne del file importato.
            // Per semplicità in questo prototipo, manteniamo l'unione dei dati nel record esistente,
            // ma le relazioni create nel punto 2 puntano al "nuovo ID clone". 
            // IDEALMENTE: Bisognerebbe correggere tutti i riferimenti nel `processedIncoming` che puntavano a `newPerson.id` 
            // per farli puntare a `existingPerson.id`.
            
            // Fix relazioni inverse:
            // Chiunque nel batch in arrivo puntava a `newPerson.id` (che ora è un duplicato) deve puntare a `existingPerson.id`.
            processedIncoming.forEach(other => {
                if (other.fatherId === newPerson.id) other.fatherId = existingPerson.id;
                if (other.motherId === newPerson.id) other.motherId = existingPerson.id;
                other.spouseIds = other.spouseIds.map(s => s === newPerson.id ? existingPerson.id : s);
                other.childrenIds = other.childrenIds.map(c => c === newPerson.id ? existingPerson.id : c);
            });

            updatedCount++;
        } else {
            // NESSUN MATCH: Aggiungi come nuovo
            mergedList.push(newPerson);
            addedCount++;
        }
    });

    return { merged: mergedList, stats: { added: addedCount, updated: updatedCount } };
};