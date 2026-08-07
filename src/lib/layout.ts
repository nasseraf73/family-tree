import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'COMPACT' | 'RADIAL';

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  nodesep?: number;
  ranksep?: number;
  arcAngle?: number; // degree 90 - 360
  branchLength?: number; // distance per generation
  radialScale?: number; // spread multiplier
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB',
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  if (direction === 'RADIAL') {
    return getRadialLayoutedElements(nodes, edges, options);
  }

  const nodeWidth = options.nodeWidth ?? 280;
  const nodeHeight = options.nodeHeight ?? 240;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction === 'BT' ? 'BT' : direction === 'LR' ? 'LR' : 'TB',
    nodesep: options.nodesep ?? 70,
    ranksep: options.ranksep ?? 140,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    const relType = edge.data?.relationship_type;
    if (relType === 'SPOUSE') return;

    let sourceId = edge.source;
    let targetId = edge.target;

    if (relType === 'CHILD') {
      sourceId = edge.target;
      targetId = edge.source;
    }

    g.setEdge(sourceId, targetId);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    if (nodeWithPos) {
      return {
        ...node,
        position: {
          x: nodeWithPos.x - nodeWidth / 2,
          y: nodeWithPos.y - nodeHeight / 2,
        },
      };
    }
    return node;
  });

  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    type: direction === 'COMPACT' ? 'straight' : edge.type || 'smoothstep',
    style: {
      stroke: edge.style?.stroke || '#10b981',
      strokeWidth: 2.5,
    },
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

/**
 * Calculates a precise, hierarchical radial tree layout (d3-hierarchy radial style).
 * - Identifies primary root patriarch at center (0,0) or spaces multiple roots evenly.
 * - Recursively assigns non-overlapping angular wedges to subtrees.
 * - Dynamically expands radius if sibling arc distance is less than minArcGap (120px) to prevent collisions.
 * - Direct straight slanted edges directly from parent center to child center.
 */
