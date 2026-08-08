'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  Connection,
  ConnectionMode,
} from '@xyflow/react';

import { PersonNode, PersonNodeData } from './PersonNode';
import { AddRelationModal } from './AddRelationModal';
import { AddSpouseModal } from './AddSpouseModal';
import { EditPersonModal } from './EditPersonModal';
import { ClaimProfileModal } from './ClaimProfileModal';

import { AuthModal } from './AuthModal';
import { LinkNodesModal } from './LinkNodesModal';
import { DeleteRelationModal } from './DeleteRelationModal';
import { PersonProfileModal } from './PersonProfileModal';
import { LayoutToolbar, VisualFilter } from './LayoutToolbar';
import { Navbar } from './Navbar';

import { getLayoutedElements, LayoutDirection } from '../lib/layout';
import { getPentanyicFullName } from '../lib/lineage';
import { Person, Relationship, RelationshipType, MergeRequest } from '../types';
import { createClient } from '../lib/supabase/client';
import { useAuth } from '../context/AuthContext';
import { normalizeForSearch, sortSearchResults, filterAndSortSearchResults } from '../lib/dedup';

import {
  ShieldCheck,
  Search,
  UserCheck,
  Sparkles,
  PlusCircle,
  GitBranch,
  Maximize,
  Minimize,
} from 'lucide-react';

const nodeTypes = {
  personNode: PersonNode,
};

