// P4.3: Web Worker for Dagre layout.
// Moves the expensive graph layout computation off the main thread,
// keeping the UI responsive while laying out hundreds/thousands of nodes.

import dagre from 'dagre';

interface LayoutMessage {
  type: 'layout';
  nodes: Array<{ id: string; data?: unknown }>;
  edges: Array<{ source: string; target: string; data?: { relationship_type?: string } }>;
  options: {
    direction: 'TB' | 'BT' | 'LR' | 'COMPACT';
    nodeWidth: number;
    nodeHeight: number;
    nodesep: number;
    ranksep: number;
  };
}

self.onmessage = (e: MessageEvent<LayoutMessage>) => {
  const { nodes, edges, options } = e.data;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: options.direction === 'BT' ? 'BT' : options.direction === 'LR' ? 'LR' : 'TB',
    nodesep: options.nodesep,
    ranksep: options.ranksep,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, { width: options.nodeWidth, height: options.nodeHeight });
  });

  edges.forEach((edge) => {
    // Skip spouse edges for lineage layout
    if (edge.data?.relationship_type === 'SPOUSE') return;
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    if (pos) {
      return {
        ...node,
        position: {
          x: pos.x - options.nodeWidth / 2,
          y: pos.y - options.nodeHeight / 2,
        },
      };
    }
    return node;
  });

  (self as unknown as Worker).postMessage({ type: 'layouted', nodes: layoutedNodes });
};

export {};
