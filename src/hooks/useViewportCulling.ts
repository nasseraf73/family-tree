// P4.4: Viewport culling hook.
// Filters nodes to only those within (or near) the current viewport.
// Avoids rendering hundreds of off-screen DOM nodes.

import { useMemo } from 'react';
import { Node, useReactFlow } from '@xyflow/react';

const BUFFER_PX = 400; // Render nodes slightly outside viewport to avoid pop-in

export function useViewportCulling(nodes: Node[], buffer = BUFFER_PX) {
  const { getViewport } = useReactFlow();

  return useMemo(() => {
    if (typeof window === 'undefined') return nodes;

    const vp = getViewport();
    const xMin = -vp.x / vp.zoom - buffer;
    const xMax = (-vp.x + window.innerWidth) / vp.zoom + buffer;
    const yMin = -vp.y / vp.zoom - buffer;
    const yMax = (-vp.y + window.innerHeight) / vp.zoom + buffer;

    // For small graphs, skip culling (overhead > benefit)
    if (nodes.length < 200) return nodes;

    return nodes.filter(
      (n) =>
        n.position.x >= xMin &&
        n.position.x <= xMax &&
        n.position.y >= yMin &&
        n.position.y <= yMax
    );
  }, [nodes, getViewport]);
}
