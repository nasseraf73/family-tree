'use client';

import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { Clock, Heart, Plus, ShieldCheck, UserCheck, MapPin, Edit3, Sparkles, Users, Mars, Venus, X } from 'lucide-react';
import { Person } from '../types';

export interface SpouseInfo {
  id: number;
  spouse_id?: number;
  spouse_name: string;
  status: string;
  marriage_order: number;
}

export interface PersonNodeData extends Person {
  isPendingStatus?: boolean;
  spouses?: SpouseInfo[];
  isReadOnly?: boolean;
  isLcaNode?: boolean;
  isSelfNode?: boolean;
  hasChildren?: boolean;
  directChildrenCount?: number;
  isCollapsed?: boolean;
  isHighlighted?: boolean;
  generationLevel?: number;
  isMarried?: boolean;
  activeFilter?: 'ALL' | 'LIVING' | 'MARRIED';
  isBottomToTop?: boolean;
  layoutDirection?: 'TB' | 'BT' | 'LR' | 'COMPACT' | 'RADIAL';
  // Hover card stats
  fullAncestorName?: string;
  grandchildrenCount?: number;
  totalDescendantsCount?: number;
  spouseNames?: string[];
  onToggleCollapse?: (personId: number) => void;
  onAddRelation?: (targetPerson: Person, relationType: 'PARENT' | 'CHILD' | 'SPOUSE') => void;
  onOpenAddSpouse?: (targetPerson: Person) => void;
  onClaimProfile?: (targetPerson: Person) => void;
  onEditPerson?: (targetPerson: Person) => void;
  onViewLineage?: (targetPerson: Person) => void;
  onFocusPerson?: (personId: number) => void;
}

