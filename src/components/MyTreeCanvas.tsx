'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { RadialTreeSVG } from './RadialTreeSVG';
import { Navbar } from './Navbar';
import { AuthModal } from './AuthModal';

import { getLayoutedElements } from '../lib/layout';
import { filterTreeByFocus, FocusMode } from '../lib/treeFilter';
import { exportCanvasToSvg } from '../lib/exportSvg';
import { generateTreeImagePrompt } from '../lib/exportPrompt';
import { getPentanyicFullName } from '../lib/lineage';
import { Person, Relationship } from '../types';
import { useAuth } from '../context/AuthContext';
import { normalizeForSearch, sortSearchResults, filterAndSortSearchResults } from '../lib/dedup';

import { createPortal } from 'react-dom';
import {
  Search,
  Share2,
  Download,
  GitBranch,
  Eye,
  CheckCircle,
  Layers,
  Sparkles,
  RefreshCw,
  UserCheck,
  X,
  AlertCircle,
  Wand2,
} from 'lucide-react';

const nodeTypes = {
  personNode: PersonNode,
};

interface MyTreeCanvasContentProps {
  initialFocusPersonId?: number | null;
  initialMode?: FocusMode;
}

function MyTreeCanvasContent({
  initialFocusPersonId = null,
  initialMode = 'spine',
}: MyTreeCanvasContentProps) {
  const { user, dbUser, role } = useAuth();
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [exportingSvg, setExportingSvg] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  // Tree Raw State from Server
  const [rawPersons, setRawPersons] = useState<Person[]>([]);
  const [rawPersonsMap, setRawPersonsMap] = useState<Map<number, Person>>(new Map());
  const [rawRelationships, setRawRelationships] = useState<Relationship[]>([]);

  // Fixed Focus Mode (Spine View Only for My Tree Page)
  const focusMode = 'spine';
  const [targetPersonId, setTargetPersonId] = useState<number | null>(initialFocusPersonId);
  const [selectedTargetPerson, setSelectedTargetPerson] = useState<Person | null>(null);

  // Active filtered nodes and relationships state for Spine view and Radial view synchronization
  const [activePersons, setActivePersons] = useState<Person[]>([]);
  const [activeRelationships, setActiveRelationships] = useState<Relationship[]>([]);

  // View Mode: 'standard' (Spine Tree) or 'radial' (Radial SVG Tree)
  const [viewType, setViewType] = useState<'standard' | 'radial'>('standard');

  // Search & Profile Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfilePerson, setSelectedProfilePerson] = useState<Person | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Target Person Selection Search Modal State
  const [isSelectPersonModalOpen, setIsSelectPersonModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const fullNamesMap = useMemo(() => {
    const map = new Map<number, string>();
    rawPersons.forEach((p) => {
      map.set(p.id, getPentanyicFullName(p, rawPersonsMap, rawRelationships));
    });
    return map;
  }, [rawPersons, rawPersonsMap, rawRelationships]);

  const modalSearchResults = useMemo(() => {
    if (!modalSearchQuery || !modalSearchQuery.trim()) return rawPersons.slice(0, 30);
    return filterAndSortSearchResults(rawPersons, modalSearchQuery, fullNamesMap).slice(0, 30);
  }, [rawPersons, modalSearchQuery, fullNamesMap]);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Center camera on target person node
  const handleFocusPerson = useCallback(
    (targetId: number) => {
      setTargetPersonId(targetId);
      const targetPerson = rawPersonsMap.get(targetId);
      if (targetPerson) {
        setSelectedTargetPerson(targetPerson);
      }

      setTimeout(() => {
        const targetNode = reactFlowInstance.getNode(targetId.toString());
        if (targetNode) {
          reactFlowInstance.setCenter(targetNode.position.x + 140, targetNode.position.y + 70, {
            zoom: 1.25,
            duration: 800,
          });
        }
      }, 100);
    },
    [reactFlowInstance, rawPersonsMap]
  );

  // Fetch Tree Data from Server API
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

        // Target person selection: Check if user is verified to a branch
        let foundTarget: Person | undefined;
        if (initialFocusPersonId && map.has(initialFocusPersonId)) {
          foundTarget = map.get(initialFocusPersonId);
        } else if (dbUser) {
          const dbUserAny = dbUser as any;
          foundTarget = pList.find((p: Person) => p.claimed_by_user_id === dbUser.id || (dbUserAny.person_id && p.id === dbUserAny.person_id));
        }

        if (foundTarget) {
          setTargetPersonId(foundTarget.id);
          setSelectedTargetPerson(foundTarget);
          setIsSelectPersonModalOpen(false);
        } else {
          // User has not verified a branch: Open popup search modal window!
          setTargetPersonId(null);
          setSelectedTargetPerson(null);
          setIsSelectPersonModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch read-only tree data', err);
    } finally {
      setLoading(false);
    }
  }, [role, initialFocusPersonId, dbUser]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Re-filter nodes & calculate Dagre layout whenever rawPersons, focusMode, or targetPersonId change
  useEffect(() => {
    if (rawPersons.length === 0) return;

    const { nodes: filteredPersons, relationships: sanitizedRels } = filterTreeByFocus(
      rawPersons,
      rawRelationships,
      targetPersonId,
      focusMode
    );

    setActivePersons(filteredPersons);
    setActiveRelationships(sanitizedRels);

    const enrichedNodes: Node[] = filteredPersons.map(person => {
      const isPending = sanitizedRels.some(
        r => (r.person_id === person.id || r.related_person_id === person.id) && r.status === 'PENDING'
      );
      const personDataAny = person as any;
      const isSelf = person.id === targetPersonId;

      return {
        id: person.id.toString(),
        type: 'personNode',
        position: { x: 0, y: 0 },
        data: {
          ...person,
          isSelfNode: isSelf,
          isPendingStatus: isPending,
          spouses: personDataAny.spouses || [],
          isReadOnly: true, // 100% Read-Only mode
          onViewLineage: (p: Person) => {
            setSelectedProfilePerson(p);
            setIsProfileModalOpen(true);
          },
          onFocusPerson: (pId: number) => handleFocusPerson(pId),
        } as unknown as Record<string, unknown>,
      };
    });

    const sanitizedEdges: Edge[] = sanitizedRels.map(rel => {
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
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      enrichedNodes,
      sanitizedEdges,
      'BT'
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Camera animation after layout recalculation: Focus directly on the target user node!
    setTimeout(() => {
      if (targetPersonId) {
        const tNode = layoutedNodes.find(n => n.id === targetPersonId.toString());
        if (tNode) {
          reactFlowInstance.setCenter(tNode.position.x + 140, tNode.position.y + 70, {
            zoom: 1.15,
            duration: 800,
          });
          return;
        }
      }
      reactFlowInstance.fitView({ padding: 0.2, duration: 600 });
    }, 150);
  }, [
    rawPersons,
    rawRelationships,
    targetPersonId,
    focusMode,
    reactFlowInstance,
    handleFocusPerson,
    setNodes,
    setEdges,
  ]);

  // Export Canvas to Vector SVG
  const handleExportSvg = async () => {
    try {
      setExportingSvg(true);
      const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElem) {
        showToast('خطأ: تعذر الوصول إلى عنصر الشجرة في الكانفاس');
        return;
      }
      const targetName = selectedTargetPerson
        ? `${selectedTargetPerson.first_name}_${selectedTargetPerson.family_name || ''}`
        : 'shajarati';
      await exportCanvasToSvg(viewportElem, nodes, `tree-${targetName}-${focusMode}`);
      showToast('تم تصدير الشجرة بنجاح بصيغة SVG عالية الدقة! 📄✨');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تصدير ملف SVG');
    } finally {
      setExportingSvg(false);
    }
  };

  // Generate & Copy AI Image Prompt for Ancient Family Tree
  const handleCopyImagePrompt = () => {
    if (!targetPersonId) {
      showToast('يرجى اختيار شخص أولاً لتوليد البرومبت الخاص بنسبه!');
      return;
    }
    try {
      const promptText = generateTreeImagePrompt(
        targetPersonId,
        rawPersonsMap,
        rawRelationships
      );
      navigator.clipboard.writeText(promptText);
      showToast('تم نسخ برومبت رسم الشجرة التراثية بنجاح إلى الحافظة! 🎨📋');
    } catch (err) {
      console.error('Failed to generate image prompt:', err);
      showToast('حدث خطأ أثناء توليد برومبت الصورة');
    }
  };

  // Generate & Copy Branch Share Link
  const handleShareBranchLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/my-tree?focus=${targetPersonId || ''}&mode=${focusMode}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('تم نسخ رابط مشاركة هذا الفرع إلى الحافظة بنجاح! 🔗📋');
  };

  // Search Results Filter
  const searchResults = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    return filterAndSortSearchResults(rawPersons, searchQuery, fullNamesMap).slice(0, 30);
  }, [rawPersons, searchQuery, fullNamesMap]);

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري تحميل منصة شجرتي المعتمَدة...
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
      {!isFullscreen && <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />}

      {/* Actions & Search Header Bar */}
      {!isFullscreen && (
        <div className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md dir-rtl z-30">

        {/* Action Buttons: View Mode Switcher, Export SVG & Share Link */}
        <div className="flex items-center gap-2">
          {/* View Type Toggle: Standard vs Radial */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 dir-rtl shadow-inner">
            <button
              onClick={() => setViewType('standard')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewType === 'standard'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض الشجرة الهيكلية العادية"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>الشجرة العادية</span>
            </button>

            <button
              onClick={() => setViewType('radial')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewType === 'radial'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض الشجرة الدائرية التفاعلية"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>الشجرة الدائرية</span>
            </button>
          </div>

          <button
            onClick={handleShareBranchLink}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title="نسخ رابط مباشر لمشاركة هذا المنظور والفرع مع الآخرين"
          >
            <Share2 className="w-4 h-4 text-blue-400" />
            مشاركة هذا الفرع
          </button>

          <button
            onClick={handleExportSvg}
            disabled={exportingSvg}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 disabled:opacity-50"
            title="تصدير الشجرة المفلترة الحالية كصورة متجهية SVG عالية الجودة"
          >
            {exportingSvg ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-emerald-200" />
            )}
            تصدير SVG
          </button>

          <button
            onClick={handleCopyImagePrompt}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
            title="نسخ برومبت توليد صورة شجرة عائلية تراثية للأفراد والعلاقات إلى الحافظة"
          >
            <Wand2 className="w-4 h-4 text-amber-100" />
            نسخ برومبت توليد صورة
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative max-w-xs w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الفرد للتركيز عليه..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-9 pl-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto">
              {searchResults.map((p) => {
                const fullName = fullNamesMap.get(p.id) || p.first_name;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      handleFocusPerson(p.id);
                      setSearchQuery('');
                    }}
                    className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs border-b border-slate-800/50"
                  >
                    <span className="font-bold text-slate-200 truncate max-w-[280px]" title={fullName}>
                      {fullName}
                    </span>
                    <span className="text-slate-400 text-[11px]">({p.birth_year || 'عام مجهول'})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Canvas Area */}
      <main className="flex-1 w-full h-full relative">
        {viewType === 'radial' ? (
          <RadialTreeSVG
            customPersons={activePersons.length > 0 ? activePersons : rawPersons}
            customRelationships={activeRelationships.length > 0 ? activeRelationships : rawRelationships}
            initialFocusPersonId={targetPersonId}
            isFullscreen={isFullscreen}
          />
        ) : loading ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm dir-rtl">
            جاري معالجة الأنساب المفلترة وبناء منظور الكانفاس...
          </div>
        ) : nodes.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center dir-rtl p-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-200">لا توجد عقد مطابقة لمنظور العمود الفقري</h3>
              <p className="text-xs text-slate-400">
                لم يتم العثور على أفراد مدونين ضمن منظور العمود الفقري الحالي.
              </p>
              <button
                onClick={() => fetchTreeData()}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                إعادة تحميل بيانات الشجرة
              </button>
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
          </ReactFlow>
        )}
      </main>

      {/* Lineage Profile Modal */}
      <PersonProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfilePerson(null);
        }}
        person={selectedProfilePerson}
        allPersonsMap={rawPersonsMap}
        relationships={rawRelationships}
        onSelectPerson={(p) => handleFocusPerson(p.id)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      {/* Target Person Selection Search Modal Popup */}
      {isSelectPersonModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => {
            if (targetPersonId) setIsSelectPersonModalOpen(false);
          }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 text-right">عرض شجرتك - اختر الشخص المستهدف</h3>
                  <p className="text-xs text-slate-400 font-medium text-right">
                    {dbUser ? 'حسابك غير موثق لفرع حالياً. ابحث عن اسمك أو أي شخص لاستكشاف شجرته' : 'يرجى كتابة الاسم للتركيز على الشخص المستهدف والنسب'}
                  </p>
                </div>
              </div>
              {targetPersonId && (
                <button
                  onClick={() => setIsSelectPersonModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Unverified Branch Guidance Callout Banner */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5 text-right dir-rtl shadow-lg">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                <span>تنبيه: حسابك غير مرتبط بفرع عائلي موثق حالياً</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                يمكنك الآن البحث واختيار أي فرد لاستكشاف نسبه وشجرته. وفي حال رغبتك بتوثيق فرعك الخاص باسمك، قم بتقديم طلب مطالبة ببطاقتك الشخصية في الشجرة، وسيتم توثيق فرعك فور اعتماد الطلب من المسؤولين لتصبح أنت الفرد المستهدف تلقائياً في جميع شاشات المنصة.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block text-right">
                ابحث باسم الشخص (مثال: محمد أحمد أبو فارة):
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  autoFocus
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="اكتب الاسم هنا للبحث..."
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl pr-11 pl-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Search Results List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pt-1 pr-1 dir-rtl">
                {modalSearchResults.length > 0 ? (
                  modalSearchResults.map((p) => {
                    const fullName = fullNamesMap.get(p.id) || p.first_name;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleFocusPerson(p.id);
                          setIsSelectPersonModalOpen(false);
                          setModalSearchQuery('');
                        }}
                        className="p-3 bg-slate-800/80 hover:bg-emerald-950/80 border border-slate-700/60 hover:border-emerald-500/60 rounded-xl cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 group-hover:bg-emerald-600/30 flex items-center justify-center text-slate-200 group-hover:text-emerald-300 transition-colors shrink-0">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-100 group-hover:text-emerald-200 block text-right">
                              {fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 block text-right">
                              {p.is_alive ? 'على قيد الحياة' : 'متوفى'} {p.birth_year ? `• مواليد ${p.birth_year}` : ''}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg shrink-0">
                          عرض شجرتي لهذا الشخص
                        </span>
                      </div>
                    );
                  })
                ) : modalSearchQuery.trim() !== '' ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800">
                    لم يتم العثور على شخص بهذا الاسم. يرجى تجربة اسم آخر.
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800">
                    اكتب الاسم في الخانة أعلاه لعرض نتائج البحث التصفوية والانتساب.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export const MyTreeCanvas = dynamic(() => Promise.resolve(MyTreeCanvasContent), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
      جاري تحميل منصة شجرتي المعتمَدة...
    </div>
  ),
});
