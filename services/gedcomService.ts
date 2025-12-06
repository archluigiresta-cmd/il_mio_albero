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

    // Standard GEDCOM pattern: Level + (Optional ID) + Tag + (Optional Value)
    // Esempi: 
    // 0 @I1@ INDI
    // 1 NAME Mario /Rossi/
    
    const parts = trimmed.split(' ');
    const level = parts[0];
    
    // Se è un record di livello 0 (Nuova entità)
    if (level === '0') {
       const idPart = parts[1];
       const tagPart = parts[2];

       // Caso standard: 0 @I1@ INDI
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
    // Se siamo dentro un'entità valida
    else if (currentId && currentType) {
       const tag = parts[1];
       const value = parts.slice(2).join(' ').replace(/\//g, ''); // Rimuovi slash dai cognomi
       
       if (currentType === 'INDI') {
           const person = people.get(currentId);
           if (tag === 'NAME' && !person.name) person.name = value;
           if (tag === 'SEX') person.gender = value;
           if (tag === 'BIRT') person.readingBirth = true; // Flag per leggere data successiva
           if (tag === 'DEAT') person.readingDeath = true;
           if (tag === 'DATE') {
               if (person.readingBirth) { person.birthDate = value; person.readingBirth = false; }
               if (person.readingDeath) { person.deathDate = value; person.readingDeath = false; }
           }
           if (tag === 'PLAC') {
                if (person.readingBirth) { person.birthPlace = value; } // A volte PLAC segue BIRT sulla stessa riga logica o successiva
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
         isLiving: !raw.deathDate, // Semplificazione: se non c'è data morte, è vivo
         spouseIds: [],
         childrenIds: [],
         fatherId: undefined,
         motherId: undefined
     });
  });

  // 3. Terza passata: Collega le relazioni usando le famiglie
  const personMap = new Map(result.map(p => [p.id, p]));

  families.forEach(fam => {
      const husband = personMap.get(fam.husb);
      const wife = personMap.get(fam.wife);

      // Collega coniugi
      if (husband && wife) {
          if (!husband.spouseIds.includes(wife.id)) husband.spouseIds.push(wife.id);
          if (!wife.spouseIds.includes(husband.id)) wife.spouseIds.push(husband.id);
      }

      // Collega figli
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