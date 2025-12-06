import { Person, Gender } from '../types';

/**
 * A simple GEDCOM parser.
 * It reads the line-based structure and converts INDI and FAM records into our Person graph.
 */
export const parseGedcom = (content: string): Person[] => {
  const lines = content.split(/\r?\n/);
  const records: any[] = [];
  let currentRecord: any = null;
  const stack: any[] = [];

  // 1. Build a hierarchy of records
  lines.forEach((line) => {
    const match = line.match(/^\s*(\d+)\s+(@\w+@|\w+)(\s+(.*))?$/);
    if (!match) return;

    const level = parseInt(match[1], 10);
    const tagOrId = match[2];
    const value = match[4] || '';

    let tag = tagOrId;
    let xref_id = undefined;

    // Check if it's a definition like "0 @I1@ INDI"
    if (tagOrId.startsWith('@')) {
      xref_id = tagOrId;
      tag = match[4] ? match[4].trim() : ''; // The tag is actually in the value position usually
    }

    const newNode = { tag, value, xref_id, children: [] };

    if (level === 0) {
      currentRecord = newNode;
      records.push(currentRecord);
      stack.length = 0;
      stack.push(currentRecord);
    } else {
      // Find parent at level - 1
      while (stack.length > level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(newNode);
        stack.push(newNode);
      }
    }
  });

  // 2. Convert Records to Persons
  const personMap = new Map<string, Person>();
  const families: any[] = [];

  // Pass 1: Create Persons
  records.forEach((rec) => {
    if (rec.value === 'INDI' || rec.tag === 'INDI') { // Handle variations
        const id = rec.xref_id;
        if (!id) return;

        const nameRec = rec.children.find((c: any) => c.tag === 'NAME');
        const sexRec = rec.children.find((c: any) => c.tag === 'SEX');
        const birtRec = rec.children.find((c: any) => c.tag === 'BIRT');
        const deatRec = rec.children.find((c: any) => c.tag === 'DEAT');
        
        // Extract Name
        let rawName = nameRec ? nameRec.value : 'Unknown /Unknown/';
        rawName = rawName.replace(/\//g, '');
        const nameParts = rawName.split(' ');
        const lastName = nameParts.length > 1 ? nameParts.pop() || '' : '';
        const firstName = nameParts.join(' ');

        // Extract Dates
        const getVal = (parent: any, tag: string) => parent?.children.find((c: any) => c.tag === tag)?.value;

        // Determine Living Status
        // If DEAT tag exists, they are not living.
        const isLiving = !deatRec;

        const p: Person = {
            id,
            firstName,
            lastName,
            gender: sexRec?.value === 'F' ? Gender.Female : sexRec?.value === 'M' ? Gender.Male : Gender.Unknown,
            birthDate: getVal(birtRec, 'DATE'),
            birthPlace: getVal(birtRec, 'PLAC'),
            deathDate: getVal(deatRec, 'DATE'),
            deathPlace: getVal(deatRec, 'PLAC'),
            isLiving,
            spouseIds: [],
            childrenIds: []
        };
        personMap.set(id, p);
    } else if (rec.value === 'FAM' || rec.tag === 'FAM') {
        families.push(rec);
    }
  });

  // Pass 2: Link Families
  families.forEach(fam => {
      const husb = fam.children.find((c: any) => c.tag === 'HUSB')?.value;
      const wife = fam.children.find((c: any) => c.tag === 'WIFE')?.value;
      const children = fam.children.filter((c: any) => c.tag === 'CHIL').map((c: any) => c.value);

      if (husb && wife) {
          const h = personMap.get(husb);
          const w = personMap.get(wife);
          if (h && w) {
              if(!h.spouseIds.includes(wife)) h.spouseIds.push(wife);
              if(!w.spouseIds.includes(husb)) w.spouseIds.push(husb);
          }
      }

      children.forEach((childId: string) => {
          const child = personMap.get(childId);
          if (child) {
              if (husb) child.fatherId = husb;
              if (wife) child.motherId = wife;
              
              if (husb) {
                  const father = personMap.get(husb);
                  if (father && !father.childrenIds.includes(childId)) father.childrenIds.push(childId);
              }
              if (wife) {
                  const mother = personMap.get(wife);
                  if (mother && !mother.childrenIds.includes(childId)) mother.childrenIds.push(childId);
              }
          }
      });
  });

  return Array.from(personMap.values());
};