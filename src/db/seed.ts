import { db } from './index';
import { users, persons, relationships, countries } from './schema';

async function seed() {
  console.log('--- بدء تهيئة بيانات شجرة عائلة النمّاري ---');

  // 1. إضافة الدولة الأساسية
  await db.insert(countries).values([
    {
      id: 1,
      name: 'المملكة العربية السعودية',
      code: 'SA',
      flag_emoji: '🇸🇦',
      is_active: true,
    }
  ]).onConflictDoNothing();

  // 2. إنشاء حساب المدير الأساسي للنظام
  await db.insert(users).values([
    {
      id: 1,
      full_name: 'مدير شجرة عائلة النمّاري',
      email: 'admin@nammari.family',
      phone: '+966500000000',
      role: 'ADM',
    }
  ]).onConflictDoNothing();

  // 3. إضافة أفراد العائلة (الجد حزام وأبنائه وبناته)
  await db.insert(persons).values([
    {
      id: 1,
      first_name: 'حزام',
      father_name: '',
      grand_father_name: '',
      family_name: 'النمّاري',
      gender: 'MALE',
      is_alive: false,
      country_id: 1,
      biography: 'الجد الأول ومؤسس فرع العائلة المبارك.',
      created_by_user_id: 1,
    },
    {
      id: 2,
      first_name: 'سعيدان',
      father_name: 'حزام',
      grand_father_name: '',
      family_name: 'النمّاري',
      gender: 'MALE',
      is_alive: true,
      country_id: 1,
      created_by_user_id: 1,
    },
    {
      id: 3,
      first_name: 'عبد الله',
      father_name: 'حزام',
      grand_father_name: '',
      family_name: 'النمّاري',
      gender: 'MALE',
      is_alive: true,
      country_id: 1,
      created_by_user_id: 1,
    },
    {
      id: 4,
      first_name: 'منيرة',
      father_name: 'حزام',
      grand_father_name: '',
      family_name: 'النمّاري',
      gender: 'FEMALE',
      is_alive: true,
      country_id: 1,
      created_by_user_id: 1,
    },
    {
      id: 5,
      first_name: 'حسنة',
      father_name: 'حزام',
      grand_father_name: '',
      family_name: 'النمّاري',
      gender: 'FEMALE',
      is_alive: true,
      country_id: 1,
      created_by_user_id: 1,
    },
    {
      id: 6,
      first_name: 'وطفة',
      father_name: 'حزام',
      grand_father_name: '',
      family_name: 'النمّاري',
      gender: 'FEMALE',
      is_alive: true,
      country_id: 1,
      created_by_user_id: 1,
    },
  ]).onConflictDoNothing();

  // 4. ربط علاقات الأبناء والبنات بالجد حزام (Parent relationships)
  await db.insert(relationships).values([
    { id: 1, person_id: 2, related_person_id: 1, relationship_type: 'PARENT', status: 'VERIFIED', created_by_user_id: 1 },
    { id: 2, person_id: 3, related_person_id: 1, relationship_type: 'PARENT', status: 'VERIFIED', created_by_user_id: 1 },
    { id: 3, person_id: 4, related_person_id: 1, relationship_type: 'PARENT', status: 'VERIFIED', created_by_user_id: 1 },
    { id: 4, person_id: 5, related_person_id: 1, relationship_type: 'PARENT', status: 'VERIFIED', created_by_user_id: 1 },
    { id: 5, person_id: 6, related_person_id: 1, relationship_type: 'PARENT', status: 'VERIFIED', created_by_user_id: 1 },
  ]).onConflictDoNothing();

  console.log('✅ تم إدخال بيانات الجد حزام وأبنائه وبناته بنجاح!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ خطأ أثناء إدخال البيانات:', err);
  process.exit(1);
});
