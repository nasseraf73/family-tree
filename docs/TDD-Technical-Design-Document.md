# وثيقة التصميم التقني (TDD)
# Technical Design Document
## منصة شجرة العائلة الكبرى — Crowdsourced Grand Family Tree Platform

---

| البند            | التفاصيل                                              |
|------------------|-------------------------------------------------------|
| **الإصدار**      | 2.0 — موثق من الكود الفعلي (Post-Implementation)      |
| **تاريخ التوثيق**| 2026-07-30                                            |
| **حالة المشروع** | مُنفَّذ ومُشغَّل (Production-Ready)                   |

---

## 1. نظرة عامة على البنية التقنية (Architecture Overview)

### 1.1 مكدس التقنيات (Technology Stack)

| الطبقة | التقنية | الإصدار | الدور |
|--------|---------|---------|-------|
| **Frontend Framework** | Next.js | 14.x | إطار عمل React مع SSR و App Router |
| **UI Library** | React | 18.x | بناء واجهات المستخدم التفاعلية |
| **Language** | TypeScript | 5.5.x | لغة البرمجة مع الأنواع الثابتة |
| **Styling** | TailwindCSS | 3.4.x | إطار CSS مبني على الأصناف |
| **Canvas Engine** | @xyflow/react (React Flow) | 12.11.x | محرك الكانفاس التفاعلي اللانهائي |
| **Graph Layout** | Dagre | 0.8.x | خوارزمية ترتيب الرسم البياني الشجري |
| **Database** | PostgreSQL | - | قاعدة البيانات العلائقية الرئيسية |
| **ORM** | Drizzle ORM | 0.45.x | طبقة الوصول لقاعدة البيانات |
| **DB Driver** | postgres (pg-native) | 3.4.x | عميل PostgreSQL لـ Node.js |
| **Auth Provider** | Supabase Auth | 2.110.x | مصادقة المستخدمين (اختياري) |
| **Storage** | Supabase Storage | - | تخزين الصور (مع Base64 fallback) |
| **Icons** | Lucide React | 1.26.x | مكتبة الأيقونات |
| **Utilities** | clsx, tailwind-merge | - | دمج أسماء CSS الديناميكية |
| **Image Export** | html-to-image | 1.11.x | تصدير الكانفاس كصورة SVG |
| **String Matching** | Levenshtein (Custom) | - | خوارزمية مسافة التحرير للتكرارات |
| **Font** | Cairo (Google Fonts) | - | الخط العربي الرئيسي |

### 1.2 مخطط البنية العامة (Architecture Diagram)

```mermaid
graph TB
    subgraph "Frontend - Client Side"
        LP["Landing Page<br/>/"]
        TC["Tree Canvas<br/>/tree"]
        CT["Compact Tree<br/>/compact-tree"]
        MT["My Tree<br/>/my-tree"]
        CA["Common Ancestor<br/>/common-ancestor"]
        IG["Infographic<br/>/infographic"]
    end

    subgraph "React Components"
        PN["PersonNode"]
        CN["CircleNode"]
        NB["Navbar"]
        AM["AuthModal"]
        ARM["AddRelationModal"]
        ASM["AddSpouseModal"]
        EPM["EditPersonModal"]
        PPM["PersonProfileModal"]
        CPM["ClaimProfileModal"]
        DRM["DeleteRelationModal"]
        LNM["LinkNodesModal"]
        CM["ConfirmModal"]
        SD["StewardDashboard"]
        LT["LayoutToolbar"]
    end

    subgraph "Context Providers"
        AC["AuthContext"]
        ThC["ThemeContext"]
    end

    subgraph "Business Logic - lib/"
        KS["kinship.ts<br/>Cycle Detection & Derived Kinship"]
        DD["dedup.ts<br/>Deduplication Engine"]
        AF["ancestorFinder.ts<br/>LCA Algorithm"]
        TF["treeFilter.ts<br/>Focus Mode Filters"]
        TA["treeAnalytics.ts<br/>Demographics & Stats"]
        LN["lineage.ts<br/>Patronymic Lineage Builder"]
        LY["layout.ts<br/>Dagre Layout Engine"]
        ES["exportSvg.ts<br/>SVG Export"]
        ST["store.ts<br/>MemoryStore Fallback"]
    end

    subgraph "API Layer - Next.js Route Handlers"
        AP_P["POST/PUT/DELETE<br/>/api/v1/persons"]
        AP_R["DELETE<br/>/api/v1/relationships"]
        AP_TC["GET<br/>/api/v1/tree/canvas"]
        AP_M["POST<br/>/api/v1/marriages"]
        AP_D["POST<br/>/api/v1/dedup/check"]
        AP_C["POST<br/>/api/v1/claim/request"]
        AP_RA["PUT/POST<br/>/api/v1/review/approve"]
        AP_RM["POST<br/>/api/v1/review/merge"]
        AP_AR["POST<br/>/api/v1/auth/register"]
        AP_AU["GET<br/>/api/v1/auth/user"]
    end

    subgraph "Data Layer"
        DB["PostgreSQL<br/>(Drizzle ORM)"]
        MS["MemoryStore<br/>(In-Memory Fallback)"]
        SS["Supabase Storage<br/>(Photo Upload)"]
        SA["Supabase Auth<br/>(Authentication)"]
    end

    LP & TC & CT & MT & CA & IG --> NB
    TC --> PN
    CT --> CN
    MT --> PN
    CA --> PN

    TC & CT & MT & CA --> AP_TC
    TC & CT & MT --> AP_P
    TC & CT & MT --> AP_R
    TC & CT & MT --> AP_M
    TC & CT & MT --> AP_D
    TC & CT & MT --> AP_C
    TC & CT & MT --> AP_RA
    TC & CT & MT --> AP_RM
    LP --> AP_AR
    LP --> AP_AU

    AP_P & AP_R & AP_TC & AP_M & AP_D & AP_RA & AP_RM --> DB
    AP_P & AP_R & AP_TC & AP_D --> MS

    AC --> SA
    AC --> AP_AR
    AC --> AP_AU
```

