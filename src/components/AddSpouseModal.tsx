'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Heart, Search, CheckCircle, RefreshCw, AlertTriangle, UserCheck, Users } from 'lucide-react';
import { Person } from '../types';
import { getPentanyicFullName } from '../lib/lineage';
import { normalizeForSearch, sortSearchResults } from '../lib/dedup';

interface AddSpouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPerson: Person | null;
  allPersons: Person[];
  onSuccess: () => void;
}

export const AddSpouseModal: React.FC<AddSpouseModalProps> = ({
  isOpen,
  onClose,
  targetPerson,
  allPersons,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInternalPerson, setSelectedInternalPerson] = useState<Person | null>(null);

  const [externalSpouseName, setExternalSpouseName] = useState('');
  const [externalFamilyName, setExternalFamilyName] = useState('');
  const [marriageStatus, setMarriageStatus] = useState<'ACTIVE' | 'DIVORCED' | 'WIDOWED' | 'DECEASED'>('ACTIVE');
  const [marriageOrder, setMarriageOrder] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedInternalPerson(null);
      setExternalSpouseName('');
      setExternalFamilyName('');
      setMarriageStatus('ACTIVE');
      setMarriageOrder(1);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Live Auto-Suggest Search Filter
  const searchResults = useMemo(() => {
    const queryClean = normalizeForSearch(searchQuery);
    if (!queryClean || queryClean.length < 2) return [];
    const filtered = allPersons.filter(p => {
      if (targetPerson && p.id === targetPerson.id) return false;
      const fullNameClean = normalizeForSearch(`${p.first_name}${p.father_name || ''}${p.grand_father_name || ''}${p.family_name || ''}`);
      return fullNameClean.includes(queryClean) || (p.birth_year && p.birth_year.toString().includes(queryClean));
    });
    return sortSearchResults(filtered, searchQuery);
  }, [allPersons, searchQuery, targetPerson]);

  const handleSelectSuggestion = (person: Person) => {
    setSelectedInternalPerson(person);
    setSearchQuery(`${person.first_name} ${person.father_name || ''} ${person.family_name || ''}`.trim());
  };

  const handleClearSelection = () => {
    setSelectedInternalPerson(null);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPerson) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';
      const isTargetHusband = targetPerson.gender === 'MALE';

      const payload = selectedInternalPerson
        ? {
            husband_id: isTargetHusband ? targetPerson.id : selectedInternalPerson.id,
            wife_id: isTargetHusband ? selectedInternalPerson.id : targetPerson.id,
            status: marriageStatus,
            marriage_order: marriageOrder,
          }
        : {
            husband_id: isTargetHusband ? targetPerson.id : null,
            wife_id: !isTargetHusband ? targetPerson.id : null,
            external_spouse_name: externalSpouseName || searchQuery || 'زوجة',
            external_family_name: externalFamilyName || targetPerson.family_name || '',
            status: marriageStatus,
            marriage_order: marriageOrder,
          };

      const res = await fetch('/api/v1/marriages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء إرسال بيانات الزوجية');
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

  if (!isOpen || !targetPerson) return null;

  const isMaleTarget = targetPerson.gender === 'MALE';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden dir-rtl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-base text-slate-100">
              إضافة وتوثيق {isMaleTarget ? 'زوجة' : 'زوج'} لـ: <span className="text-pink-300">{targetPerson.first_name} {targetPerson.family_name}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm dir-rtl">
          {/* Live Auto-Suggest Search Bar */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold text-slate-300">
              البحث التلقائي التفاعلي في أفراد العائلة (Auto-Suggest):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (selectedInternalPerson) setSelectedInternalPerson(null);
                }}
                placeholder={isMaleTarget ? "اكتب اسم الزوجة أو اسم والدها للبحث في الشجرة..." : "اكتب اسم الزوج للبحث في الشجرة..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              {selectedInternalPerson && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="absolute left-2.5 top-2 text-xs text-pink-400 hover:text-pink-300 font-bold bg-pink-950/60 px-2 py-0.5 rounded-md border border-pink-500/30"
                >
                  إلغاء التحديد
                </button>
              )}
            </div>

            {/* Selected Internal Person Pill Banner */}
            {selectedInternalPerson && (
              <div className="bg-emerald-950/70 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    تم اختيار: <strong className="text-white">{selectedInternalPerson.first_name} {selectedInternalPerson.father_name} {selectedInternalPerson.family_name}</strong> (فرد مسجل بالشجرة)
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  ربط داخلي
                </span>
              </div>
            )}

            {/* Dropdown Live Suggestions list */}
            {searchResults.length > 0 && !selectedInternalPerson && (
              <div className="absolute top-full mt-1 right-0 left-0 bg-slate-950 border border-pink-500/40 rounded-xl shadow-2xl overflow-hidden z-50 max-h-44 overflow-y-auto">
                <div className="p-2 bg-slate-900 text-[10px] text-pink-300 font-bold border-b border-slate-800">
                  نتائج المطابقة المباشرة في شجرة العائلة:
                </div>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectSuggestion(p)}
                    className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs border-b border-slate-800/60 transition-colors"
                  >
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-pink-400" />
                      <span>{getPentanyicFullName(p)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {p.birth_year ? `الميلاد: ${p.birth_year}` : ''} {p.is_alive ? '(حي)' : '(متوفى)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Spouse Fallback Inputs (Only visible if no internal person is selected) */}
          {!selectedInternalPerson && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>أو أدخل بيانات {isMaleTarget ? 'الزوجة الخارجية' : 'الزوج الخارجي'} مباشرة:</span>
                <span className="text-[10px] text-slate-400 font-normal">(في حال كان الطرف الآخر من خارج الشجرة)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الاسم الأول *</label>
                  <input
                    type="text"
                    value={externalSpouseName}
                    onChange={e => setExternalSpouseName(e.target.value)}
                    placeholder={isMaleTarget ? "مثال: مريم، فاطمة..." : "مثال: خالد، عبد الله..."}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-pink-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">اسم العائلة / اللقب</label>
                  <input
                    type="text"
                    value={externalFamilyName}
                    onChange={e => setExternalFamilyName(e.target.value)}
                    placeholder="اسم عائلة الزوجة..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-pink-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Marriage Status and Order Selectors */}
          <div className="grid grid-cols-2 gap-3 bg-pink-950/20 border border-pink-500/30 p-3 rounded-xl">
            <div>
              <label className="block text-xs text-pink-300 font-semibold mb-1">حالة الزوجية الحاليّة:</label>
              <select
                value={marriageStatus}
                onChange={e => setMarriageStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
              >
                <option value="ACTIVE">💚 قائمة (على عصمته)</option>
                <option value="DIVORCED">💔 مطلقة / مطلق</option>
                <option value="WIDOWED">🖤 متوفى (أرمل/أرملة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-pink-300 font-semibold mb-1">ترتيب الزوجة / الزواج:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={marriageOrder}
                onChange={e => setMarriageOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Error Display */}
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
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-pink-600/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              حفظ وتوثيق الزوجية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
