'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Edit3, User, Calendar, MapPin, Heart, FileText, Sparkles, Users, Baby, Download, Loader2, ShieldCheck } from 'lucide-react';
import { Person, Relationship } from '../types';
import { generateFullLineage } from '../lib/lineage';
import { exportCustomProfilePdf } from '../lib/lineagePdfExport';

interface PersonProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  allPersonsMap: Map<number, Person>;
  relationships: Relationship[];
  collapsedNodes?: Set<number>;
  onToggleCollapse?: (personId: number) => void;
  onEditPerson?: (person: Person) => void;
  onSelectPerson?: (person: Person) => void;
  onClaimProfile?: (person: Person) => void;
}

/**
 * Derives brothers and sisters (siblings) of targetPersonId from the relationships graph
 */
const getSiblings = (
  targetPersonId: number,
  allPersonsMap: Map<number, Person>,
  relationships: Relationship[]
): Person[] => {
  const validRels = relationships.filter((r) => r.status !== 'REJECTED');

  // 1. Get all parent IDs of targetPersonId
  const parentIds = new Set<number>();
  validRels.forEach((r) => {
    if (r.relationship_type === 'PARENT' && r.person_id === targetPersonId) {
      parentIds.add(r.related_person_id);
    } else if (r.relationship_type === 'CHILD' && r.related_person_id === targetPersonId) {
      parentIds.add(r.person_id);
    }
  });

  if (parentIds.size === 0) return [];

  // 2. Find all children of these parents (excluding targetPersonId)
  const siblingIds = new Set<number>();
  validRels.forEach((r) => {
    let pId: number | null = null;
    let cId: number | null = null;

    if (r.relationship_type === 'PARENT') {
      pId = r.related_person_id;
      cId = r.person_id;
    } else if (r.relationship_type === 'CHILD') {
      pId = r.person_id;
      cId = r.related_person_id;
    }

    if (pId && cId && parentIds.has(pId) && cId !== targetPersonId) {
      siblingIds.add(cId);
    }
  });

  return Array.from(siblingIds)
    .map((id) => allPersonsMap.get(id))
    .filter(Boolean) as Person[];
};

/**
 * Derives direct sons and daughters (children) of targetPersonId from the relationships graph
 */
const getDirectChildren = (
  targetPersonId: number,
  allPersonsMap: Map<number, Person>,
  relationships: Relationship[]
): Person[] => {
  const validRels = relationships.filter((r) => r.status !== 'REJECTED');

  const childIds = new Set<number>();
  validRels.forEach((r) => {
    if (r.relationship_type === 'PARENT' && r.related_person_id === targetPersonId) {
      childIds.add(r.person_id);
    } else if (r.relationship_type === 'CHILD' && r.person_id === targetPersonId) {
      childIds.add(r.related_person_id);
    }
  });

  return Array.from(childIds)
    .map((id) => allPersonsMap.get(id))
    .filter(Boolean) as Person[];
};