---

## 2. هيكل المشروع (Project Structure)

```
FamilyTree/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root Layout (RTL, Cairo Font)
│   │   ├── page.tsx                 # Landing Page الصفحة الرئيسية
│   │   ├── globals.css              # Global Styles + React Flow Overrides
│   │   ├── error.tsx                # Error Boundary
│   │   ├── not-found.tsx            # 404 Page
│   │   ├── tree/
│   │   │   └── page.tsx             # Full Family Tree Canvas
│   │   ├── compact-tree/
│   │   │   └── page.tsx             # Compact Tree View (Circle Nodes)
│   │   ├── my-tree/
│   │   │   └── page.tsx             # Personal Focus Tree
│   │   ├── common-ancestor/
│   │   │   └── page.tsx             # Common Ancestor Finder
│   │   ├── infographic/
│   │   │   └── page.tsx             # Tree Analytics & Infographic
│   │   └── api/v1/                  # RESTful API Routes
│   │       ├── auth/
│   │       │   ├── register/route.ts    # POST: User Registration
│   │       │   └── user/route.ts        # GET: User Lookup
│   │       ├── persons/route.ts         # POST/PUT/DELETE: Person CRUD
│   │       ├── relationships/route.ts   # DELETE: Relationship Removal
│   │       ├── marriages/route.ts       # POST: Marriage Registration
│   │       ├── tree/canvas/route.ts     # GET: Canvas Data (Nodes + Edges)
│   │       ├── dedup/check/route.ts     # POST: Deduplication Check
│   │       ├── claim/request/route.ts   # POST: Profile Claim
│   │       └── review/
│   │           ├── approve/route.ts     # PUT/POST: Approve/Reject
│   │           └── merge/route.ts       # POST: Execute Merge
│   │
│   ├── components/                  # React Components
│   │   ├── PersonNode.tsx           # Rich Person Card Node (w/ Actions)
│   │   ├── CircleNode.tsx           # Compact Circle Node
│   │   ├── FamilyTreeCanvas.tsx     # Main Tree Canvas Controller
│   │   ├── CompactTreeCanvas.tsx    # Compact Tree Canvas Controller
│   │   ├── MyTreeCanvas.tsx         # Personal Tree Canvas Controller
│   │   ├── CommonAncestorCanvas.tsx # LCA Canvas Controller
│   │   ├── Navbar.tsx               # Navigation Bar
│   │   ├── AuthModal.tsx            # Login/Register Modal
│   │   ├── AddRelationModal.tsx     # Add Person/Relation Modal
│   │   ├── AddSpouseModal.tsx       # Add Spouse/Marriage Modal
│   │   ├── EditPersonModal.tsx      # Edit Person Data Modal
│   │   ├── PersonProfileModal.tsx   # Person Profile Viewer
│   │   ├── ClaimProfileModal.tsx    # Profile Claiming Modal
│   │   ├── DeleteRelationModal.tsx  # Delete Relationship Modal
│   │   ├── LinkNodesModal.tsx       # Link Existing Nodes Modal
│   │   ├── ConfirmModal.tsx         # Generic Confirmation Modal
│   │   ├── StewardDashboard.tsx     # Branch Reviewer Dashboard
│   │   └── LayoutToolbar.tsx        # Layout Direction Toolbar
│   │
│   ├── context/                     # React Context Providers
│   │   ├── AuthContext.tsx          # Authentication State & Methods
│   │   └── ThemeContext.tsx         # Dark/Light Theme Toggle
│   │
│   ├── db/                          # Database Layer
│   │   ├── index.ts                 # PostgreSQL Connection (Drizzle)
│   │   ├── schema.ts               # Drizzle ORM Schema Definitions
│   │   ├── seed.ts                  # Initial Seed Data Script
│   │   ├── rls_policies.sql         # RLS Security Policies
│   │   └── auth_trigger.sql         # Auth Sync Trigger
│   │
│   ├── lib/                         # Business Logic & Utilities
│   │   ├── kinship.ts              # Kinship Cycle Detection & Derived Kin
│   │   ├── dedup.ts                # Deduplication Scoring Engine
│   │   ├── ancestorFinder.ts       # LCA (Lowest Common Ancestor) Finder
│   │   ├── treeFilter.ts           # Focus Mode Tree Filters
│   │   ├── treeAnalytics.ts        # Demographics & Record Calculators
│   │   ├── lineage.ts              # Arabic Patronymic Lineage Builder
│   │   ├── layout.ts               # Dagre Graph Layout Engine
│   │   ├── exportSvg.ts            # Canvas-to-SVG Export
│   │   ├── store.ts                # In-Memory Fallback Store
│   │   └── supabase/
│   │       ├── client.ts           # Supabase Browser Client
│   │       ├── auth.ts             # Server-Side Auth Helper
│   │       └── storage.ts          # Photo Upload + Base64 Fallback
│   │
│   └── types/
│       └── index.ts                # TypeScript Type Definitions
│
├── drizzle/                        # Database Migrations
│   ├── 0000_gifted_rattler.sql     # Initial Schema Migration
│   └── meta/                       # Migration Metadata
│
├── public/images/                  # Static Assets (Logo)
├── drizzle.config.ts               # Drizzle Kit Configuration
├── package.json                    # Dependencies & Scripts
├── tailwind.config.ts              # TailwindCSS Configuration
├── tsconfig.json                   # TypeScript Configuration
└── next.config.mjs                 # Next.js Configuration
```

