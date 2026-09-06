# 🚀 خطة النشر المرحلية — FamilyTree Al-Nammari

> اتبع هذه الخطوات بالترتيب. كل خطوة مستقلة وآمنة. إذا فشلت أي خطوة، أوقف واطلب المساعدة.

---

## ⏱️ متى أبدأ؟

- **الأفضل:** في وقت حركة قليلة على الموقع (الساعة ٣-٥ صباحاً بتوقيتك)
- **الحد الأدنى:** بعيداً عن أوقات الاستخدام الذروة
- **المدة الكاملة:** ١٠-١٥ دقيقة (مع المراقبة)

---

## 📋 قبل البدء — قائمة التحقق

```bash
# ١. تأكد من أنك على السيرفر الصحيح
pwd
# يجب أن يُظهر: /path/to/FamilyTree Al-Nammari

# ٢. تأكد من نظافة git
git status
# يجب أن يكون: "nothing to commit, working tree clean"
# أو فقط التعديلات التي قمت بها أنا (ستظهر في الخطوة ٢)

# ٣. سجّل الأرقام الحالية (Baseline) — مهم جداً
# افتح متصفح -> DevTools -> Network
# افتح https://your-domain.com/tree
# سجّل:
#   - Time to First Byte (TTFB)
#   - DOM Content Loaded
#   - Total requests
#   - Total transferred
```

---

## 🔴 المرحلة A: تعديلات الكود الآمنة (٢-٣ دقائق)

> هذه تعديلات كود فقط، **صفر تأثير على البيانات**.

```bash
# ١. راجع التعديلات التي قمت بها
git diff --stat
# يجب أن يظهر: ~٥ ملفات معدّلة

# ٢. إذا بدت التعديلات سليمة، احفظ snapshot قبل النشر
pm2 save

# ٣. شغّل البناء
npm run build
# انتظر حتى ينتهي بنجاح. إذا فشل، أوقف واطلب المساعدة.

# ٤. أعِد تشغيل التطبيق
pm2 reload family-tree
# أو: pm2 restart family-tree (أقل سلاسة)

# ٥. تحقق من السجلات
pm2 logs family-tree --lines 50
# تأكد من عدم وجود errors حمراء

# ٦. اختبر سريعاً
# افتح الموقع في المتصفح
# - هل الشجرة تفتح بشكل طبيعي؟
# - هل يمكنك إضافة شخص جديد؟
# - هل البحث يعمل؟
# - هل الانتقال بين الصفحات سريع؟
```

**✅ معيار النجاح:**
- لا errors في السجلات
- الموقع يعمل كالسابق بالضبط
- لا فرق في السلوك (التحسينات في الأداء فقط)

**❌ إذا حدثت مشكلة:**
```bash
# ارجع فوراً
pm2 stop family-tree
git checkout -- .
npm run build
pm2 reload family-tree
```

---

## 🟡 المرحلة B: تشغيل migrations (٥-٧ دقائق)

> migrations تعمل على قاعدة البيانات. **خُذ backup قبل كل واحدة.**

### B.0 — Backup كامل لقاعدة البيانات

```bash
# احفظ backup بتاريخ
pg_dump "$DATABASE_URL" -Fc -f "backups/backup_$(date +%Y%m%d_%H%M%S).dump"

# تحقق من أن الـ backup تم بنجاح
ls -lh backups/
# يجب أن ترى ملف بحجم منطقي (> 1 MB)
```

**⚠️ إذا فشلت أي migration لاحقاً، استخدم هذا الـ backup للعودة:**
```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists backups/backup_YYYYMMDD_HHMMSS.dump
```

---

### B.1 — Migration #0002: تنظيف `photo_url` (1-2 دقيقة)

```bash
# ١. أولاً: DRY RUN لمعرفة عدد السجلات المتأثرة
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) AS bad_rows
  FROM persons
  WHERE photo_url IS NOT NULL AND photo_url LIKE 'data:%';
"
```

**تفسير النتيجة:**
- `bad_rows = 0` → ممتاز، يمكنك تشغيل الـ UPDATE مباشرة (لن يعدّل شيئاً)
- `bad_rows < 100` → كمية صغيرة، آمن
- `bad_rows بين 100-1000` → قابل للإصلاح، آمن
- `bad_rows > 1000` → راجع، قد يكون هناك bug في تطبيق آخر

```bash
# ٢. شغّل الـ UPDATE الفعلي
psql "$DATABASE_URL" -f drizzle/0002_cleanup_photo_urls.sql
```

**✅ معيار النجاح:**
- الرسالة: `UPDATE <عدد>`
- بدون errors

**❌ إذا فشل:** ارجع للـ backup وأبلغني.

---

### B.2 — Migration #0003: CHECK constraint (ثوانٍ)

```bash
# ١. تأكد من أن لا توجد بيانات سيئة
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) FROM persons
  WHERE photo_url IS NOT NULL AND photo_url LIKE 'data:%';
"
# يجب أن يكون 0 (بعد B.1)

# ٢. شغّل الـ migration
psql "$DATABASE_URL" -f drizzle/0003_prevent_base64_photos.sql
```

