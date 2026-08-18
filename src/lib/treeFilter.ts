import { Person, Relationship } from '../types';

export type FocusMode = 'branch' | 'spine' | 'household' | 'full';

export interface FilteredTreeResult {
  nodes: Person[];
  relationships: Relationship[];
  includedNodeIds: Set<number>;
}

/**
 * Filters the tree nodes and relationships based on the selected focus mode and target person ID.
 */
export function filterTreeByFocus(
  allPersons: Person[],
  allRelationships: Relationship[],
  targetPersonId: number | null,
  mode: FocusMode
): FilteredTreeResult {
  // If mode is 'full' or no target person is selected, return the entire tree
  if (mode === 'full' || !targetPersonId) {
    const allIds = new Set(allPersons.map(p => p.id));
    return {
      nodes: allPersons,
      relationships: allRelationships,
      includedNodeIds: allIds,
    };
  }

  const personsMap = new Map<number, Person>();
  allPersons.forEach(p => personsMap.set(p.id, p));

  if (!personsMap.has(targetPersonId)) {
    const allIds = new Set(allPersons.map(p => p.id));
    return {
      nodes: allPersons,
      relationships: allRelationships,
      includedNodeIds: allIds,
    };
  }

  // Build Graph Adjacency Maps
  const parentsMap = new Map<number, Set<number>>();
  const childrenMap = new Map<number, Set<number>>();
  const spousesMap = new Map<number, Set<number>>();

  const addParentChild = (parentId: number, childId: number) => {
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, new Set());
    childrenMap.get(parentId)!.add(childId);

    if (!parentsMap.has(childId)) parentsMap.set(childId, new Set());
    parentsMap.get(childId)!.add(parentId);
  };

  const addSpouse = (id1: number, id2: number) => {
    if (!spousesMap.has(id1)) spousesMap.set(id1, new Set());
    spousesMap.get(id1)!.add(id2);

    if (!spousesMap.has(id2)) spousesMap.set(id2, new Set());
    spousesMap.get(id2)!.add(id1);
  };

  // 1. Process relationships table
  allRelationships.forEach(rel => {
    if (rel.status === 'REJECTED') return;

    if (rel.relationship_type === 'PARENT') {
      // related_person_id is parent, person_id is child
      addParentChild(rel.related_person_id, rel.person_id);
    } else if (rel.relationship_type === 'CHILD') {
      // person_id is parent, related_person_id is child
      addParentChild(rel.person_id, rel.related_person_id);
    } else if (rel.relationship_type === 'SPOUSE') {
      addSpouse(rel.person_id, rel.related_person_id);
    }
  });

  // 2. Process embedded spouses if available on Person object data
  allPersons.forEach(p => {
    const pAny = p as any;
    if (Array.isArray(pAny.spouses)) {
      pAny.spouses.forEach((s: any) => {
        if (s.spouse_id && personsMap.has(s.spouse_id)) {
          addSpouse(p.id, s.spouse_id);
        }
      });
    }
  });

  const getSiblings = (id: number): Set<number> => {
    const siblings = new Set<number>();
    const parents = parentsMap.get(id);
    if (parents) {
      parents.forEach(pId => {
        const children = childrenMap.get(pId);
        if (children) {
          children.forEach(cId => {
            if (cId !== id) siblings.add(cId);
          });
        }
      });
    }
    return siblings;
  };

  const includedNodeIds = new Set<number>();

  if (mode === 'branch') {
    // Mode 1: "فرعي المباشر الكامل" (Full Branch Focus)
    // - Direct linear ancestors of target
    // - Target and target's siblings + ancestors' siblings
    // - All descendants of target and siblings
    // - Spouses of included nodes

    // A. Linear ancestors
    const ancestors = new Set<number>();
    const queueAncestors = [targetPersonId];
    while (queueAncestors.length > 0) {
      const curr = queueAncestors.shift()!;
      ancestors.add(curr);
      const parents = parentsMap.get(curr);
      if (parents) {
        parents.forEach(pId => {
          if (!ancestors.has(pId)) {
            ancestors.add(pId);
            queueAncestors.push(pId);
          }
        });
      }
    }

    // B. Target & siblings + ancestors' siblings
    const keyRoots = new Set<number>();
    ancestors.forEach(ancId => {
      keyRoots.add(ancId);
      const sibs = getSiblings(ancId);
      sibs.forEach(sId => keyRoots.add(sId));
    });

    // C. Descendants of all key roots
    const descendants = new Set<number>();
    const queueDesc = Array.from(keyRoots);
    while (queueDesc.length > 0) {
      const curr = queueDesc.shift()!;
      descendants.add(curr);
      const children = childrenMap.get(curr);
      if (children) {
        children.forEach(cId => {
          if (!descendants.has(cId)) {
            descendants.add(cId);
            queueDesc.push(cId);
          }
        });
      }
    }

    descendants.forEach(id => includedNodeIds.add(id));

    // D. Spouses of all included nodes
    const spousesToAdd = new Set<number>();
    includedNodeIds.forEach(id => {
      const spouses = spousesMap.get(id);
      if (spouses) {
        spouses.forEach(sId => spousesToAdd.add(sId));
      }
    });
    spousesToAdd.forEach(id => includedNodeIds.add(id));
  } else if (mode === 'spine') {
    // Mode 2: "سلسلة العمود الفقري / العمود النسبي" (Direct Lineage Only)
    // Pure vertical chain: Direct parents up to root -> Target -> Direct children/grandchildren down.
    // Exclude siblings & spouses.

    // A. Direct Parents chain upward (picking primary father/parent link)
    const ancestorsUp = new Set<number>([targetPersonId]);
    let currId: number | null = targetPersonId;
    while (currId !== null) {
      const parents = parentsMap.get(currId);
      if (parents && parents.size > 0) {
        let chosenParent: number | null = null;
        for (const pId of parents) {
          const parentObj = personsMap.get(pId);
          if (parentObj && parentObj.gender === 'MALE') {
            chosenParent = pId;
            break;
          }
        }
        if (chosenParent === null) {
          chosenParent = Array.from(parents)[0];
        }

        if (chosenParent && !ancestorsUp.has(chosenParent)) {
          ancestorsUp.add(chosenParent);
          currId = chosenParent;
        } else {
          currId = null;
        }
      } else {
        currId = null;
      }
    }

    // B. Direct Children chain downward
    const descendantsDown = new Set<number>([targetPersonId]);
    const queueChildren = [targetPersonId];
    while (queueChildren.length > 0) {
      const curr = queueChildren.shift()!;
      descendantsDown.add(curr);
      const children = childrenMap.get(curr);
      if (children) {
        children.forEach(cId => {
          if (!descendantsDown.has(cId)) {
            descendantsDown.add(cId);
            queueChildren.push(cId);
          }
        });
      }
    }

    ancestorsUp.forEach(id => includedNodeIds.add(id));
    descendantsDown.forEach(id => includedNodeIds.add(id));
  } else if (mode === 'household') {
    // Mode 3: "عائلتي المباشرة / النواة" (Immediate Household)
    // Target + Parents + Children + Siblings + Spouses (1-hop degree)
    includedNodeIds.add(targetPersonId);

    const parents = parentsMap.get(targetPersonId);
    if (parents) parents.forEach(id => includedNodeIds.add(id));

    const children = childrenMap.get(targetPersonId);
    if (children) children.forEach(id => includedNodeIds.add(id));

    const siblings = getSiblings(targetPersonId);
    siblings.forEach(id => includedNodeIds.add(id));

    const spouses = spousesMap.get(targetPersonId);
    if (spouses) spouses.forEach(id => includedNodeIds.add(id));
  }

  // Filter nodes array
  const filteredNodes = allPersons.filter(p => includedNodeIds.has(p.id));

  // Sanitize Edges: Keep ONLY relationships where BOTH source and target exist in includedNodeIds
  const sanitizedRelationships = allRelationships.filter(rel => {
    if (rel.status === 'REJECTED') return false;

    // For Mode 2 ('spine'), exclude SPOUSE relationships explicitly
    if (mode === 'spine' && rel.relationship_type === 'SPOUSE') return false;

    let sourceId: number;
    let targetId: number;

    if (rel.relationship_type === 'PARENT') {
      sourceId = rel.related_person_id;
      targetId = rel.person_id;
    } else if (rel.relationship_type === 'CHILD') {
      sourceId = rel.person_id;
      targetId = rel.related_person_id;
    } else {
      sourceId = rel.person_id;
      targetId = rel.related_person_id;
    }

    return includedNodeIds.has(sourceId) && includedNodeIds.has(targetId);
  });

  return {
    nodes: filteredNodes,
    relationships: sanitizedRelationships,
    includedNodeIds,
  };
}