---

## 3. طبقة قاعدة البيانات (Database Layer)

### 3.1 اتصال قاعدة البيانات

```typescript
// src/db/index.ts
const connectionString = process.env.DATABASE_URL
  || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';

const client = postgres(connectionString, {
  max: 5,              // أقصى عدد اتصالات متزامنة
  idle_timeout: 20,    // إغلاق الاتصال الخامل بعد 20 ثانية
  connect_timeout: 10, // مهلة الاتصال 10 ثوانٍ
  max_lifetime: 600,   // أقصى عمر للاتصال 10 دقائق
});

const db = drizzle(client, { schema });
```

### 3.2 استراتيجية Dual Storage (الكتابة المزدوجة)

كل عملية كتابة تتبع نفس النمط:

```
1. محاولة الكتابة في PostgreSQL عبر Drizzle ORM
   ↓ (في حالة الفشل)
2. التراجع التلقائي للكتابة في MemoryStore (في الذاكرة)
```

**مثال من الكود الفعلي (`/api/v1/persons`):**
```typescript
try {
  const insertedPersons = await db.insert(personsTable).values({...}).returning();
  if (insertedPersons.length > 0) {
    createdPerson = /* map from DB row */;
  }
} catch (e) {
  console.error('Error inserting:', e);
}

// Fallback to MemoryStore
if (!createdPerson) {
  createdPerson = dbStore.addPerson({...});
}
```

---

## 4. واجهات API (API Endpoints)

### 4.1 جدول API الكامل

