'use client';

import React from 'react';
import { AlertTriangle, Trash2, Info, X, RefreshCw } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl text-slate-100 overflow-hidden dir-rtl transform transition-all scale-100">
        
        {/* Top Accent Gradient Line */}
        <div className={`h-1.5 w-full ${
          isDanger
            ? 'bg-gradient-to-l from-red-500 via-rose-500 to-red-600'
            : isWarning
            ? 'bg-gradient-to-l from-amber-500 via-yellow-500 to-amber-600'
            : 'bg-gradient-to-l from-blue-500 via-indigo-500 to-blue-600'
        }`} />

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-right">
          
          {/* Header & Icon */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDanger
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                  : isWarning
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10'
              }`}>
                {isDanger ? (
                  <Trash2 className="w-6 h-6 animate-pulse" />
                ) : isWarning ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-100 leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 ${
                isDanger
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/25'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 shadow-amber-600/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isDanger ? (
                <Trash2 className="w-4 h-4" />
              ) : null}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
