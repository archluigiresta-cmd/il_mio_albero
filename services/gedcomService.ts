import { Person, Gender } from '../types';

/**
 * Robust GEDCOM parser.
 * Uses regex to strictly identify level, optional ID, tag, and value.
 */
export const parseGedcom = (content: string): Person[] => {
  if (!content || typeof content !== 'string') return [];

  // 1. Clean content & Normalize line endings
  const cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM
  const lines = cleanContent.split(/\r?\n/);
  
  const records: any[] = [];
  let currentRecord: any = null;
  const stack: any[] = []; 

  // Regex to parse a line: 
  // Level (digits) + whitespace + optional ID (@...@) + whitespace + Tag (alphanum) + whitespace + optional Value
  // This handles multiple spaces between parts better than split(' ')
  const lineRegex = /^\s*(\d+)\s+(@[^@]+@)?\s*(\w+)?\s*(.*)$/;

  // 2. Build Hierarchy
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Special handling for strict format vs loose format
    // Try regex match
    const match = line.match(lineRegex);
    if (!match) return;

    const level = parseInt(match[1], 10);
    const optId = match[2]; // e.g. @I1@
    let tag = match[3];   // e.g. INDI or NAME
    let value = match[4]; // e.g. Luigi Resta

    // FIX: GEDCOM standard quirks
    // Case 1: "0 @I1@ INDI" -> optId=@I1@, tag=INDI, value=""
    // Case 2: "1 NAME Luigi" -> optId=undefined, tag=NAME, value="Luigi"
    // Case 3 (Rare): "0 HEAD" -> optId=undefined, tag=HEAD
    
    // If we have an ID but no tag in match[3], check if the ID was actually the tag? 
    // No, regex structure forces ID to be @...@.
    
    // However, sometimes "0 @I1@ INDI" might be parsed differently if spaces are weird.
    // Let's rely on the positions.
    
    let xref_id = optId;

    // If tag is missing but value exists, maybe the split was weird?
    if (!tag && value) {
        // Fallback split logic
    }

    const newNode = { tag: tag || '', value: value || '', xref_id, children: [] };

    if (level === 0) {
      currentRecord = newNode;
      records.push(currentRecord);
      stack.length = 0;
      stack.push(currentRecord);
    } else {
      // Find parent
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
    // Tag could be INDI or value could be INDI (standard varies by version)
    const isIndi = (rec.tag === 'INDI') || (rec.value && rec.value.trim() === 'INDI');
    const isFam = (rec.tag === 'FAM') || (rec.value && rec.value.trim() === 'FAM');

    if (isIndi) {
        const id = rec.xref_id || `@UNK${Math.random().toString(36).substr(2, 9)}@`;
        
        const getChild = (tag: string) => rec.children.find((c: any) => c.tag === tag);
        const getVal = (tag: string) => getChild(tag)?.value;

        // Name handling
        const nameNode = getChild('NAME');
        let rawName = nameNode ? nameNode.value : 'Sconosciuto';
        rawName = rawName.replace(/\//g, ''); // Remove slashes /Surname/
        const nameParts = rawName.trim().split(/\s+/);
        
        let lastName = '';
        let firstName = rawName;
        
        if (nameParts.length > 1) {
             lastName = nameParts[nameParts.length - 1];
             firstName = nameParts.slice(0, nameParts.length - 1).join(' ');
        }

        // Sex
        const sexVal = getVal('SEX')?.trim().toUpperCase();
        let gender = Gender.Unknown;
        if (sexVal === 'M' || sexVal === 'MALE') gender = Gender.Male;
        if (sexVal === 'F' || sexVal === 'FEMALE') gender = Gender.Female;

        // Dates
        const birtNode = getChild('BIRT');
        const deatNode = getChild('DEAT');
        
        const getSubVal = (node: any, tag: string) => node?.children.find((c: any) => c.tag === tag)?.value;

        const birthDate = getSubVal(birtNode, 'DATE');
        const birthPlace = getSubVal(birtNode, 'PLAC');
        const deathDate = getSubVal(deatNode, 'DATE');
        const deathPlace = getSubVal(deatNode, 'PLAC');

        // Logic: if DEAT tag is present (even without date), person is likely deceased
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

    } else if (isFam) {
        families.push(rec);
    }
  });

  // 4. Link Families
  families.forEach(fam => {
      const getChildVal = (tag: string) => fam.children.find((c: any) => c.tag === tag)?.value;
      const husbId = getChildVal('HUSB');
      const wifeId = getChildVal('WIFE');
      // Children can be multiple
      const childrenIds = fam.children.filter((c: any) => c.tag === 'CHIL').map((c: any) => c.value);

      const h = husbId ? personMap.get(husbId) : null;
      const w = wifeId ? personMap.get(wifeId) : null;

      if (h && w) {
         if (!h.spouseIds.includes(w.id)) h.spouseIds.push(w.id);
         if (!w.spouseIds.includes(h.id)) w.spouseIds.push(h.id);
      } else if (h && !w) {
          // Single parent family logic if needed
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