| المسار | HTTP Method | الوصف | المدخلات | المخرجات |
|--------|-------------|-------|----------|----------|
| `/api/v1/auth/register` | `POST` | تسجيل مستخدم جديد | `{ email, full_name, phone }` | `{ user }` |
| `/api/v1/auth/user` | `GET` | البحث عن مستخدم بالبريد | `?email=` | `{ user }` |
| `/api/v1/persons` | `POST` | إنشاء شخص / ربط علاقة | Body: بيانات الشخص + العلاقة | `{ person, relationship }` |
| `/api/v1/persons` | `PUT` | تعديل بيانات شخص | Body: بيانات محدثة مع `id` | `{ person }` |
| `/api/v1/persons` | `DELETE` | حذف شخص وعلاقاته | `?id=` | `{ success }` |
| `/api/v1/relationships` | `DELETE` | حذف علاقة محددة | Body: `{ relationship_id }` | `{ success }` |
| `/api/v1/marriages` | `POST` | تسجيل زواج | Body: بيانات الزواج | `{ marriage }` |
| `/api/v1/tree/canvas` | `GET` | جلب بيانات الكانفاس | `?role=&xMin=&yMin=&xMax=&yMax=` | `{ nodes, edges }` |
| `/api/v1/dedup/check` | `POST` | فحص التكرارات | Body: بيانات الشخص المراد فحصه | `{ hasDuplicates, matches }` |
| `/api/v1/claim/request` | `POST` | المطالبة بملف شخصي | Body: `{ person_id }` | `{ person }` |
| `/api/v1/review/approve` | `PUT/POST` | اعتماد/رفض علاقة | Body: `{ relationship_id, action }` | `{ status }` |
| `/api/v1/review/merge` | `POST` | تنفيذ دمج مكررات | Body: `{ merge_request_id }` | `{ message }` |

### 4.2 تفاصيل API: إنشاء شخص (`POST /api/v1/persons`)

هذا أعقد API في النظام ويتعامل مع 4 سيناريوهات مختلفة:

```mermaid
flowchart TD
    A["POST /api/v1/persons"] --> B{relationship_type == SIBLING?}
    B -->|نعم| C["Phase 1: Sibling Bridging"]
    B -->|لا| D{existing_person_id && related_person_id?}

    C --> C1["إنشاء شخص الأخ الجديد"]
    C1 --> C2{هل يوجد والد مشترك؟}
    C2 -->|نعم| C3["ربط الأخ بالوالد الموجود"]
    C2 -->|لا| C4["إنشاء عقدة والد Placeholder تلقائياً"]
    C4 --> C5["ربط الشخصين كأبناء للوالد"]

    D -->|نعم| E["Phase 2: Link Existing Node"]
    D -->|لا| F{related_person_id موجود؟}

    E --> E1["إنشاء علاقة بين شخصين موجودين"]

    F -->|لا| G["Phase 3: Root Person"]
    F -->|نعم| H["Phase 4: Add Relative"]

    G --> G1["إنشاء شخص جذر بدون علاقات"]

    H --> H1["فحص Circular Kinship Loop"]
    H1 --> H2{حلقة دائرية؟}
    H2 -->|نعم| H3["HTTP 422: رفض العملية"]
    H2 -->|لا| H4["إنشاء الشخص + العلاقة"]
```

---

## 5. محركات الذكاء (Intelligence Engines)

### 5.1 محرك كشف التكرارات (Deduplication Engine)

**الموقع:** `src/lib/dedup.ts`

**خوارزمية التطابق المركبة (Composite Matching Score):**

```
Total Score = (Sim_Name × 0.60) + (Sim_Context × 0.25) + (Sim_BirthYear × 0.15)
```

**أوزان تشابه الاسم (Sim_Name) الديناميكية:**

| الحقول المدخلة | الأول | الأب | الجد | العائلة |
|---------------|-------|------|------|---------|
| الأربعة كاملة | 0.30 | 0.25 | 0.20 | 0.25 |
| الأول + الأب + العائلة | 0.40 | 0.30 | — | 0.30 |
| الأول + الأب | 0.55 | 0.45 | — | — |
| الأول + العائلة | 0.55 | — | — | 0.45 |
| الأول فقط | 1.00 | — | — | — |

**تطبيع الأسماء العربية (`normalizeArabicName`):**
1. إزالة التشكيل (حركات)
2. توحيد الهمزات: `أ إ آ` → `ا`
3. توحيد التاء المربوطة: `ة` → `ه`
4. توحيد الياء المقصورة: `ى` → `ي`
5. إزالة المسافات الزائدة
6. تحويل للأحرف الصغيرة

