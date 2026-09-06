// P4.3: Client-side wrapper for the Web Worker layout.
// Falls back to synchronous dagre on main thread if worker fails.

import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'COMPACT' | 'RADIAL';

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  nodesep?: number;
  ranksep?: number;
  arcAngle?: number;
  branchLength?: number;
  radialScale?: number;
}

/**
 * Synchronous Dagre layout (used as fallback and for radial layout).
 */
export function getLayoutedElementsSync(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB',
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

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
    g.setEdge(edge.source, edge.target);
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
 * Async layout using Web Worker.
 * Returns a Promise that resolves with laid-out nodes/edges.
 * Falls back to sync if worker fails.
 */
export async function getLayoutedElementsAsync(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB',
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (typeof window === 'undefined' || nodes.length === 0) {
    return getLayoutedElementsSync(nodes, edges, direction, options);
  }

  // For small graphs, sync is faster (worker setup overhead)
  if (nodes.length < 100) {
    return getLayoutedElementsSync(nodes, edges, direction, options);
  }

  return new Promise((resolve) => {
    try {
      const worker = new Worker(
        new URL('./workers/layout.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve(getLayoutedElementsSync(nodes, edges, direction, options));
      }, 5000);

      worker.onmessage = (e: MessageEvent) => {
        clearTimeout(timeout);
        const layoutedNodes = e.data.nodes;
        const layoutedEdges = edges.map((edge) => ({
          ...edge,
          type: direction === 'COMPACT' ? 'straight' : edge.type || 'smoothstep',
          style: {
            stroke: edge.style?.stroke || '#10b981',
            strokeWidth: 2.5,
          },
        }));
        worker.terminate();
        resolve({ nodes: layoutedNodes, edges: layoutedEdges });
      };

      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(getLayoutedElementsSync(nodes, edges, direction, options));
      };

      worker.postMessage({
        type: 'layout',
        nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          data: e.data,
        })),
        options: {
          direction: direction === 'BT' ? 'BT' : direction === 'LR' ? 'LR' : 'TB',
          nodeWidth: options.nodeWidth ?? 280,
          nodeHeight: options.nodeHeight ?? 240,
          nodesep: options.nodesep ?? 70,
          ranksep: options.ranksep ?? 140,
        },
      });
    } catch {
      // Fallback if Worker construction fails
      resolve(getLayoutedElementsSync(nodes, edges, direction, options));
    }
  });
}