/**
 * Builds a map from Parent Person ID to Set of Child Person IDs.
 */
export function getChildrenMap(allRelationships: Relationship[]): Map<number, Set<number>> {
  const childrenMap = new Map<number, Set<number>>();

  allRelationships.forEach(rel => {
    if (rel.status === 'REJECTED') return;

    let parentId: number | null = null;
    let childId: number | null = null;

    if (rel.relationship_type === 'PARENT') {
      // PARENT: person_id is the child, related_person_id is the parent
      parentId = rel.related_person_id;
      childId = rel.person_id;
    } else if (rel.relationship_type === 'CHILD') {
      // CHILD: person_id is the child (subject), related_person_id is the parent
      parentId = rel.related_person_id;
      childId = rel.person_id;
    }

    if (parentId !== null && childId !== null) {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, new Set());
      childrenMap.get(parentId)!.add(childId);
    }
  });

  return childrenMap;
}

/**
 * Builds a map from Child Person ID to Set of Parent Person IDs.
 */
export function getParentsMap(allRelationships: Relationship[]): Map<number, Set<number>> {
  const parentsMap = new Map<number, Set<number>>();

  allRelationships.forEach(rel => {
    if (rel.status === 'REJECTED') return;

    let parentId: number | null = null;
    let childId: number | null = null;

    if (rel.relationship_type === 'PARENT') {
      // PARENT: person_id is the child, related_person_id is the parent
      parentId = rel.related_person_id;
      childId = rel.person_id;
    } else if (rel.relationship_type === 'CHILD') {
      // CHILD: person_id is the child (subject), related_person_id is the parent
      parentId = rel.related_person_id;
      childId = rel.person_id;
    }

    if (parentId !== null && childId !== null) {
      if (!parentsMap.has(childId)) parentsMap.set(childId, new Set());
      parentsMap.get(childId)!.add(parentId);
    }
  });

  return parentsMap;
}

