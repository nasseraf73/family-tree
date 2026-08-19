import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { db } from '@/db';
import { persons as personsTable, relationships as relsTable, marriages as marriagesTable } from '@/db/schema';
import { Person, Relationship, RelationshipType, RelationshipStatus, Gender } from '@/types';
import { sql, like } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Local types to avoid importing @xyflow/react in server-side API route
interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userRole = searchParams.get('role') || 'USER';

  const xMin = searchParams.get('xMin') ? parseFloat(searchParams.get('xMin')!) : null;
  const yMin = searchParams.get('yMin') ? parseFloat(searchParams.get('yMin')!) : null;
  const xMax = searchParams.get('xMax') ? parseFloat(searchParams.get('xMax')!) : null;
  const yMax = searchParams.get('yMax') ? parseFloat(searchParams.get('yMax')!) : null;

  let persons: Person[] = [];
  let relationships: Relationship[] = [];
  const personSpousesMap = new Map<number, Array<{
    id: number;
    spouse_id?: number;
    spouse_name: string;
    status: string;
    marriage_order: number;
  }>>();

  // Fetch directly from persistent PostgreSQL database
  try {
    // 0. Database Cleanup: Permanently remove any heavy Base64 image strings from persons table
    try {
      await db.update(personsTable).set({ photo_url: null }).where(like(personsTable.photo_url, 'data:%'));
    } catch {
      // Safe catch if table isn't populated yet
    }

    const dbPersons = await db.select().from(personsTable);
    const dbRels = await db.select().from(relsTable);
    const dbMarriages = await db.select().from(marriagesTable);

    if (dbPersons.length > 0) {
      persons = dbPersons.map(p => ({
        id: p.id,
        first_name: p.first_name,
        father_name: p.father_name || undefined,
        grand_father_name: p.grand_father_name || undefined,
        family_name: p.family_name || undefined,
        gender: p.gender as Gender,
        is_alive: p.is_alive,
        birth_year: p.birth_year || undefined,
        death_date: p.death_date || undefined,
        burial_place: p.burial_place || undefined,
        country_id: p.country_id || undefined,
        photo_url: p.photo_url && !p.photo_url.startsWith('data:') ? p.photo_url : undefined,
        biography: p.biography || undefined,
        created_by_user_id: p.created_by_user_id || undefined,
        claimed_by_user_id: p.claimed_by_user_id || undefined,
        claim_status: (p.claim_status as 'PENDING' | 'APPROVED' | 'REJECTED') || undefined,
        created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
      }));

      relationships = dbRels.map(r => ({
        id: r.id,
        person_id: r.person_id,
        related_person_id: r.related_person_id,
        relationship_type: r.relationship_type as RelationshipType,
        status: r.status as RelationshipStatus,
        created_by_user_id: r.created_by_user_id || undefined,
        verified_by_user_id: r.verified_by_user_id || undefined,
        verified_at: r.verified_at ? r.verified_at.toISOString() : undefined,
        created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      }));

      dbMarriages.forEach((m) => {
        const wifeObj = dbPersons.find((p) => p.id === m.wife_id);
        const husbandObj = dbPersons.find((p) => p.id === m.husband_id);

        const wifeName = wifeObj
          ? `${wifeObj.first_name} ${wifeObj.family_name || ''}`.trim()
          : `${m.external_spouse_name || 'زوجة'} ${m.external_family_name || ''}`.trim();

        const husbandName = husbandObj
          ? `${husbandObj.first_name} ${husbandObj.family_name || ''}`.trim()
          : 'زوج';

        if (!personSpousesMap.has(m.husband_id)) personSpousesMap.set(m.husband_id, []);
        personSpousesMap.get(m.husband_id)!.push({
          id: m.id,
          spouse_id: m.wife_id || undefined,
          spouse_name: wifeName,
          status: m.status,
          marriage_order: m.marriage_order,
        });

        if (m.wife_id) {
          if (!personSpousesMap.has(m.wife_id)) personSpousesMap.set(m.wife_id, []);
          personSpousesMap.get(m.wife_id)!.push({
            id: m.id,
            spouse_id: m.husband_id,
            spouse_name: husbandName,
            status: m.status,
            marriage_order: m.marriage_order,
          });
        }
      });
    } else {
      persons = dbStore.getPersons();
      relationships = dbStore.getRelationships();
    }
  } catch {
    persons = dbStore.getPersons();
    relationships = dbStore.getRelationships();
  }

  const validRelationships = relationships.filter(r => r.status !== 'REJECTED' && r.person_id !== r.related_person_id);

  const visibleRelationships = validRelationships.filter(r => {
    if (r.status === 'VERIFIED') return true;
    if (r.status === 'PENDING') return true;
    return false;
  });

  // Identify root ancestors (nodes without parent relationships)
  const rootAncestors = persons.filter(p => {
    const parentRels = validRelationships.filter(r => 
      (r.person_id === p.id && r.relationship_type === 'PARENT') ||
      (r.related_person_id === p.id && r.relationship_type === 'CHILD')
    );
    return parentRels.length === 0;
  });

  const nodePositions = new Map<number, { x: number; y: number }>();
  const processedNodes = new Set<number>();

  let currentClusterXOffset = 0;

  rootAncestors.forEach((rootPerson) => {
    if (processedNodes.has(rootPerson.id)) return;

    const clusterNodes: number[] = [rootPerson.id];
    const queue = [rootPerson.id];
    const visited = new Set<number>([rootPerson.id]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      visibleRelationships.forEach(rel => {
        let childId: number | null = null;
        if (rel.relationship_type === 'PARENT' && rel.related_person_id === currentId) {
          childId = rel.person_id;
        } else if (rel.relationship_type === 'CHILD' && rel.person_id === currentId) {
          childId = rel.related_person_id;
        }

        if (childId && !visited.has(childId)) {
          visited.add(childId);
          clusterNodes.push(childId);
          queue.push(childId);
        }
      });
    }

    clusterNodes.forEach(id => processedNodes.add(id));

    let maxClusterWidth = 1;

    clusterNodes.forEach(id => {
      const nodeChildren = visibleRelationships.filter(r => 
        (r.relationship_type === 'PARENT' && r.related_person_id === id) ||
        (r.relationship_type === 'CHILD' && r.person_id === id)
      );
      if (nodeChildren.length > maxClusterWidth) {
        maxClusterWidth = nodeChildren.length;
      }
    });

    const clusterWidthPx = maxClusterWidth * 340;
    currentClusterXOffset += clusterWidthPx + 500;
  });

  persons.forEach(p => {
    if (!nodePositions.has(p.id)) {
      nodePositions.set(p.id, { x: currentClusterXOffset, y: 0 });
      currentClusterXOffset += 400;
    }
  });

  let nodes: CanvasNode[] = persons.map(person => {
    const pos = nodePositions.get(person.id) || { x: 0, y: 0 };
    
    const isPending = validRelationships.some(r => 
      (r.person_id === person.id || r.related_person_id === person.id) && r.status === 'PENDING'
    );

    return {
      id: person.id.toString(),
      type: 'personNode',
      position: pos,
      data: {
        ...person,
        isPendingStatus: isPending,
        spouses: personSpousesMap.get(person.id) || [],
      },
    };
  });

  if (xMin !== null && yMin !== null && xMax !== null && yMax !== null) {
    const buffer = 400;
    nodes = nodes.filter(node => 
      node.position.x >= xMin - buffer &&
      node.position.x <= xMax + buffer &&
      node.position.y >= yMin - buffer &&
      node.position.y <= yMax + buffer
    );
  }

  const visibleNodeIds = new Set(nodes.map(n => n.id));
  const personMap = new Map<number, Person>();
  persons.forEach(p => personMap.set(p.id, p));

  const edges: CanvasEdge[] = visibleRelationships
    .map(rel => {
      let sourceId: string;
      let targetId: string;

      if (rel.relationship_type === 'SPOUSE') {
        sourceId = rel.person_id.toString();
        targetId = rel.related_person_id.toString();
      } else {
        // Lineage hierarchy: Parent is always the source (top) and Child is always the target (bottom)
        const p1 = personMap.get(rel.person_id);
        const p2 = personMap.get(rel.related_person_id);

        let parentId = rel.related_person_id;
        let childId = rel.person_id;

        if (p1 && p2 && p1.father_name && p2.first_name && p1.father_name.trim() === p2.first_name.trim()) {
          // p2 is the father of p1
          parentId = rel.related_person_id;
          childId = rel.person_id;
        } else if (p1 && p2 && p2.father_name && p1.first_name && p2.father_name.trim() === p1.first_name.trim()) {
          // p1 is the father of p2
          parentId = rel.person_id;
          childId = rel.related_person_id;
        } else if (rel.relationship_type === 'CHILD') {
          parentId = rel.related_person_id;
          childId = rel.person_id;
        } else {
          parentId = rel.related_person_id;
          childId = rel.person_id;
        }

        sourceId = parentId.toString();
        targetId = childId.toString();
      }

      return {
        id: `e-${rel.id}`,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: rel.status === 'PENDING',
        style: {
          stroke: rel.status === 'PENDING' ? '#f59e0b' : rel.relationship_type === 'SPOUSE' ? '#ec4899' : '#10b981',
          strokeWidth: 2.5,
          strokeDasharray: rel.status === 'PENDING' ? '5,5' : undefined,
        },
        data: {
          relationship_type: rel.relationship_type,
          status: rel.status,
        },
      };
    })
    .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

  return NextResponse.json({
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    persons,
    relationships,
  });
}
