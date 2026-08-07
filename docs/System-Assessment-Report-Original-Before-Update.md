تقرير التقييم الشامل — جاهزية النظام للنشر والبيع
Comprehensive System Assessment Report — Production & Commercial Readiness
منصة شجرة العائلة الكبرى — Crowdsourced Grand Family Tree Platform
--------------------------------------------------------------------------------
البند
التفاصيل
تاريخ التقييم
2026-07-30
نطاق الفحص
أمني + جودة الكود + اختبارات + جاهزية الإنتاج
عدد الملفات
56 ملف TypeScript/TSX
إجمالي الأسطر
~10,500 سطر كود
--------------------------------------------------------------------------------
الحكم النهائي (Executive Verdict)
[!WARNING] التطبيق غير جاهز للنشر التجاري أو البيع في حالته الحالية. يحتوي على ثغرات أمنية حرجة ومشاكل هيكلية تحتاج لمعالجة قبل النشر. ومع ذلك، المنطق الأساسي (Business Logic) متين وذكي، والتطبيق يمكن أن يكون جاهزاً للإنتاج بعد معالجة النقاط المذكورة أدناه.
التقييم الإجمالي
المحور
التقييم
النسبة
🔒 الأمان
⚠️ ضعيف — 4 ثغرات حرجة + 10 عالية
25%
📝 جودة الكود
✅ متوسط-جيد — مع ملاحظات
65%
🧪 الاختبارات
❌ غائبة تماماً
0%
🏗️ البنية المعمارية
✅ جيدة — تصميم ذكي
75%
🎨 واجهة المستخدم
✅ ممتازة — تصميم احترافي
85%
⚙️ البناء والتجميع
✅ ناجح بالكامل
100%
📋 التوثيق
✅ شامل ومحدّث
90%
الإجمالي
غير جاهز للنشر
~50%
--------------------------------------------------------------------------------
1. التقييم الأمني (Security Assessment) 🔒
1.1 ثغرات حرجة (Critical) 🔴
SEC-CRIT-1: لا يوجد نظام مصادقة حقيقي — الوضع المحلي بدون كلمة مرور
[!CAUTION] مستوى الخطورة: حرج (Critical) في الوضع المحلي (بدون Supabase)، يمكن لأي شخص تسجيل الدخول بأي بريد إلكتروني بدون كلمة مرور. لا يوجد تحقق من هوية المستخدم.
المشكلة:
// AuthContext.tsx - سطر 51-98
const handleLocalSignIn = async (rawEmail: string) => {
  // يقبل أي بريد إلكتروني بدون كلمة مرور!
  let foundUser = await fetchDbUserRole(cleanEmail);
  if (!foundUser) {
    // ينشئ حساب جديد تلقائياً لأي بريد!
    const regRes = await fetch('/api/v1/auth/register', {...});
  }
};
التأثير: أي شخص يعرف بريد admin@family.org يمكنه الدخول كمدير نظام بصلاحيات كاملة. التوصية: إضافة نظام مصادقة بكلمة مرور مشفرة (bcrypt/argon2) أو إلزام استخدام Supabase Auth في بيئة الإنتاج.
--------------------------------------------------------------------------------
SEC-CRIT-2: بيانات اعتماد تجريبية مكشوفة في الكود (Hardcoded Demo Credentials)
[!CAUTION] مستوى الخطورة: حرج (Critical) ملف AuthModal.tsx يحتوي على أزرار دخول سريع بحسابات تجريبية مكشوفة للعموم.
الموقع: [AuthModal.tsx](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/components/AuthModal.tsx#L172-L222)
// AuthModal.tsx - أسطر 178, 194, 210
setEmail('admin@family.org');     // حساب مدير النظام!
setPassword('123456');            // كلمة مرور مكشوفة!
setEmail('khalid@family.org');    // حساب المراجع!
setEmail('ahmed@family.org');     // حساب عضو!
التأثير: أي زائر يمكنه الدخول كمدير نظام أو مراجع بنقرة واحدة. التوصية: حذف أزرار الدخول السريع بالكامل قبل النشر، واستخدام بيئة تجريبية منفصلة.
--------------------------------------------------------------------------------
SEC-CRIT-3: لا يوجد ملف .gitignore — خطر تسريب الأسرار
[!CAUTION] مستوى الخطورة: حرج (Critical) المشروع لا يحتوي على ملف .gitignore!
التأثير: عند رفع المشروع لمستودع Git، ستُرفع ملفات .env.local و node_modules و .next وكل الملفات الحساسة. التوصية: إنشاء .gitignore فوراً مع استبعاد: .env*, node_modules/, .next/, *.log
--------------------------------------------------------------------------------
SEC-CRIT-4: بيانات اتصال قاعدة البيانات مكشوفة في الكود
[!CAUTION] مستوى الخطورة: حرج (Critical)
الموقع: [db/index.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/db/index.ts#L5)
const connectionString = process.env.DATABASE_URL 
  || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';
الموقع: [supabase/client.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/lib/supabase/client.ts#L3-L4)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://familytree.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGci...placeholder_anon_key';
التأثير: بيانات اتصال قاعدة البيانات وSuppbase مكشوفة كقيم افتراضية. التوصية: إزالة جميع القيم الافتراضية ورمي خطأ واضح عند عدم تعيين متغيرات البيئة.
--------------------------------------------------------------------------------
1.2 ثغرات عالية الخطورة (High) 🟠
SEC-HIGH-1: لا يوجد Rate Limiting على أي API
المشكلة: لا يوجد أي نظام تحديد معدل الطلبات (Rate Limiting) على أي من الـ 10 API endpoints. التأثير: عرضة لهجمات Brute Force و DDoS وإساءة الاستخدام. التوصية: إضافة middleware لتحديد المعدل (مثل @upstash/ratelimit أو حل مخصص).
--------------------------------------------------------------------------------
SEC-HIGH-2: لا يوجد CSRF Protection
المشكلة: لا يوجد أي حماية ضد هجمات Cross-Site Request Forgery. التأثير: يمكن لموقع خبيث إرسال طلبات POST/PUT/DELETE نيابة عن المستخدم المسجل. التوصية: إضافة CSRF tokens أو استخدام SameSite cookies.
--------------------------------------------------------------------------------
SEC-HIGH-3: لا يوجد Security Headers
المشكلة: ملف next.config.mjs فارغ من إعدادات الأمان.
const nextConfig = {
  reactStrictMode: true,
  // لا يوجد headers أمنية!
};
التوصية: إضافة:
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security
X-XSS-Protection
--------------------------------------------------------------------------------
SEC-HIGH-4: DELETE /api/v1/persons بدون تحقق من الصلاحيات
الموقع: [persons/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/persons/route.ts#L654-L690) (دالة DELETE)
export async function DELETE(request: Request) {
  const personId = parseInt(personIdParam, 10);
  // لا يوجد أي تحقق من صلاحية المستخدم!
  // لا يوجد حتى تحقق من تسجيل الدخول!
  await db.delete(personsTable).where(eq(personsTable.id, personId));
}
التأثير: أي شخص يمكنه حذف أي بطاقة في الشجرة بدون مصادقة. التوصية: إضافة نفس نمط RBAC الموجود في PUT.
--------------------------------------------------------------------------------
SEC-HIGH-5: POST /api/v1/marriages بدون مصادقة إجبارية
الموقع: [marriages/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/marriages/route.ts#L6-L51)
export async function POST(request: Request) {
  const userEmail = request.headers.get('x-user-email');
  // إذا لم يكن هناك بريد → يستمر بدون مستخدم!
  let userId: number | null = null;
}
التأثير: يمكن تسجيل زيجات بدون تسجيل دخول.
--------------------------------------------------------------------------------
SEC-HIGH-6: POST /api/v1/review/approve بدون تحقق من دور المستخدم
الموقع: [review/approve/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/review/approve/route.ts#L9-L62)
const { dbUser } = await getAuthenticatedUser(request);
const reviewerId = dbUser ? dbUser.id : 2; // إذا لم يوجد مستخدم → يستخدم ID=2!
// لا يتحقق أن المستخدم REVIEWER أو ADMIN!
التأثير: أي مستخدم عادي (USER) يمكنه اعتماد أو رفض العلاقات المعلقة. والأسوأ: إذا لم يكن مسجلاً أصلاً، يتم استخدام reviewerId = 2 كقيمة افتراضية! التوصية: إضافة تحقق if (dbUser.role !== 'REVIEWER' && dbUser.role !== 'ADMIN') return 403.
--------------------------------------------------------------------------------
SEC-HIGH-7: POST /api/v1/review/merge بدون تحقق من دور المستخدم
الموقع: [review/merge/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/review/merge/route.ts#L9-L77)
const reviewerId = dbUser ? dbUser.id : 2; // نفس المشكلة!
// لا يتحقق من الدور → أي شخص يمكنه دمج السجلات!
التأثير: أي مستخدم يمكنه تنفيذ دمج السجلات وحذف أشخاص من الشجرة.
--------------------------------------------------------------------------------
SEC-HIGH-8: POST /api/v1/claim/request يعمل على MemoryStore فقط
الموقع: [claim/request/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/claim/request/route.ts#L5-L38)
// يبحث فقط في MemoryStore!
const person = dbStore.getPersonById(person_id);
// لا يوجد أي تكامل مع PostgreSQL!
person.claimed_by_user_id = userIdToClaim; // يُعدّل الذاكرة فقط
التأثير: المطالبة بالملفات الشخصية لا تُحفظ في PostgreSQL — تضيع عند إعادة تشغيل الخادم. التوصية: إضافة db.update(personsTable).set({ claimed_by_user_id }).where(eq(personsTable.id, person_id)).
--------------------------------------------------------------------------------
SEC-HIGH-9: GET /api/v1/auth/user يجلب جميع المستخدمين للبحث عن واحد
الموقع: [auth/user/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/auth/user/route.ts#L19-L27)
// يجلب كل المستخدمين من قاعدة البيانات!
const dbUsers = await db.select().from(users);
const foundUser = dbUsers.find(u => u.email.toLowerCase() === cleanEmail);
التأثير: مشكلة أداء — يجلب جميع سجلات المستخدمين من قاعدة البيانات للبحث عن بريد واحد. أيضاً يُرجع password_hash ضمن البيانات! التوصية: استخدام WHERE filter: db.select().from(users).where(eq(users.email, cleanEmail)).limit(1) مع استبعاد password_hash.
--------------------------------------------------------------------------------
SEC-HIGH-10: POST /api/v1/auth/register بدون تحقق من صيغة البريد
الموقع: [auth/register/route.ts](file:///c:/Users/ASUS/Documents/Drive D/my apps and programs/FamilyTree/src/app/api/v1/auth/register/route.ts#L7-L57)
if (!email || !full_name) { // يتحقق من الوجود فقط!
  return NextResponse.json({ error: '...' }, { status: 400 });
}
// لا يتحقق من صيغة البريد الإلكتروني!
// لا يتحقق من طول الاسم!
// لا يمنع حقن HTML/Script في الاسم!
التأثير: يمكن تسجيل حساب ببريد abc أو اسم <script>alert('XSS')</script>. رغم أن React يحمي من XSS في العرض، إلا أن البيانات الخبيثة تُحفظ في قاعدة البيانات.
--------------------------------------------------------------------------------
1.3 ثغرات متوسطة (Medium) 🟡
SEC-MED-1: المصادقة تعتمد على Header قابل للتزوير
المشكلة: نظام المصادقة على جانب الخادم يعتمد بشكل أساسي على x-user-email HTTP header:
// auth.ts - سطر 10
const xUserEmail = request.headers.get('x-user-email');
التأثير: يمكن لأي عميل تزوير هذا الـ header للتظاهر بأنه أي مستخدم. التوصية: الاعتماد على JWT tokens فقط مع التحقق الخادمي (server-side verification).
--------------------------------------------------------------------------------
SEC-MED-2: MemoryStore — البيانات تضيع عند إعادة التشغيل
المشكلة: نظام MemoryStore يخزن البيانات في الذاكرة فقط، وتضيع عند إعادة تشغيل الخادم. التأثير: إذا فشلت PostgreSQL وتم استخدام MemoryStore، كل البيانات المُدخلة ستضيع. التوصية: إما إزالة MemoryStore أو استخدام حل تخزين مؤقت مستدام (Redis/SQLite).
--------------------------------------------------------------------------------
SEC-MED-3: بيانات الصور كـ Base64 في قاعدة البيانات
المشكلة: عند فشل Supabase Storage، يتم تخزين الصور كـ Base64 في حقل photo_url مما يؤدي لتضخم قاعدة البيانات. التأثير: كل صورة ≈ 100-500KB نص في قاعدة البيانات.
--------------------------------------------------------------------------------
1.4 نقاط إيجابية أمنية ✅
النقطة
التفاصيل
✅ لا يوجد XSS
لم يتم استخدام dangerouslySetInnerHTML أو eval() أو innerHTML في أي مكان
✅ لا يوجد SQL Injection
استخدام Drizzle ORM يمنع حقن SQL بالكامل (Parameterized Queries)
✅ RBAC في PUT
تحقق من الصلاحيات في تعديل الأشخاص (المُنشئ/المُطالب/المراجع)
✅ RBAC في DELETE Relationships
تحقق من الصلاحيات في حذف العلاقات
✅ Circular Loop Prevention
منع الحلقات الدائرية يحمي سلامة البيانات
✅ Duplicate Detection
نظام كشف التكرارات يمنع تلوث البيانات
✅ CASCADE Deletes
حذف متسلسل يمنع البيانات اليتيمة
✅ React Strict Mode
مُفعّل في next.config.mjs
--------------------------------------------------------------------------------
2. تقييم جودة الكود (Code Quality Assessment) 📝
2.1 نتائج الاختبارات التقنية
الاختبار
النتيجة
التفاصيل
✅ TypeScript Compilation
ناجح
tsc --noEmit — بدون أخطاء
✅ Production Build
ناجح
next build — compiled successfully
✅ Static Pages
17/17
كل الصفحات تولدت بنجاح
❌ Unit Tests
غير موجودة
لا يوجد أي ملف اختبار
❌ ESLint Config
غير مُهيأ
لم يتم إعداد ESLint
--------------------------------------------------------------------------------
2.2 مشاكل جودة الكود (Code Smells)
CQ-1: كتل catch فارغة بكثرة (30+ حالة) 🟠
[!WARNING] تم رصد 30+ كتلة catch {} فارغة في المشروع. هذا يُخفي الأخطاء ويجعل تشخيص المشاكل شبه مستحيل.
أمثلة:
// persons/route.ts — 13 كتلة catch فارغة!
} catch {
  // Fallback
}

// AuthContext.tsx — 7 كتل catch فارغة!
} catch {
  // Ignore
}
التأثير: عند حدوث خطأ غير متوقع، لن يظهر أي أثر في السجلات. التوصية: إضافة console.error() أو نظام logging مركزي (مثل Winston/Pino) لكل catch block.
--------------------------------------------------------------------------------
CQ-2: تكرار كبير في تحويل بيانات PostgreSQL (Mapping Boilerplate) 🟡
المشكلة: نفس كود تحويل صفوف قاعدة البيانات إلى كائنات TypeScript مُكرر في أكثر من 8 أماكن مختلفة:
// هذا النمط مُكرر حرفياً في:
// persons/route.ts (4 مرات)
// tree/canvas/route.ts (1 مرة)
// dedup/check/route.ts (1 مرة)
// auth.ts (2 مرة)
const p = dbRows[0];
createdPerson = {
  id: p.id,
  first_name: p.first_name,
  father_name: p.father_name || undefined,
  grand_father_name: p.grand_father_name || undefined,
  // ... 15+ سطر من نفس التحويل
};
التوصية: إنشاء دالة mapper مركزية:
function mapDbRowToPerson(row: typeof personsTable.$inferSelect): Person { ... }
function mapDbRowToRelationship(row: typeof relsTable.$inferSelect): Relationship { ... }
--------------------------------------------------------------------------------
CQ-3: ملف persons/route.ts ضخم جداً (691 سطر) 🟡
المشكلة: ملف API واحد يحتوي على 691 سطر مع 3 دوال معقدة (POST/PUT/DELETE). التوصية: تقسيمه إلى:
persons/create.ts — POST logic
persons/update.ts — PUT logic
persons/delete.ts — DELETE logic
persons/utils.ts — دوال مشتركة
--------------------------------------------------------------------------------
CQ-4: استراتيجية Dual Storage تزيد التعقيد بدون فائدة إنتاجية 🟡
المشكلة: كل عملية كتابة تحاول PostgreSQL أولاً ثم تتراجع لـ MemoryStore. هذا يضاعف كمية الكود وعدد مسارات التنفيذ. التوصية: في بيئة الإنتاج، يجب إزالة MemoryStore بالكامل والاعتماد حصرياً على PostgreSQL مع معالجة أخطاء واضحة.
--------------------------------------------------------------------------------
CQ-5: عدم استخدام Transactions في العمليات المتعددة 🟡
المشكلة: عمليات مثل Sibling Bridging تنشئ 2-3 سجلات متعددة بدون Transaction. إذا فشلت العملية الثانية، الأولى تبقى.
// إنشاء placeholder parent → إنشاء علاقة 1 → إنشاء علاقة 2
// إذا فشلت الخطوة 3، الخطوتان 1 و 2 تبقيان في قاعدة البيانات!
التوصية: لف العمليات المتعددة في db.transaction().
--------------------------------------------------------------------------------
CQ-6: console.error بدلاً من نظام Logging 🟡
المشكلة: 19 استخدام لـ console.error و console.log مباشرة في الكود. التوصية: استخدام مكتبة logging مثل Pino أو Winston مع مستويات (info/warn/error) وتسجيل مركزي.
--------------------------------------------------------------------------------
2.3 نقاط إيجابية في جودة الكود ✅
النقطة
التفاصيل
✅ TypeScript بالكامل
100% من الكود مكتوب بـ TypeScript مع أنواع صارمة
✅ Zero TypeScript Errors
tsc --noEmit بدون أي خطأ واحد
✅ Clean Build
البناء الإنتاجي ناجح بدون أي تحذيرات
✅ تنظيم الملفات
هيكل مشروع واضح ومنطقي (app router, components, lib, db, types, context)
✅ تسمية واضحة
أسماء الملفات والدوال والمتغيرات واضحة ومعبرة
✅ فصل المسؤوليات
فصل واضح بين: الواجهة (components)، المنطق (lib)، البيانات (db)، الأنواع (types)
✅ خوارزميات ذكية
Dedup, Kinship, LCA, Lineage — مكتوبة بكفاءة عالية
✅ React.memo
استخدام التخزين المؤقت للمكونات الثقيلة (PersonNode)
✅ رسائل خطأ عربية
كل رسائل الخطأ والنجاح مكتوبة بالعربية الفصحى
✅ Drizzle ORM
يمنع SQL Injection بالكامل
✅ لا يوجد any مُسيء
الأنواع مُعرَّفة بشكل صحيح في types/index.ts
--------------------------------------------------------------------------------
3. تقييم الاختبارات (Testing Assessment) 🧪
[!CAUTION] لا يوجد أي اختبار واحد في المشروع بالكامل.
نوع الاختبار
الحالة
التفاصيل
❌ Unit Tests
غير موجودة
لا يوجد أي ملف .test.ts أو .spec.ts
❌ Integration Tests
غير موجودة
لا يوجد اختبارات API
❌ E2E Tests
غير موجودة
لا يوجد Cypress أو Playwright
❌ Test Framework
غير مُثبت
لا يوجد Jest أو Vitest في package.json
❌ Test Scripts
غير موجودة
لا يوجد "test" script في package.json
الاختبارات الحرجة المطلوبة:
الأولوية القصوى:
اختبار خوارزمية منع الحلقات الدائرية (kinship.ts)
اختبار خوارزمية كشف التكرارات (dedup.ts)
اختبار خوارزمية الجد المشترك (ancestorFinder.ts)
اختبار RBAC في APIs (الصلاحيات)
اختبار Sibling Bridging (إنشاء الوالد التلقائي)
الأولوية العالية: 6. اختبار تسلسل النسب العربي (lineage.ts) 7. اختبار أوضاع التركيز (treeFilter.ts) 8. اختبار إحصائيات الشجرة (treeAnalytics.ts) 9. اختبار تسجيل/دخول المستخدمين 10. اختبار CRUD الكامل للأشخاص والعلاقات
--------------------------------------------------------------------------------
4. تقييم البنية المعمارية (Architecture Assessment) 🏗️
4.1 نقاط القوة
النقطة
الوصف
✅ App Router
استخدام Next.js App Router الحديث
✅ Server Components
فصل واضح بين Client و Server
✅ API Routes
RESTful APIs مُنظمة بشكل جيد
✅ Context Providers
AuthContext و ThemeContext مُصممان بشكل نظيف
✅ Database Layer
Drizzle ORM مع schema واضح ومُهاجرات مُنظمة
✅ Graph Algorithms
خوارزميات الشجرة مكتوبة بكفاءة في lib/
✅ Component Architecture
مكونات React مُفصّلة ومُعاد استخدامها
4.2 نقاط الضعف
النقطة
الوصف
❌ لا يوجد Middleware
لا يوجد middleware للمصادقة أو الأمان
❌ لا يوجد Error Boundary شامل
فقط error.tsx بسيط
❌ MemoryStore في الإنتاج
مخزن ذاكرة لا يصلح للإنتاج
❌ لا يوجد Logging System
console.error فقط
❌ لا يوجد Monitoring
لا يوجد أي نظام مراقبة أو تنبيهات
--------------------------------------------------------------------------------
5. تقييم واجهة المستخدم (UI/UX Assessment) 🎨
النقطة
التقييم
✅ تصميم احترافي
واجهة عصرية مع تدرجات وظلال وتأثيرات hover
✅ RTL كامل
دعم كامل للاتجاه من اليمين لليسار
✅ Dark/Light Mode
دعم ممتاز للوضعين مع حفظ التفضيل
✅ Responsive
متجاوب مع الشاشات الصغيرة مع قائمة جانبية
✅ Accessibility
أيقونات واضحة مع عناوين title
✅ خط Cairo
خط عربي احترافي من Google Fonts
✅ كانفاس تفاعلي
تجربة سلسة مع React Flow
--------------------------------------------------------------------------------
6. نتائج اختبار البناء الإنتاجي (Build Results) ⚙️
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (17/17)

Route (app)                     Size     First Load JS
┌ ○ /                           7.87 kB  179 kB
├ ○ /common-ancestor            6.26 kB  276 kB
├ ○ /compact-tree               10.1 kB  275 kB
├ ○ /infographic                7.59 kB  179 kB
├ ○ /my-tree                    6.41 kB  276 kB
└ ○ /tree                       16.3 kB  281 kB
+ First Load JS shared          87.4 kB

○ (Static)  prerendered as static content
ƒ (Dynamic) server-rendered on demand
[!NOTE] حجم الصفحة الرئيسية 179 KB (First Load JS) وهو مقبول. صفحة الشجرة 281 KB وهو أعلى قليلاً بسبب React Flow.
--------------------------------------------------------------------------------
7. خارطة الطريق للجاهزية الإنتاجية (Production Readiness Roadmap)
المرحلة 1: إصلاحات أمنية حرجة (يجب إنجازها قبل أي نشر) 🔴
#
المهمة
الأولوية
الجهد التقديري
1
إنشاء ملف .gitignore شامل
حرج
15 دقيقة
2
إزالة أزرار الدخول السريع التجريبية من AuthModal.tsx
حرج
15 دقيقة
3
إزالة القيم الافتراضية لبيانات الاتصال من db/index.ts و supabase/client.ts
حرج
30 دقيقة
4
إضافة تحقق مصادقة في DELETE /api/v1/persons
حرج
1 ساعة
5
إضافة تحقق مصادقة إجبارية في POST /api/v1/marriages
حرج
30 دقيقة
6
إضافة تحقق RBAC في review/approve و review/merge (فقط REVIEWER/ADMIN)
حرج
1 ساعة
7
إصلاح claim/request ليكتب في PostgreSQL بدلاً من MemoryStore فقط
حرج
1 ساعة
8
إصلاح auth/user لاستخدام WHERE filter + استبعاد password_hash
حرج
30 دقيقة
9
إضافة تحقق صيغة البريد + تطهير المدخلات في auth/register
حرج
1 ساعة
10
إنشاء نظام مصادقة حقيقي بكلمة مرور مشفرة أو إلزام Supabase Auth
حرج
4-8 ساعات
11
استبدال x-user-email header بـ JWT tokens آمنة
حرج
4-6 ساعات
المرحلة 2: تقوية أمنية (مطلوبة للنشر التجاري) 🟠
#
المهمة
الأولوية
الجهد التقديري
8
إضافة Security Headers في next.config.mjs
عالي
1 ساعة
9
إضافة Rate Limiting middleware
عالي
2-4 ساعات
10
إضافة CSRF Protection
عالي
2 ساعات
11
إضافة Input Validation middleware (zod/joi)
عالي
4-6 ساعات
12
إزالة MemoryStore أو استبداله بـ Redis
عالي
2-4 ساعات
المرحلة 3: جودة الكود (مطلوبة للصيانة طويلة الأمد) 🟡
#
المهمة
الأولوية
الجهد التقديري
13
إنشاء دوال mapper مركزية (DB Row → TypeScript)
متوسط
2 ساعات
14
تقسيم persons/route.ts إلى ملفات أصغر
متوسط
2 ساعات
15
إضافة logging مع catch blocks مفيدة
متوسط
3 ساعات
16
لف العمليات المتعددة في Transactions
متوسط
3 ساعات
17
إعداد ESLint + Prettier
متوسط
1 ساعة
المرحلة 4: الاختبارات (مطلوبة للجودة والموثوقية) 🟡
#
المهمة
الأولوية
الجهد التقديري
18
إعداد Vitest/Jest كإطار اختبار
متوسط
1 ساعة
19
كتابة Unit Tests للخوارزميات (kinship, dedup, LCA, lineage)
عالي
6-8 ساعات
20
كتابة Integration Tests للـ APIs
عالي
8-10 ساعات
21
إعداد E2E Tests مع Playwright
متوسط
8-12 ساعة
--------------------------------------------------------------------------------
8. ملخص التوصيات (Recommendations Summary)
لجعل التطبيق جاهزاً للنشر الداخلي (Internal Deployment):
أكمل المرحلة 1 بالكامل (الإصلاحات الأمنية الحرجة)
الوقت المقدر: 2-3 أيام عمل
لجعل التطبيق جاهزاً للنشر العام (Public Production):
أكمل المرحلتين 1 و 2
أكمل المهام 13-17 من المرحلة 3
الوقت المقدر: 1-2 أسبوع عمل
لجعل التطبيق جاهزاً للبيع التجاري (Commercial Sale):
أكمل جميع المراحل الأربع
إضافة توثيق API (Swagger/OpenAPI)
إضافة نظام إدارة النسخ الاحتياطي
إضافة نظام مراقبة وتنبيهات (Sentry/DataDog)
الوقت المقدر: 3-4 أسابيع عمل
--------------------------------------------------------------------------------
[!IMPORTANT] خلاصة: التطبيق يحتوي على منطق أعمال ممتاز وخوارزميات ذكية وواجهة مستخدم احترافية، لكنه يفتقر للأساسيات الأمنية اللازمة للنشر. مع إنجاز الإصلاحات المذكورة أعلاه، يمكن أن يتحول لمنتج تجاري قوي ومنافس.