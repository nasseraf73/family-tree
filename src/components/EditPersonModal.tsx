'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Edit3, Upload, RefreshCw, User, Trash2, Link as LinkIcon } from 'lucide-react';
import { Person, Gender, Country } from '../types';
import { uploadPersonPhoto } from '../lib/supabase/storage';
import { ConfirmModal } from './ConfirmModal';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  allPersonsMap?: Map<number, Person>;
  onSuccess: () => void;
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  isOpen,
  onClose,
  person,
  allPersonsMap,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [grandFatherName, setGrandFatherName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [isAlive, setIsAlive] = useState(true);
  const [birthYear, setBirthYear] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [burialPlace, setBurialPlace] = useState('');
  const [countryId, setCountryId] = useState('');
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [biography, setBiography] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ relId: number; name: string } | null>(null);

  const [activeRels, setActiveRels] = useState<Array<{ id: number; relative: Person; type: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActiveRels = useCallback(async () => {
    if (!person) return;
    try {
      const res = await fetch(`/api/v1/tree/canvas?role=ADMIN`);
      const data = await res.json();
      if (data.edges) {
        const userEdges = data.edges.filter(
          (e: any) => e.source === person.id.toString() || e.target === person.id.toString()
        );
        const relList = userEdges.map((e: any) => {
          const relId = parseInt(e.id.replace('e-', ''), 10);
          const isSource = e.source === person.id.toString();
          const relativeId = parseInt(isSource ? e.target : e.source, 10);
          const relative = allPersonsMap?.get(relativeId) || {
            id: relativeId,
            first_name: 'فرد عائلة',
            family_name: '',
          } as Person;

          return {
            id: relId,
            relative,
            type: e.data?.relationship_type || 'RELATED',
          };
        });
        setActiveRels(relList);
      }
    } catch {
      // Safe catch
    }
  }, [person, allPersonsMap]);

  useEffect(() => {
    if (person) {
      setFirstName(person.first_name || '');
      setFatherName(person.father_name || '');
      setGrandFatherName(person.grand_father_name || '');
      setFamilyName(person.family_name || '');
      setGender(person.gender || 'MALE');
      setIsAlive(person.is_alive ?? true);
      setBirthYear(person.birth_year ? person.birth_year.toString() : '');
      setDeathDate(person.death_date ? person.death_date.substring(0, 4) : '');
      setBurialPlace(person.burial_place || '');
      setCountryId(person.country_id ? person.country_id.toString() : '');
      setBiography(person.biography || '');
      setPhotoPreview(person.photo_url || null);
      setPhotoFile(null);
      setIsPhotoRemoved(false);
      setShowDeleteConfirm(false);
      setUnlinkTarget(null);
      setErrorMessage(null);
      loadActiveRels();

      fetch('/api/v1/countries')
        .then((res) => res.json())
        .then((data) => {
          if (data.countries) setCountriesList(data.countries);
        })
        .catch(() => {});
    }
  }, [person, isOpen, loadActiveRels]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setIsPhotoRemoved(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsPhotoRemoved(true);
  };

  const handleUnlinkRelationship = async () => {
    if (!unlinkTarget) return;
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
        body: JSON.stringify({ relationship_id: unlinkTarget.relId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء فصل العلاقة');
        return;
      }
      setUnlinkTarget(null);
      await loadActiveRels();
      onSuccess();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePersonConfirmed = async () => {
    if (!person) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';
      const res = await fetch(`/api/v1/persons?id=${person.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': savedEmail,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء حذف بطاقة الشخص');
        setLoading(false);
        return;
      }

      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      let uploadedPhotoUrl: string | null = isPhotoRemoved ? null : (person.photo_url || null);
      if (photoFile) {
        const uploadRes = await uploadPersonPhoto(photoFile, person.id);
        if (uploadRes.url) {
          uploadedPhotoUrl = uploadRes.url;
        } else if (uploadRes.error) {
          setErrorMessage(`فشل معالجة الصورة: ${uploadRes.error}`);
          setLoading(false);
          return;
        }
      }

      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';

      const formattedDeathDate = !isAlive && deathDate && deathDate.trim()
        ? (deathDate.trim().length === 4 ? `${deathDate.trim()}-01-01` : deathDate.trim())
        : null;

      const res = await fetch('/api/v1/persons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify({
          id: person.id,
          first_name: firstName,
          father_name: fatherName,
          grand_father_name: grandFatherName,
          family_name: familyName,
          gender,
          is_alive: isAlive,
          birth_year: birthYear,
          death_date: formattedDeathDate,
          burial_place: !isAlive ? burialPlace : null,
          country_id: countryId ? parseInt(countryId, 10) : null,
          biography,
          photo_url: uploadedPhotoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء تعديل بيانات الشخص');
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

  if (!isOpen || !person) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden dir-rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">
              تعديل بيانات: <span className="text-emerald-400">{person.first_name} {person.family_name}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
          {/* Photo Upload Section */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-800 flex items-center justify-center shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-500" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-slate-300">الصورة الشخصية:</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/50 px-3 py-1.5 rounded-lg text-xs text-slate-300 transition-colors">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{photoPreview ? 'تغيير الصورة' : 'اختر صورة جديدة'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>حذف الصورة</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">الجنس *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  gender === 'MALE'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>ذكر (MALE)</span>
              </button>

              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  gender === 'FEMALE'
                    ? 'bg-pink-600/30 border-pink-500 text-pink-300 shadow-md shadow-pink-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>أنثى (FEMALE)</span>
              </button>
            </div>
          </div>

          {/* 4-part Name Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">الاسم الأول *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم الأب</label>
              <input
                type="text"
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم الجد</label>
              <input
                type="text"
                value={grandFatherName}
                onChange={e => setGrandFatherName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم العائلة / اللقب *</label>
              <input
                type="text"
                required
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* Active Relationships Manager Section */}
          {activeRels.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <LinkIcon className="w-4 h-4 text-emerald-400" />
                <span>الأقارب والعلاقات المباشرة ({activeRels.length}):</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activeRels.map(rel => (
                  <div
                    key={rel.id}
                    className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">
                        {rel.relative.first_name} {rel.relative.father_name} {rel.relative.family_name}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                        {rel.type === 'PARENT' ? 'والد / أم' : rel.type === 'CHILD' ? 'فرع / ابن' : rel.type === 'SPOUSE' ? 'زواج' : 'قرابة'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setUnlinkTarget({ relId: rel.id, name: `${rel.relative.first_name} ${rel.relative.family_name || ''}`.trim() })}
                      className="px-2 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="فصل وحذف هذه العلاقة"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>فصل العلاقة</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Birth & Vital Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">سنة الميلاد</label>
              <input
                type="number"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                placeholder="مثال: 1942"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الدولة / الانتماء الجغرافي</label>
              <select
                value={countryId}
                onChange={e => setCountryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="">-- اختر الدولة / المنطقة --</option>
                {countriesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.flag_emoji ? `${c.flag_emoji} ` : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الحالة الحياتية</label>
              <div className="flex gap-4 items-center mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="isAliveEdit"
                    checked={isAlive}
                    onChange={() => setIsAlive(true)}
                    className="accent-emerald-500"
                  />
                  <span>على قيد الحياة</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="isAliveEdit"
                    checked={!isAlive}
                    onChange={() => setIsAlive(false)}
                    className="accent-amber-500"
                  />
                  <span>متوفى</span>
                </label>
              </div>
            </div>
          </div>

          {/* Deceased details */}
          {!isAlive && (
            <div className="grid grid-cols-2 gap-3 bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl">
              <div>
                <label className="block text-xs text-amber-300 font-semibold mb-1">سنة الوفاة</label>
                <input
                  type="number"
                  value={deathDate}
                  onChange={e => setDeathDate(e.target.value)}
                  placeholder="مثال: 2022"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-amber-300 font-semibold mb-1">مكان الوفاة / الدفن</label>
                <input
                  type="text"
                  value={burialPlace}
                  onChange={e => setBurialPlace(e.target.value)}
                  placeholder="مثال: مقبرة إربد الإسلامية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Biography Input */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">السيرة / ملاحظات تاريخية:</label>
            <textarea
              rows={2}
              value={biography}
              onChange={e => setBiography(e.target.value)}
              placeholder="اكتب نبذة مختصرة عن الشخص..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs resize-none"
            />
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="حذف بطاقة هذا الشخص المستقلة كلياً من الشجرة"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>حذف البطاقة من الشجرة</span>
            </button>

            <div className="flex gap-2">
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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                حفظ التعديلات
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Person Deletion */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePersonConfirmed}
        title="تأكيد حذف بطاقة الشخص"
        description={`هل أنت متأكد من رغبتك في حذف بطاقة (${person.first_name} ${person.family_name || ''}) كلياً من شجرة العائلة؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="تأكيد الحذف النهائي"
        cancelText="إلغاء"
        variant="danger"
        loading={loading}
      />

      {/* Confirmation Modal for Relationship Unlinking */}
      <ConfirmModal
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={handleUnlinkRelationship}
        title="تأكيد فصل العلاقة"
        description={`هل أنت متأكد من فصل وحذف العلاقة مع (${unlinkTarget?.name || ''})؟`}
        confirmText="تأكيد فصل العلاقة"
        cancelText="إلغاء"
        variant="warning"
        loading={loading}
      />
    </div>
  );
};
