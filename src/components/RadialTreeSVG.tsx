'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Person, Relationship } from '../types';
import { createClient } from '../lib/supabase/client';
import { Download, Maximize, Minimize } from 'lucide-react';

// ===== Tree Node for SVG rendering =====
interface TreeNode {
  id: number;
  person: Person;
  children: TreeNode[];
  depth: number;
  // Computed layout fields
  angleStart: number;
  angleEnd: number;
  angleMid: number;
  radius: number;
  x: number;
  y: number;
  leafCount: number;
}

// ===== Component Props =====
interface RadialTreeSVGProps {
  isFullscreen?: boolean;
  customPersons?: Person[];
  customRelationships?: Relationship[];
  initialFocusPersonId?: number | null;
}

export const RadialTreeSVG: React.FC<RadialTreeSVGProps> = ({
  isFullscreen: isFullscreenProp,
  customPersons,
  customRelationships,
  initialFocusPersonId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreenState, setIsFullscreenState] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreenState(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const isFs = isFullscreenProp ?? isFullscreenState;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Data state
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());

  // Controls
  const [arcAngle, setArcAngle] = useState(180);
  const [branchLength, setBranchLength] = useState(120);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // ===== Fetch data =====
  useEffect(() => {
    if (customPersons && customRelationships) {
      setPersons(customPersons);
      setRelationships(customRelationships);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Try API first
        let fetchedPersons: Person[] = [];
        let fetchedRels: Relationship[] = [];

        try {
          const res = await fetch('/api/v1/tree/canvas');
          if (res.ok) {
            const data = await res.json();
            if (data.nodes) {
              fetchedPersons = data.nodes.map((n: any) => n.data as Person);
              fetchedRels = (data.edges || []).map((e: any) => {
                const relType = e.data?.relationship_type || (e.style?.stroke === '#ec4899' ? 'SPOUSE' : 'PARENT');
                const isParentRel = relType === 'PARENT';
                return {
                  id: parseInt(e.id.replace('e-', ''), 10) || Date.now(),
                  person_id: isParentRel ? parseInt(e.target, 10) : parseInt(e.source, 10),
                  related_person_id: isParentRel ? parseInt(e.source, 10) : parseInt(e.target, 10),
                  relationship_type: relType,
                  status: e.data?.status || 'VERIFIED',
                  created_at: new Date().toISOString(),
                };
              });
            }
          }
        } catch (err) {
          console.warn('API fetch error:', err);
        }

        // Fallback to Supabase
        if (fetchedPersons.length === 0) {
          try {
            const supabase = createClient();
            const [pRes, rRes] = await Promise.all([
              supabase.from('persons').select('*').order('id', { ascending: true }),
              supabase.from('relationships').select('*').eq('status', 'VERIFIED'),
            ]);
            if (!pRes.error && pRes.data) fetchedPersons = pRes.data;
            if (!rRes.error && rRes.data) fetchedRels = rRes.data;
          } catch (err) {
            console.warn('Supabase fallback error:', err);
          }
        }

        setPersons(fetchedPersons);
        setRelationships(fetchedRels);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ===== Build hierarchical tree from flat data =====
  const buildTree = useCallback((): TreeNode | null => {
    if (persons.length === 0) return null;

    const personsMap = new Map<number, Person>();
    persons.forEach((p) => personsMap.set(p.id, p));

    // Build parent->children map from PARENT/CHILD relationships
    const childrenMap = new Map<number, number[]>();
    const hasParent = new Set<number>();

    relationships.forEach((rel) => {
      if (rel.relationship_type === 'SPOUSE') return;
      if (rel.status === 'REJECTED') return;

      let parentId: number;
      let childId: number;

      if (rel.relationship_type === 'PARENT') {
        childId = rel.person_id;
        parentId = rel.related_person_id;
      } else if (rel.relationship_type === 'CHILD') {
        parentId = rel.person_id;
        childId = rel.related_person_id;
      } else {
        childId = rel.person_id;
        parentId = rel.related_person_id;
      }

      if (!personsMap.has(parentId) || !personsMap.has(childId)) return;

      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      const arr = childrenMap.get(parentId)!;
      if (!arr.includes(childId)) arr.push(childId);
      hasParent.add(childId);
    });

    // Find root ancestors (persons with no parent)
    const rootIds = persons
      .filter((p) => !hasParent.has(p.id))
      .map((p) => p.id);

    if (rootIds.length === 0) return null;

    // Build tree recursively
    const visited = new Set<number>();
    const buildNode = (id: number, depth: number): TreeNode | null => {
      if (visited.has(id)) return null;
      visited.add(id);

      const person = personsMap.get(id);
      if (!person) return null;

      const childIds = childrenMap.get(id) || [];
      const isCollapsed = collapsedNodes.has(id);

      const childNodes: TreeNode[] = [];
      if (!isCollapsed) {
        childIds.forEach((cId) => {
          const childNode = buildNode(cId, depth + 1);
          if (childNode) childNodes.push(childNode);
        });
      }

      const leafCount = childNodes.length === 0 ? 1 : childNodes.reduce((s, c) => s + c.leafCount, 0);

      return {
        id,
        person,
        children: childNodes,
        depth,
        angleStart: 0,
        angleEnd: 0,
        angleMid: 0,
        radius: 0,
        x: 0,
        y: 0,
        leafCount,
      };
    };

    // If single root, use it directly
    if (rootIds.length === 1) {
      return buildNode(rootIds[0], 0);
    }

    // Multiple roots: create a virtual root
    const virtualRoot: TreeNode = {
      id: -1,
      person: {
        id: -1,
        first_name: '',
        gender: 'MALE',
        is_alive: false,
        created_at: '',
      },
      children: [],
      depth: -1,
      angleStart: 0,
      angleEnd: 0,
      angleMid: 0,
      radius: 0,
      x: 0,
      y: 0,
      leafCount: 0,
    };

    rootIds.forEach((rId) => {
      const node = buildNode(rId, 0);
      if (node) virtualRoot.children.push(node);
    });
    virtualRoot.leafCount = virtualRoot.children.reduce((s, c) => s + c.leafCount, 0);

    return virtualRoot;
  }, [persons, relationships, collapsedNodes]);

  // ===== Helper to count total descendants of a person (children, grandchildren, etc.) =====
  const getDescendantsCount = useCallback((personId: number): number => {
    const childrenMap = new Map<number, number[]>();
    relationships.forEach((rel) => {
      if (rel.relationship_type === 'SPOUSE') return;
      if (rel.status === 'REJECTED') return;

      let parentId: number;
      let childId: number;

      if (rel.relationship_type === 'PARENT') {
        childId = rel.person_id;
        parentId = rel.related_person_id;
      } else if (rel.relationship_type === 'CHILD') {
        parentId = rel.person_id;
        childId = rel.related_person_id;
      } else {
        childId = rel.person_id;
        parentId = rel.related_person_id;
      }

      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      const arr = childrenMap.get(parentId)!;
      if (!arr.includes(childId)) {
        arr.push(childId);
      }
    });

    const visited = new Set<number>();
    const countKids = (pId: number): number => {
      if (visited.has(pId)) return 0;
      visited.add(pId);
      
      const kids = childrenMap.get(pId) || [];
      let total = kids.length;
      for (const kidId of kids) {
        total += countKids(kidId);
      }
      return total;
    };

    return countKids(personId);
  }, [relationships]);

  // ===== Compute radial positions =====
  const computeLayout = useCallback(
    (root: TreeNode, centerX: number, centerY: number) => {
      const arcRad = (arcAngle * Math.PI) / 180;
      // Semi-circle: start from bottom-left going to bottom-right, arching upward
      // For 180°: angles go from 3π/2 - π/2 = π to 3π/2 + π/2 = 2π, i.e. bottom semicircle inverted
      // We want the tree to fan UPWARD from the bottom, so:
      // Start angle: π + (π - arcRad)/2 (left side)
      // End angle: startAngle + arcRad (right side)
      const startAngle = Math.PI / 2 - arcRad / 2; // fan upward
      const endAngle = Math.PI / 2 + arcRad / 2;

      // Root at bottom center
      root.x = centerX;
      root.y = centerY;
      root.radius = 0;
      root.angleStart = startAngle;
      root.angleEnd = endAngle;
      root.angleMid = (startAngle + endAngle) / 2;

      const layoutNode = (node: TreeNode, aStart: number, aEnd: number, depth: number) => {
        node.angleStart = aStart;
        node.angleEnd = aEnd;
        node.angleMid = (aStart + aEnd) / 2;
        node.radius = depth * branchLength;
        // Convert polar to Cartesian (y-axis inverted: up is negative)
        node.x = centerX + node.radius * Math.cos(node.angleMid);
        node.y = centerY - node.radius * Math.sin(node.angleMid);

        if (node.children.length === 0) return;

        const totalLeaves = node.children.reduce((s, c) => s + c.leafCount, 0);
        const wedge = aEnd - aStart;
        let currentAngle = aStart;

        node.children.forEach((child) => {
          const childWedge = (child.leafCount / totalLeaves) * wedge;
          const childStart = currentAngle;
          const childEnd = currentAngle + childWedge;

          layoutNode(child, childStart, childEnd, depth + 1);
          currentAngle = childEnd;
        });
      };

      if (root.id === -1) {
        // Virtual root: layout children as if they're at depth 0
        const totalLeaves = root.children.reduce((s, c) => s + c.leafCount, 0);
        let currentAngle = startAngle;
        const wedge = endAngle - startAngle;

        root.children.forEach((child) => {
          const childWedge = (child.leafCount / totalLeaves) * wedge;
          child.x = centerX;
          child.y = centerY;
          child.radius = 0;
          layoutNode(child, currentAngle, currentAngle + childWedge, 1);
          currentAngle += childWedge;
        });
      } else {
        layoutNode(root, startAngle, endAngle, 0);
        // Now shift children to start from depth 1
        const relayout = (node: TreeNode, depth: number) => {
          node.radius = depth * branchLength;
          if (depth === 0) {
            node.x = centerX;
            node.y = centerY;
          } else {
            node.x = centerX + node.radius * Math.cos(node.angleMid);
            node.y = centerY - node.radius * Math.sin(node.angleMid);
          }
          node.children.forEach((c) => relayout(c, depth + 1));
        };
        relayout(root, 0);
      }
    },
    [arcAngle, branchLength]
  );

  // ===== Collect all nodes flat =====
  const collectNodes = (node: TreeNode): TreeNode[] => {
    const result: TreeNode[] = [node];
    node.children.forEach((c) => {
      result.push(...collectNodes(c));
    });
    return result;
  };

  // ===== Generate SVG branch path (curved thick branch) =====
  const generateBranchPath = (parent: TreeNode, child: TreeNode, centerX: number, centerY: number): string => {
    // Quadratic bezier from parent to child, curving through a control point
    const px = parent.x;
    const py = parent.y;
    const cx = child.x;
    const cy = child.y;

    // Control point: at child's radius but at parent's angle
    const midRadius = (parent.radius + child.radius) / 2;
    const ctrlX = centerX + midRadius * Math.cos(child.angleMid);
    const ctrlY = centerY - midRadius * Math.sin(child.angleMid);

    return `M ${px} ${py} Q ${ctrlX} ${ctrlY} ${cx} ${cy}`;
  };

  // ===== Render =====
  const treeRoot = buildTree();

  const canvasWidth = 3000;
  const canvasHeight = 3000;
  const centerX = canvasWidth / 2;
  // When arc > 180°, root moves to center so full circle renders properly
  const centerY = arcAngle > 180 ? canvasHeight / 2 : canvasHeight - 150;

  if (treeRoot) {
    computeLayout(treeRoot, centerX, centerY);
  }

  const allNodes = treeRoot ? collectNodes(treeRoot).filter((n) => n.id !== -1) : [];

  // Collect all parent-child pairs for branches
  const branches: { parent: TreeNode; child: TreeNode }[] = [];
  const collectBranches = (node: TreeNode) => {
    node.children.forEach((child) => {
      if (child.id !== -1) {
        branches.push({ parent: node.id === -1 ? child : node, child });
      }
      collectBranches(child);
    });
  };
  if (treeRoot) collectBranches(treeRoot);

  // Max depth for color gradient
  const maxDepth = allNodes.reduce((m, n) => Math.max(m, n.depth), 0);

  // Branch color by depth
  const getBranchColor = (depth: number): string => {
    const colors = [
      '#8B6914', // dark gold trunk
      '#A0842B',
      '#B59A42',
      '#C8AD59',
      '#D4BE6F',
      '#DFCF86',
      '#E8D99D',
      '#9EC7A3',
      '#79B586',
      '#5BA36A',
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  // Branch thickness by depth (moderate at root, thin at leaves)
  const getBranchWidth = (depth: number): number => {
    const base = 5;
    return Math.max(1, base - depth * 0.5);
  };

  // Node color by gender
  const getNodeColor = (person: Person): string => {
    return person.gender === 'MALE' ? '#10b981' : '#ec4899';
  };

  const getNodeBg = (person: Person): string => {
    return person.gender === 'MALE' ? '#064e3b' : '#831843';
  };

  // Toggle collapse
  const toggleCollapse = (id: number) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { x: panX, y: panY };
      hasMovedRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      // Only recognize drag if mouse moved more than 4px
      if (hasMovedRef.current || Math.sqrt(dx * dx + dy * dy) > 4) {
        hasMovedRef.current = true;
        setPanX(panStartRef.current.x + dx);
        setPanY(panStartRef.current.y + dy);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fit to view
  const fitView = () => {
    setZoom(0.5);
    setPanX(0);
    setPanY(0);
  };

  // Export to SVG
  const exportToSVG = () => {
    if (!svgRef.current) return;
    
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);
      
      // Inject required namespaces if not present
      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }
      
      source = '<?xml version="1.0" encoding="utf-8"?>\n' + source;
      
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `family_tree_${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SVG:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 dir-rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            جاري تحميل الشجرة الدائرية...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* ===== SVG Canvas ===== */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="select-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: '50% 100%',
          }}
        >
          {/* Background generation rings */}
          {Array.from({ length: maxDepth + 1 }, (_, i) => i).map((depth) => {
            if (depth === 0) return null;
            const r = depth * branchLength;
            return (
              <circle
                key={`ring-${depth}`}
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-slate-300 dark:text-slate-800"
                opacity={0.4}
                strokeDasharray="6,6"
              />
            );
          })}

          {/* Branches (thick curved lines) */}
          {branches.map(({ parent, child }, i) => {
            const parentDepth = parent.id === -1 ? 0 : parent.depth;
            return (
              <path
                key={`branch-${i}`}
                d={generateBranchPath(parent, child, centerX, centerY)}
                fill="none"
                stroke={getBranchColor(parentDepth)}
                strokeWidth={getBranchWidth(parentDepth)}
                strokeLinecap="round"
                opacity={0.85}
                className="transition-opacity duration-200"
              />
            );
          })}

          {/* Node circles + names */}
          {allNodes.map((node) => {
            const p = node.person;
            const isHovered = hoveredNode === node.id;
            const hasKids = (node.children.length > 0) || collapsedNodes.has(node.id);
            const isCollapsed = collapsedNodes.has(node.id);
            const nodeRadius = node.depth === 0 ? 20 : 10;

            // Label rotation: align text along the radial direction
            const angleDeg = (node.angleMid * 180) / Math.PI;
            const flipText = angleDeg > 90 && angleDeg < 270;
            const textRotation = flipText ? angleDeg - 180 : angleDeg;

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => hasKids && toggleCollapse(node.id)}
              >
                {/* Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? nodeRadius + 4 : nodeRadius}
                  fill={getNodeBg(p)}
                  stroke={getNodeColor(p)}
                  strokeWidth={node.depth === 0 ? 4 : 2.5}
                  className="transition-all duration-200"
                />

                {/* Deceased indicator */}
                {!p.is_alive && (
                  <circle
                    cx={node.x + nodeRadius * 0.6}
                    cy={node.y - nodeRadius * 0.6}
                    r={3}
                    fill="#a1a1aa"
                    stroke="white"
                    strokeWidth={1}
                  />
                )}

                {/* Collapse indicator */}
                {isCollapsed && (
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize={12}
                    fontWeight="bold"
                  >
                    +
                  </text>
                )}

                {/* Name label - rotated along radial direction */}
                <g transform={`translate(${node.x}, ${node.y}) rotate(${-textRotation})`}>
                  {(() => {
                    const name = p.first_name || '';
                    const labelWidth = Math.max(50, name.length * 8 + 16);
                    const offset = nodeRadius + 6;
                    
                    const rectX = flipText ? -offset - labelWidth : offset;
                    const textX = flipText ? -offset - labelWidth / 2 : offset + labelWidth / 2;

                    return (
                      <>
                        {/* Background pill for name */}
                        <rect
                          x={rectX}
                          y={-10}
                          width={labelWidth}
                          height={20}
                          rx={8}
                          fill={isHovered ? getNodeColor(p) : 'white'}
                          fillOpacity={isHovered ? 0.95 : 0.9}
                          stroke={getNodeColor(p)}
                          strokeWidth={1.5}
                          className="dark:fill-slate-900 dark:fill-opacity-90 shadow-sm"
                        />
                        <text
                          x={textX}
                          y={4}
                          textAnchor="middle"
                          fill={isHovered ? 'white' : '#1e293b'}
                          fontSize={node.depth === 0 ? 12 : 10.5}
                          fontWeight="700"
                          fontFamily="Cairo, sans-serif"
                          className="dark:fill-slate-100 select-none"
                        >
                          {name}
                        </text>
                      </>
                    );
                  })()}
                </g>

                {/* Hover tooltip with full info */}
                {isHovered && (() => {
                  const fullName = [p.first_name, p.father_name, p.grand_father_name, p.family_name]
                    .filter(Boolean)
                    .join(' ');
                  const tooltipWidth = Math.max(200, fullName.length * 7 + 35);
                  const descendantCount = getDescendantsCount(node.id);

                  return (
                    <g>
                      <rect
                        x={node.x - tooltipWidth / 2}
                        y={node.y - nodeRadius - 80}
                        width={tooltipWidth}
                        height={66}
                        rx={12}
                        fill="white"
                        fillOpacity={0.98}
                        stroke={getNodeColor(p)}
                        strokeWidth={2.5}
                        className="dark:fill-slate-900 shadow-xl"
                      />
                      {/* Name */}
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 58}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize={12.5}
                        fontWeight="800"
                        fontFamily="Cairo, sans-serif"
                        direction="rtl"
                        className="dark:fill-white"
                      >
                        {fullName}
                      </text>
                      {/* Status / Birth Year */}
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 38}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize={9.5}
                        fontFamily="Cairo, sans-serif"
                        className="dark:fill-slate-400"
                      >
                        {p.is_alive ? '🟢 حي' : '⚫ متوفى'}{' '}
                        {p.birth_year ? `• مواليد ${p.birth_year}` : ''}
                      </text>
                      {/* Descendants Count */}
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 20}
                        textAnchor="middle"
                        fill="#059669"
                        fontSize={10.5}
                        fontWeight="bold"
                        fontFamily="Cairo, sans-serif"
                        className="dark:fill-emerald-400"
                      >
                        {`عدد الذرية: ${descendantCount} فرد`}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Root ancestor name at center bottom */}
          {treeRoot && treeRoot.id !== -1 && (
            <text
              x={centerX}
              y={centerY + 40}
              textAnchor="middle"
              fill="#10b981"
              fontSize={18}
              fontWeight="900"
              fontFamily="Cairo, sans-serif"
            >
              {treeRoot.person.first_name} {treeRoot.person.father_name || ''}{' '}
              {treeRoot.person.family_name || ''}
            </text>
          )}
        </svg>
      </div>

      {/* ===== Controls Panel ===== */}
      <div className={`absolute ${isFs ? 'top-4' : 'top-24'} right-4 z-40 flex flex-col gap-3 w-[220px] dir-rtl transition-all duration-300`}>
        {/* Sliders */}
        <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center justify-between">
            <span>🌳 التحكم بتفرع الشجرة</span>
          </h3>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`w-full py-2 px-3 rounded-xl font-bold text-[11.5px] border transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              isFs
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isFs ? <Minimize className="w-4 h-4 text-amber-500" /> : <Maximize className="w-4 h-4 text-emerald-500" />}
            <span>{isFs ? 'إنهاء ملء الشاشة' : 'عرض ملء الشاشة'}</span>
          </button>

          {/* Arc Angle */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span>استدارة الشجرة</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{arcAngle}°</span>
            </div>
            <input
              type="range"
              min="90"
              max="360"
              step="10"
              value={arcAngle}
              onChange={(e) => setArcAngle(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Branch Length */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span>طول الفرع</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{branchLength}px</span>
            </div>
            <input
              type="range"
              min="60"
              max="250"
              step="10"
              value={branchLength}
              onChange={(e) => setBranchLength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Zoom */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span>التكبير</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Reset buttons */}
          <div className="flex gap-2">
            <button
              onClick={fitView}
              className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition-all"
            >
              ضبط العرض
            </button>
            {collapsedNodes.size > 0 && (
              <button
                onClick={() => setCollapsedNodes(new Set())}
                className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30 transition-all"
              >
                فتح الفروع ({collapsedNodes.size})
              </button>
            )}
          </div>

          {/* Export SVG Button */}
          <button
            onClick={exportToSVG}
            className="w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[11.5px] border border-blue-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4.5 h-4.5" />
            تصدير الشجرة كـ SVG
          </button>
        </div>

        {/* Stats */}
        <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex justify-around">
          <span>👥 {allNodes.length} فرد</span>
          <span>🌿 {maxDepth} جيل</span>
          <span>🔗 {branches.length} رابطة</span>
        </div>
      </div>

      {/* Prominent Floating Fullscreen Button (Bottom-Left) */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl font-black text-xs border shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-center gap-2.5 dir-rtl hover:scale-105 ${
          isFs
            ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-950/50 ring-2 ring-amber-500/30'
            : 'bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50 ring-2 ring-emerald-500/30 hover:border-emerald-400'
        }`}
      >
        {isFs ? (
          <>
            <Minimize className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            <span>إنهاء ملء الشاشة</span>
          </>
        ) : (
          <>
            <Maximize className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            <span>عرض ملء الشاشة (Full Screen)</span>
          </>
        )}
      </button>
    </div>
  );
};