function FamilyTreeCanvasContent() {
  const { user, dbUser, role, loading: authLoading } = useAuth();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const hasAutoCenteredRef = useRef(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutDirection>('BT');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Branch collapse state & Visual filter state
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<VisualFilter>('ALL');

  const pendingFocusNodeIdRef = useRef<number | null>(null);

  // Raw fetched graph cache to re-apply filtering & collapse on the fly
  const rawNodesRef = useRef<any[]>([]);
  const rawEdgesRef = useRef<any[]>([]);

  // Spacing settings state & refs
  const [nodeSep, setNodeSepState] = useState(60);
  const [rankSep, setRankSepState] = useState(200);
  const nodeSepRef = useRef(60);
  const rankSepRef = useRef(200);

  const collapsedNodesRef = useRef(collapsedNodes);
  collapsedNodesRef.current = collapsedNodes;

  const currentLayoutRef = useRef(currentLayout);
  currentLayoutRef.current = currentLayout;

  const activeFilterRef = useRef(activeFilter);
  activeFilterRef.current = activeFilter;

  const setNodeSep = (val: number) => {
    nodeSepRef.current = val;
    setNodeSepState(val);
  };

  const setRankSep = (val: number) => {
    rankSepRef.current = val;
    setRankSepState(val);
  };

  // App Data State
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [allPersonsMap, setAllPersonsMap] = useState<Map<number, Person>>(new Map());
  const [allRelationships, setAllRelationships] = useState<Relationship[]>([]);
  const [pendingRelationships, setPendingRelationships] = useState<Relationship[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTargetPerson, setSelectedTargetPerson] = useState<Person | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('PARENT');

  const [isAddSpouseModalOpen, setIsAddSpouseModalOpen] = useState(false);
  const [selectedSpouseTargetPerson, setSelectedSpouseTargetPerson] = useState<Person | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditPerson, setSelectedEditPerson] = useState<Person | null>(null);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTargetPerson, setClaimTargetPerson] = useState<Person | null>(null);



  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfilePerson, setSelectedProfilePerson] = useState<Person | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkSourcePerson, setLinkSourcePerson] = useState<Person | null>(null);
  const [linkTargetPerson, setLinkTargetPerson] = useState<Person | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteRelId, setDeleteRelId] = useState<number | null>(null);
  const [deleteSourcePerson, setDeleteSourcePerson] = useState<Person | null>(null);
  const [deleteTargetPerson, setDeleteTargetPerson] = useState<Person | null>(null);
  const [deleteRelType, setDeleteRelType] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFocusPerson = useCallback(
    (targetId: number) => {
      const targetNode = reactFlowInstance.getNode(targetId.toString());
      if (targetNode) {
        reactFlowInstance.setCenter(targetNode.position.x + 140, targetNode.position.y + 70, {
          zoom: 1.2,
          duration: 800,
        });
      }
    },
    [reactFlowInstance]
  );

  // Toggle single branch collapse
  const handleToggleCollapseNode = useCallback((personId: number) => {
    pendingFocusNodeIdRef.current = personId;
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }, []);

  // Direction switch handler (Root Top ⬇️ vs Root Bottom ⬆️)
  const handleToggleDirection = useCallback(() => {
    setCurrentLayout((prev) => (prev === 'BT' ? 'TB' : 'BT'));
  }, []);

  // Compute Layout with Generation Levels and Collapsed Subtrees
  const applyGraphLayout = useCallback(
    (
      rawNodes: any[],
      rawEdges: any[],
      layoutDir: LayoutDirection,
      collapsedSet: Set<number>,
      filterMode: VisualFilter,
      ns: number,
      rs: number
    ) => {
      if (!rawNodes || rawNodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      // 1. Build adjacency maps for generation levels and subtree collapse
      const parentMap = new Map<string, string[]>();
      const childrenMap = new Map<string, string[]>();

      rawEdges.forEach((e: any) => {
        const relType = e.data?.relationship_type;
        // Ignore SPOUSE edges when constructing parent->child lineage hierarchy
        if (relType === 'SPOUSE') return;

        let parentId: string;
        let childId: string;

        if (relType === 'CHILD') {
          // For CHILD relationship: target is parent, source is child
          parentId = e.target;
          childId = e.source;
        } else {
          // For PARENT relationship (default): source is parent, target is child
          parentId = e.source;
          childId = e.target;
        }

        if (!parentMap.has(childId)) parentMap.set(childId, []);
        parentMap.get(childId)!.push(parentId);

        if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
        childrenMap.get(parentId)!.push(childId);
      });

      // 2. Compute Generation Levels (BFS from roots)
      const genMap = new Map<string, number>();
      const rootIds = rawNodes
        .map((n: any) => n.id)
        .filter((id: string) => !parentMap.has(id) || parentMap.get(id)!.length === 0);

      const queue: { id: string; gen: number }[] = rootIds.map((id: string) => ({ id, gen: 1 }));
      const visitedGen = new Set<string>();

      while (queue.length > 0) {
        const { id, gen } = queue.shift()!;
        if (visitedGen.has(id)) continue;
        visitedGen.add(id);

        const currentGen = genMap.get(id) ?? 1;
        genMap.set(id, Math.max(currentGen, gen));

        const children = childrenMap.get(id) || [];
        children.forEach((cId) => {
          queue.push({ id: cId, gen: gen + 1 });
        });
      }

      rawNodes.forEach((n: any) => {
        if (!genMap.has(n.id)) genMap.set(n.id, 1);
      });

      // 3. Compute hidden nodes due to collapsed parent branches
      // Note: Only descendants (children, grandchildren, etc.) of a collapsed node are hidden.
      // The origin node itself and all its parents/ancestors ALWAYS remain visible.
      const hiddenNodeIds = new Set<string>();
      const collectDescendants = (parentId: string) => {
        const children = childrenMap.get(parentId) || [];
        children.forEach((cId) => {
          if (!hiddenNodeIds.has(cId)) {
            hiddenNodeIds.add(cId);
            collectDescendants(cId);
          }
        });
      };

      collapsedSet.forEach((pId) => {
        collectDescendants(pId.toString());
      });

      // 4. Filter active nodes & edges
      const activeRawNodes = rawNodes.filter((n: any) => !hiddenNodeIds.has(n.id));
      const activeRawEdges = rawEdges.filter(
        (e: any) => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target)
      );

      // 5. Enrich node data
      const enrichedNodes = activeRawNodes.map((node: any) => {
        const pIdNum = parseInt(node.id, 10);
        const childrenList = childrenMap.get(node.id) || [];
        const genLevel = genMap.get(node.id) || 1;
        const pData = node.data as Person;
        const isMarried = (node.data.spouses && node.data.spouses.length > 0) || false;

        return {
          ...node,
          data: {
            ...node.data,
            generationLevel: genLevel,
            isMarried: isMarried,
            hasChildren: childrenList.length > 0,
            directChildrenCount: childrenList.length,
            isCollapsed: collapsedSet.has(pIdNum),
            activeFilter: filterMode,
            onToggleCollapse: handleToggleCollapseNode,
            onAddRelation: (person: Person, relType: RelationshipType) => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              setSelectedTargetPerson(person);
              setSelectedRelationType(relType);
              setIsAddModalOpen(true);
            },
            onOpenAddSpouse: (person: Person) => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              setSelectedSpouseTargetPerson(person);
              setIsAddSpouseModalOpen(true);
            },
            onEditPerson: (person: Person) => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              setSelectedEditPerson(person);
              setIsEditModalOpen(true);
            },
            onClaimProfile: (person: Person) => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              setClaimTargetPerson(person);
              setIsClaimModalOpen(true);
            },
            onViewLineage: (person: Person) => {
              setSelectedProfilePerson(person);
              setIsProfileModalOpen(true);
            },
            onFocusPerson: handleFocusPerson,
          } as PersonNodeData,
        };
      });

      // 6. Compute layout positioning
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        enrichedNodes,
        activeRawEdges,
        layoutDir,
        { nodesep: ns, ranksep: rs }
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Auto-focus camera on target parent node after branch collapse/expand
      if (pendingFocusNodeIdRef.current !== null) {
        const focusId = pendingFocusNodeIdRef.current;
        pendingFocusNodeIdRef.current = null;

        const targetNode = layoutedNodes.find((n) => n.id === focusId.toString());
        if (targetNode) {
          setTimeout(() => {
            const currentViewport = reactFlowInstance.getViewport();
            const currentZoom = currentViewport?.zoom || 1.1;
            const targetZoom = currentZoom > 0.4 ? Math.min(currentZoom, 1.2) : 1.1;

            reactFlowInstance.setCenter(
              targetNode.position.x + 140,
              targetNode.position.y + 70,
              { zoom: targetZoom, duration: 800 }
            );
          }, 50);
        }
      }
    },
    [user, handleFocusPerson, handleToggleCollapseNode, setNodes, setEdges, reactFlowInstance]
  );

  // Load Tree Data from Backend API
  const fetchTreeData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/tree/canvas?role=${role}`);
      const data = await res.json();

      if (data.nodes && data.edges) {
        rawNodesRef.current = data.nodes;
        rawEdgesRef.current = data.edges;

        applyGraphLayout(
          data.nodes,
          data.edges,
          currentLayoutRef.current,
          collapsedNodesRef.current,
          activeFilterRef.current,
          nodeSepRef.current,
          rankSepRef.current
        );

        const pList = data.nodes.map((n: any) => n.data as Person);
        setAllPersons(pList);
        const map = new Map<number, Person>();
        pList.forEach((p: Person) => map.set(p.id, p));
        setAllPersonsMap(map);

        const parsedRels: Relationship[] = data.edges.map((e: any) => ({
          id: parseInt(e.id.replace('e-', ''), 10),
          person_id: parseInt(e.target, 10),
          related_person_id: parseInt(e.source, 10),
          relationship_type: e.data?.relationship_type || 'PARENT',
          status: e.data?.status || 'VERIFIED',
          created_at: new Date().toISOString(),
        }));
        setAllRelationships(parsedRels);

        const pend = parsedRels.filter((r) => r.status === 'PENDING');
        setPendingRelationships(pend);
      }
    } catch (err) {
      console.error('Failed to fetch tree data', err);
    } finally {
      setLoading(false);
    }
  }, [role, applyGraphLayout]);

  // Auto-focus camera on logged-in user's node upon opening the tree
  useEffect(() => {
    // Wait until tree nodes are loaded AND auth state has settled
    if (hasAutoCenteredRef.current || nodes.length === 0 || authLoading || !dbUser) return;

    // Search for logged in user's person node strictly by ID or multi-part name (first + father + grandfather)
    const nameWords = (dbUser.full_name || '').trim().split(/\s+/).filter(Boolean);
    const uFirst = nameWords[0] ? normalizeForSearch(nameWords[0]) : '';
    const uFather = nameWords[1] ? normalizeForSearch(nameWords[1]) : '';
    const uGrand = nameWords[2] ? normalizeForSearch(nameWords[2]) : '';

    const userNode = nodes.find((n) => {
      const p = n.data as unknown as Person;
      if (!p || !p.first_name) return false;

      // 1. Claimed profile ID match (highest priority)
      if (p.claimed_by_user_id && Number(p.claimed_by_user_id) === Number(dbUser.id)) return true;

      // 2. Full combined string match
      const pFullClean = normalizeForSearch(`${p.first_name}${p.father_name || ''}${p.grand_father_name || ''}${p.family_name || ''}`);
      const userFullNameClean = normalizeForSearch(dbUser.full_name || '');
      if (userFullNameClean.length >= 6 && (pFullClean.includes(userFullNameClean) || userFullNameClean.includes(pFullClean))) return true;

      // 3. Strict multi-part match: first_name AND father_name AND (grand_father_name OR family_name)
      const pFirst = normalizeForSearch(p.first_name);
      const pFather = normalizeForSearch(p.father_name || '');
      const pGrand = normalizeForSearch(p.grand_father_name || '');

      if (uFirst && pFirst === uFirst) {
        if (uFather && pFather === uFather) {
          if (!uGrand || pGrand === uGrand) {
            return true;
          }
        }
      }

      return false;
    });

    if (userNode) {
      hasAutoCenteredRef.current = true;
      const targetX = userNode.position.x + 140;
      const targetY = userNode.position.y + 70;

      setTimeout(() => {
        reactFlowInstance.setCenter(targetX, targetY, { zoom: 1.2, duration: 0 });
      }, 350);
    }
  }, [dbUser, user, authLoading, nodes, reactFlowInstance]);

  // Re-apply graph layout whenever direction, collapsed nodes, or filter change
  useEffect(() => {
    if (rawNodesRef.current.length > 0) {
      applyGraphLayout(
        rawNodesRef.current,
        rawEdgesRef.current,
        currentLayout,
        collapsedNodes,
        activeFilter,
        nodeSepRef.current,
        rankSepRef.current
      );
    }
  }, [currentLayout, collapsedNodes, activeFilter, applyGraphLayout]);

  useEffect(() => {
    fetchTreeData();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholder = !supabaseUrl || supabaseUrl.includes('familytree.supabase.co');

    if (!isPlaceholder) {
      try {
        const supabase = createClient();
        const channel = supabase
          .channel('relationships_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'relationships' }, () => {
            fetchTreeData();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch {
        // Safe catch
      }
    }
  }, [fetchTreeData]);

  const handleSelectLayout = useCallback((direction: LayoutDirection) => {
    setCurrentLayout(direction);
  }, []);

  // Global Expand/Collapse All Branches Toggle
  const handleToggleExpandAll = useCallback(() => {
    if (collapsedNodes.size > 0) {
      setCollapsedNodes(new Set());
    } else {
      const parentIdsWithChildren = new Set<number>();
      rawEdgesRef.current.forEach((e: any) => {
        const srcId = parseInt(e.source, 10);
        if (srcId) parentIdsWithChildren.add(srcId);
      });
      setCollapsedNodes(parentIdsWithChildren);
    }
  }, [collapsedNodes]);

  const updateLayoutSpacing = (ns: number, rs: number) => {
    if (rawNodesRef.current.length > 0) {
      applyGraphLayout(
        rawNodesRef.current,
        rawEdgesRef.current,
        currentLayout,
        collapsedNodes,
        activeFilter,
        ns,
        rs
      );
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const srcId = parseInt(connection.source, 10);
      const tgtId = parseInt(connection.target, 10);

      const srcPerson = allPersonsMap.get(srcId);
      const tgtPerson = allPersonsMap.get(tgtId);

      if (srcPerson && tgtPerson) {
        if (!user) {
          setIsAuthModalOpen(true);
          return;
        }
        setLinkSourcePerson(srcPerson);
        setLinkTargetPerson(tgtPerson);
        setIsLinkModalOpen(true);
      }
    },
    [allPersonsMap, user]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }

      const relId = parseInt(edge.id.replace('e-', ''), 10);
      const srcId = parseInt(edge.source, 10);
      const tgtId = parseInt(edge.target, 10);

      const srcPerson = allPersonsMap.get(srcId);
      const tgtPerson = allPersonsMap.get(tgtId);

      if (relId && srcPerson && tgtPerson) {
        setDeleteRelId(relId);
        setDeleteSourcePerson(srcPerson);
        setDeleteTargetPerson(tgtPerson);
        setDeleteRelType((edge.data?.relationship_type as string) || 'PARENT');
        setIsDeleteModalOpen(true);
      }
    },
    [allPersonsMap, user]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];

    const fullNamesMap = new Map<number, string>();
    allPersons.forEach((p) => {
      fullNamesMap.set(p.id, getPentanyicFullName(p, allPersonsMap, allRelationships));
    });

    return filterAndSortSearchResults(allPersons, searchQuery, fullNamesMap).slice(0, 30);
  }, [allPersons, allPersonsMap, allRelationships, searchQuery]);

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري تحميل منصة شجرة العائلة الكبرى...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Single Unified Action & Layout Control Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md dir-rtl z-30">
        {/* Right side: Search Bar */}
        <div className="relative max-w-xs w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو سنة الميلاد..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-9 pl-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    handleFocusPerson(p.id);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs border-b border-slate-800/50"
                >
                  <span className="font-bold text-slate-200 truncate max-w-[240px]" title={getPentanyicFullName(p, allPersonsMap, allRelationships)}>
                    {getPentanyicFullName(p, allPersonsMap, allRelationships)}
                  </span>
                  <span className="text-slate-400 text-[11px]">({p.birth_year || 'عام مجهول'})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Left side: Layout Direction, Presets, Filters & View Options */}
        <LayoutToolbar
          activeDirection={currentLayout}
          onSelectLayout={handleSelectLayout}
          onToggleDirection={handleToggleDirection}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onToggleExpandAll={handleToggleExpandAll}
          isAllCollapsed={collapsedNodes.size > 0}
          onFitView={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 600 })}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Main Canvas Area */}
      <main className="flex-1 w-full h-full relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            جاري تحميل كائن الكانفاس وشجرة الأنساب...
          </div>
        ) : nodes.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center dir-rtl p-6">
            <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-10 max-w-lg w-full text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-600/30 animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-100">شجرة العائلة فارغة حالياً</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  مرحباً بك! لا يوجد أي أفراد مضافين حالياً. ابدأ بتوثيق نسبك وبناء شجرة عائلتك الكبرى عن طريق إضافة أول فرد (الجد أو الأصل الأول)!
                </p>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setSelectedTargetPerson(null);
                  setIsAddModalOpen(true);
                }}
                className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" />
                إضافة الجد والأصل الأول للشجرة الآن
              </button>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            minZoom={0.05}
            maxZoom={2.5}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#059669', strokeWidth: 2.5 },
            }}
          >
            <Background color="#1e293b" gap={24} size={1.5} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
            
            {/* Spacing Control Panel - Bottom Right */}
            <div className="absolute bottom-4 right-4 z-10 w-72 p-4 bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col gap-3.5 text-slate-100 dir-rtl">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-xs">إعدادات أبعاد الشجرة</span>
              </div>

              {/* Horizontal Spacing */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>التباعد الأفقي (بين البطاقات)</span>
                  <span className="text-emerald-400 font-bold">{nodeSep}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={nodeSep}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNodeSep(val);
                    updateLayoutSpacing(val, rankSep);
                  }}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Vertical Spacing */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>التباعد العمودي (بين الأجيال)</span>
                  <span className="text-emerald-400 font-bold">{rankSep}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="250"
                  step="10"
                  value={rankSep}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRankSep(val);
                    updateLayoutSpacing(nodeSep, val);
                  }}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNodeSep(60);
                    setRankSep(200);
                    updateLayoutSpacing(60, 200);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-bold text-[10.5px] border border-slate-700 transition-all text-center"
                >
                  إعادة الضبط
                </button>
                <button
                  type="button"
                  onClick={() => reactFlowInstance.fitView({ padding: 0.2, duration: 600 })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10.5px] border border-emerald-500/30 transition-all text-center"
                >
                  ضبط الاحتواء
                </button>
              </div>
            </div>

          </ReactFlow>
        )}

        {/* Prominent Floating Fullscreen Button (Bottom-Left) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl font-black text-xs border shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-center gap-2.5 dir-rtl hover:scale-105 ${
            isFullscreen
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-950/50 ring-2 ring-amber-500/30'
              : 'bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50 ring-2 ring-emerald-500/30 hover:border-emerald-400'
          }`}
        >
          {isFullscreen ? (
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
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          fetchTreeData();
        }}
      />

      <AddRelationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTargetPerson(null);
        }}
        targetPerson={selectedTargetPerson}
        initialRelationType={selectedRelationType}
        userRole={role}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchTreeData();
        }}
      />

      <AddSpouseModal
        isOpen={isAddSpouseModalOpen}
        onClose={() => {
          setIsAddSpouseModalOpen(false);
          setSelectedSpouseTargetPerson(null);
        }}
        targetPerson={selectedSpouseTargetPerson}
        allPersons={allPersons}
        onSuccess={() => {
          setIsAddSpouseModalOpen(false);
          fetchTreeData();
        }}
      />

      <EditPersonModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditPerson(null);
        }}
        person={selectedEditPerson}
        allPersonsMap={allPersonsMap}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchTreeData();
        }}
      />

      <ClaimProfileModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimTargetPerson(null);
        }}
        targetPerson={claimTargetPerson}
        allPersons={allPersons}
        onSuccess={() => {
          setIsClaimModalOpen(false);
          fetchTreeData();
        }}
      />



      <LinkNodesModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setLinkSourcePerson(null);
          setLinkTargetPerson(null);
        }}
        sourcePerson={linkSourcePerson}
        targetPerson={linkTargetPerson}
        userRole={role}
        onSuccess={() => {
          setIsLinkModalOpen(false);
          fetchTreeData();
        }}
      />

      <DeleteRelationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteRelId(null);
        }}
        relationshipId={deleteRelId}
        sourcePerson={deleteSourcePerson}
        targetPerson={deleteTargetPerson}
        relationshipType={deleteRelType}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          fetchTreeData();
        }}
      />

      <PersonProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfilePerson(null);
        }}
        person={selectedProfilePerson}
        allPersonsMap={allPersonsMap}
        relationships={allRelationships}
        collapsedNodes={collapsedNodes}
        onToggleCollapse={handleToggleCollapseNode}
        onEditPerson={(p) => {
          setSelectedEditPerson(p);
          setIsEditModalOpen(true);
        }}
        onSelectPerson={(p) => handleFocusPerson(p.id)}
        onClaimProfile={(p) => {
          setIsProfileModalOpen(false);
          if (!user) {
            setIsAuthModalOpen(true);
            return;
          }
          setClaimTargetPerson(p);
          setIsClaimModalOpen(true);
        }}
      />
    </div>
  );
}

export const FamilyTreeCanvas = dynamic(() => Promise.resolve(FamilyTreeCanvasContent), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
      جاري تحميل منصة شجرة العائلة الكبرى...
    </div>
  ),
});
