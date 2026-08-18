import { Person, Relationship } from '../types';

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
    // Find parent relationship where currentId is the child
    const parentRel = relationships.find(
      r =>
        (r.relationship_type === 'PARENT' && r.person_id === currId) ||
        (r.relationship_type === 'CHILD' && r.related_person_id === currId)
    );

    if (parentRel) {
      const parentId =
        parentRel.relationship_type === 'PARENT'
          ? parentRel.related_person_id
          : parentRel.person_id;

      if (!visited.has(parentId)) {
        visited.add(parentId);
        const parentObj = personsMap.get(parentId);
        if (parentObj) {
          lineageNames.push(parentObj.first_name);
          currentId = parentId;
          continue;
        }
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
