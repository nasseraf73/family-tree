# 📊 سجل تحسينات الأداء — FamilyTree Al-Nammari

> **القاعدة:** سجّل الأرقام قبل كل تغيير، ثم بعده. التغيير الذي لا يحسّن الأرقام يُرجَع.

---

## 🎯 الحالة الأساسية (Baseline)

**التاريخ:** _________________  
**وقت القياس:** _________________  
**عدد الأشخاص في DB:** _________________  
**عدد العلاقات:** _________________  

| القياس | القيمة | الطريقة |
|---|---|---|
| TTFB على `/api/v1/tree/canvas` | _____ ms | `curl -w "%{time_starttransfer}"` |
| Total response time | _____ ms | `curl -w "%{time_total}"` |
| Active DB connections | _____ | `SELECT count(*) FROM pg_stat_activity` |
| حجم `/api/v1/tree/canvas` response | _____ KB | DevTools Network |
| وقت فتح `/tree` في المتصفح | _____ s | DevTools Performance |
| LCP (Largest Contentful Paint) | _____ s | Lighthouse |
| INP (Interaction to Next Paint) | _____ ms | web-vitals |
| CLS (Cumulative Layout Shift) | _____ | Lighthouse |

**استعلامات بطيئة (إن وُجدت):**
```sql
-- نسخ من EXPLAIN ANALYZE هنا
```

---

## 📝 سجل التغييرات

### Change #1 — P0.2: زيادة Connection Pool (max: 5 → 20)

- **التاريخ:** _________________
- **Commit:** `git rev-parse HEAD`
- **الملفات:** `src/db/index.ts`

| القياس | قبل | بعد | Δ |
|---|---|---|---|
| Active DB connections (peak) | _____ | _____ | _____ |
| TTFB | _____ | _____ | _____ |

**الحكم:** ⬜ Keep · ⬜ Revert  
**السبب:** _______________________________________

---

### Change #2 — P0.3: استبدال `queue.shift()` بمؤشر

- **التاريخ:** _________________
- **Commit:** `git rev-parse HEAD`
- **الملفات:** `src/lib/kinship.ts`, `src/lib/layout.ts`, `src/lib/treeFilter.ts`, `src/components/FamilyTreeCanvas.tsx`

| القياس | قبل | بعد | Δ |
|---|---|---|---|
| وقت `applyGraphLayout` (20K سجل) | _____ s | _____ s | _____ |
| INP (طي/فتح فرع) | _____ ms | _____ ms | _____ |

**الحكم:** ⬜ Keep · ⬜ Revert  
**السبب:** _______________________________________

---

### Change #3 — P0.4: `Set.has()` بدل `result.includes()`

- **التاريخ:** _________________
- **Commit:** `git rev-parse HEAD`
- **الملفات:** `src/lib/kinship.ts`

**الحكم:** ⬜ Keep · ⬜ Revert (لا يتغيّر السلوك، يجب أن يكون Keep)  
**السبب:** _______________________________________

---

### Change #4 — P0.5: تعطيل realtime channel (polling 60s)

- **التاريخ:** _________________
- **Commit:** `git rev-parse HEAD`
- **الملفات:** `src/components/FamilyTreeCanvas.tsx`

| القياس | قبل | بعد | Δ |
|---|---|---|---|
| WebSockets مفتوحة | _____ | _____ | _____ |
| CPU في حالة السكون | _____ % | _____ % | _____ |

**الحكم:** ⬜ Keep · ⬜ Revert  
**السبب:** _______________________________________

---

### Change #5 — Migration 0002: تنظيف `photo_url` (data:)

- **التاريخ:** _________________
- **الـ Backup:** `backups/backup_YYYYMMDD_HHMMSS.dump`
- **عدد السجلات المتأثرة:** _________________

| القياس | قبل | بعد | Δ |
|---|---|---|---|
| حجم `persons` table | _____ MB | _____ MB | _____ |
| عدد الـ rows بـ `data:%` | _____ | 0 | _____ |

**الحكم:** ⬜ Keep · ⬜ Revert  
**السبب:** _______________________________________

---

### Change #6 — Migration 0003: CHECK constraint

- **التاريخ:** _________________

**الحكم:** ⬜ Keep · ⬜ Revert (يجب أن يكون Keep، يضيف حماية فقط)  
**السبب:** _______________________________________

---

### Change #7 — Migration 0004: الفهارس

- **التاريخ:** _________________
- **عدد الفهارس قبل:** _____
- **عدد الفهارس بعد:** _____

| الاستعلام | قبل (ms) | بعد (ms) | Δ |
|---|---|---|---|
| `EXPLAIN ANALYZE SELECT * FROM relationships WHERE person_id = X` | _____ | _____ | _____ |
| `EXPLAIN ANALYZE SELECT * FROM persons WHERE first_name ILIKE '%X%'` | _____ | _____ | _____ |

**الحكم:** ⬜ Keep · ⬜ Revert  
**السبب:** _______________________________________

---

### Change #8 — P0.1: إزالة in-request UPDATE من `/tree/canvas`

- **التاريخ:** _________________
- **Commit:** `git rev-parse HEAD`
- **الملفات:** `src/app/api/v1/tree/canvas/route.ts`

| القياس | قبل | بعد | Δ |
|---|---|---|---|
| TTFB | _____ ms | _____ ms | _____ |
| DB load (عدد queries لكل request) | _____ | _____ | _____ |

**الحكم:** ⬜ Keep · ⬜ Revert  
**السبب:** _______________________________________

---

## 🏁 ملخص التحسينات الكلية (بعد كل التغييرات)

| القياس | Baseline | بعد P0 | تحسّن |
|---|---|---|---|
| TTFB | _____ | _____ | _____% |
| Total response | _____ | _____ | _____% |
| Active connections (peak) | _____ | _____ | _____ |
| INP | _____ | _____ | _____% |
| وقت Layout (20K سجل) | _____ | _____ | _____% |

---

## 🗒️ ملاحظات

- كل التغييرات قابلة للعكس عبر `git revert <commit>`
- كل migration لها `down.sql` في تعليق داخل الملف
- النسخ الاحتياطية في `backups/`

---

## 🔜 المرحلة القادمة: P2 — Pagination + Caching

**ستبدأ بعد نجاح P0 و P1.**

المتطلبات:
- [ ] كل التغييرات السابقة Keep
- [ ] TTFB < 300ms لمستخدم واحد
- [ ] لا errors في السجلات لمدة ٢٤ ساعة
- [ ] الفهارس تعمل كما هو متوقع

عند تحقق هذه الشروط، أرسل لي إشارة وأجهّز P2.
