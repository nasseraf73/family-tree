import { Person, Relationship } from '../types';

export interface AncestorFinderResult {
  nodes: Person[];
  relationships: Relationship[];
  lcaNode: Person | null;
  degreeText: string;
  distanceA: number;
  distanceB: number;
}

/**
 * Calculates the Lowest Common Ancestor (LCA) between Person A and Person B,
 * formats their kinship degree in Arabic, and constructs a clean Y-shape dual backbone subgraph.
 */
export function findCommonAncestorLineage(
  personAId: number | null,
  personBId: number | null,
  allPersons: Person[],
  allRelationships: Relationship[]
): AncestorFinderResult {
  if (!personAId || !personBId || allPersons.length === 0) {
    return {
      nodes: [],
      relationships: [],
      lcaNode: null,
      degreeText: 'يرجى تحديد الفردين لعرض الجد المشترك وسلسلة النسب',
      distanceA: 0,
      distanceB: 0,
    };
  }

  const personsMap = new Map<number, Person>();
  allPersons.forEach(p => personsMap.set(p.id, p));

  const personA = personsMap.get(personAId);
  const personB = personsMap.get(personBId);

  if (!personA || !personB) {
    return {
      nodes: [],
      relationships: [],
      lcaNode: null,
      degreeText: 'تعذر العثور على بيانات أحد الأفراد المحددين',
      distanceA: 0,
      distanceB: 0,
    };
  }

  if (personAId === personBId) {
    return {
      nodes: [personA],
      relationships: [],
      lcaNode: personA,
      degreeText: `تم اختيار نفس الشخص في الحقلين (${personA.first_name} ${personA.family_name || ''})`,
      distanceA: 0,
      distanceB: 0,
    };
  }

  // Build Parents Lookup Map (childId -> list of parentIds)
  const parentsMap = new Map<number, number[]>();

  allRelationships.forEach(rel => {
    if (rel.status === 'REJECTED') return;

    let parentId: number | null = null;
    let childId: number | null = null;

    if (rel.relationship_type === 'PARENT') {
      parentId = rel.related_person_id;
      childId = rel.person_id;
    } else if (rel.relationship_type === 'CHILD') {
      parentId = rel.person_id;
      childId = rel.related_person_id;
    }

    if (parentId && childId && personsMap.has(parentId) && personsMap.has(childId)) {
      if (!parentsMap.has(childId)) parentsMap.set(childId, []);
      const pList = parentsMap.get(childId)!;
      if (!pList.includes(parentId)) pList.push(parentId);
    }
  });

  // Helper to pick primary father / parent ID
  const getPrimaryParent = (id: number): number | null => {
    const parents = parentsMap.get(id);
    if (!parents || parents.length === 0) return null;
    // Prefer male parent if available
    for (const pId of parents) {
      const parentObj = personsMap.get(pId);
      if (parentObj && parentObj.gender === 'MALE') return pId;
    }
    return parents[0];
  };

  // Trace ascending path from Person A up to top root
  const pathA: number[] = [personAId];
  const depthA = new Map<number, number>();
  depthA.set(personAId, 0);

  let currA: number | null = personAId;
  let distCountA = 0;
  while (currA !== null) {
    const parentId = getPrimaryParent(currA);
    if (parentId !== null && !depthA.has(parentId)) {
      distCountA++;
      pathA.push(parentId);
      depthA.set(parentId, distCountA);
      currA = parentId;
    } else {
      currA = null;
    }
  }

  // Trace ascending path from Person B up to top root
  const pathB: number[] = [personBId];
  const depthB = new Map<number, number>();
  depthB.set(personBId, 0);

  let currB: number | null = personBId;
  let distCountB = 0;
  while (currB !== null) {
    const parentId = getPrimaryParent(currB);
    if (parentId !== null && !depthB.has(parentId)) {
      distCountB++;
      pathB.push(parentId);
      depthB.set(parentId, distCountB);
      currB = parentId;
    } else {
      currB = null;
    }
  }

  // Find Lowest Common Ancestor (first node in pathA that is also in pathB)
  let lcaId: number | null = null;
  for (const nodeA of pathA) {
    if (depthB.has(nodeA)) {
      lcaId = nodeA;
      break;
    }
  }

  if (lcaId === null) {
    return {
      nodes: [],
      relationships: [],
      lcaNode: null,
      degreeText: `⚠️ لا يوجد جد مشترك مسجل بين (${personA.first_name}) و (${personB.first_name}) في سجلات المنظومة حالياً`,
      distanceA: 0,
      distanceB: 0,
    };
  }

  const lcaNode = personsMap.get(lcaId) || null;
  const distanceA = depthA.get(lcaId)!;
  const distanceB = depthB.get(lcaId)!;

  // Format Arabic Kinship Degree Text
  let degreeText = '';
  const nameA = `${personA.first_name} ${personA.family_name || ''}`.trim();
  const nameB = `${personB.first_name} ${personB.family_name || ''}`.trim();

  if (distanceA === 0) {
    degreeText = `صلة نسب مباشرة: (${nameB}) هو من أحفاد/فروع (${nameA}) المباشرين`;
  } else if (distanceB === 0) {
    degreeText = `صلة نسب مباشرة: (${nameA}) هو من أحفاد/فروع (${nameB}) المباشرين`;
  } else if (distanceA === 1 && distanceB === 1) {
    degreeText = `إخوة (أبناء نفس الوالد: ${lcaNode?.first_name} ${lcaNode?.family_name || ''})`;
  } else if (distanceA === 2 && distanceB === 2) {
    degreeText = `أبناء عمومة من الدرجة الأولى (الجد المشترك: ${lcaNode?.first_name} ${lcaNode?.family_name || ''})`;
  } else if (distanceA === 3 && distanceB === 3) {
    degreeText = `أبناء عمومة من الدرجة الثانية (الجد المشترك: ${lcaNode?.first_name} ${lcaNode?.family_name || ''})`;
  } else if (distanceA === 4 && distanceB === 4) {
    degreeText = `أبناء عمومة من الدرجة الثالثة (الجد المشترك: ${lcaNode?.first_name} ${lcaNode?.family_name || ''})`;
  } else if ((distanceA === 1 && distanceB === 2) || (distanceA === 2 && distanceB === 1)) {
    degreeText = `قرابة مباشرة: عم / خالة وابن أخ (الجد المشترك: ${lcaNode?.first_name} ${lcaNode?.family_name || ''})`;
  } else {
    degreeText = `قرابة عائلية عبر الجد المشترك (${lcaNode?.first_name} ${lcaNode?.family_name || ''}) - درجة البُعْد: (${distanceA} / ${distanceB})`;
  }

  // Construct Subgraph Node Set: pathA_to_LCA + pathB_to_LCA + LCA_to_top_root
  const lcaIndexInA = pathA.indexOf(lcaId);
  const lcaIndexInB = pathB.indexOf(lcaId);

  const pathAtoLcaNodes = pathA.slice(0, lcaIndexInA + 1);
  const pathBtoLcaNodes = pathB.slice(0, lcaIndexInB + 1);
  const lcaToRootNodes = pathA.slice(lcaIndexInA);

  const includedNodeIds = new Set<number>([
    ...pathAtoLcaNodes,
    ...pathBtoLcaNodes,
    ...lcaToRootNodes,
  ]);

  const filteredNodes = allPersons.filter(p => includedNodeIds.has(p.id));

  // Sanitize Edges: Keep ONLY parent-child relationships between nodes in includedNodeIds along dual backbone
  const sanitizedRelationships = allRelationships.filter(rel => {
    if (rel.status === 'REJECTED' || rel.relationship_type === 'SPOUSE') return false;

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
    lcaNode,
    degreeText,
    distanceA,
    distanceB,
  };
}
