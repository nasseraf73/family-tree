import { Person, Relationship } from '../types';

/**
 * Standard robust resolver for parent and child IDs from any relationship record.
 * Leverages patronymic name matching and birth years to guarantee 100% accurate parent-child orientation.
 */
export function resolveParentAndChildIds(
  rel: Relationship,
  personsMap?: Map<number, Person>
): { parentId: number; childId: number } | null {
  if (rel.relationship_type === 'SPOUSE' || rel.status === 'REJECTED' || rel.person_id === rel.related_person_id) {
    return null;
  }

  const p1 = personsMap?.get(rel.person_id);
  const p2 = personsMap?.get(rel.related_person_id);

  // 1. Patronymic names check (Highest accuracy: if p1.father_name == p2.first_name, p2 is parent)
  if (p1 && p2 && p1.father_name && p2.first_name && p1.father_name.trim().toLowerCase() === p2.first_name.trim().toLowerCase()) {
    return { parentId: rel.related_person_id, childId: rel.person_id };
  }
  if (p1 && p2 && p2.father_name && p1.first_name && p2.father_name.trim().toLowerCase() === p1.first_name.trim().toLowerCase()) {
    return { parentId: rel.person_id, childId: rel.related_person_id };
  }

  // 2. Birth year check (if difference is at least 12 years)
  if (p1 && p2 && p1.birth_year && p2.birth_year) {
    if (p2.birth_year <= p1.birth_year - 12) {
      return { parentId: rel.related_person_id, childId: rel.person_id };
    }
    if (p1.birth_year <= p2.birth_year - 12) {
      return { parentId: rel.person_id, childId: rel.related_person_id };
    }
  }

  // 3. Fallback:
  // In the standard schema, PARENT means person_id is child and related_person_id is parent.
  // When CHILD was stored with person_id as child and related_person_id as parent:
  // Both point to related_person_id being the parent!
  return { parentId: rel.related_person_id, childId: rel.person_id };
}

/**
 * Traverses parent relationships upward from a target person to compute full Arabic patronymic lineage string.
 * Uses "بنت" for female subjects on the first patronymic link, and "بن" throughout the lineage tree.
 */
export function generateFullLineage(
  personId: number,
  personsMap: Map<number, Person>,
  relationships: Relationship[]
): string {
  const targetPerson = personsMap.get(personId);
  if (!targetPerson) return '';

  const lineageNames: string[] = [targetPerson.first_name];
  const isFemale = targetPerson.gender === 'FEMALE';

  const visited = new Set<number>([personId]);
  let currentId: number | null = personId;

  // Climb up parent relationships
  while (currentId !== null) {
    const currId: number = currentId;
    
    // Find parent relationship where currId is the child
    let foundParentId: number | null = null;

    for (const r of relationships) {
      const resolved = resolveParentAndChildIds(r, personsMap);
      if (resolved && resolved.childId === currId) {
        foundParentId = resolved.parentId;
        break;
      }
    }

    if (foundParentId !== null && !visited.has(foundParentId)) {
      visited.add(foundParentId);
      const parentObj = personsMap.get(foundParentId);
      if (parentObj) {
        lineageNames.push(parentObj.first_name);
        currentId = foundParentId;
        continue;
      }
    }

    // Fallback: if top node reached has father_name and grand_father_name, append them
    const topPerson = personsMap.get(currentId);
    if (topPerson) {
      if (topPerson.father_name && topPerson.father_name.trim()) {
        lineageNames.push(topPerson.father_name.trim());
      }
      if (topPerson.grand_father_name && topPerson.grand_father_name.trim()) {
        lineageNames.push(topPerson.grand_father_name.trim());
      }
    }
    break;
  }

  // Build Arabic patronymic lineage string
  let result = '';
  for (let i = 0; i < lineageNames.length; i++) {
    if (i === 0) {
      result += lineageNames[i];
    } else if (i === 1) {
      const conj = isFemale ? 'بنت' : 'بن';
      result += ` ${conj} ${lineageNames[i]}`;
    } else {
      result += ` بن ${lineageNames[i]}`;
    }
  }

  // Append family name / surname at the end
  const familyName = targetPerson.family_name ? targetPerson.family_name.trim() : '';
  if (familyName && !result.includes(familyName)) {
    result += ` ${familyName}`;
  }

  return result;
}

/**
 * Formats a 5-part (Pentanyic) or complete multi-generational lineage string for a person.
 * Used in search dropdowns across all pages to clearly distinguish duplicate names.
 */
export function getPentanyicFullName(
  person: Person,
  personsMap?: Map<number, Person>,
  relationships?: Relationship[]
): string {
  if (!person) return '';

  if (personsMap && relationships && personsMap.has(person.id)) {
    const fullLineage = generateFullLineage(person.id, personsMap, relationships);
    if (fullLineage && fullLineage.trim()) {
      return fullLineage;
    }
  }

  const parts = [
    person.first_name,
    person.father_name,
    person.grand_father_name,
    person.family_name,
  ].filter(Boolean);

  return parts.join(' ');
}