**مقياس Levenshtein للسلاسل:**
```
Similarity(s1, s2) = 1 - (LevenshteinDistance(s1, s2) / max(len(s1), len(s2)))
```

**Triple Lineage Bonus:** إذا تطابق الأب + الجد + العائلة بنسبة ≥85%، يتم رفع درجة السياق إلى 0.95 ودرجة الاسم الأساسية إلى 0.78.

### 5.2 محرك منع الحلقات الدائرية (Circular Kinship Prevention)

**الموقع:** `src/lib/kinship.ts`

**الخوارزمية:**
1. عند إضافة علاقة `PARENT`: تحقق أن الشخص الجديد ليس من أحفاد الشخص المستهدف
2. عند إضافة علاقة `CHILD`: تحقق أن الشخص الجديد ليس من أجداد الشخص المستهدف
3. الشخص لا يمكن أن يكون قريباً لنفسه

```typescript
function detectCircularLoop(personId, relatedPersonId, type, relationships) {
  if (personId === relatedPersonId) return { isCircular: true };

  if (type === 'PARENT') {
    const descendants = getDescendants(personId, relationships);
    if (descendants.has(relatedPersonId)) return { isCircular: true };
  }

  if (type === 'CHILD') {
    const ancestors = getAncestors(personId, relationships);
    if (ancestors.has(relatedPersonId)) return { isCircular: true };
  }

  return { isCircular: false };
}
```

### 5.3 محرك الجد المشترك (Common Ancestor Finder / LCA)

**الموقع:** `src/lib/ancestorFinder.ts`

**الخوارزمية:**
1. تتبع مسار Person A صعوداً للجذر (مع تفضيل الأب الذكر كمسار أولي)
2. تتبع مسار Person B صعوداً للجذر
3. البحث عن أول عقدة مشتركة (LCA - Lowest Common Ancestor)
4. حساب المسافة من كل شخص للجد المشترك
5. ترجمة درجة القرابة بالعربية

**درجات القرابة المُترجمة:**

| المسافة A | المسافة B | الترجمة العربية |
|-----------|-----------|-----------------|
| 0 | أي | صلة نسب مباشرة (أحفاد/فروع) |
| 1 | 1 | إخوة (أبناء نفس الوالد) |
| 2 | 2 | أبناء عمومة من الدرجة الأولى |
| 3 | 3 | أبناء عمومة من الدرجة الثانية |
| 4 | 4 | أبناء عمومة من الدرجة الثالثة |
| 1 | 2 أو العكس | عم / خالة وابن أخ |
| أخرى | أخرى | قرابة عائلية (درجة البُعد: X / Y) |

### 5.4 محرك الأقارب المشتق (Derived Kinship Engine)

**الموقع:** `src/lib/kinship.ts` → `deriveKinship()`

يحسب تلقائياً:
- **الإخوة (Siblings):** أبناء نفس الوالد
- **الأعمام/الخالات (Uncles/Aunts):** إخوة الوالدين
- **أبناء العمومة (Cousins):** أبناء الأعمام/الخالات

### 5.5 محرك سلسلة النسب العربية (Patronymic Lineage Builder)

**الموقع:** `src/lib/lineage.ts`

**الخوارزمية:**
1. يبدأ من الشخص المحدد ويصعد عبر علاقات PARENT
2. يجمع أسماء الآباء بالتسلسل
3. يربط الأسماء بصيغة "بن" (للذكور) أو "بنت" (للإناث في الموضع الأول)
4. يُلحق اسم العائلة في النهاية

**مثال:** `أحمد بن عبد الله بن عبد العزيز بن سلمان آل سلمان`

---

## 6. نظام التركيز والفلترة (Focus Mode Filtering)

**الموقع:** `src/lib/treeFilter.ts`

### 6.1 أوضاع التركيز الأربعة

```mermaid
graph LR
    subgraph "Branch Mode"
        B1["الأجداد"] --> B2["الشخص المحدد"]
        B1 --> B3["إخوة الأجداد"]
        B2 --> B4["الأحفاد"]
        B3 --> B5["أحفاد الإخوة"]
        B6["الأزواج"] -.-> B2
    end

    subgraph "Spine Mode"
        S1["الجد الأعلى"] --> S2["الأب"] --> S3["الشخص"] --> S4["الأبناء"] --> S5["الأحفاد"]
    end

    subgraph "Household Mode"
        H1["الوالدان"] --> H2["الشخص"]
        H2 --> H3["الأبناء"]
        H4["الإخوة"] -.-> H2
        H5["الزوج/ة"] -.-> H2
    end
```

