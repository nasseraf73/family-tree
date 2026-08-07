import { Person, Relationship, RelationshipType } from '@/types';

/**
 * Get all verified direct parent IDs for a person
 */
export function getParentIds(personId: number, relationships: Relationship[]): number[] {
  return relationships
    .filter(r => 
      ((r.person_id === personId && r.relationship_type === 'PARENT') ||
       (r.related_person_id === personId && r.relationship_type === 'CHILD')) &&
      r.status === 'VERIFIED'
    )
    .map(r => r.person_id === personId ? r.related_person_id : r.person_id);
}

/**
 * Get all verified direct child IDs for a person
 */
export function getChildIds(personId: number, relationships: Relationship[]): number[] {
  return relationships
    .filter(r => 
      ((r.person_id === personId && r.relationship_type === 'CHILD') ||
       (r.related_person_id === personId && r.relationship_type === 'PARENT')) &&
      r.status === 'VERIFIED'
    )
    .map(r => r.person_id === personId ? r.related_person_id : r.person_id);
}

/**
 * Get all verified spouse IDs for a person
 */
export function getSpouseIds(personId: number, relationships: Relationship[]): number[] {
  return relationships
    .filter(r => 
      r.relationship_type === 'SPOUSE' &&
      r.status === 'VERIFIED' &&
      (r.person_id === personId || r.related_person_id === personId)
    )
    .map(r => r.person_id === personId ? r.related_person_id : r.person_id);
}

/**
 * Recursive Ancestors Query (equivalent to PostgreSQL WITH RECURSIVE Ancestors CTE)
 */
export function getAncestors(personId: number, relationships: Relationship[]): Set<number> {
  const ancestors = new Set<number>();
  const queue = [personId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const parents = getParentIds(current, relationships);
    for (const parentId of parents) {
      if (!ancestors.has(parentId)) {
        ancestors.add(parentId);
        queue.push(parentId);
      }
    }
  }

  return ancestors;
}

/**
 * Recursive Descendants Query
 */
export function getDescendants(personId: number, relationships: Relationship[]): Set<number> {
  const descendants = new Set<number>();
  const queue = [personId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const children = getChildIds(current, relationships);
    for (const childId of children) {
      if (!descendants.has(childId)) {
        descendants.add(childId);
        queue.push(childId);
      }
    }
  }

  return descendants;
}

/**
 * Edge Case 1: Circular Relationship Prevention (User Stories 3.1)
 * Backend solution: Check if adding this proposed relationship creates a cycle.
 */
export function detectCircularLoop(
  personId: number,
  relatedPersonId: number,
  relationshipType: RelationshipType,
  relationships: Relationship[]
): { isCircular: boolean; message?: string } {
  if (personId === relatedPersonId) {
    return { isCircular: true, message: 'لا يمكن إضافة الشخص كنفسه كقريب (Circular Loop)' };
  }

  if (relationshipType === 'PARENT') {
    const descendantsOfPerson = getDescendants(personId, relationships);
    if (descendantsOfPerson.has(relatedPersonId)) {
      return {
        isCircular: true,
        message: 'خطأ 422 (Unprocessable Entity): تم اكتشاف حلقة نسب دائرية! الشخص المطلوب إضافته كـ "أب/أم" هو بالفعل أحد الأبناء/الأحفاد.',
      };
    }
  }

  if (relationshipType === 'CHILD') {
    const ancestorsOfPerson = getAncestors(personId, relationships);
    if (ancestorsOfPerson.has(relatedPersonId)) {
      return {
        isCircular: true,
        message: 'خطأ 422 (Unprocessable Entity): تم اكتشاف حلقة نسب دائرية! الشخص المطلوب إضافته كـ "ابن/ابنة" هو بالفعل أحد الآباء/الأجداد.',
      };
    }
  }

  return { isCircular: false };
}

export function checkKinshipCycle(
  personId: number,
  relatedPersonId: number,
  relationshipType: RelationshipType,
  _persons: Person[],
  relationships: Relationship[]
): boolean {
  return detectCircularLoop(personId, relatedPersonId, relationshipType, relationships).isCircular;
}

/**
 * Derived Kinship Engine (BRD FR-6.2)
 * Infers Siblings, Uncles/Aunts, and Cousins via graph traversal.
 */
export function deriveKinship(
  personId: number,
  personsMap: Map<number, Person>,
  relationships: Relationship[]
) {
  const parents = getParentIds(personId, relationships);

  const siblingIds = new Set<number>();
  for (const parentId of parents) {
    const childrenOfParent = getChildIds(parentId, relationships);
    for (const childId of childrenOfParent) {
      if (childId !== personId) {
        siblingIds.add(childId);
      }
    }
  }

  const uncleAuntIds = new Set<number>();
  for (const parentId of parents) {
    const grandparents = getParentIds(parentId, relationships);
    for (const gpId of grandparents) {
      const childrenOfGp = getChildIds(gpId, relationships);
      for (const childId of childrenOfGp) {
        if (childId !== parentId) {
          uncleAuntIds.add(childId);
        }
      }
    }
  }

  const cousinIds = new Set<number>();
  for (const uaId of uncleAuntIds) {
    const childrenOfUa = getChildIds(uaId, relationships);
    for (const childId of childrenOfUa) {
      cousinIds.add(childId);
    }
  }

  return {
    siblings: Array.from(siblingIds).map(id => personsMap.get(id)).filter(Boolean) as Person[],
    unclesAunts: Array.from(uncleAuntIds).map(id => personsMap.get(id)).filter(Boolean) as Person[],
    cousins: Array.from(cousinIds).map(id => personsMap.get(id)).filter(Boolean) as Person[],
  };
}