const PersonNodeComponent = ({ data }: { data: PersonNodeData }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const currentYear = 2026;
  const isLiving = data.is_alive;
  const isPending = data.isPendingStatus;
  const isClaimApproved = Boolean(data.claimed_by_user_id && data.claim_status === 'APPROVED');
  const isClaimPending = Boolean(data.claimed_by_user_id && (data.claim_status === 'PENDING' || !data.claim_status));
  const isLca = data.isLcaNode ?? false;
  const isSelfNode = data.isSelfNode ?? false;
  const isBottomToTop = Boolean(data.isBottomToTop || data.layoutDirection === 'BT');

  const isMarried = data.isMarried ?? (data.spouses && data.spouses.length > 0);
  const genLevel = data.generationLevel ?? 1;
  const hasChildren = Boolean(data.hasChildren || (data.directChildrenCount && data.directChildrenCount > 0));
  const isCollapsed = data.isCollapsed ?? false;

  // Active filter opacity dimming check
  const isFilteredOut =
    (data.activeFilter === 'LIVING' && !isLiving) ||
    (data.activeFilter === 'MARRIED' && !isMarried);

  // Build 4-part full name: First Name - Father Name - Grandfather Name - Family Name
  const fullName4 = [data.first_name, data.father_name, data.grand_father_name, data.family_name]
    .filter(Boolean)
    .join(' ');

  // 1. Frame Style: Strict Emerald for Living, Dark Earthy Stone for Deceased, Golden for LCA/Self
  const cardStyle = isLca || isSelfNode
    ? 'border-4 border-amber-400 bg-amber-950/85 text-amber-100 shadow-2xl shadow-amber-500/50 ring-4 ring-amber-400/40'
    : isPending
    ? 'border-2 border-dashed border-amber-500 bg-amber-500/10 text-amber-100 shadow-amber-500/10'
    : isLiving
    ? 'border-2 border-emerald-500 bg-slate-900/95 text-slate-100 shadow-xl shadow-emerald-500/20 hover:border-emerald-400 ring-1 ring-emerald-500/30'
    : 'border-2 border-stone-700 bg-stone-950/95 text-stone-200 shadow-xl shadow-stone-900/40 hover:border-stone-500 ring-1 ring-stone-800/40';

  const headerBg = isLca || isSelfNode
    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-black'
    : isPending
    ? 'bg-amber-600/30 text-amber-200'
    : isLiving
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
    : 'bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 text-stone-300 border-b border-stone-800';

  // Generation Level Badge Colors
  const genBadgeStyle =
    genLevel === 1
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : genLevel === 2
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : genLevel === 3
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
      : genLevel === 4
      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

  // Age calculations
  const livingAge = data.birth_year ? currentYear - data.birth_year : null;
  const livingDisplay = data.birth_year
    ? `(${data.birth_year}) ${livingAge ? `(العمر: ${livingAge} سنة)` : ''}`
    : '';

  const deathYear = data.death_date ? parseInt(data.death_date.substring(0, 4), 10) : null;
  const deathYearStr = data.death_date ? data.death_date.substring(0, 4) : '';
  const deceasedAge = data.birth_year && deathYear
    ? deathYear - data.birth_year
    : data.birth_year
    ? currentYear - data.birth_year
    : null;

  const deceasedDisplay = data.birth_year
    ? `(${data.birth_year} - ${deathYearStr || 'غير محدد'}) ${deceasedAge ? `(العمر: ${deceasedAge} سنة)` : ''}`
    : deathYearStr
    ? `(؟ - ${deathYearStr})`
    : '';

  return (
    <div
      dir="rtl"
      className={`relative group w-72 min-h-[260px] flex flex-col justify-between rounded-xl shadow-xl backdrop-blur-md transition-all duration-300 text-right ${cardStyle} ${
        isFilteredOut ? 'opacity-35 scale-95 pointer-events-none' : ''
      }`}
    >
      {/* React Flow Handles for dynamic connections (Direction aware: TB vs BT) */}
      <Handle
        type="target"
        position={isBottomToTop ? Position.Bottom : Position.Top}
        isConnectable={false}
        className="!bg-emerald-500 !w-3.5 !h-3.5 !opacity-0"
      />
      <Handle
        type="source"
        position={isBottomToTop ? Position.Top : Position.Bottom}
        isConnectable={false}
        className="!bg-emerald-500 !w-3.5 !h-3.5 !opacity-0"
      />
      <Handle type="target" position={Position.Left} id="left-handle" isConnectable={false} className="!bg-pink-500 !w-3.5 !h-3.5 !opacity-0" />
      <Handle type="source" position={Position.Right} id="right-handle" isConnectable={true} className="!bg-pink-500 !w-4 !h-4 !z-10 border-2 border-white shadow-md cursor-crosshair" />

      {/* Contextual Directional (+) Action Buttons */}
      {!data.isReadOnly && (
        <>
          {/* Add Child (+) button */}
          <button
            title="إضافة ابن / ابنة"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddRelation?.(data, 'CHILD');
            }}
            className={`absolute ${
              isBottomToTop ? '-bottom-3.5' : '-top-3.5'
            } left-1/2 -translate-x-1/2 z-20 w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 border-2 border-slate-900`}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Add Spouse (+) button placed at Left side */}
          <button
            title="إضافة زوج / زوجة"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onOpenAddSpouse) {
                data.onOpenAddSpouse(data);
              } else {
                data.onAddRelation?.(data, 'SPOUSE');
              }
            }}
            className="absolute top-1/2 -left-3.5 -translate-y-1/2 z-20 w-7 h-7 bg-pink-600 hover:bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 border-2 border-slate-900"
          >
            <Plus className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Branch Expand/Collapse Button using expand-icon.png and collapse-icon.png */}
      {hasChildren && data.onToggleCollapse && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.(data.id);
          }}
          title={isCollapsed ? 'توسيع فرع الأبناء' : 'طي فرع الأبناء'}
          className={`absolute ${
            isBottomToTop ? '-top-4' : '-bottom-4'
          } left-1/2 -translate-x-1/2 z-30 p-1 bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/70 rounded-full shadow-2xl transition-transform hover:scale-115 flex items-center justify-center`}
        >
          <img
            src={isCollapsed ? '/icons/expand-icon.png' : '/icons/collapse-icon.png'}
            alt={isCollapsed ? 'توسيع' : 'طي'}
            className="w-5 h-5 object-contain"
            onError={(e) => {
              // Fallback SVG icon if PNG fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </button>
      )}

      {/* Card Header: Verified/Status Badges (Right), Edit Button with Text (Left) */}
      <div className={`px-3 py-2 rounded-t-lg flex items-center justify-between font-bold text-right ${headerBg}`}>
        {/* Right side: Verified / Pending / LCA / Self Badges */}
        <div className="flex items-center gap-1.5 truncate text-right">
          {isLca ? (
            <span className="flex items-center gap-1 text-[10px] bg-amber-950 text-amber-200 border border-amber-400 px-2 py-0.5 rounded-full font-black shadow-md animate-pulse">
              👑 الجد المشترك
            </span>
          ) : isSelfNode ? (
            <span className="flex items-center gap-1 text-[10px] bg-amber-950 text-amber-200 border border-amber-400 px-2 py-0.5 rounded-full font-black shadow-md animate-pulse">
              👑 بطاقتي الشخصية
            </span>
          ) : isPending ? (
            <span className="flex items-center gap-1 text-[10px] bg-amber-500/40 text-amber-200 px-1.5 py-0.5 rounded-full font-medium">
              <Clock className="w-3 h-3 animate-pulse" />
              معلق
            </span>
          ) : isClaimPending ? (
            <span className="flex items-center gap-1 text-[10px] bg-amber-950/90 text-amber-200 border border-amber-400/80 px-2 py-0.5 rounded-full font-bold shadow-md" title="طلب التوثيق قيد المراجعة والاعتماد من المشرف">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>توثيق قيد المراجعة</span>
            </span>
          ) : isClaimApproved ? (
            <span className="flex items-center gap-1 text-[10px] bg-slate-950/90 text-white border border-cyan-400/80 px-2 py-0.5 rounded-full font-extrabold shadow-md" title="ملف موثق ومطالب به رسميًا">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>موثق</span>
            </span>
          ) : null}
        </div>

        {/* Left side: Edit Button with icon and "تعديل" text */}
        <div className="flex items-center gap-1 shrink-0">
          {!data.isReadOnly && data.onEditPerson && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onEditPerson?.(data);
              }}
              title="تعديل بيانات الشخص"
              className="p-1 px-2 hover:bg-black/30 text-white/90 hover:text-white rounded-md transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-2 text-xs text-right dir-rtl">
        {/* Name & Status (Right) & Photo/Avatar (Left) */}
        <div className="flex items-start justify-between gap-2 text-slate-100">
          <div className="flex flex-col text-right truncate">
            <span className="font-bold text-[15px] text-slate-100 truncate" title={fullName4}>
              {fullName4}
            </span>
            <span className="text-xs text-slate-200 font-normal mt-0.5">
              {isLiving ? (
                <>على قيد الحياة {livingDisplay}</>
              ) : (
                <>🕯️ متوفى {deceasedDisplay}</>
              )}
            </span>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsImageModalOpen(true);
            }}
            title="انقر لعرض الصورة بحجم مكبّر ثابت"
            className="cursor-pointer transition-transform hover:scale-115 shrink-0"
          >
            {data.photo_url ? (
              <img src={data.photo_url} alt={fullName4} className="w-11 h-11 rounded-full object-cover border-2 border-white/70 shadow-md" />
            ) : data.gender === 'FEMALE' ? (
              <span className="w-11 h-11 rounded-full bg-pink-500/30 text-pink-200 border-2 border-pink-400/50 shadow-md flex items-center justify-center" title="أنثى">
                <svg className="w-6 h-6 fill-pink-300 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2c-2.21 0-4 1.79-4 4 0 1.25.57 2.36 1.47 3.09C6.72 10.15 4.5 12.8 4.5 16v2c0 .55.45 1 1 1h13c.55 0 1-.45 1-1v-2c0-3.2-2.22-5.85-4.97-6.91C15.43 8.36 16 7.25 16 6c0-2.21-1.79-4-4-4zm-2.5 4c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.1-.72 2.03-1.72 2.37L12 8.75l-.78-.38C10.22 8.03 9.5 7.1 9.5 6z"/>
                </svg>
              </span>
            ) : (
              <span className="w-11 h-11 rounded-full bg-blue-500/30 text-blue-200 border-2 border-blue-400/50 shadow-md flex items-center justify-center" title="ذكر">
                <svg className="w-6 h-6 fill-blue-300 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-6 15c0-2.67 5.33-4 8-4s8 1.33 8 4v2H6v-2z"/>
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Rectangle containing Generation Badge & Marital Status Badge */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs">
          {/* Generation Level Badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border shadow-sm ${genBadgeStyle}`}>
            الجيل {genLevel}
          </span>

          {/* Marital Status Badge */}
          {isMarried ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-950/60 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <img src="/icons/rings-icon.png" alt="متزوج" className="w-3 h-3 object-contain" />
              <span>{data.gender === 'FEMALE' ? 'متزوجة' : 'متزوج'}</span>
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1">
              <span>{data.gender === 'FEMALE' ? 'عزباء' : 'أعزب'}</span>
            </span>
          )}
        </div>

        {/* Embedded Spousal Metadata Section */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              {isMarried && (
                <img src="/icons/rings-icon.png" alt="خاتمين" className="w-3.5 h-3.5 object-contain" />
              )}
              <span>{data.gender === 'FEMALE' ? 'الأزواج:' : 'الزوجات:'}</span>
            </span>

            {!isMarried && (
              <span className="text-[10px] text-slate-500 font-normal">أعزب / عزباء</span>
            )}
          </div>

          {data.spouses && data.spouses.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {data.spouses.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.spouse_id && data.onFocusPerson) {
                      data.onFocusPerson(s.spouse_id);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-all ${
                    s.spouse_id
                      ? 'bg-pink-950/60 border-pink-500/40 text-pink-200 hover:bg-pink-900/80 cursor-pointer'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                  title={s.spouse_id ? 'انقر للتركيز على بطاقة الزوجة في الكانفاس' : 'زوجة سابقة / خارجية'}
                >
                  <span className="truncate max-w-[110px]">{s.spouse_name}</span>
                  <span className="text-[9px]">
                    {s.status === 'DIVORCED' ? '💔' : s.status === 'DECEASED' ? '🖤' : '💚'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {data.burial_place && (
          <div className="flex items-center gap-1 text-stone-400 text-[11px] truncate text-right">
            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
            <span>مكان الوفاة/الدفن: {data.burial_place}</span>
          </div>
        )}

        {data.biography && (
          <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-right">
            "{data.biography}"
          </p>
        )}

        {/* Dedicated View Full Lineage Button */}
        {data.onViewLineage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onViewLineage?.(data);
            }}
            className="w-full mt-1.5 py-1.5 px-2 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900/90 hover:to-teal-900/90 text-emerald-300 border border-emerald-500/40 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>عرض سلسلة النسب والملف الكامل</span>
          </button>
        )}

        {/* Claim Profile Action Button if not claimed */}
        {!data.isReadOnly && !isClaimApproved && (
          isClaimPending ? (
            <div className="w-full mt-1 py-1.5 px-2 bg-amber-950/50 text-amber-300 border border-amber-500/40 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>طلب التوثيق قيد المراجعة</span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onClaimProfile?.(data);
              }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-[11px] font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>هذا أنا (مطالبة بالملف)</span>
            </button>
          )
        )}
      </div>

      {/* Fixed-Size Image Preview Modal Popup mounted to document.body via Portal */}
      {isImageModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsImageModalOpen(false);
          }}
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-default dir-rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-900 border-2 border-slate-700 rounded-3xl w-[550px] h-[550px] max-w-[90vw] max-h-[85vh] p-5 flex flex-col items-center justify-between shadow-2xl overflow-hidden"
          >
            {/* Header: Name & Close Button */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-base text-slate-100 truncate pr-2" title={fullName4}>
                {fullName4}
              </span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center border border-slate-600 transition-colors shrink-0 shadow-md"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Image View */}
            <div className="w-full flex-1 flex items-center justify-center p-2 overflow-hidden">
              {data.photo_url ? (
                <img
                  src={data.photo_url}
                  alt={fullName4}
                  className="max-w-full max-h-full object-contain rounded-2xl border border-slate-800 shadow-2xl"
                />
              ) : (
                <div className="w-64 h-64 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner">
                  {data.gender === 'FEMALE' ? (
                    <Venus className="w-32 h-32 text-pink-400" />
                  ) : (
                    <Mars className="w-32 h-32 text-blue-400" />
                  )}
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

export const PersonNode = memo(PersonNodeComponent);