### 6.2 دوال مساعدة للفلترة

| الدالة | الوصف |
|--------|-------|
| `getChildrenMap()` | خريطة من معرف الوالد → مجموعة معرفات الأبناء |
| `getParentsMap()` | خريطة من معرف الابن → مجموعة معرفات الوالدين |
| `getAncestors()` | تجميع كل الأجداد صعوداً بالـ BFS |
| `getSubtreeDescendants()` | تجميع كل الأحفاد نزولاً مع حماية العقد المحمية |

---

## 7. نظام المصادقة (Authentication System)

### 7.1 وضع المصادقة المزدوج (Dual Auth Mode)

```mermaid
flowchart TD
    A["المستخدم يحاول الدخول"] --> B{Supabase URL متوفر وحقيقي؟}
    B -->|نعم| C["محاولة Supabase Auth"]
    B -->|لا| D["وضع المصادقة المحلية"]

    C --> E{نجح الدخول؟}
    E -->|نعم| F["تسجيل الدخول + جلب بيانات المستخدم من DB"]
    E -->|لا| D

    D --> G["البحث عن البريد في DB"]
    G --> H{مستخدم موجود؟}
    H -->|نعم| I["تسجيل دخول محلي"]
    H -->|لا| J["إنشاء حساب تلقائي + دخول"]
    I & J --> K["حفظ البريد في localStorage"]
```

### 7.2 المصادقة على جانب الخادم (Server-Side Auth)

**الموقع:** `src/lib/supabase/auth.ts`

**ترتيب أولوية المصادقة:**
1. `x-user-email` Header (للمصادقة المحلية)
2. `Authorization: Bearer <token>` (لـ Supabase JWT)
3. Fallback: أول مستخدم في قاعدة البيانات

---

## 8. نظام الكانفاس التفاعلي (Canvas System)

### 8.1 تحويل البيانات للكانفاس

**المسار:** `GET /api/v1/tree/canvas`

```
PostgreSQL Data → Map to Person/Relationship → Build Nodes & Edges → Apply Viewport Culling → Return JSON
```

**هيكل العقدة (CanvasNode):**
```typescript
{
  id: string;            // Person ID كنص
  type: 'personNode';    // نوع العقدة
  position: { x, y };   // الموقع على الكانفاس
  data: {
    ...person,           // كل بيانات الشخص
    isPendingStatus,     // هل لديه علاقات معلقة
    spouses: SpouseInfo[], // قائمة الأزواج
  }
}
```

**هيكل الحافة (CanvasEdge):**
```typescript
{
  id: string;            // e.g. "e-123"
  source: string;        // معرف العقدة المصدر (الوالد)
  target: string;        // معرف العقدة الهدف (الابن)
  type: 'smoothstep';    // نوع خط الاتصال
  animated: boolean;     // متحرك للمعلقة
  style: {
    stroke: string;      // أخضر=#10b981 (مُعتمد), أصفر=#f59e0b (معلق), زهري=#ec4899 (زوجي)
    strokeWidth: 2.5,
    strokeDasharray?: string, // متقطع للمعلقة
  }
}
```

### 8.2 محرك التخطيط (Dagre Layout Engine)

**الموقع:** `src/lib/layout.ts`

```typescript
function getLayoutedElements(nodes, edges, direction, options) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({
    rankdir: direction === 'LR' ? 'LR' : 'TB',
    nodesep: direction === 'COMPACT' ? 35 : 60,
    ranksep: direction === 'COMPACT' ? 60 : 100,
    marginx: 40,
    marginy: 40,
  });
  // ... Set nodes and edges, run dagre.layout()
}
```

**الاتجاهات المدعومة:**
| الاتجاه | الوصف | nodesep | ranksep |
|---------|-------|---------|---------|
| `TB` | عمودي (أعلى→أسفل) | 60px | 100px |
| `LR` | أفقي (يسار→يمين) | 60px | 100px |
| `COMPACT` | مدمج (تباعد أقل) | 35px | 60px |

---

## 9. نظام رفع الصور (Photo Upload System)

### 9.1 استراتيجية الرفع

