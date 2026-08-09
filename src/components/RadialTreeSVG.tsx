'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Person, Relationship } from '../types';
import { createClient } from '../lib/supabase/client';
import { Download, Maximize, Minimize, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { PersonProfileModal } from './PersonProfileModal';

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
  const [selectedPersonForModal, setSelectedPersonForModal] = useState<Person | null>(null);

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
  const [arcAngle, setArcAngle] = useState(360);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [branchLength, setBranchLength] = useState(200); // Base radial distance
  const [zoom, setZoom] = useState(0.4); // Framed default zoom
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);


  // Persons Map for quick lookup
  const personsMap = useMemo(() => {
    const map = new Map<number, Person>();
    persons.forEach((p) => map.set(p.id, p));
    return map;
  }, [persons]);

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
                  id: parseInt(String(e.id).replace('e-', ''), 10) || Date.now(),
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
  }, [customPersons, customRelationships]);

  // ===== Build hierarchical tree from flat data =====
  const buildTree = useCallback((): TreeNode | null => {
    if (persons.length === 0) return null;

    const pMap = new Map<number, Person>();
    persons.forEach((p) => pMap.set(p.id, p));

    // Build parent->children map
    const childrenMap = new Map<number, number[]>();
    const hasParent = new Set<number>();

    relationships.forEach((rel) => {
      if (rel.relationship_type === 'SPOUSE' || rel.status === 'REJECTED') return;

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

      if (!pMap.has(parentId) || !pMap.has(childId)) return;

      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      const arr = childrenMap.get(parentId)!;
      if (!arr.includes(childId)) arr.push(childId);
      hasParent.add(childId);
    });

    let rootIds = persons.filter((p) => !hasParent.has(p.id)).map((p) => p.id);

    if (initialFocusPersonId && pMap.has(initialFocusPersonId)) {
      const findRoot = (currId: number, visited = new Set<number>()): number => {
        if (visited.has(currId)) return currId;
        visited.add(currId);
        for (const rel of relationships) {
          if (rel.status === 'REJECTED' || rel.relationship_type === 'SPOUSE') continue;
          if (rel.relationship_type === 'PARENT' && rel.person_id === currId) {
            return findRoot(rel.related_person_id, visited);
          }
          if (rel.relationship_type === 'CHILD' && rel.related_person_id === currId) {
            return findRoot(rel.person_id, visited);
          }
        }
        return currId;
      };
      const topRoot = findRoot(initialFocusPersonId);
      if (topRoot) rootIds = [topRoot];
    }

    if (rootIds.length === 0 && persons.length > 0) {
      rootIds = [persons[0].id];
    }

    const visited = new Set<number>();
    const buildNode = (id: number, depth: number): TreeNode | null => {
      if (visited.has(id)) return null;
      visited.add(id);

      const person = pMap.get(id);
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

    if (rootIds.length === 1) {
      return buildNode(rootIds[0], 0);
    }

    const virtualRoot: TreeNode = {
      id: -1,
      person: {
        id: -1,
        first_name: 'أصل الشجرة الجامع',
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
  }, [persons, relationships, collapsedNodes, initialFocusPersonId]);

  // Count total descendants
  const getDescendantsCount = useCallback(
    (personId: number): number => {
      const childrenMap = new Map<number, number[]>();
      relationships.forEach((rel) => {
        if (rel.relationship_type === 'SPOUSE' || rel.status === 'REJECTED') return;
        let pId = rel.related_person_id;
        let cId = rel.person_id;
        if (rel.relationship_type === 'CHILD') {
          pId = rel.person_id;
          cId = rel.related_person_id;
        }
        if (!childrenMap.has(pId)) childrenMap.set(pId, []);
        const arr = childrenMap.get(pId)!;
        if (!arr.includes(cId)) arr.push(cId);
      });

      const visited = new Set<number>();
      const countKids = (pId: number): number => {
        if (visited.has(pId)) return 0;
        visited.add(pId);
        const kids = childrenMap.get(pId) || [];
        let total = kids.length;
        for (const kId of kids) {
          total += countKids(kId);
        }
        return total;
      };

      return countKids(personId);
    },
    [relationships]
  );

  // Compute depth node counts flat map
  const getDepthNodeCounts = useCallback((root: TreeNode): Map<number, number> => {
    const counts = new Map<number, number>();
    const traverse = (node: TreeNode) => {
      if (node.id !== -1) {
        counts.set(node.depth, (counts.get(node.depth) || 0) + 1);
      }
      node.children.forEach(traverse);
    };
    traverse(root);
    return counts;
  }, []);

  // Compute Layout with Guaranteed Ring Circumference
  const computeLayout = useCallback(
    (root: TreeNode, centerX: number, centerY: number) => {
      const arcRad = (arcAngle * Math.PI) / 180;
      const rotRad = (rotationDeg * Math.PI) / 180;

      let startAngle = -Math.PI / 2 + rotRad;
      let endAngle = startAngle + arcRad;

      if (arcAngle === 360) {
        startAngle = rotRad;
        endAngle = rotRad + 2 * Math.PI;
      }

      // 1. Calculate required radius for each depth to guarantee NO node overlap (minimum 65px per node)
      const depthNodeCounts = getDepthNodeCounts(root);
      const depthRadii = new Map<number, number>();
      depthRadii.set(0, 0);

      let currentAccumulatedRadius = 0;
      const maxD = Math.max(...Array.from(depthNodeCounts.keys()), 0);

      for (let d = 1; d <= maxD; d++) {
        const countAtDepth = depthNodeCounts.get(d) || 1;
        // Circumference C = 2 * PI * R => R = C / (2 * PI)
        // We require C >= countAtDepth * 65px
        const requiredRadiusForUncrowdedRing = (countAtDepth * 65) / (2 * Math.PI);
        const minLinearRadius = d * branchLength;

        // Radius is accumulated dynamically so rings stay properly spaced
        const step = Math.max(branchLength, requiredRadiusForUncrowdedRing - currentAccumulatedRadius);
        currentAccumulatedRadius += step;
        depthRadii.set(d, currentAccumulatedRadius);
      }

      root.x = centerX;
      root.y = centerY;
      root.radius = 0;
      root.angleStart = startAngle;
      root.angleEnd = endAngle;
      root.angleMid = (startAngle + endAngle) / 2;

      // Sector partitioning
      const layoutNode = (node: TreeNode, aStart: number, aEnd: number, depth: number) => {
        node.angleStart = aStart;
        node.angleEnd = aEnd;
        node.angleMid = (aStart + aEnd) / 2;
        node.radius = depthRadii.get(depth) || depth * branchLength;

        node.x = centerX + node.radius * Math.cos(node.angleMid);
        node.y = centerY + node.radius * Math.sin(node.angleMid);

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

        // Recenter parent angle at exact midpoint of its children
        if (node.children.length > 0) {
          const firstChildMid = node.children[0].angleMid;
          const lastChildMid = node.children[node.children.length - 1].angleMid;
          node.angleMid = (firstChildMid + lastChildMid) / 2;
          if (depth > 0) {
            node.x = centerX + node.radius * Math.cos(node.angleMid);
            node.y = centerY + node.radius * Math.sin(node.angleMid);
          }
        }
      };

      if (root.id === -1) {
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
      }
    },
    [arcAngle, rotationDeg, branchLength, getDepthNodeCounts]
  );

  const collectNodes = (node: TreeNode): TreeNode[] => {
    const result: TreeNode[] = [node];
    node.children.forEach((c) => {
      result.push(...collectNodes(c));
    });
    return result;
  };

  // ===== Generate TRUE Radial Circular Arc Path (A r r ... L x y) =====
  const generateBranchPath = (parent: TreeNode, child: TreeNode, centerX: number, centerY: number): string => {
    const px = parent.x;
    const py = parent.y;
    const cx = child.x;
    const cy = child.y;

    if (parent.radius === 0) {
      // From root center to 1st generation ring: straight line
      return `M ${px} ${py} L ${cx} ${cy}`;
    }

    const rP = parent.radius;
    const aP = parent.angleMid;
    const aC = child.angleMid;

    // Arc endpoint along parent's ring at child's angle
    const arcX = centerX + rP * Math.cos(aC);
    const arcY = centerY + rP * Math.sin(aC);

    // Determine SVG arc sweep flag
    // Normalize angle difference
    let diff = aC - aP;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const sweepFlag = diff >= 0 ? 1 : 0;
    const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;

    // 1. Draw arc along parent's ring radius rP from parent angle to child angle
    // 2. Draw radial straight line along child angle from rP to rC (child position)
    return `M ${px} ${py} A ${rP} ${rP} 0 ${largeArcFlag} ${sweepFlag} ${arcX} ${arcY} L ${cx} ${cy}`;
  };

  // Render Calculations
  const treeRoot = buildTree();

  const canvasWidth = 7000;
  const canvasHeight = 7000;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  if (treeRoot) {
    computeLayout(treeRoot, centerX, centerY);
  }

  const allNodes = treeRoot ? collectNodes(treeRoot).filter((n) => n.id !== -1) : [];

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

  const maxDepth = allNodes.reduce((m, n) => Math.max(m, n.depth), 0);

  // Compute depth radii for background ring circles
  const depthRadiiMap = useMemo(() => {
    const map = new Map<number, number>();
    allNodes.forEach((n) => {
      if (!map.has(n.depth)) {
        map.set(n.depth, n.radius);
      }
    });
    return map;
  }, [allNodes]);

  const getBranchColor = (depth: number): string => {
    const colors = [
      '#10b981',
      '#059669',
      '#047857',
      '#0f766e',
      '#0284c7',
      '#2563eb',
      '#4f46e5',
      '#7c3aed',
      '#9333ea',
      '#c026d3',
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  const getBranchWidth = (depth: number): number => {
    return Math.max(1.5, 4 - depth * 0.35);
  };

  const getNodeColor = (person: Person): string => {
    return person.gender === 'MALE' ? '#10b981' : '#ec4899';
  };

  const getNodeBg = (person: Person): string => {
    return person.gender === 'MALE' ? '#064e3b' : '#831843';
  };

  const toggleCollapse = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.04 : 0.04;
    setZoom((prev) => Math.max(0.05, Math.min(3, prev + delta)));
  };

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

  const fitView = () => {
    setZoom(0.4);
    setPanX(0);
    setPanY(0);
    setRotationDeg(0);
    setArcAngle(360);
  };

  const exportToSVG = () => {
    if (!svgRef.current) return;
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

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
      downloadLink.download = `radial_family_tree_${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SVG:', err);
    }
  };

  const getGenLabel = (d: number): string => {
    if (d === 0) return 'أصل العائلة (المركز)';
    if (d === 1) return 'الجيل الأول (الأبناء)';
    if (d === 2) return 'الجيل الثاني (الأحفاد)';
    if (d === 3) return 'الجيل الثالث';
    if (d === 4) return 'الجيل الرابع';
    if (d === 5) return 'الجيل الخامس';
    return `الجيل ${d}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 dir-rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <span className="text-xs font-bold text-slate-300">
            جاري رسم المروحة القطبية بالأقواس الدائرية...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
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
            transformOrigin: '50% 50%',
          }}
        >
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central background glow */}
          <circle cx={centerX} cy={centerY} r={branchLength * 1.5} fill="url(#centerGlow)" />

          {/* ===== Concentric Generational Rings ===== */}
          {Array.from({ length: maxDepth + 1 }, (_, i) => i).map((depth) => {
            if (depth === 0) return null;
            const r = depthRadiiMap.get(depth) || depth * branchLength;
            return (
              <g key={`ring-group-${depth}`}>
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={r}
                  fill="none"
                  stroke="#334155"
                  strokeWidth={1.5}
                  strokeDasharray="5,7"
                  opacity={0.45}
                />
                {/* Generation Tag */}
                <rect
                  x={centerX - 65}
                  y={centerY - r - 12}
                  width={130}
                  height={24}
                  rx={12}
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth={1}
                />
                <text
                  x={centerX}
                  y={centerY - r + 4}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                  fontWeight="bold"
                  fontFamily="Cairo, sans-serif"
                >
                  {getGenLabel(depth)}
                </text>
              </g>
            );
          })}

          {/* ===== True Radial Arc Branches ===== */}
          {branches.map(({ parent, child }, i) => {
            const parentDepth = parent.id === -1 ? 0 : parent.depth;
            const isHoveredBranch = hoveredNode === parent.id || hoveredNode === child.id;

            return (
              <path
                key={`branch-${i}`}
                d={generateBranchPath(parent, child, centerX, centerY)}
                fill="none"
                stroke={isHoveredBranch ? '#34d399' : getBranchColor(parentDepth)}
                strokeWidth={isHoveredBranch ? getBranchWidth(parentDepth) + 2.5 : getBranchWidth(parentDepth)}
                strokeLinecap="round"
                opacity={isHoveredBranch ? 1 : 0.8}
                className="transition-all duration-300"
              />
            );
          })}

          {/* ===== Nodes & Cards ===== */}
          {allNodes.map((node) => {
            const p = node.person;
            const isHovered = hoveredNode === node.id;
            const isRootNode = node.depth === 0;
            const hasChildren = node.children.length > 0 || collapsedNodes.has(node.id);
            const isCollapsed = collapsedNodes.has(node.id);

            const nodeRadius = isRootNode ? 26 : node.depth <= 2 ? 14 : 10;

            let angleDeg = ((node.angleMid * 180) / Math.PI) % 360;
            if (angleDeg < 0) angleDeg += 360;

            const flipText = angleDeg > 90 && angleDeg < 270;
            const textRotation = flipText ? angleDeg - 180 : angleDeg;

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedPersonForModal(p)}
              >
                {/* Node Outer Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? nodeRadius + 5 : nodeRadius}
                  fill={getNodeBg(p)}
                  stroke={getNodeColor(p)}
                  strokeWidth={isRootNode ? 4.5 : 2.5}
                  filter={isHovered ? 'url(#glow)' : undefined}
                  className="transition-all duration-200"
                />

                {/* Root node star */}
                {isRootNode && (
                  <text
                    x={node.x}
                    y={node.y + 6}
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize={18}
                    fontWeight="bold"
                  >
                    ★
                  </text>
                )}

                {/* Deceased indicator */}
                {!p.is_alive && !isRootNode && (
                  <circle
                    cx={node.x + nodeRadius * 0.7}
                    cy={node.y - nodeRadius * 0.7}
                    r={3.5}
                    fill="#a1a1aa"
                    stroke="#090d16"
                    strokeWidth={1}
                  />
                )}

                {/* Collapse / Expand Toggle Button */}
                {hasChildren && !isRootNode && (
                  <g onClick={(e) => toggleCollapse(node.id, e)} className="hover:scale-125 transition-transform">
                    <circle
                      cx={node.x - nodeRadius * 0.7}
                      cy={node.y + nodeRadius * 0.7}
                      r={7}
                      fill={isCollapsed ? '#f59e0b' : '#334155'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    <text
                      x={node.x - nodeRadius * 0.7}
                      y={node.y + nodeRadius * 0.7 + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      {isCollapsed ? '+' : '-'}
                    </text>
                  </g>
                )}

                {/* Name Label Badge (Rotated along radial angle) */}
                <g transform={`translate(${node.x}, ${node.y}) rotate(${textRotation})`}>
                  {(() => {
                    const name = p.first_name || 'فرد';
                    const labelWidth = Math.max(50, name.length * 7.5 + 16);
                    const offset = nodeRadius + 7;

                    const rectX = flipText ? -offset - labelWidth : offset;
                    const textX = flipText ? -offset - labelWidth / 2 : offset + labelWidth / 2;

                    return (
                      <g className="transition-all duration-200">
                        {/* Pill Background */}
                        <rect
                          x={rectX}
                          y={-10}
                          width={labelWidth}
                          height={20}
                          rx={10}
                          fill={isHovered ? getNodeColor(p) : '#0f172a'}
                          fillOpacity={0.95}
                          stroke={getNodeColor(p)}
                          strokeWidth={isHovered ? 2 : 1.5}
                          className="shadow-lg"
                        />
                        {/* Person Name Text */}
                        <text
                          x={textX}
                          y={3.5}
                          textAnchor="middle"
                          fill={isHovered ? '#ffffff' : '#f8fafc'}
                          fontSize={isRootNode ? 12 : 10.5}
                          fontWeight="700"
                          fontFamily="Cairo, sans-serif"
                          className="select-none"
                        >
                          {name}
                        </text>
                      </g>
                    );
                  })()}
                </g>

                {/* Hover Full Card Tooltip */}
                {isHovered && (() => {
                  const fullName = [p.first_name, p.father_name, p.grand_father_name, p.family_name]
                    .filter(Boolean)
                    .join(' ');
                  const tooltipWidth = Math.max(220, fullName.length * 7.5 + 30);
                  const descendantCount = getDescendantsCount(node.id);

                  return (
                    <g className="pointer-events-none">
                      <rect
                        x={node.x - tooltipWidth / 2}
                        y={node.y - nodeRadius - 85}
                        width={tooltipWidth}
                        height={72}
                        rx={14}
                        fill="#090d16"
                        fillOpacity={0.98}
                        stroke={getNodeColor(p)}
                        strokeWidth={2}
                        className="shadow-2xl"
                      />
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 62}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={13}
                        fontWeight="800"
                        fontFamily="Cairo, sans-serif"
                      >
                        {fullName}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 42}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={10}
                        fontFamily="Cairo, sans-serif"
                      >
                        {p.gender === 'MALE' ? '👨 ذكر' : '👩 أنثى'} •{' '}
                        {p.is_alive ? '🟢 حي يرزق' : '⚫ متوفى'}{' '}
                        {p.birth_year ? `• مواليد ${p.birth_year}` : ''}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 22}
                        textAnchor="middle"
                        fill="#34d399"
                        fontSize={11}
                        fontWeight="bold"
                        fontFamily="Cairo, sans-serif"
                      >
                        {`إجمالي الذرية: ${descendantCount} فرد | الجيل ${node.depth}`}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Center Root Ancestor Highlight Card */}
          {treeRoot && treeRoot.id !== -1 && (
            <g transform={`translate(${centerX}, ${centerY + 55})`}>
              <rect
                x={-130}
                y={-20}
                width={260}
                height={40}
                rx={20}
                fill="#064e3b"
                stroke="#10b981"
                strokeWidth={2.5}
                className="shadow-2xl"
              />
              <text
                x={0}
                y={5}
                textAnchor="middle"
                fill="#ecfdf5"
                fontSize={15}
                fontWeight="900"
                fontFamily="Cairo, sans-serif"
              >
                👑 أصل العائلة: {treeRoot.person.first_name} {treeRoot.person.family_name || ''}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* ===== Controls Panel (Top Right) ===== */}
      <div
        className={`absolute ${
          isFs ? 'top-4' : 'top-20'
        } right-4 z-40 flex flex-col gap-3 w-[240px] dir-rtl transition-all duration-300`}
      >
        <div className="p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-col gap-3">
          <h3 className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>🌳 التحكم بالشجرة الدائرية</span>
            <button
              onClick={fitView}
              title="إعادة ضبط الرؤية"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </h3>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              isFs
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isFs ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-emerald-400" />}
            <span>{isFs ? 'خروج من ملء الشاشة' : 'ملء الشاشة الكاملة'}</span>
          </button>

          {/* Rotation Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-emerald-400" /> استدارة الدائرة
              </span>
              <span className="text-emerald-400 font-bold">{rotationDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={rotationDeg}
              onChange={(e) => setRotationDeg(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Arc Angle Spread */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>اتساع المروحة الدائرية</span>
              <span className="text-emerald-400 font-bold">{arcAngle}°</span>
            </div>
            <input
              type="range"
              min="180"
              max="360"
              step="10"
              value={arcAngle}
              onChange={(e) => setArcAngle(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Branch Radius Length */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>توسع قطر الدوائر</span>
              <span className="text-emerald-400 font-bold">{branchLength}px</span>
            </div>
            <input
              type="range"
              min="100"
              max="350"
              step="10"
              value={branchLength}
              onChange={(e) => setBranchLength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Zoom */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-emerald-400" /> التكبير والتصغير
              </span>
              <span className="text-emerald-400 font-bold">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="300"
              step="5"
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Expand all button if collapsed */}
          {collapsedNodes.size > 0 && (
            <button
              onClick={() => setCollapsedNodes(new Set())}
              className="w-full py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all"
            >
              إظهار الفروع المطوية ({collapsedNodes.size})
            </button>
          )}

          {/* Export SVG Button */}
          <button
            onClick={exportToSVG}
            className="w-full py-2 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-500/40 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            تصدير الشجرة كـ SVG
          </button>
        </div>

        {/* Live Tree Stats */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-md text-xs text-slate-300 font-semibold flex justify-around">
          <span>👥 {allNodes.length} فرد</span>
          <span>🌿 {maxDepth} أجيال</span>
          <span>🔗 {branches.length} رابطة</span>
        </div>
      </div>

      {/* Floating Bottom Action */}
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
            <span>خروج من ملء الشاشة</span>
          </>
        ) : (
          <>
            <Maximize className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            <span>عرض ملء الشاشة</span>
          </>
        )}
      </button>

      {/* Person Detail Modal */}
      {selectedPersonForModal && (
        <PersonProfileModal
          isOpen={!!selectedPersonForModal}
          onClose={() => setSelectedPersonForModal(null)}
          person={selectedPersonForModal}
          allPersonsMap={personsMap}
          relationships={relationships}
          collapsedNodes={collapsedNodes}
          onToggleCollapse={(pId) => toggleCollapse(pId)}
        />
      )}
    </div>
  );
};