/**
 * Collects all upward linear ancestors (parents, grandparents, etc.) of a target person ID up to the root.
 */
export function getAncestors(
  personId: number,
  parentsMap: Map<number, Set<number>>
): Set<number> {
  const ancestors = new Set<number>();
  const queue = [personId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const parents = parentsMap.get(curr);
    if (parents) {
      parents.forEach(pId => {
        if (!ancestors.has(pId)) {
          ancestors.add(pId);
          queue.push(pId);
        }
      });
    }
  }

  return ancestors;
}

/**
 * Collects all downstream descendant node IDs (children, grandchildren, etc.) for a root person ID,
 * explicitly excluding rootId itself and any protected node IDs (such as ancestors of the target focus).
 */
export function getSubtreeDescendants(
  rootId: number,
  childrenMap: Map<number, Set<number>>,
  protectedIds?: Set<number>
): Set<number> {
  const descendants = new Set<number>();
  const visited = new Set<number>();
  const queue = [rootId];
  visited.add(rootId);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const children = childrenMap.get(curr);
    if (children) {
      children.forEach(childId => {
        if (childId !== rootId && !visited.has(childId)) {
          visited.add(childId);
          // Always traverse through this node to discover deeper descendants
          queue.push(childId);
          // But only mark as descendant (to hide) if NOT protected
          if (!protectedIds || !protectedIds.has(childId)) {
            descendants.add(childId);
          }
        }
      });
    }
  }

  return descendants;
}


