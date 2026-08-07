import { toSvg } from 'html-to-image';
import { Node, getNodesBounds } from '@xyflow/react';

/**
 * Client-side SVG Exporter for React Flow Canvas.
 * Captures the .react-flow__viewport element and calculates full node bounds to avoid cropping.
 */
export async function exportCanvasToSvg(
  viewportElem: HTMLElement,
  nodes: Node[],
  fileName: string = 'family-tree-export'
): Promise<void> {
  if (!viewportElem || nodes.length === 0) return;

  try {
    // Compute full bounding box of all visible nodes
    const bounds = getNodesBounds(nodes);

    const width = Math.max(bounds.width + 160, 800);
    const height = Math.max(bounds.height + 160, 600);

    // Render viewport element to SVG Data URI
    const dataUrl = await toSvg(viewportElem, {
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${-bounds.x + 80}px, ${-bounds.y + 80}px) scale(1)`,
      },
      // Ensure custom web fonts and inline styles pass through cleanly
      fontEmbedCSS: '',
      filter: (node: HTMLElement) => {
        // Exclude UI controls, minimap, or overlays from the SVG export if any match
        if (node.classList && (
          node.classList.contains('react-flow__controls') ||
          node.classList.contains('react-flow__minimap')
        )) {
          return false;
        }
        return true;
      },
    });

    // Create dynamic download link
    const link = document.createElement('a');
    link.download = `${fileName}.svg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export canvas to SVG:', error);
    throw error;
  }
}
