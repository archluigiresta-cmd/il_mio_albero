import { Person, Gender } from '../types';

/**
 * Robust GEDCOM parser.
 * Reads line by line and splits by spaces, handling loose formats.
 */
export const parseGedcom = (content: string): Person[] => {
  // 1. Clean content
  const cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM
  const lines = cleanContent.split(/\r?\n/);
  
  const records: any[] = [];
  let currentRecord: any = null;
  const stack: any[] = []; // Parent stack for hierarchy

  // 2. Build Hierarchy
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Standard GEDCOM: Level + Space + [Optional ID] + Space + Tag + Space + Value
    // Example 1: "0 @I1@ INDI" -> Level:0, ID:@I1@, Tag:INDI
    // Example 2: "1 NAME Luigi" -> Level:1, Tag:NAME, Value:Luigi
    
    // Split by first 2 spaces to isolate Level, Tag/ID, and Rest
    const parts = trimmed.split(' ');
    const levelStr = parts[0];
    const level = parseInt(levelStr, 10);
    
    if (isNaN(level)) return; // Skip invalid lines

    let tag = '';
    let xref_id = undefined;
    let value = '';

    if (parts.length > 2 && parts[1].startsWith('@') && parts[1].endsWith('@')) {
        // Case: 0 @I1@ INDI
        xref_id = parts[1];
        tag = parts[2];
        value = parts.slice(3).join(' ');
    } else if (parts.length > 1) {
        // Case: 1 NAME Luigi Resta
        tag = parts[1];
        value = parts.slice(2).join(' ');
    } else {
        // Just Level (rare/invalid)
        return;
    }

    const newNode = { tag, value, xref_id, children: [] };

    if (level === 0) {
      currentRecord = newNode;
      records.push(currentRecord);
      stack.length = 0;
      stack.push(currentRecord);
    } else {
      // Find parent (stack should have elements up to 'level')
      // If level is 1, parent is at index 0.
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

  // 3. Convert to Person Objects
  const personMap = new Map<string, Person>();
  const families: any[] = [];

  records.forEach((rec) => {
    // Check if it's an Individual
    if ((rec.tag === 'INDI') || (rec.value && rec.value.trim() === 'INDI')) {
        const id = rec.xref_id || `@UNK${Math.random().toString(36).substr(2, 9)}@`;
        
        // Helper to find child tag value
        const getVal = (parent: any, tagName: string) => {
            const node = parent.children.find((c: any) => c.tag === tagName);
            return node ? node.value : undefined;
        };
        const getChildNode = (parent: any, tagName: string) => parent.children.find((c: any) => c.tag === tagName);

        // Name
        const nameNode = getChildNode(rec, 'NAME');
        let rawName = nameNode ? nameNode.value : 'Sconosciuto';
        rawName = rawName.replace(/\//g, ''); // Remove slashes
        const nameParts = rawName.split(' ').filter((s: string) => s.trim().length > 0);
        const lastName = nameParts.length > 1 ? nameParts.pop() || '' : '';
        const firstName = nameParts.join(' ');

        // Sex
        const sexVal = getVal(rec, 'SEX');
        let gender = Gender.Unknown;
        if (sexVal === 'M' || sexVal === 'MALE') gender = Gender.Male;
        if (sexVal === 'F' || sexVal === 'FEMALE') gender = Gender.Female;

        // Dates
        const birtNode = getChildNode(rec, 'BIRT');
        const deatNode = getChildNode(rec, 'DEAT');

        const birthDate = birtNode ? getVal(birtNode, 'DATE') : undefined;
        const birthPlace = birtNode ? getVal(birtNode, 'PLAC') : undefined;
        const deathDate = deatNode ? getVal(deatNode, 'DATE') : undefined;
        const deathPlace = deatNode ? getVal(deatNode, 'PLAC') : undefined;

        // Living Logic: If explicit DEAT tag exists, they are dead. 
        // Or if birth is very old (e.g. > 110 years ago), but we'll stick to DEAT tag presence for now.
        const isLiving = !deatNode;

        const p: Person = {
            id,
            firstName,
            lastName,
            gender,
            birthDate,
            birthPlace,
            deathDate,
            deathPlace,
            isLiving,
            spouseIds: [],
            childrenIds: []
        };
        personMap.set(id, p);

    } else if ((rec.tag === 'FAM') || (rec.value && rec.value.trim() === 'FAM')) {
        families.push(rec);
    }
  });

  // 4. Link Families
  families.forEach(fam => {
      // Find IDs in Family
      const husbId = fam.children.find((c: any) => c.tag === 'HUSB')?.value;
      const wifeId = fam.children.find((c: any) => c.tag === 'WIFE')?.value;
      const childrenIds = fam.children.filter((c: any) => c.tag === 'CHIL').map((c: any) => c.value);

      const h = husbId ? personMap.get(husbId) : null;
      const w = wifeId ? personMap.get(wifeId) : null;

      // Link Spouses
      if (h && w) {
         if (!h.spouseIds.includes(w.id)) h.spouseIds.push(w.id);
         if (!w.spouseIds.includes(h.id)) w.spouseIds.push(h.id);
      }

      // Link Children
      childrenIds.forEach((childId: string) => {
          const c = personMap.get(childId);
          if (c) {
              if (h) {
                  c.fatherId = h.id;
                  if (!h.childrenIds.includes(c.id)) h.childrenIds.push(c.id);
              }
              if (w) {
                  c.motherId = w.id;
                  if (!w.childrenIds.includes(c.id)) w.childrenIds.push(c.id);
              }
          }
      });
  });

  return Array.from(personMap.values());
};