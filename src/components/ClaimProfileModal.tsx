'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, ShieldCheck, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Person } from '../types';
import { getPentanyicFullName } from '../lib/lineage';
import { normalizeForSearch, sortSearchResults, filterAndSortSearchResults } from '../lib/dedup';
import { useAuth } from '../context/AuthContext';

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPersons: Person[];
  targetPerson?: Person | null;
  onSuccess: () => void;
}

export const ClaimProfileModal: React.FC<ClaimProfileModalProps> = ({
  isOpen,
  onClose,
  allPersons,
  targetPerson: initialTargetPerson,
  onSuccess,
}) => {
  const { user, dbUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(initialTargetPerson || null);
  const [proofNote, setProofNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if current user already owns/claimed a profile
  const existingClaimedPerson = useMemo(() => {
    if (!dbUser) return null;
    return allPersons.find((p) => Number(p.claimed_by_user_id) === Number(dbUser.id));
  }, [dbUser, allPersons]);

  // Synchronize selectedPerson when modal opens or initialTargetPerson prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPerson(initialTargetPerson || null);
      setMessage(null);
      setError(null);
      setProofNote('');
      setSearchQuery('');
    }
  }, [isOpen, initialTargetPerson]);

  const filteredPersons = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return allPersons.slice(0, 30);
    return filterAndSortSearchResults(allPersons, searchQuery).slice(0, 30);
  }, [allPersons, searchQuery]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const userEmail = user?.email || dbUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '');

    if (!userEmail) {
      setError('غير مصرح: يرجى تسجيل الدخول أولاً من شريط التنقل العلوي للمطالبة ببطاقة نسبك.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/claim/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          proof_document: proofNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشلت المطالبة بالملف');
      } else {
        setMessage(data.message || 'تم تقديم طلب المطالبة بالبطاقة بنجاح للمراجعة');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden dir-rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg">المطالبة بالملف الشخصي ("هذا أنا")</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleClaimSubmit} className="p-6 space-y-4 text-sm">
          {existingClaimedPerson && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">تنبيه: حسابك مرتبط ببطاقة موثقة بالفعل</span>
                <span>
                  حسابك مرتبط مسبقاً ببطاقة: <strong>{getPentanyicFullName(existingClaimedPerson)}</strong>.
                  لا يتيح النظام للمستخدم الواحد المطالبة بأكثر من بطاقة شخصية واحدة.
                </span>
              </div>
            </div>
          )}

          {!selectedPerson ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                ابحث عن اسمك في الشجرة العامة للمطالبة بملفك:
              </label>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم الأول، اسم الأب، أو سنة الميلاد..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-950/50">
                {filteredPersons.map((p: Person) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPerson(p)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 cursor-pointer flex items-center justify-between border border-slate-800 text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-100">
                        {getPentanyicFullName(p)}
                      </span>
                      <span className="text-slate-400 mr-2">({p.birth_year || 'سنة غير محددة'})</span>
                    </div>
                    {p.claimed_by_user_id ? (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">مطالب به</span>
                    ) : (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">متاح للمطالبة</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs text-slate-400 block">العقدة المختارة للمطالبة:</span>
                  <span className="font-bold text-base text-blue-300">
                    {getPentanyicFullName(selectedPerson)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  تغيير
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">إثبات الهوية / ملاحظة للمشرف:</label>
                <textarea
                  rows={3}
                  value={proofNote}
                  onChange={e => setProofNote(e.target.value)}
                  placeholder="أدخل رقم الهوية أو صلة القرابة المباشرة لتأكيد ملكيتك لهذا الملف..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {message && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs">
              {error}
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              إلغاء
            </button>
            {selectedPerson && (
              <button
                type="submit"
                disabled={loading || (!!existingClaimedPerson && existingClaimedPerson.id !== selectedPerson.id)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                إرسال طلب المطالبة (CLAIM_PENDING)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