```mermaid
flowchart TD
    A["المستخدم يختار صورة"] --> B["محاولة رفع Supabase Storage"]
    B --> C{نجح الرفع؟}
    C -->|نعم| D["إرجاع Public URL"]
    C -->|لا| E["ضغط الصورة → Base64 Data URL"]
    E --> F["حفظ Base64 في حقل photo_url"]
```

### 9.2 معلمات ضغط الصور

| المعلمة | القيمة |
|---------|--------|
| أقصى بُعد | 600 بكسل |
| الجودة | 75% |
| الصيغة | JPEG |
| طريقة الضغط | Canvas API + `toDataURL()` |

---

## 10. إحصائيات وتحليلات الشجرة (Tree Analytics Engine)

**الموقع:** `src/lib/treeAnalytics.ts`

### 10.1 الحسابات المُنفَّذة

| الفئة | المقياس | الخوارزمية |
|-------|---------|-----------|
| **ديموغرافي** | إجمالي الأفراد | `persons.length` |
| | نسبة الذكور/الإناث | فلترة بحقل `gender` |
| | نسبة الأحياء/المتوفين | فلترة بحقل `is_alive` |
| | عدد المتزوجين/العزاب | من جدول marriages + relationships (SPOUSE) |
| **أرقام قياسية** | عميد العائلة | أقل `birth_year` مع `is_alive=true` |
| | أحدث مولود | أعلى `birth_year` |
| | الأكثر إنجاباً | أكبر عدد أبناء مباشرين |
| | الأكثر تعدد للزوجات | أكبر عدد أزواج مسجلين |
| | أكبر فرع | BFS من كل جذر → أكبر مجموعة أحفاد |
| **تحليل الأجيال** | عمق الأجيال | Recursive depth مع memoization |
| | متوسط الأبناء | `totalChildren / parentsCount` |
| | أكثر 5 أسماء ذكور | تكرار `first_name` مع `gender=MALE` |
| | أكثر 5 أسماء إناث | تكرار `first_name` مع `gender=FEMALE` |

---

## 11. تصدير الكانفاس (SVG Export)

**الموقع:** `src/lib/exportSvg.ts`

```typescript
async function exportCanvasToSvg(viewportElem, nodes, fileName) {
  const bounds = getNodesBounds(nodes);
  const dataUrl = await toSvg(viewportElem, {
    width: Math.max(bounds.width + 160, 800),
    height: Math.max(bounds.height + 160, 600),
    filter: (node) => {
      // استبعاد عناصر التحكم والخريطة المصغرة
      return !node.classList?.contains('react-flow__controls')
          && !node.classList?.contains('react-flow__minimap');
    },
  });
  // تحميل كملف SVG
}
```

---

## 12. نظام الوضع الليلي/النهاري (Theme System)

**الموقع:** `src/context/ThemeContext.tsx`

- الوضع الافتراضي: **Dark Mode**
- الحفظ: `localStorage('family_tree_theme')`
- التطبيق: CSS class `dark` على `<html>` مع TailwindCSS Dark Mode
- التبديل: زر في Navbar مع أيقونة شمس/قمر

---

## 13. سكربتات التشغيل والصيانة (Utility Scripts)

| الملف | الوظيفة |
|-------|---------|
| `start-app.bat` | تشغيل التطبيق (Windows) |
| `start.bat` | تشغيل سريع |
| `stop-app.bat` | إيقاف التطبيق (Windows) |
| `create_db.js` | إنشاء قاعدة البيانات |
| `clear_db.js` | مسح جميع البيانات |
| `fix_seq.js` | إصلاح تسلسلات Auto-Increment |
| `run_migrations.js` | تشغيل عمليات الترحيل |
| `src/db/seed.ts` | زرع بيانات تجريبية أولية |

---

## 14. التوافقية والأداء (Compatibility & Performance)

### 14.1 متطلبات التشغيل
- Node.js 18+
- PostgreSQL 14+
- متصفح حديث (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)

### 14.2 تحسينات الأداء المُنفَّذة
- **Viewport Culling:** تحميل العقد المرئية فقط (xMin/yMin/xMax/yMax)
- **Memoized Components:** `React.memo()` على PersonNode
- **Connection Pooling:** تجمع اتصالات PostgreSQL (max: 5)
- **Force Dynamic:** تعطيل SSG لصفحات الكانفاس
- **Suspense Boundaries:** تحميل كسول للصفحات الفرعية
- **Image Compression:** ضغط الصور قبل التخزين
