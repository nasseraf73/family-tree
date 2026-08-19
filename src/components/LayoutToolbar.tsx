'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Users, Sparkles } from 'lucide-react';
import { LayoutDirection } from '../lib/layout';

export type VisualFilter = 'ALL' | 'LIVING' | 'MARRIED';

interface LayoutToolbarProps {
  activeDirection: LayoutDirection;
  onSelectLayout: (direction: LayoutDirection) => void;
  onToggleDirection?: () => void;
  onFitView?: () => void;
  activeFilter?: VisualFilter;
  onSelectFilter?: (filter: VisualFilter) => void;
  onToggleExpandAll?: () => void;
  isAllCollapsed?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  activeDirection,
  onSelectLayout,
  onToggleDirection,
  activeFilter = 'ALL',
  onSelectFilter,
  onToggleExpandAll,
  isAllCollapsed = false,
}) => {
  const isBottomToTop = activeDirection === 'BT';

  const handleDirectionToggle = () => {
    if (onToggleDirection) {
      onToggleDirection();
    } else {
      onSelectLayout(isBottomToTop ? 'TB' : 'BT');
    }
  };

  return (
    <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl shadow-2xl flex flex-wrap items-center gap-2 dir-rtl">
      {/* 1. Root Direction Toggle Button (Top vs Bottom Root) */}
      <button
        type="button"
        onClick={handleDirectionToggle}
        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
          isBottomToTop
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-lg shadow-emerald-600/30'
            : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-600/30'
        }`}
        title="تبديل اتجاه الشجرة بين الجذر في الأسفل (صعوداً) والجذر في الأعلى (هبوطاً)"
      >
        <img
          src="/icons/change-direction-icon.png"
          alt="اتجاه"
          className="w-4 h-4 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <span>{isBottomToTop ? 'الجذر بالأسفل ⬆️' : 'الجذر بالأعلى ⬇️'}</span>
      </button>

      <div className="w-px h-5 bg-slate-800 mx-0.5 hidden sm:block" />

      {/* 2. Direction Presets (TB, BT) */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onSelectLayout('TB')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            activeDirection === 'TB' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="الجذر في الأعلى والأحفاد للأسفل"
        >
          <ArrowDown className="w-3 h-3" />
          <span>أعلى ⬇️</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectLayout('BT')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            activeDirection === 'BT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="الجذر في الأسفل والفروع للأعلى"
        >
          <ArrowUp className="w-3 h-3" />
          <span>أسفل ⬆️</span>
        </button>
      </div>

      <div className="w-px h-5 bg-slate-800 mx-0.5 hidden sm:block" />

      {/* 3. Quick Visual Filters Toolbar */}
      {onSelectFilter && (
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 px-1.5 hidden md:inline">تصفية:</span>

          <button
            type="button"
            onClick={() => onSelectFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'ALL'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="إظهار كل أفراد العائلة"
          >
            <Users className="w-3 h-3" />
            <span>الكل</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('LIVING')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'LIVING'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="تظليل وإبراز الأحياء فقط"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>الأحياء فقط</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('MARRIED')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'MARRIED'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="تظليل وإبراز المتزوجين فقط"
          >
            <img src="/icons/rings-icon.png" alt="خاتمين" className="w-3.5 h-3.5 object-contain" />
            <span>المتزوجون</span>
          </button>
        </div>
      )}

      {/* 4. Global Expand/Collapse All Branches Button */}
      {onToggleExpandAll && (
        <button
          type="button"
          onClick={onToggleExpandAll}
          className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          title={isAllCollapsed ? 'توسيع كل فروع الشجرة' : 'طي كل فروع الشجرة'}
        >
          <img
            src={isAllCollapsed ? '/icons/expand-icon.png' : '/icons/collapse-icon.png'}
            alt="طي/توسيع"
            className="w-3.5 h-3.5 object-contain shrink-0"
          />
          <span>{isAllCollapsed ? 'توسيع الكل' : 'طي الكل'}</span>
        </button>
      )}
    </div>
  );
};
