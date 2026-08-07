'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import { PersonNodeData } from './PersonNode';
import { Mars, Venus, Sparkles, MapPin, Calendar, Lock, Users, Heart, TreePine, Baby, UserRound } from 'lucide-react';
import Image from 'next/image';

const CircleNodeComponent = ({ data }: { data: PersonNodeData }) => {
  const [isHovered, setIsHovered] = useState(false);

  const currentYear = 2026;
  const isMale = data.gender === 'MALE';
  const isLiving = data.is_alive;

  // Age calculation
  const livingAge = data.birth_year ? currentYear - data.birth_year : null;

  // Dynamic font scaling inside 60px circle
  const firstName = data.first_name || '';
  const getFontSizeClass = (name: string) => {
    const len = name.trim().length;
    if (len <= 4) return 'text-xs font-black';
    if (len <= 7) return 'text-[11px] font-extrabold';
    return 'text-[9.5px] leading-[1.1] font-extrabold tracking-tighter max-w-[48px] text-center line-clamp-2';
  };

  // Gender ring & background styles
  const circleStyle = data.isHighlighted
    ? 'ring-4 ring-amber-400 dark:ring-amber-400 bg-amber-500/20 text-slate-950 dark:text-slate-100 shadow-2xl shadow-amber-500/60 scale-125 z-40 animate-pulse'
    : isMale
      ? 'ring-2 ring-emerald-500/90 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/90 dark:via-slate-900 dark:to-emerald-900/90 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-500/20 hover:ring-emerald-400'
      : 'ring-2 ring-rose-400/90 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 dark:from-pink-950/90 dark:via-slate-900 dark:to-rose-950/90 text-pink-950 dark:text-pink-100 shadow-md shadow-pink-500/20 hover:ring-rose-300';

  const displayName = data.fullAncestorName || [data.first_name, data.father_name, data.grand_father_name, data.family_name].filter(Boolean).join(' ');
  const directChildren = data.directChildrenCount || 0;
  const grandchildren = data.grandchildrenCount || 0;
  const totalDescendants = data.totalDescendantsCount || 0;
  const spouseNames = data.spouseNames || [];

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-emerald-500/60 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* ===== Rich Hover Card Popover ===== */}
      <NodeToolbar
        isVisible={isHovered}
        position={Position.Top}
        offset={12}
        className="z-50 w-[320px] p-0 rounded-2xl bg-white/[0.97] dark:bg-slate-900/[0.97] backdrop-blur-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] dir-rtl text-right pointer-events-none overflow-hidden"
      >
        {/* Top Gradient Accent Bar */}
        <div className={`h-1.5 w-full ${isMale ? 'bg-gradient-to-l from-emerald-400 via-teal-500 to-emerald-600' : 'bg-gradient-to-l from-rose-400 via-pink-500 to-rose-600'}`} />

        <div className="p-3.5 flex flex-col gap-3">
          {/* Header Section: Photo + Full Name + Status */}
          <div className="flex items-start gap-3">
            {/* Photo */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 ${isMale ? 'border-emerald-400/50' : 'border-rose-400/50'} bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
              {data.photo_url ? (
                <Image
                  src={data.photo_url}
                  alt={firstName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <UserRound className={`w-7 h-7 ${isMale ? 'text-emerald-400/60' : 'text-rose-400/60'}`} />
              )}
            </div>

            {/* Name + Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`p-0.5 rounded-md ${isMale ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                  {isMale ? <Mars className="w-3.5 h-3.5" /> : <Venus className="w-3.5 h-3.5" />}
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">#{data.id}</span>
              </div>
              <h3 className="text-[13px] font-bold leading-snug text-slate-900 dark:text-slate-100 line-clamp-3">
                {displayName}
              </h3>
              <div className="mt-1 text-[10.5px] font-medium">
                {isLiving ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    على قيد الحياة
                    {data.birth_year ? <span className="text-slate-400 dark:text-slate-500 mr-1">({data.birth_year})</span> : null}
                    {livingAge ? <span className="text-slate-500 dark:text-slate-400">• {livingAge} سنة</span> : null}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    متوفى
                    {data.birth_year ? <span className="text-slate-400 dark:text-slate-500 mr-1">({data.birth_year})</span> : null}
                  </span>
                )}
              </div>
              {!isLiving && data.burial_place && (
                <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-amber-500" />
                  {data.burial_place}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Children */}
            <div className={`flex flex-col items-center gap-1 p-2 rounded-xl ${isMale ? 'bg-emerald-50/80 dark:bg-emerald-950/40' : 'bg-rose-50/80 dark:bg-rose-950/40'}`}>
              <Baby className={`w-4 h-4 ${isMale ? 'text-emerald-500' : 'text-rose-500'}`} />
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">{directChildren}</span>
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">الأبناء</span>
            </div>

            {/* Grandchildren */}
            <div className={`flex flex-col items-center gap-1 p-2 rounded-xl ${isMale ? 'bg-teal-50/80 dark:bg-teal-950/40' : 'bg-pink-50/80 dark:bg-pink-950/40'}`}>
              <Users className={`w-4 h-4 ${isMale ? 'text-teal-500' : 'text-pink-500'}`} />
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">{grandchildren}</span>
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">الأحفاد</span>
            </div>

            {/* Total Descendants */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40">
              <TreePine className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">{totalDescendants}</span>
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">إجمالي النسل</span>
            </div>
          </div>

          {/* Spouses Section */}
          {spouseNames.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-l from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isMale ? 'الزوجات' : 'الأزواج'} ({spouseNames.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {spouseNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-[10.5px] font-semibold text-rose-700 dark:text-rose-300"
                    >
                      <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer Badge */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-emerald-500" />
              عرض مدمج (قراءة فقط)
            </span>
          </div>
        </div>
      </NodeToolbar>

      {/* Center Target & Source Handles for direct straight lines */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1 !h-1 !bg-emerald-500 !border-0 !opacity-0"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* ===== Compact 14px Dot Node + Adjacent Name Badge ===== */}
      <div
        className="relative flex items-center gap-1.5 cursor-pointer select-none group/node transition-all duration-200"
        onClick={() => {
          if (data.onFocusPerson) {
            data.onFocusPerson(data.id);
          }
        }}
      >
        {/* 14px Circular Dot Anchor */}
        <div
          className={`flex-shrink-0 w-3.5 h-3.5 rounded-full transition-transform duration-200 group-hover/node:scale-125 ${data.isHighlighted
              ? 'ring-4 ring-amber-400 bg-amber-400 shadow-lg shadow-amber-400/50 animate-bounce'
              : isMale
                ? 'ring-2 ring-emerald-500 bg-emerald-400 dark:bg-emerald-500 shadow-sm shadow-emerald-500/30'
                : 'ring-2 ring-rose-400 bg-pink-400 dark:bg-rose-400 shadow-sm shadow-rose-400/30'
            }`}
        >
          {!isLiving && (
            <span className="block w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100 m-0.5" title="متوفى" />
          )}
        </div>

        {/* Adjacent Crisp Name Label Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border backdrop-blur-md transition-all duration-200 ${data.isHighlighted
              ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md text-xs'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 font-bold border-slate-200 dark:border-slate-800 shadow-sm text-[11px] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
        >
          <span className="whitespace-nowrap font-extrabold dir-rtl">
            {firstName}
          </span>

          {/* Interactive Subtree Collapse Toggle Badge */}
          {data.hasChildren && data.onToggleCollapse && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleCollapse!(data.id);
              }}
              title={data.isCollapsed ? 'إظهار الفروع المطوية' : 'طي هذا الفرع'}
              className={`mr-1 px-1 py-0.2 rounded font-black text-[9.5px] transition-transform hover:scale-110 ${data.isCollapsed
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white'
                }`}
            >
              {data.isCollapsed ? `+${data.directChildrenCount || ''}` : '−'}
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1 !h-1 !bg-emerald-500 !border-0 !opacity-0"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
};

export const CircleNode = memo(CircleNodeComponent);