export function getRadialLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const arcAngleDegree = options.arcAngle ?? 180; // Default semi-circle 180 deg
  const baseBranchLength = options.branchLength ?? 200; // Base radial step
  const radialScale = (options.radialScale ?? 100) / 100;
  const minArcGap = 110; // Minimum arc pixels between node centers to guarantee zero label collisions

  // 1. Build Parent & Child Adjacency Maps
  const parentMap = new Map<string, string[]>();
  const childrenMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!parentMap.has(edge.target)) parentMap.set(edge.target, []);
    parentMap.get(edge.target)!.push(edge.source);

    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
    childrenMap.get(edge.source)!.push(edge.target);
  });

  // 2. Identify Root Ancestors
  const rootNodeIds = nodes
    .map((n) => n.id)
    .filter((id) => !parentMap.has(id) || parentMap.get(id)!.length === 0);

  // 3. Compute Subtree Weights (leaf count per subtree)
  const weightMap = new Map<string, number>();
  const computeWeight = (id: string, visitedPath = new Set<string>()): number => {
    if (visitedPath.has(id)) return 1;
    visitedPath.add(id);
    const children = childrenMap.get(id) || [];
    if (children.length === 0) {
      weightMap.set(id, 1);
      return 1;
    }
    let w = 0;
    children.forEach((cId) => {
      w += computeWeight(cId, new Set(visitedPath));
    });
    const finalW = Math.max(1, w);
    weightMap.set(id, finalW);
    return finalW;
  };

  rootNodeIds.forEach((rId) => computeWeight(rId));
  nodes.forEach((n) => {
    if (!weightMap.has(n.id)) weightMap.set(n.id, 1);
  });

  // Sort root nodes so patriarch with largest subtree is first
  rootNodeIds.sort((a, b) => (weightMap.get(b) || 0) - (weightMap.get(a) || 0));

  // 4. Compute Generations / Depths from Roots
  const depthMap = new Map<string, number>();
  const queue: { id: string; depth: number }[] = rootNodeIds.map((id) => ({ id, depth: 0 }));
  const visitedDepth = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visitedDepth.has(id)) continue;
    visitedDepth.add(id);

    const currentDepth = depthMap.get(id) ?? 0;
    depthMap.set(id, Math.max(currentDepth, depth));

    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      if (!visitedDepth.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    });
  }

  nodes.forEach((n) => {
    if (!depthMap.has(n.id)) depthMap.set(n.id, 0);
  });

  // 5. Polar Sector Allocation (minAngle -> maxAngle per node)
  const totalArcRad = (arcAngleDegree * Math.PI) / 180;
  const startAngle = Math.PI + (Math.PI - totalArcRad) / 2;

  const nodePositions = new Map<string, { x: number; y: number; angleRad: number }>();
  const nodeWedges = new Map<string, { minAngle: number; maxAngle: number }>();

  if (rootNodeIds.length === 1) {
    // Single Root Ancestor (Patriarch) at exact center (0,0)
    const primaryRootId = rootNodeIds[0];
    nodePositions.set(primaryRootId, { x: 0, y: 0, angleRad: startAngle - totalArcRad / 2 });
    nodeWedges.set(primaryRootId, { minAngle: startAngle, maxAngle: startAngle - totalArcRad });
  } else if (rootNodeIds.length > 1) {
    // Multiple Root Ancestors: space them out across totalArcRad at small radius R=60 to avoid stacking at (0,0)
    const totalWeight = rootNodeIds.reduce((sum, id) => sum + (weightMap.get(id) || 1), 0);
    let curAngle = startAngle;

    rootNodeIds.forEach((rId, idx) => {
      const w = weightMap.get(rId) || 1;
      const span = (w / (totalWeight || 1)) * totalArcRad;
      const minA = curAngle;
      const maxA = curAngle - span;
      const midA = (minA + maxA) / 2;

      nodeWedges.set(rId, { minAngle: minA, maxAngle: maxA });

      // Primary patriarch at 0,0, other secondary roots placed slightly offset
      if (idx === 0) {
        nodePositions.set(rId, { x: 0, y: 0, angleRad: midA });
      } else {
        const rootR = 70 * radialScale;
        nodePositions.set(rId, { x: rootR * Math.cos(midA), y: rootR * Math.sin(midA), angleRad: midA });
      }

      curAngle = maxA;
    });
  }

  // Recursive DFS to position children within parent's wedge
  const layoutChildren = (parentId: string) => {
    const children = childrenMap.get(parentId) || [];
    if (children.length === 0) return;

    const parentPos = nodePositions.get(parentId)!;
    const parentWedge = nodeWedges.get(parentId) || {
      minAngle: parentPos.angleRad + 0.1,
      maxAngle: parentPos.angleRad - 0.1,
    };

    const parentDepth = depthMap.get(parentId) || 0;
    const childDepth = parentDepth + 1;

    // Calculate required radius for child depth to ensure arc distance >= minArcGap
    const totalWedgeSpan = Math.abs(parentWedge.minAngle - parentWedge.maxAngle);
    const totalChildWeight = children.reduce((sum, cId) => sum + (weightMap.get(cId) || 1), 0);

    // Standard base radius
    let calculatedRadius = childDepth * baseBranchLength * radialScale;

    // Dynamic Collision Prevention: Check smallest child wedge arc distance
    const minChildSpan = (1 / (totalChildWeight || 1)) * totalWedgeSpan;
    const currentArcPixels = calculatedRadius * minChildSpan;

    if (currentArcPixels < minArcGap && minChildSpan > 0) {
      // Expand radius for this depth to guarantee zero label overlap
      calculatedRadius = Math.max(calculatedRadius, minArcGap / minChildSpan);
    }

    let childCurAngle = parentWedge.minAngle;

    children.forEach((childId) => {
      const childWeight = weightMap.get(childId) || 1;
      const childSpan = (childWeight / (totalChildWeight || 1)) * totalWedgeSpan;
      const childMinA = childCurAngle;
      const childMaxA = childCurAngle - childSpan;
      const childMidA = (childMinA + childMaxA) / 2;

      nodeWedges.set(childId, { minAngle: childMinA, maxAngle: childMaxA });

      const posX = calculatedRadius * Math.cos(childMidA);
      const posY = calculatedRadius * Math.sin(childMidA);

      nodePositions.set(childId, { x: posX, y: posY, angleRad: childMidA });

      childCurAngle = childMaxA;

      // Recurse down children
      layoutChildren(childId);
    });
  };

  rootNodeIds.forEach((rId) => layoutChildren(rId));

  // Handle orphan nodes
  nodes.forEach((n) => {
    if (!nodePositions.has(n.id)) {
      const d = depthMap.get(n.id) || 1;
      const r = d * baseBranchLength * radialScale;
      const midA = startAngle - totalArcRad / 2;
      nodePositions.set(n.id, { x: r * Math.cos(midA), y: r * Math.sin(midA), angleRad: midA });
    }
  });

  // 6. Map to React Flow Nodes
  const layoutedNodes = nodes.map((node) => {
    const pos = nodePositions.get(node.id) || { x: 0, y: 0, angleRad: 0 };
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
      data: {
        ...node.data,
        radialAngleRad: pos.angleRad,
        isRadialLayout: true,
      },
    };
  });

  // 7. Map to Direct Straight Slanted Edges
  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    type: 'straight',
    style: {
      stroke: edge.style?.stroke === '#ec4899' ? '#ec4899' : '#10b981',
      strokeWidth: 2,
      opacity: 0.85,
    },
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
