'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  ConnectionMode,
} from '@xyflow/react';

import { PersonNode, PersonNodeData } from './PersonNode';
import { PersonProfileModal } from './PersonProfileModal';
import { LayoutToolbar } from './LayoutToolbar';
import { Navbar } from './Navbar';
import { AuthModal } from './AuthModal';

import { getLayoutedElements, LayoutDirection } from '../lib/layout';
import { findCommonAncestorLineage } from '../lib/ancestorFinder';
import { filterTreeByFocus } from '../lib/treeFilter';
import { exportCanvasToSvg } from '../lib/exportSvg';
import { getPentanyicFullName } from '../lib/lineage';
import { Person, Relationship } from '../types';
import { useAuth } from '../context/AuthContext';
import { normalizeForSearch, sortSearchResults, filterAndSortSearchResults } from '../lib/dedup';

import {
  Search,
  Share2,
  Download,
  CheckCircle,
  Crown,
  GitMerge,
  RefreshCw,
  Users,
  AlertCircle,
} from 'lucide-react';

const nodeTypes = {
  personNode: PersonNode,
};

interface CommonAncestorCanvasContentProps {
  initialPersonAId?: number | null;
  initialPersonBId?: number | null;
}

function CommonAncestorCanvasContent({
  initialPersonAId = null,
  initialPersonBId = null,
}: CommonAncestorCanvasContentProps) {
  const { user, dbUser, role } = useAuth();
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [exportingSvg, setExportingSvg] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutDirection>('BT');

  // Tree Raw Data from Server API
  const [rawPersons, setRawPersons] = useState<Person[]>([]);
  const [rawPersonsMap, setRawPersonsMap] = useState<Map<number, Person>>(new Map());
  const [rawRelationships, setRawRelationships] = useState<Relationship[]>([]);

  // Person A and Person B selection state
  const [personAId, setPersonAId] = useState<number | null>(initialPersonAId);
  const [personBId, setPersonBId] = useState<number | null>(initialPersonBId);

  const [searchAQuery, setSearchAQuery] = useState('');
  const [searchBQuery, setSearchBQuery] = useState('');

  // Kinship metrics result
  const [lcaNode, setLcaNode] = useState<Person | null>(null);
  const [degreeText, setDegreeText] = useState<string>('');

  // Modals & Toast
  const [selectedProfilePerson, setSelectedProfilePerson] = useState<Person | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Tree Data from Server API
  const fetchTreeData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/tree/canvas?role=${role}`);
      const data = await res.json();

      if (data.nodes && data.edges) {
        const pList = data.nodes.map((n: any) => n.data as Person);
        setRawPersons(pList);

        const map = new Map<number, Person>();
        pList.forEach((p: Person) => map.set(p.id, p));
        setRawPersonsMap(map);

        const parsedRels: Relationship[] = data.edges.map((e: any) => ({
          id: parseInt(e.id.replace('e-', ''), 10),
          person_id: parseInt(e.target, 10),
          related_person_id: parseInt(e.source, 10),
          relationship_type: e.data?.relationship_type || 'PARENT',
          status: e.data?.status || 'VERIFIED',
          created_at: new Date().toISOString(),
        }));
        setRawRelationships(parsedRels);

        // Person A selection: ONLY if initialPersonAId is provided OR dbUser has a verified claimed branch!
        let defaultA: number | null = initialPersonAId ?? null;
        if (!defaultA && dbUser) {
          const dbUserAny = dbUser as any;
          const userNode = pList.find(
            (p: Person) => p.claimed_by_user_id === dbUser.id || (dbUserAny.person_id && p.id === dbUserAny.person_id)
          );
          if (userNode) defaultA = userNode.id;
        }
        setPersonAId(defaultA);

        // Person B selection: ONLY if initialPersonBId is provided in URL! Do NOT default to any random person!
        const defaultB: number | null = initialPersonBId ?? null;
        setPersonBId(defaultB);
      }
    } catch (err) {
      console.error('Failed to fetch tree data for common ancestor finder', err);
    } finally {
      setLoading(false);
    }
  }, [role, initialPersonAId, initialPersonBId, dbUser]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Recalculate LCA and Y-Shape / Single-Spine Dagre Layout
  const calculateLcaTree = useCallback(() => {
    if (rawPersons.length === 0) return;

    // Case 1: Both Person A and Person B are empty -> clear canvas
    if (!personAId && !personBId) {
      setNodes([]);
      setEdges([]);
      setLcaNode(null);
      setDegreeText('يرجى اختيار الشخص الأول والشخص الثاني من خانات البحث اعلاه لبدء المقارنة ورسم صلة النسب بينهما.');
      return;
    }

    // Case 2: Only one person selected (e.g. Person A verified claimed branch) -> show their spine branch
    if (personAId && !personBId) {
      const { nodes: filteredPersons, relationships: sanitizedRels } = filterTreeByFocus(
        rawPersons,
        rawRelationships,
        personAId,
        'spine'
      );
      setLcaNode(null);
      const personAObj = rawPersonsMap.get(personAId);
      const nameA = personAObj ? `${personAObj.first_name} ${personAObj.father_name || ''} ${personAObj.family_name || ''}`.trim() : '';
      setDegreeText(`تم عرض فرع (${nameA}). اختر الشخص الثاني في الخانة أعلاه لبدء المقارنة وإيجاد الجد المشترك.`);

      const enrichedNodes: Node[] = filteredPersons.map((person) => ({
        id: person.id.toString(),
        type: 'personNode',
        position: { x: 0, y: 0 },
        data: {
          ...person,
          isPendingStatus: false,
          spouses: (person as any).spouses || [],
          isReadOnly: true,
          isLcaNode: false,
          isSelfNode: person.id === personAId,
          onViewLineage: (p: Person) => {
            setSelectedProfilePerson(p);
            setIsProfileModalOpen(true);
          },
        } as unknown as Record<string, unknown>,
      }));

      const sanitizedEdges: Edge[] = sanitizedRels.map((rel) => {
        let sourceId = rel.person_id.toString();
        let targetId = rel.related_person_id.toString();
        if (rel.relationship_type === 'PARENT') {
          sourceId = rel.related_person_id.toString();
          targetId = rel.person_id.toString();
        }
        return {
          id: `e-${rel.id}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2.5 },
          data: { relationship_type: rel.relationship_type, status: rel.status },
        };
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        enrichedNodes,
        sanitizedEdges,
        currentLayout
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setTimeout(() => {
        if (layoutedNodes.length > 0) {
          reactFlowInstance.fitView({ padding: 0.25, duration: 600 });
        }
      }, 150);
      return;
    }

    // Case 3: Both Person A and Person B are selected -> calculate LCA lineage!
    if (personAId && personBId) {
      const result = findCommonAncestorLineage(personAId, personBId, rawPersons, rawRelationships);
      setLcaNode(result.lcaNode);
      setDegreeText(result.degreeText);

      const enrichedNodes: Node[] = result.nodes.map((person) => {
        const isLca = result.lcaNode ? person.id === result.lcaNode.id : false;
        const isPending = result.relationships.some(
          (r) => (r.person_id === person.id || r.related_person_id === person.id) && r.status === 'PENDING'
        );
        const personDataAny = person as any;

        return {
          id: person.id.toString(),
          type: 'personNode',
          position: { x: 0, y: 0 },
          data: {
            ...person,
            isPendingStatus: isPending,
            spouses: personDataAny.spouses || [],
            isReadOnly: true,
            isLcaNode: isLca,
            onViewLineage: (p: Person) => {
              setSelectedProfilePerson(p);
              setIsProfileModalOpen(true);
            },
          } as unknown as Record<string, unknown>,
        };
      });

      const sanitizedEdges: Edge[] = result.relationships.map((rel) => {
        let sourceId = rel.person_id.toString();
        let targetId = rel.related_person_id.toString();

        if (rel.relationship_type === 'PARENT') {
          sourceId = rel.related_person_id.toString();
          targetId = rel.person_id.toString();
        } else if (rel.relationship_type === 'CHILD') {
          sourceId = rel.person_id.toString();
          targetId = rel.related_person_id.toString();
        }

        return {
          id: `e-${rel.id}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke:
              result.lcaNode && (sourceId === result.lcaNode.id.toString() || targetId === result.lcaNode.id.toString())
                ? '#f59e0b'
                : '#10b981',
            strokeWidth: 3,
          },
          data: {
            relationship_type: rel.relationship_type,
            status: rel.status,
          },
        };
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        enrichedNodes,
        sanitizedEdges,
        currentLayout
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setTimeout(() => {
        if (layoutedNodes.length > 0) {
          reactFlowInstance.fitView({ padding: 0.25, duration: 600 });
        }
      }, 150);
    }
  }, [
    rawPersons,
    rawPersonsMap,
    rawRelationships,
    personAId,
    personBId,
    currentLayout,
    reactFlowInstance,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    calculateLcaTree();
  }, [calculateLcaTree]);

  // Layout Direction Switcher
  const handleSelectLayout = useCallback(
    (direction: LayoutDirection) => {
      setCurrentLayout(direction);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  // SVG Export Handler
  const handleExportSvg = async () => {
    try {
      setExportingSvg(true);
      const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElem) {
        showToast('خطأ: تعذر الوصول إلى الكانفاس');
        return;
      }
      await exportCanvasToSvg(viewportElem, nodes, `common-ancestor-${personAId}-${personBId}`);
      showToast('تم تصدير كشف الجد المشترك بصيغة SVG عالية الدقة! 📄✨');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تصدير ملف SVG');
    } finally {
      setExportingSvg(false);
    }
  };

  // Copy Common Ancestor Share Link Handler
  const handleShareLcaLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/common-ancestor?personA=${personAId || ''}&personB=${personBId || ''}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('تم نسخ رابط كشف الجد المشترك إلى الحافظة بنجاح! 🔗📋');
  };

  const fullNamesMap = useMemo(() => {
    const map = new Map<number, string>();
    rawPersons.forEach((p) => {
      map.set(p.id, getPentanyicFullName(p, rawPersonsMap, rawRelationships));
    });
    return map;
  }, [rawPersons, rawPersonsMap, rawRelationships]);

  // Search Results for Person A
  const searchAResults = useMemo(() => {
    if (!searchAQuery || !searchAQuery.trim()) return [];
    return filterAndSortSearchResults(rawPersons, searchAQuery, fullNamesMap).slice(0, 30);
  }, [rawPersons, searchAQuery, fullNamesMap]);

  // Search Results for Person B
  const searchBResults = useMemo(() => {
    if (!searchBQuery || !searchBQuery.trim()) return [];
    return filterAndSortSearchResults(rawPersons, searchBQuery, fullNamesMap).slice(0, 30);
  }, [rawPersons, searchBQuery, fullNamesMap]);

  const personAObj = personAId ? rawPersonsMap.get(personAId) : null;
  const personBObj = personBId ? rawPersonsMap.get(personBId) : null;

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري تحميل منظومة كشف الجد المشترك...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce dir-rtl">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Dynamic Summary Metric Banner Header */}
      <div className="bg-amber-50/50 dark:bg-slate-900 border-b border-amber-500/20 dark:border-amber-500/30 px-6 py-3 shadow-xl dir-rtl z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span>كشف الجد المشترك وسلسلة التقاء الأنساب</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {degreeText}
              </p>
            </div>
          </div>

          {/* LCA Crown Badge Summary */}
          {lcaNode && (
            <div className="bg-white dark:bg-slate-950/80 border border-amber-500/30 dark:border-amber-500/40 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg text-slate-900 dark:text-white">
              <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-pulse" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold">الجد المشترك (LCA):</span>
                <span className="text-xs font-extrabold">
                  {lcaNode.first_name} {lcaNode.father_name} {lcaNode.family_name}
                </span>
              </div>
            </div>
          )}

          {/* Actions: Share & SVG Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLcaLink}
              className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
              title="نسخ رابط مباشر لكشف الجد المشترك ومشاركته"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              مشاركة الكشف
            </button>

            <button
              onClick={handleExportSvg}
              disabled={exportingSvg}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105 disabled:opacity-50"
              title="تصدير شجرة الجد المشترك المتشعبة بصيغة SVG"
            >
              {exportingSvg ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              تصدير SVG
            </button>
          </div>
        </div>
      </div>

      {/* Consolidated Single-Line Control Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-lg dir-rtl z-40 relative pointer-events-auto">
        
        {/* Right Side: Dual Person Inputs & Search Button (الجهة اليمنى) */}
        <div className="flex items-center gap-2.5 flex-wrap pointer-events-auto">
          {/* Person A Compact Search */}
          <div className="relative w-48 sm:w-56 pointer-events-auto">
            <div className="relative flex items-center">
              <Users className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchAQuery}
                onChange={(e) => setSearchAQuery(e.target.value)}
                placeholder={personAObj ? `${personAObj.first_name} ${personAObj.family_name || ''}` : 'الشخص الأول (A)...'}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-emerald-600/70 dark:placeholder-emerald-400/70 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {searchAResults.length > 0 && (
              <div className="absolute top-full mt-1 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto pointer-events-auto min-w-[280px]">
                {searchAResults.map((p) => {
                  const fullName = fullNamesMap.get(p.id) || p.first_name;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setPersonAId(p.id);
                        setSearchAQuery('');
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800/50"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[240px]" title={fullName}>
                        {fullName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">({p.birth_year || 'عام مجهول'})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <span className="text-amber-400 font-bold text-xs shrink-0">↔️</span>

          {/* Person B Compact Search */}
          <div className="relative w-48 sm:w-56 pointer-events-auto">
            <div className="relative flex items-center">
              <Users className="w-3.5 h-3.5 text-blue-400 absolute right-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchBQuery}
                onChange={(e) => setSearchBQuery(e.target.value)}
                placeholder={personBObj ? `${personBObj.first_name} ${personBObj.family_name || ''}` : 'الشخص الثاني (B)...'}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-blue-600/70 dark:placeholder-blue-400/70 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {searchBResults.length > 0 && (
              <div className="absolute top-full mt-1 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto pointer-events-auto min-w-[280px]">
                {searchBResults.map((p) => {
                  const fullName = fullNamesMap.get(p.id) || p.first_name;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setPersonBId(p.id);
                        setSearchBQuery('');
                      }}
                      className="p-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs border-b border-slate-800/50"
                    >
                      <span className="font-bold text-slate-200 truncate max-w-[240px]" title={fullName}>
                        {fullName}
                      </span>
                      <span className="text-slate-400 text-[10px]">({p.birth_year || 'عام مجهول'})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={calculateLcaTree}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1.5 shrink-0 pointer-events-auto cursor-pointer"
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>كشف الجد المشترك</span>
          </button>
        </div>

        {/* Left Side: Layout Toolbar (الجهة اليسرى) */}
        <div className="shrink-0 pointer-events-auto">
          <LayoutToolbar
            activeDirection={currentLayout}
            onSelectLayout={handleSelectLayout}
            onFitView={() => reactFlowInstance.fitView({ padding: 0.25, duration: 600 })}
          />
        </div>
      </div>

      {/* Main Canvas Area */}
      <main className="flex-1 w-full h-full relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm dir-rtl">
            جاري احتساب سلاسل النسب وتقاطع الأجداد...
          </div>
        ) : nodes.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center dir-rtl p-6">
            <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-7 max-w-lg text-right space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Common Ancestor Unverified Guidance Callout Banner */}
              {!personAId && (
                <div className="bg-amber-950/50 border border-amber-500/40 rounded-2xl p-4 space-y-2 dir-rtl">
                  <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                    <span>تنبيه: حسابك غير مرتبط بفرع عائلي موثق حالياً</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                    أهلاً بك في منصة كشف الجد المشترك! يمكنك الآن مقارنة سلاسل النسب وتحديد نقطة التقاء الأنساب والأجداد المشتركين بين أي فردين في العائلة باختيارهما من خانات البحث أعلاه. وعند مطالبك ببطاقتك الشخصية وتوثيق فرعك، ستُعتمد تلقائياً كـ (الشخص الأول) الأساسي في جميع مقارنات الأنساب.
                  </p>
                </div>
              )}

              <div className="pt-2 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
                <h3 className="text-sm font-extrabold text-amber-300">{degreeText}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  استخدم خانات البحث في الشريط العلوي لاختيار الشخص الأول والشخص الثاني لبدء المقارنة الفورية ورسم صلة النسب.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            nodesConnectable={false}
            nodesDraggable={true}
            elementsSelectable={true}
            fitView
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
            <MiniMap
              style={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }}
              nodeColor={(n) => {
                if ((n.data as any)?.isLcaNode) return '#f59e0b';
                if ((n.data as any)?.gender === 'FEMALE') return '#ec4899';
                return '#10b981';
              }}
            />
          </ReactFlow>
        )}
      </main>

      {/* Person Profile Details Modal */}
      <PersonProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfilePerson(null);
        }}
        person={selectedProfilePerson}
        allPersonsMap={rawPersonsMap}
        relationships={rawRelationships}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export const CommonAncestorCanvas = dynamic(() => Promise.resolve(CommonAncestorCanvasContent), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
      جاري تحميل منظومة كشف الجد المشترك...
    </div>
  ),
});
