import { Person, Gender } from '../types';

/**
 * Ultra-Robust GEDCOM parser.
 * Does not rely on strict regex. Manually splits lines to handle various formats.
 */
export const parseGedcom = (content: string): Person[] => {
  if (!content || typeof content !== 'string') return [];

  // Remove BOM and split by newlines (handling mixed \r\n)
  const lines = content.replace(/^\uFEFF/, '').split(/[\r\n]+/);
  
  const records: any[] = [];
  let currentRecord: any = null;
  const stack: any[] = []; 

  // 1. Build Record Hierarchy
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Line structure: LEVEL + [optional SPACE] + [ID or TAG] + [optional SPACE] + [TAG or VALUE]
    const parts = line.split(/\s+/); // Split by any whitespace
    if (parts.length < 2) continue;

    const levelStr = parts[0];
    const level = parseInt(levelStr, 10);
    if (isNaN(level)) continue;

    let tag = '';
    let xref_id = undefined;
    let valueParts: string[] = [];

    // Check for ID format: @...@
    if (parts[1].startsWith('@') && parts[1].endsWith('@')) {
        xref_id = parts[1];
        tag = parts[2] || '';
        valueParts = parts.slice(3);
    } else {
        tag = parts[1];
        valueParts = parts.slice(2);
    }

    // Reconstruct value ensuring spaces are kept where appropriate
    // (Actual raw line parsing for value is better but split/join is safe enough for names/dates)
    let value = valueParts.join(' ');
    
    // Create Node
    const newNode = { tag: tag.toUpperCase(), value, xref_id, children: [] };

    if (level === 0) {
      currentRecord = newNode;
      records.push(currentRecord);
      stack.length = 0;
      stack.push(currentRecord);
    } else {
       // Find correct parent level
       // If current level is N, parent must be at N-1.
       // Stack[0] is level 0. Stack[level-1] is parent.
       if (stack[level - 1]) {
           stack[level - 1].children.push(newNode);
           // Update stack for next children
           stack[level] = newNode;
           // Trim stack if we went back up? 
           // Standard stack logic: slice to current level
           stack.length = level + 1; 
       }
    }
  }

  // 2. Map to Person Objects
  const personMap = new Map<string, Person>();
  const families: any[] = [];

  records.forEach((rec) => {
    // Identify Individuals
    const isIndi = rec.tag === 'INDI' || (rec.value && rec.value.trim() === 'INDI');
    const isFam = rec.tag === 'FAM' || (rec.value && rec.value.trim() === 'FAM');

    if (isIndi) {
        const id = rec.xref_id || `@UNK${Math.random().toString(36).substr(2, 5)}@`;
        
        // Helper to get child value safe
        const getVal = (node: any, tagName: string) => {
            const child = node.children.find((c: any) => c.tag === tagName);
            return child ? child.value : undefined;
        };
        const getChild = (node: any, tagName: string) => node.children.find((c: any) => c.tag === tagName);

        // Name
        const nameRaw = getVal(rec, 'NAME') || 'Sconosciuto';
        const nameClean = nameRaw.replace(/\//g, '').trim();
        const nameParts = nameClean.split(/\s+/);
        let firstName = nameClean;
        let lastName = '';
        if (nameParts.length > 1) {
            lastName = nameParts.pop() || '';
            firstName = nameParts.join(' ');
        }

        // Gender
        const sex = getVal(rec, 'SEX');
        let gender = Gender.Unknown;
        if (sex && (sex.startsWith('M') || sex === '1')) gender = Gender.Male;
        if (sex && (sex.startsWith('F') || sex === '2')) gender = Gender.Female;

        // Vital Events
        const birthNode = getChild(rec, 'BIRT');
        const deathNode = getChild(rec, 'DEAT');
        
        const birthDate = birthNode ? getVal(birthNode, 'DATE') : undefined;
        const birthPlace = birthNode ? getVal(birthNode, 'PLAC') : undefined;
        const deathDate = deathNode ? getVal(deathNode, 'DATE') : undefined;
        const deathPlace = deathNode ? getVal(deathNode, 'PLAC') : undefined;

        const isLiving = !deathNode && !deathDate;

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

    } else if (isFam) {
        families.push(rec);
    }
  });

  // 3. Link Relationships
  families.forEach(fam => {
      const getVal = (tagName: string) => {
          const c = fam.children.find((x: any) => x.tag === tagName);
          return c ? c.value : undefined;
      };

      const husbId = getVal('HUSB');
      const wifeId = getVal('WIFE');
      
      const childrenIds = fam.children
        .filter((c: any) => c.tag === 'CHIL')
        .map((c: any) => c.value);

      const h = husbId ? personMap.get(husbId) : null;
      const w = wifeId ? personMap.get(wifeId) : null;

      if (h && w) {
          if (!h.spouseIds.includes(w.id)) h.spouseIds.push(w.id);
          if (!w.spouseIds.includes(h.id)) w.spouseIds.push(h.id);
      }

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