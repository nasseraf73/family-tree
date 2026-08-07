import { db } from './index';
import { users, persons, relationships, branchReviewers, mergeRequests } from './schema';

async function seed() {
  console.log('Seeding initial family tree data into family_tree_db...');

  // 1. Seed Users
  const seededUsers = await db.insert(users).values([
    {
      id: 1,
      full_name: 'أحمد بن عبد الله آل سلمان',
      email: 'ahmed@family.org',
      phone: '+966500000001',
      role: 'USR',
    },
    {
      id: 2,
      full_name: 'د. خالد بن فهد آل سلمان (مشرف الفرع)',
      email: 'khalid@family.org',
      phone: '+966500000002',
      role: 'REV',
    },
    {
      id: 3,
      full_name: 'المهندس سلمان الإبراهيم (مدير النظام)',
      email: 'admin@family.org',
      phone: '+966500000003',
      role: 'ADM',
    },
  ]).onConflictDoNothing().returning();

  // 2. Seed Persons
  const seededPersons = await db.insert(persons).values([
    {
      id: 100,
      first_name: 'عبد العزيز',
      father_name: 'سلمان',
      grand_father_name: 'إبراهيم',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: false,
      birth_year: 1930,
      death_date: '2015-04-12',
      burial_place: 'الرياض - مقبرة العود',
      biography: 'مؤسس فرع العائلة وعميد الأسرة، عُرف بالحكمة والجود.',
      created_by_user_id: 3,
    },
    {
      id: 101,
      first_name: 'عبد الله',
      father_name: 'عبد العزيز',
      grand_father_name: 'سلمان',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: true,
      birth_year: 1958,
      biography: 'رجل أعمال وعضو مجلس العائلة.',
      created_by_user_id: 3,
    },
    {
      id: 102,
      first_name: 'فاطمة',
      father_name: 'محمد',
      grand_father_name: 'عبد الرحمن',
      family_name: 'العمري',
      gender: 'FEMALE',
      is_alive: true,
      birth_year: 1962,
      created_by_user_id: 3,
    },
    {
      id: 103,
      first_name: 'فهد',
      father_name: 'عبد العزيز',
      grand_father_name: 'سلمان',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: true,
      birth_year: 1964,
      biography: 'طبيب استشاري ومشرف سابق.',
      created_by_user_id: 3,
      claimed_by_user_id: 2,
    },
    {
      id: 104,
      first_name: 'منيرة',
      father_name: 'سعود',
      grand_father_name: 'فهد',
      family_name: 'المطيري',
      gender: 'FEMALE',
      is_alive: true,
      birth_year: 1968,
      created_by_user_id: 3,
    },
    {
      id: 105,
      first_name: 'نورة',
      father_name: 'عبد العزيز',
      grand_father_name: 'سلمان',
      family_name: 'آل سلمان',
      gender: 'FEMALE',
      is_alive: true,
      birth_year: 1960,
      created_by_user_id: 3,
    },
    {
      id: 106,
      first_name: 'أحمد',
      father_name: 'عبد الله',
      grand_father_name: 'عبد العزيز',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: true,
      birth_year: 1988,
      biography: 'مهندس برمجيات ومسؤول توثيق الشجرة الإلكترونية.',
      created_by_user_id: 1,
      claimed_by_user_id: 1,
    },
    {
      id: 107,
      first_name: 'سارة',
      father_name: 'عبد الله',
      grand_father_name: 'عبد العزيز',
      family_name: 'آل سلمان',
      gender: 'FEMALE',
      is_alive: true,
      birth_year: 1992,
      created_by_user_id: 1,
    },
    {
      id: 108,
      first_name: 'خالد',
      father_name: 'فهد',
      grand_father_name: 'عبد العزيز',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: true,
      birth_year: 1994,
      created_by_user_id: 2,
    },
    {
      id: 109,
      first_name: 'علي',
      father_name: 'فهد',
      grand_father_name: 'عبد العزيز',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: true,
      birth_year: 1998,
      biography: 'طالب جامعي - إضافة حديثة بانتظار الاعتماد.',
      created_by_user_id: 1,
    },
    {
      id: 110,
      first_name: 'أحمد',
      father_name: 'عبدالله',
      grand_father_name: 'عبدالعزيز',
      family_name: 'آل سلمان',
      gender: 'MALE',
      is_alive: true,
      birth_year: 1988,
      biography: 'سجل مكرر تم إدخاله بواسطة مجهول.',
      created_by_user_id: 1,
    },
  ]).onConflictDoNothing().returning();

  // 3. Seed Relationships
  await db.insert(relationships).values([
    { id: 1, person_id: 101, related_person_id: 100, relationship_type: 'PARENT', status: 'VERIFIED' },
    { id: 2, person_id: 103, related_person_id: 100, relationship_type: 'PARENT', status: 'VERIFIED' },
    { id: 3, person_id: 105, related_person_id: 100, relationship_type: 'PARENT', status: 'VERIFIED' },
    { id: 4, person_id: 101, related_person_id: 102, relationship_type: 'SPOUSE', status: 'VERIFIED' },
    { id: 5, person_id: 103, related_person_id: 104, relationship_type: 'SPOUSE', status: 'VERIFIED' },
    { id: 6, person_id: 106, related_person_id: 101, relationship_type: 'PARENT', status: 'VERIFIED' },
    { id: 7, person_id: 107, related_person_id: 101, relationship_type: 'PARENT', status: 'VERIFIED' },
    { id: 8, person_id: 108, related_person_id: 103, relationship_type: 'PARENT', status: 'VERIFIED' },
    { id: 9, person_id: 109, related_person_id: 103, relationship_type: 'PARENT', status: 'PENDING', created_by_user_id: 1 },
  ]).onConflictDoNothing();

  // 4. Seed Branch Reviewers
  await db.insert(branchReviewers).values([
    { id: 1, user_id: 2, root_person_id: 100 },
  ]).onConflictDoNothing();

  // 5. Seed Merge Requests
  await db.insert(mergeRequests).values([
    { id: 1, primary_person_id: 106, duplicate_person_id: 110, status: 'PENDING', requested_by_user_id: 1 },
  ]).onConflictDoNothing();

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
