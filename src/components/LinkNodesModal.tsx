'use client';

import React, { useState } from 'react';
import { X, Link as LinkIcon, RefreshCw, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Person } from '../types';

interface LinkNodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePerson: Person | null;
  targetPerson: Person | null;
  userRole: string;
  onSuccess: () => void;
}

export const LinkNodesModal: React.FC<LinkNodesModalProps> = ({
  isOpen,
  onClose,
  sourcePerson,
  targetPerson,
  userRole,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !sourcePerson || !targetPerson) return null;

  const handleLink = async (relationshipType: 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING') => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';

      // Standardize so child is always existing_person_id (person_id) and parent is related_person_id
      let pId = sourcePerson.id;
      let rId = targetPerson.id;
      let relType: 'PARENT' | 'SPOUSE' | 'SIBLING' = 'PARENT';

      if (relationshipType === 'PARENT') {
        // sourcePerson is PARENT of targetPerson (target is child, source is parent)
        pId = targetPerson.id;
        rId = sourcePerson.id;
        relType = 'PARENT';
      } else if (relationshipType === 'CHILD') {
        // sourcePerson is CHILD of targetPerson (source is child, target is parent)
        pId = sourcePerson.id;
        rId = targetPerson.id;
        relType = 'PARENT';
      } else if (relationshipType === 'SPOUSE') {
        pId = sourcePerson.id;
        rId = targetPerson.id;
        relType = 'SPOUSE';
      } else if (relationshipType === 'SIBLING') {
        pId = sourcePerson.id;
        rId = targetPerson.id;
        relType = 'SIBLING';
      }

      const payload: any = {
        related_person_id: rId,
        existing_person_id: pId,
        relationship_type: relType,
        user_role: userRole,
      };

      if (relationshipType === 'SIBLING') {
        payload.link_mode = 'AUTO_PARENT_BRIDGE';
      }

      const res = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء ربط العقدتين');
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
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <LinkIcon className="w-5 h-5" />
            <span>ربط عقدتين موجودتين على اللوحة</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-center">
            <p className="text-slate-400">حدد نوع العلاقة بين الشخصين التاليين:</p>
            <div className="flex items-center justify-center gap-3 font-bold text-sm text-slate-100 pt-1">
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                {sourcePerson.first_name} {sourcePerson.family_name}
              </span>
              <span className="text-slate-500">↔</span>
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                {targetPerson.first_name} {targetPerson.family_name}
              </span>
            </div>
          </div>

          <p className="font-semibold text-slate-300">اختر طبيعة العلاقة المباشرة:</p>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleLink('PARENT')}
              className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl font-bold text-slate-200 text-right flex items-center justify-between transition-all group"
            >
              <span>{sourcePerson.first_name} هو (والد / أم) لـ {targetPerson.first_name}</span>
              <CheckCircle className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLink('CHILD')}
              className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl font-bold text-slate-200 text-right flex items-center justify-between transition-all group"
            >
              <span>{sourcePerson.first_name} هو (ابن / ابنة) لـ {targetPerson.first_name}</span>
              <CheckCircle className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLink('SPOUSE')}
              className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 rounded-xl font-bold text-slate-200 text-right flex items-center justify-between transition-all group"
            >
              <span>{sourcePerson.first_name} و {targetPerson.first_name} (زوج وزوجة)</span>
              <CheckCircle className="w-4 h-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLink('SIBLING')}
              className="w-full p-3 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/40 hover:border-amber-500 rounded-xl font-bold text-amber-200 text-right flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{sourcePerson.first_name} و {targetPerson.first_name} (إخوة أشقاء)</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                إنشاء الوالد تلقائياً
              </span>
            </button>
          </div>

          {errorMessage && (
            <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs py-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري حفظ وتحديث شبكة الأنساب...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
