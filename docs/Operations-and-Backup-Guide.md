# 🛠️ دليل الصيانة التشغيلية وإجراءات النسخ الاحتياطي والتعافي (Operations, Maintenance & Disaster Recovery Guide)

هذا الدليل المرجعي موجه لإداريي النظام ومندوبي التشغيل (DevOps / System Administrators) لإدارة قاعدة بيانات منظومة شجرة العائلة الكبرى وسيرفرات Next.js و Supabase / PostgreSQL.

---

## 💾 1. استراتيجية النسخ الاحتياطي الدوري (Automated & Manual DB Backups)

### أ. النسخ الاحتياطي التلقائي اليومي عبر PostgreSQL (`pg_dump`)
يتم تنفيذ الأوامر التالية عبر جدول المهام المجدولة (Cron Job / Windows Task Scheduler):

```bash
# إنشاء نسخة احتياطية محلية مضغوطة بقاعدة البيانات
pg_dump -h localhost -U postgres -d family_tree_db -F c -b -v -f "C:\Backups\family_tree_db_%date:~-4,4%%date:~-7,2%%date:~-10,2%.dump"
```

### ب. النسخ الاحتياطي عبر Supabase CLI & Cloud Snapshot
إذا تم الربط المباشر مع Supabase Cloud:
```bash
# أخذ لقطة فورية لمخطط وقاعدة البيانات
npx supabase db dump -f supabase/backups/db_backup_latest.sql
```

---

## 🔄 2. إجراءات استعادة البيانات والتعافي عند الكوارث (Disaster Recovery Procedures)

في حال حدوث خلل بالسيرفر أو تدمير البيانات:

### أ. إنشاء واستعادة قاعدة البيانات من النسخة الاحتياطية
```bash
# 1. إيقاف الاتصالات الحالية وإنشاء القاعدة من جديد
node clear_db.js
node create_db.js

# 2. استعادة البيانات المأخوذة عبر pg_restore
pg_restore -h localhost -U postgres -d family_tree_db -v "C:\Backups\family_tree_db_latest.dump"
```

### ب. إعادة ضبط التسلسلات ومزامنة المخطط (Sequences Fix)
في حال استعادة البيانات يدوياً وتخطي المعرفات:
```bash
# تشغيل سكريبت ضبط تسلسل المفاتيح الرئيسية تلقائياً
node fix_seq.js
```

---

## 🧹 3. إجراءات التنظيف والصيانة التلقائية (Routine Maintenance Tasks)

### أ. تنظيف العقد المعزولة واليتيمة (Orphaned Nodes Vacuuming)
عند حذف العقد الأساسية، يقوم النظام بحذف الروابط المباشرة تلقائياً عبر `DELETE CASCADE`. يمكن إجراء فحص شهري للأفراد المعزولين الذين لا ينتمون لأي زوج أو والد عبر الاستعلام التالي:

```sql
-- كشف العقد اليتيمة التي لا تنتمي لأي شبكة عائلية
SELECT p.id, p.first_name, p.family_name 
FROM persons p
LEFT JOIN relationships r ON p.id = r.person_id OR p.id = r.related_person_id
LEFT JOIN marriages m ON p.id = m.husband_id OR p.id = m.wife_id
WHERE r.id IS NULL AND m.id IS NULL AND p.is_placeholder = true;
```

### ب. تحديث وإعادة بناء مؤشرات البحث (Index Maintenance)
تحديث فهارس الأسماء لسرعة استجابة خوارزميات قياس التشابه (Levenshtein Fuzzy Matching):
```sql
REINDEX TABLE persons;
REINDEX TABLE relationships;
```

---

## 📌 4. خريطة استجابة الطوارئ (Incident Response Matrix)

| نوع المشكلة | الإجراء الفوري | مسؤول التنفيذ |
|-------------|----------------|---------------|
| **فشل الاتصال بقاعدة البيانات** | إعادة تشغيل خدمة PostgreSQL وفحص `.env.local` | DevOps / SysAdmin |
| **تداخل معرّفات التسلسل (Sequence Conflict)** | تشغيل `node fix_seq.js` مباشرة | DB Admin |
| **تجاوز استخدام الذاكرة (Memory Spike)** | إعادة تشغيل خدمة `next start` لتفريع الكاش | System Admin |
