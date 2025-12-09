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

// Helper per decidere se sovrascrivere un valore
const mergeField = (oldVal: any, newVal: any) => {
    // Se il valore nuovo esiste ed è diverso, lo preferiamo, A MENO CHE non sia un "Unknown" o vuoto
    if (!newVal) return oldVal;
    if (newVal === 'Sconosciuto' || newVal === '') return oldVal;
    return newVal;
};

export const mergePeople = (existing: Person[], incoming: Person[]): { merged: Person[], stats: { added: number, updated: number } } => {
    const mergedList = [...existing];
    let addedCount = 0;
    let updatedCount = 0;

    // Mappa ID originale import -> Nuovo ID univoco
    const idMapping = new Map<string, string>();

    // 1. Assegna nuovi ID a tutti gli incoming
    incoming.forEach(p => {
        const newId = generateUniqueId();
        idMapping.set(p.id, newId);
    });

    // 2. Crea le copie delle persone entranti con i nuovi ID (Clone iniziale)
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

    // 3. Matching Semantico
    processedIncoming.forEach(newPerson => {
        const matchIndex = mergedList.findIndex(existingPerson => {
            const sameFirst = normalizeString(existingPerson.firstName) === normalizeString(newPerson.firstName);
            const sameLast = normalizeString(existingPerson.lastName) === normalizeString(newPerson.lastName);
            
            // Per il merge "parziale", se una delle due date manca, consideriamo il match valido sui nomi.
            // Se entrambe le date sono presenti, devono coincidere.
            const dateMatch = (existingPerson.birthDate === newPerson.birthDate) || !existingPerson.birthDate || !newPerson.birthDate;
            
            return sameFirst && sameLast && dateMatch;
        });

        if (matchIndex >= 0) {
            // MATCH TROVATO: Aggiorna Incrementale (Merge Parziale)
            const existingPerson = mergedList[matchIndex];
            
            // Logica Merge Parziale: Mantieni i dati esistenti se i nuovi sono vuoti.
            // Aggiungi solo le informazioni mancanti.
            const updated: Person = {
                ...existingPerson,
                // Aggiorna solo se il campo esistente è vuoto o se il nuovo è più specifico (semplificazione)
                birthDate: existingPerson.birthDate || newPerson.birthDate,
                birthPlace: existingPerson.birthPlace || newPerson.birthPlace,
                deathDate: existingPerson.deathDate || newPerson.deathDate,
                deathPlace: existingPerson.deathPlace || newPerson.deathPlace,
                // Aggiungi note, non sovrascrivere
                notes: (existingPerson.notes || '') + (newPerson.notes && !existingPerson.notes?.includes(newPerson.notes) ? `\n[Import]: ${newPerson.notes}` : ''),
                
                // Merge Relazioni (Unione insiemi)
                spouseIds: Array.from(new Set([...existingPerson.spouseIds, ...newPerson.spouseIds])),
                childrenIds: Array.from(new Set([...existingPerson.childrenIds, ...newPerson.childrenIds]))
            };
            
            // Genitori: Se il record esistente non ha genitori ma il nuovo si, prendili.
            if (!updated.fatherId && newPerson.fatherId) updated.fatherId = newPerson.fatherId;
            if (!updated.motherId && newPerson.motherId) updated.motherId = newPerson.motherId;

            mergedList[matchIndex] = updated;
            
            // Fix relazioni inverse nel batch corrente:
            // Tutti quelli nel file importato che puntavano a `newPerson` (che ora è fusa in `existingPerson`)
            // devono puntare al `existingPerson.id` reale.
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