'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Person } from '../types';

interface DeleteRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipId: number | null;
  sourcePerson: Person | null;
  targetPerson: Person | null;
  relationshipType: string | null;
  onSuccess: () => void;
}

export const DeleteRelationModal: React.FC<DeleteRelationModalProps> = ({
  isOpen,
  onClose,
  relationshipId,
  sourcePerson,
  targetPerson,
  relationshipType,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !relationshipId || !sourcePerson || !targetPerson) return null;

  const getRelationLabel = () => {
    if (relationshipType === 'PARENT') return 'علاقة أُبوّة / أمومة';
    if (relationshipType === 'CHILD') return 'علاقة بنوّة / فرع';
    if (relationshipType === 'SPOUSE') return 'علاقة زواج';
    return 'علاقة مباشرة';
  };

  const handleDelete = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';

      const res = await fetch('/api/v1/relationships', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify({
          relationship_id: relationshipId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء حذف العلاقة');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl text-slate-100 overflow-hidden dir-rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base">
            <Trash2 className="w-5 h-5" />
            <span>حذف العلاقة الرابطة</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl space-y-2 text-center">
            <p className="text-slate-300 font-semibold">هل أنت تأكد من رغبتك في حذف هذا الرابط بين الشخصين؟</p>
            
            <div className="flex items-center justify-center gap-3 font-bold text-sm text-slate-100 pt-2">
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                {sourcePerson.first_name} {sourcePerson.family_name}
              </span>
              <span className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-md font-mono">
                {getRelationLabel()}
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                {targetPerson.first_name} {targetPerson.family_name}
              </span>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            تنبيه: حذف الرابط سيقوم بفصل التوصيل المباشر بين العقدتين على الكانفاس، ولكنه لن يحذف الأشخاص أنفسهم من قاعدة البيانات.
          </p>

          {errorMessage && (
            <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              تأكيد حذف العلاقة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