**✅ معيار النجاح:**
- الرسالة: `ALTER TABLE` أو `DO` (idempotent)
- بدون errors

**التحقق:**
```bash
psql "$DATABASE_URL" -c "
  SELECT conname FROM pg_constraint WHERE conname = 'chk_photo_url_no_data';
"
# يجب أن يُظهر صف واحد
```

---

### B.3 — Migration #0004: الفهارس (3-5 دقائق)

> هذه الأطول لأنها تبني فهارس. `CONCURRENTLY` يمنع قفل الجداول.

```bash
# شغّل الـ migration
psql "$DATABASE_URL" -f drizzle/0004_performance_indexes.sql
```

**✅ معيار النجاح:**
- عدة رسائل `CREATE INDEX`
- آخر رسالة قد تكون `NOTICE: extension "pg_trgm" already exists` (عادي)

**⚠️ قد يستغرق 2-5 دقائق على ٢٠ ألف سجل. لا تCtrl+C!**

**التحقق:**
```bash
# عدد الفهارس الجديدة
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) AS total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public';
"
# يجب أن يكون قبل ~7-8، بعد ~22-25 (زيادة ~17)

# التحقق من استخدام Index
psql "$DATABASE_URL" -c "
  EXPLAIN ANALYZE
  SELECT * FROM relationships WHERE person_id = 1 AND status = 'VERIFIED';
"
# يجب أن يُظهر: "Index Scan using idx_relationships_person_status"
# (وليس "Seq Scan")
```

---

## 🟢 المرحلة C: إزالة in-request UPDATE (دقيقة واحدة)

> هذه الخطوة **بعد** نجاح B.1 و B.2. قبلها، الـ in-request UPDATE يحميك.

### ١. افتح الملف
`src/app/api/v1/tree/canvas/route.ts`

### ٢. احذف السطور 49-55 (تقريباً)

احذف هذا الجزء بالضبط:
```typescript
    // 0. Database Cleanup: Permanently remove any heavy Base64 image strings from persons table
    try {
      await db.update(personsTable).set({ photo_url: null }).where(like(personsTable.photo_url, 'data:%'));
    } catch {
      // Safe catch if table isn't populated yet
    }
```

### ٣. نظّف الـ imports
في أعلى الملف، احذف:
```typescript
import { sql, like } from 'drizzle-orm';
```

(إذا لم يُستخدم `sql` في مكان آخر، احذفه أيضاً. إذا غير متأكد، اتركه.)

### ٤. انشر
```bash
npm run build
pm2 reload family-tree
pm2 logs family-tree --lines 30
```

**✅ معيار النجاح:**
- لا errors
- GET `/tree` يعمل بشكل أسرع (الآن لا يوجد UPDATE في كل طلب)

---

## 📊 المرحلة D: قياس النتائج (٥ دقائق)

> **مهم جداً:** سجّل هذه الأرقام في `PERF.md` لمقارنتها مستقبلاً.

### ١. اختبر TTFB (Time to First Byte)
```bash
# استبدل your-domain.com بدومينك
curl -w "TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s \
  "https://your-domain.com/api/v1/tree/canvas?role=USER"
```

### ٢. اختبر عدد الاتصالات النشطة
```bash
psql "$DATABASE_URL" -c "
  SELECT count(*) AS active_connections
  FROM pg_stat_activity
  WHERE datname = current_database();
"
```

### ٣. اختبر حجم الـ response
في المتصفح:
1. افتح DevTools → Network
2. افتح `/tree`
3. سجّل:
   - Size: (كان ١٥-٢٠ MB، الهدف < ٥٠٠ KB بعد كل المراحل)
   - Requests
   - Time

### ٤. املأ `PERF.md`
[تعليمات في نهاية الملف]

---

## 🚨 إذا حدث خطأ

| العَرَض | السبب المحتمل | الحل |
|---|---|---|
| Migration فشل بـ `permission denied` | المستخدم لا يملك صلاحيات كافية | تواصل معي فوراً، لا تحاول مرة أخرى |
| `CREATE INDEX` فشل بـ `deadlock` | تعارض مع استعلامات أخرى | أعد تشغيل B.3 فقط |
| الموقع بطيء جداً بعد النشر | الكود الجديد فيه bug | ارجع: `git checkout -- .` وأعد البناء |
| `pm2 reload` فشل | خطأ في `next.config.mjs` | شغّل `npm run build` يدوياً لرؤية الخطأ |
| Tree فاضي بعد C | الـ in-request UPDATE أُزيل قبل B.1 | ارجع بـ git، شغّل B.1، ثم أعد C |

---

## 📞 بعد الانتهاء

بعد نجاح كل شيء، أبلغني بـ:
1. نتيجة TTFB (قبل/بعد)
2. عدد الـ connections النشطة (يجب < 8 في حالة سكون)
3. حجم الـ response (قبل/بعد)
4. أي ملاحظات من المستخدمين

سأقوم بتسجيل الأرقام في `PERF.md` ونقرر ما إذا كنا ننتقل للمرحلة P2.
