'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, UserPlus, RefreshCw, Upload, Sparkles, Link as LinkIcon, Users, Heart } from 'lucide-react';
import { Person, DeduplicationMatch, RelationshipType, Gender, Country } from '../types';
import { uploadPersonPhoto } from '../lib/supabase/storage';

interface AddRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPerson: Person | null;
  initialRelationType: RelationshipType | 'SIBLING';
  userRole: string;
  onSuccess: () => void;
}

export const AddRelationModal: React.FC<AddRelationModalProps> = ({
  isOpen,
  onClose,
  targetPerson,
  initialRelationType,
  userRole,
  onSuccess,
}) => {
  const [relationType, setRelationType] = useState<RelationshipType | 'SIBLING'>(initialRelationType);
  const [subType, setSubType] = useState<'FATHER' | 'MOTHER' | 'SON' | 'DAUGHTER' | 'HUSBAND' | 'WIFE' | 'SIBLING'>('FATHER');
  
  // Dual-Path Spouse Mode State
  const [spousePath, setSpousePath] = useState<'EXTERNAL' | 'INTERNAL'>('EXTERNAL');
  const [marriageStatus, setMarriageStatus] = useState<'ACTIVE' | 'DIVORCED' | 'WIDOWED' | 'DECEASED'>('ACTIVE');
  const [marriageOrder, setMarriageOrder] = useState<number>(1);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [grandFatherName, setGrandFatherName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [isAlive, setIsAlive] = useState(true);
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [burialPlace, setBurialPlace] = useState('');
  const [countryId, setCountryId] = useState('');
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Deduplication state
  const [dedupMatches, setDedupMatches] = useState<DeduplicationMatch[]>([]);
  const [checkingDedup, setCheckingDedup] = useState(false);

  const autofillLineageForChild = useCallback((targetP: Person) => {
    if (targetP.gender === 'MALE' || !targetP.gender) {
      setFatherName(targetP.first_name || '');
      setGrandFatherName(targetP.father_name || '');
      setFamilyName(targetP.family_name || '');
    } else {
      setFatherName('');
      setGrandFatherName('');
      setFamilyName(targetP.family_name || '');
    }
  }, []);

  const clearLineageFields = useCallback(() => {
    setFatherName('');
    setGrandFatherName('');
    setFamilyName('');
  }, []);

  // Reset ALL fields 100% clean every time modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setFatherName('');
      setGrandFatherName('');
      setFamilyName('');
      setBirthYear('');
      setDeathYear('');
      setBurialPlace('');
      setCountryId('');
      setGender('MALE');
      setIsAlive(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setDedupMatches([]);
      setErrorMessage(null);

      fetch('/api/v1/countries')
        .then((res) => res.json())
        .then((data) => {
          if (data.countries) setCountriesList(data.countries);
        })
        .catch(() => {});
      setSpousePath('EXTERNAL');
      setMarriageStatus('ACTIVE');
      setMarriageOrder(1);

      if (targetPerson) {
        if (initialRelationType === 'PARENT') {
          setSubType('FATHER');
          setGender('MALE');
          clearLineageFields();
        } else if (initialRelationType === 'CHILD') {
          setSubType('SON');
          setGender('MALE');
          autofillLineageForChild(targetPerson);
        } else if (initialRelationType === 'SPOUSE') {
          const targetGender = targetPerson.gender;
          if (targetGender === 'MALE') {
            setSubType('WIFE');
            setGender('FEMALE');
          } else {
            setSubType('HUSBAND');
            setGender('MALE');
          }
          clearLineageFields();
        } else if (initialRelationType === 'SIBLING') {
          setSubType('SIBLING');
          setGender('MALE');
          clearLineageFields();
        }
        setRelationType(initialRelationType);
      }
    }
  }, [targetPerson, initialRelationType, isOpen, autofillLineageForChild, clearLineageFields]);

  const handleGenderToggle = (selectedGender: Gender) => {
    setGender(selectedGender);
    if (subType === 'SON' && selectedGender === 'FEMALE') {
      setSubType('DAUGHTER');
      if (targetPerson) {
        autofillLineageForChild(targetPerson);
      }
    } else if (subType === 'DAUGHTER' && selectedGender === 'MALE') {
      setSubType('SON');
      if (targetPerson) {
        autofillLineageForChild(targetPerson);
      }
    } else {
      clearLineageFields();
    }
  };

  const handleSubTypeChange = (type: 'FATHER' | 'MOTHER' | 'SON' | 'DAUGHTER' | 'HUSBAND' | 'WIFE' | 'SIBLING') => {
    setSubType(type);
    if (type === 'FATHER' || type === 'SON' || type === 'HUSBAND') {
      setGender('MALE');
    } else if (type === 'MOTHER' || type === 'DAUGHTER' || type === 'WIFE') {
      setGender('FEMALE');
    }

    if (type === 'FATHER' || type === 'MOTHER') {
      setRelationType('PARENT');
      clearLineageFields();
    } else if (type === 'SON' || type === 'DAUGHTER') {
      setRelationType('CHILD');
      if (targetPerson) {
        autofillLineageForChild(targetPerson);
      } else {
        clearLineageFields();
      }
    } else if (type === 'HUSBAND' || type === 'WIFE') {
      setRelationType('SPOUSE');
      clearLineageFields();
    } else {
      setRelationType('SIBLING');
      clearLineageFields();
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const performDedupCheck = useCallback(async () => {
    if (!firstName.trim() || firstName.trim().length < 2) {
      setDedupMatches([]);
      return;
    }

    setCheckingDedup(true);
    try {
      const res = await fetch('/api/v1/dedup/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          father_name: fatherName,
          grand_father_name: grandFatherName,
          family_name: familyName,
          birth_year: birthYear,
        }),
      });

      const data = await res.json();
      if (data.hasDuplicates) {
        setDedupMatches(data.matches);
      } else {
        setDedupMatches([]);
      }
    } catch (e) {
      console.error('Error during dedup check fetch:', e);
    } finally {
      setCheckingDedup(false);
    }
  }, [firstName, fatherName, grandFatherName, familyName, birthYear]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performDedupCheck();
    }, 300);
    return () => clearTimeout(timer);
  }, [firstName, fatherName, grandFatherName, familyName, birthYear, performDedupCheck]);

  // Standard Link Existing Node Handler
  const handleLinkExistingPerson = async (existingPersonId: number) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';

      if (relationType === 'SPOUSE' && targetPerson) {
        const isTargetHusband = targetPerson.gender === 'MALE';
        const resM = await fetch('/api/v1/marriages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': savedEmail,
          },
          body: JSON.stringify({
            husband_id: isTargetHusband ? targetPerson.id : existingPersonId,
            wife_id: isTargetHusband ? existingPersonId : targetPerson.id,
            status: marriageStatus,
            marriage_order: marriageOrder,
          }),
        });

        if (!resM.ok) {
          const dataM = await resM.json();
          setErrorMessage(dataM.error || 'حدث خطأ أثناء ربط الزواج');
          setLoading(false);
          return;
        }
      } else {
        const bodyPayload = targetPerson ? {
          related_person_id: targetPerson.id,
          existing_person_id: existingPersonId,
          relationship_type: relationType,
          user_role: userRole,
        } : {
          first_name: firstName,
          father_name: fatherName,
          grand_father_name: grandFatherName,
          family_name: familyName,
          gender,
          is_alive: isAlive,
          birth_year: birthYear,
          death_date: !isAlive ? deathYear : null,
          burial_place: !isAlive ? burialPlace : null,
          existing_person_id: existingPersonId,
          relationship_type: relationType,
          user_role: userRole,
        };

        const res = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': savedEmail,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || 'حدث خطأ أثناء ربط الشخص');
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Sibling Bridging Handler
  const handleLinkAsSiblings = async (existingPersonId: number) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';

      const bodyPayload = targetPerson ? {
        related_person_id: targetPerson.id,
        existing_person_id: existingPersonId,
        relationship_type: 'SIBLING',
        link_mode: 'AUTO_PARENT_BRIDGE',
        user_role: userRole,
      } : {
        first_name: firstName,
        father_name: fatherName,
        grand_father_name: grandFatherName,
        family_name: familyName,
        gender,
        is_alive: isAlive,
        birth_year: birthYear,
        death_date: !isAlive ? deathYear : null,
        burial_place: !isAlive ? burialPlace : null,
        existing_person_id: existingPersonId,
        relationship_type: 'SIBLING',
        link_mode: 'AUTO_PARENT_BRIDGE',
        user_role: userRole,
      };

      const res = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء ربط الإخوة');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '';

      // Dual-Path Spouse Handling
      if (relationType === 'SPOUSE' && targetPerson) {
        const isTargetHusband = targetPerson.gender === 'MALE';

        if (spousePath === 'EXTERNAL') {
          // Path B: External Partner entry saved in marriagesTable without creating a standalone card
          const resM = await fetch('/api/v1/marriages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': savedEmail,
            },
            body: JSON.stringify({
              husband_id: isTargetHusband ? targetPerson.id : null,
              wife_id: !isTargetHusband ? targetPerson.id : null,
              external_spouse_name: firstName,
              external_family_name: familyName,
              status: marriageStatus,
              marriage_order: marriageOrder,
            }),
          });

          if (!resM.ok) {
            const dataM = await resM.json();
            setErrorMessage(dataM.error || 'حدث خطأ أثناء إضافة الزواج الخارجي');
            setLoading(false);
            return;
          }

          onSuccess();
          onClose();
          return;
        }
      }

      // Standard Person Creation
      let uploadedPhotoUrl: string | null = null;
      if (photoFile) {
        const uploadRes = await uploadPersonPhoto(photoFile);
        if (uploadRes.url) {
          uploadedPhotoUrl = uploadRes.url;
        } else if (uploadRes.error) {
          setErrorMessage(`فشل معالجة الصورة: ${uploadRes.error}`);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify({
          first_name: firstName,
          father_name: fatherName,
          grand_father_name: grandFatherName,
          family_name: familyName,
          gender,
          is_alive: isAlive,
          birth_year: birthYear,
          death_date: !isAlive ? deathYear : null,
          burial_place: !isAlive ? burialPlace : null,
          country_id: countryId ? parseInt(countryId, 10) : null,
          photo_url: uploadedPhotoUrl,
          related_person_id: targetPerson ? targetPerson.id : null,
          relationship_type: targetPerson ? relationType : null,
          user_role: userRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء إضافة الشخص');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden dir-rtl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {targetPerson ? (
              <UserPlus className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="font-bold text-lg">
              {targetPerson ? (
                initialRelationType === 'CHILD' ? (
                  <>إضافة ابن / ابنة لـ: <span className="text-emerald-400">{targetPerson.first_name} {targetPerson.family_name}</span></>
                ) : initialRelationType === 'SPOUSE' ? (
                  <>إضافة وتوثيق زوج / زوجة لـ: <span className="text-pink-400">{targetPerson.first_name} {targetPerson.family_name}</span></>
                ) : (
                  <>إضافة قريب إلى: <span className="text-emerald-400">{targetPerson.first_name} {targetPerson.family_name}</span></>
                )
              ) : (
                <>إضافة الجد والأصل الأول في شجرة العائلة الجديدة</>
              )}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
          {/* Real-time Match Suggestion Banner */}
          {dedupMatches.length > 0 && (
            <div className="bg-amber-950/90 border-2 border-amber-500/80 rounded-xl p-4 space-y-3 shadow-2xl z-30">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <span>تم العثور على شخص (أو أكثر) مطابق مسبقاً في شجرة العائلة!</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dedupMatches.map(match => (
                  <div key={match.person.id} className="bg-slate-900/95 border border-amber-800/60 p-3 rounded-lg flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{match.person.first_name} {match.person.father_name} {match.person.grand_father_name} {match.person.family_name}</span>
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {Math.round(match.score * 100)}% تطابق نسب
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {match.person.birth_year ? `الميلاد: ${match.person.birth_year}` : ''} {match.person.is_alive ? '(حي)' : '(متوفى)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleLinkAsSiblings(match.person.id)}
                        disabled={loading}
                        className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-transform hover:scale-[1.02] flex items-center justify-center gap-1 shadow-md"
                      >
                        <Users className="w-3.5 h-3.5" />
                        ربط كإخوة (إنشاء الأب المشترك تلقائياً)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLinkExistingPerson(match.person.id)}
                        disabled={loading}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        ربط مباشر
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relation Type Selector (Only if targetPerson is defined and relation is not pre-locked to CHILD or SPOUSE) */}
          {targetPerson && initialRelationType !== 'CHILD' && initialRelationType !== 'SPOUSE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">نوع العلاقة المباشرة:</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSubTypeChange('FATHER')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                    subType === 'FATHER' || subType === 'MOTHER'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  أب / أم (والد)
                </button>

                <button
                  type="button"
                  onClick={() => handleSubTypeChange('SON')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                    subType === 'SON' || subType === 'DAUGHTER'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ابن / ابنة (فرع)
                </button>

                <button
                  type="button"
                  onClick={() => handleSubTypeChange('HUSBAND')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                    subType === 'HUSBAND' || subType === 'WIFE'
                      ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  زوج / زوجة
                </button>

                <button
                  type="button"
                  onClick={() => handleSubTypeChange('SIBLING')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                    subType === 'SIBLING'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  أخ / أخت (شقيق)
                </button>
              </div>
            </div>
          )}

          {/* Dual-Path Spouse Mode Options */}
          {relationType === 'SPOUSE' && (
            <div className="bg-pink-950/20 border border-pink-500/30 p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>طبيعة إضافة الزوج / الزوجة:</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpousePath('EXTERNAL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      spousePath === 'EXTERNAL'
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    طرف خارجي (مدمج بالبطاقة)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpousePath('INTERNAL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      spousePath === 'INTERNAL'
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    فرد مسجل بالشجرة
                  </button>
                </div>
              </div>

              {/* Status and Order */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">حالة الزوجية:</label>
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
                  <label className="block text-[11px] text-slate-400 mb-1">ترتيب الزواج:</label>
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
            </div>
          )}

          {/* Explicit Gender Selector Component */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">الجنس *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenderToggle('MALE')}
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
                onClick={() => handleGenderToggle('FEMALE')}
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

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">الاسم الأول *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="أحمد، فاطمة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم الأب</label>
              <input
                type="text"
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="عبد الله..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم الجد</label>
              <input
                type="text"
                value={grandFatherName}
                onChange={e => setGrandFatherName(e.target.value)}
                placeholder="سلمان..."
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
                placeholder="اسم عائلتك..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* Photo Upload Input */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">الصورة الشخصية (اختياري):</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-300">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>رفع صورة شخصية</span>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
              {photoPreview && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

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
              <label className="block text-xs text-slate-400 mb-1">الحالة الصحية / الحياتية</label>
              <div className="flex gap-2 items-center mt-1">
                <label className="flex items-center gap-1 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="isAlive"
                    checked={isAlive}
                    onChange={() => setIsAlive(true)}
                    className="accent-emerald-500"
                  />
                  <span>على قيد الحياة</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-xs mr-4">
                  <input
                    type="radio"
                    name="isAlive"
                    checked={!isAlive}
                    onChange={() => setIsAlive(false)}
                    className="accent-amber-500"
                  />
                  <span>متوفى</span>
                </label>
              </div>
            </div>
          </div>

          {/* Conditional Death Details: Death Year & Burial Place */}
          {!isAlive && (
            <div className="grid grid-cols-2 gap-3 bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl">
              <div>
                <label className="block text-xs text-amber-300 font-semibold mb-1">سنة الوفاة (اختياري)</label>
                <input
                  type="number"
                  value={deathYear}
                  onChange={e => setDeathYear(e.target.value)}
                  placeholder="مثال: 2015"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-amber-300 font-semibold mb-1">مكان الوفاة / الدفن (اختياري)</label>
                <input
                  type="text"
                  value={burialPlace}
                  onChange={e => setBurialPlace(e.target.value)}
                  placeholder="مثال: الرياض - مقبرة العود"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Error Message Display */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {targetPerson ? 'حفظ القريب' : 'إنشاء الجد والأصل الأول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