export const PersonProfileModal: React.FC<PersonProfileModalProps> = ({
  isOpen,
  onClose,
  person,
  allPersonsMap,
  relationships,
  collapsedNodes,
  onToggleCollapse,
  onEditPerson,
  onSelectPerson,
  onClaimProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activePerson, setActivePerson] = useState<Person | null>(person);

  useEffect(() => {
    setActivePerson(person);
  }, [person]);

  if (!isOpen || !activePerson) return null;

  const currentPerson = activePerson;
  const lineageString = generateFullLineage(currentPerson.id, allPersonsMap, relationships);
  const siblings = getSiblings(currentPerson.id, allPersonsMap, relationships);
  const directChildren = getDirectChildren(currentPerson.id, allPersonsMap, relationships);

  const handleCopyLineage = () => {
    if (lineageString) {
      navigator.clipboard.writeText(lineageString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate age
  const currentYear = new Date().getFullYear();
  let ageString = '';
  if (currentPerson.birth_year) {
    if (currentPerson.is_alive) {
      const age = currentYear - currentPerson.birth_year;
      ageString = `(العمر الحالي: ${age} سنة)`;
    } else if (currentPerson.death_date) {
      const dYear = parseInt(currentPerson.death_date.substring(0, 4), 10);
      if (!isNaN(dYear)) {
        const age = dYear - currentPerson.birth_year;
        ageString = `(توفي عن عمر: ${age} سنة)`;
      }
    }
  }

  const handleExportPdf = async () => {
    if (!currentPerson) return;
    try {
      setIsExporting(true);
      const siblingsWithCount = siblings.map((s) => ({
        ...s,
        childrenCount: getDirectChildren(s.id, allPersonsMap, relationships).length,
      }));
      const childrenWithCount = directChildren.map((c) => ({
        ...c,
        childrenCount: getDirectChildren(c.id, allPersonsMap, relationships).length,
      }));

      await exportCustomProfilePdf({
        person: currentPerson,
        lineageString,
        siblings: siblingsWithCount,
        directChildren: childrenWithCount,
        ageString,
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Render individual sibling or child row with Collapse and Expand buttons
  const renderPersonItem = (p: Person) => {
    const isMale = p.gender === 'MALE';
    const isAlive = p.is_alive;
    const personChildren = getDirectChildren(p.id, allPersonsMap, relationships);
    const hasChildren = personChildren.length > 0;
    const isCollapsed = collapsedNodes?.has(p.id) ?? false;

    return (
      <div
        key={p.id}
        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-sm ${
          isMale
            ? 'bg-blue-950/60 border-blue-500/40 text-blue-100'
            : 'bg-pink-950/60 border-pink-500/40 text-pink-100'
        }`}
      >
        {/* Name & Focus Button */}
        <div className="flex items-center gap-2 truncate">
          <button
            type="button"
            onClick={() => {
              if (onSelectPerson) {
                onSelectPerson(p);
              }
            }}
            className="flex items-center gap-1.5 font-extrabold hover:underline text-xs text-right truncate"
            title={`انقر للانتقال مباشرة للتركيز على بطاقة ${p.first_name} في الشجرة`}
          >
            <span className="text-[11px] shrink-0">{isMale ? '♂️' : '♀️'}</span>
            <span className="truncate">{p.first_name}</span>
            <span className="text-[10px] opacity-80 shrink-0">{isAlive ? '💚' : '🖤'}</span>
          </button>

          {hasChildren && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 font-bold shrink-0">
              {personChildren.length} أبناء
            </span>
          )}
        </div>

        {/* 2 Buttons: 1 for Collapse (طي) & 1 for Expand (فتح/عرض) */}
        {hasChildren ? (
          <div className="flex items-center gap-1.5 shrink-0 no-export">
            {/* Button 1: Collapse (طي) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleCollapse && !isCollapsed) {
                  onToggleCollapse(p.id);
                }
              }}
              disabled={isCollapsed}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all border ${
                isCollapsed
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/60 shadow-inner opacity-60 cursor-not-allowed'
                  : 'bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border-amber-500/50 hover:scale-105 active:scale-95 cursor-pointer shadow-md'
              }`}
              title={`طي شجرة/فرع أبناء ${p.first_name}`}
            >
              <span>🔽</span>
              <span>طي</span>
              {isCollapsed && <span className="text-[9px] text-amber-300 font-bold">(مطوي)</span>}
            </button>

            {/* Button 2: Expand (فتح / عرض) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleCollapse && isCollapsed) {
                  onToggleCollapse(p.id);
                }
              }}
              disabled={!isCollapsed}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all border ${
                !isCollapsed
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/60 shadow-inner opacity-60 cursor-not-allowed'
                  : 'bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-200 border-emerald-500/50 hover:scale-105 active:scale-95 cursor-pointer shadow-md'
              }`}
              title={`إعادة فتح/عرض شجرة/فرع أبناء ${p.first_name}`}
            >
              <span>🔼</span>
              <span>فتح</span>
              {!isCollapsed && <span className="text-[9px] text-emerald-300 font-bold">(مفتوح)</span>}
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium italic px-1 shrink-0">
            (ليس لديه فروع لطيها)
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden dir-rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">
              الملف الشخصي وسلسلة النسب
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto bg-slate-900">
          {/* 1. Lineage Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 p-3 px-4 rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-emerald-300">سلسلة النسب الكاملة:</span>
              <button
                type="button"
                onClick={handleCopyLineage}
                className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                title="نسخ سلسلة النسب إلى الحافظة"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>نسخ النسب</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs font-bold text-slate-100 leading-normal font-serif tracking-wide dir-rtl">
              {lineageString}
            </p>
          </div>

          {/* 2. Profile Card & Photo Header */}
          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              title="انقر لعرض الصورة بحجم مكبّر ثابت"
              className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-slate-900 flex items-center justify-center shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              {currentPerson.photo_url ? (
                <img src={currentPerson.photo_url} alt={currentPerson.first_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-500" />
              )}
            </div>

            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-slate-100">
                  {currentPerson.first_name} {currentPerson.father_name || ''} {currentPerson.grand_father_name || ''} {currentPerson.family_name || ''}
                </h4>
                {/* Gender Badge */}
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    currentPerson.gender === 'FEMALE'
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {currentPerson.gender === 'FEMALE' ? '♀️ أنثى' : '♂️ ذكر'}
                </span>
              </div>
              
              <p className="text-xs text-slate-200 font-medium">
                {currentPerson.is_alive ? (
                  <span>
                    💚 على قيد الحياة {currentPerson.birth_year ? `(${currentPerson.birth_year})` : ''} {ageString}
                  </span>
                ) : (
                  <span>
                    🕯️ متوفى {currentPerson.birth_year || currentPerson.death_date ? `(${currentPerson.birth_year || '؟'} - ${currentPerson.death_date ? currentPerson.death_date.substring(0, 4) : 'غير محدد'})` : ''} {ageString}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Burial Place Field */}
          {!currentPerson.is_alive && (
            <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>مكان الوفاة / المدفن:</span>
              </div>
              <p className="font-bold text-amber-100 pr-5">
                {currentPerson.burial_place || 'غير مدوّن'}
              </p>
            </div>
          )}

          {/* 4. Biography / Notes */}
          {currentPerson.biography && (
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span>السيرة الذاتية / ملاحظات:</span>
              </div>
              <p className="text-slate-300 leading-relaxed pr-5">
                {currentPerson.biography}
              </p>
            </div>
          )}

          {/* 5. Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              إغلاق
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              title="تصدير السجل الكامل والنسب إلى ملف PDF"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تصدير البيانات</span>
                </>
              )}
            </button>

            {onClaimProfile && !currentPerson.claimed_by_user_id && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onClaimProfile(currentPerson);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                title="المطالبة بتوثيق هذا الملف الشخصي كبطاقة نسبك"
              >
                <ShieldCheck className="w-4 h-4 text-blue-200" />
                <span>هذا أنا (مطالبة)</span>
              </button>
            )}

            {onEditPerson && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditPerson(currentPerson);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Edit3 className="w-4 h-4" />
                تعديل البيانات
              </button>
            )}
          </div>

          {/* 6. Siblings Container */}
          <div className="bg-slate-950/90 border-2 border-indigo-500/40 p-4 rounded-2xl space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-extrabold text-indigo-200">الإخوة والأخوات:</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {siblings.length} {siblings.length === 1 ? 'أخ/أخت' : 'إخوة وأخوات'}
              </span>
            </div>

            {siblings.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 pt-1">
                {siblings.map((sib) => renderPersonItem(sib))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium py-0.5">
                لا يوجد إخوة أو أخوات مدونون في السجل حالياً.
              </p>
            )}
          </div>

          {/* 7. Direct Children Container */}
          <div className="bg-slate-950/90 border-2 border-emerald-500/40 p-4 rounded-2xl space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-extrabold text-emerald-200">الأبناء والبنات المباشرون:</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {directChildren.length} {directChildren.length === 1 ? 'ابن/ابنة' : 'أبناء وبنات'}
              </span>
            </div>

            {directChildren.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 pt-1">
                {directChildren.map((child) => renderPersonItem(child))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium py-0.5">
                لا يوجد أبناء أو بنات مدونون في السجل حالياً.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fixed-Size Photo Preview Modal Popup via Portal */}
      {isPhotoModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsPhotoModalOpen(false)}
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-default dir-rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-900 border-2 border-slate-700 rounded-3xl w-[550px] h-[550px] max-w-[90vw] max-h-[85vh] p-5 flex flex-col items-center justify-between shadow-2xl overflow-hidden"
          >
            {/* Header: Name & Close Button */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-base text-slate-100 truncate pr-2">
                {currentPerson.first_name} {currentPerson.father_name || ''} {currentPerson.grand_father_name || ''} {currentPerson.family_name || ''}
              </span>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center border border-slate-600 transition-colors shrink-0 shadow-md"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo View */}
            <div className="w-full flex-1 flex items-center justify-center p-2 overflow-hidden">
              {currentPerson.photo_url ? (
                <img
                  src={currentPerson.photo_url}
                  alt={currentPerson.first_name}
                  className="max-w-full max-h-full object-contain rounded-2xl border border-slate-800 shadow-2xl"
                />
              ) : (
                <div className="w-64 h-64 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner">
                  <User className="w-32 h-32 text-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
