# 🌐 دليل وتوثيق واجهات البرمجة التفاعلي (OpenAPI / API Specification Document)

- **اسم المنظومة**: منصة شجرة العائلة الكبرى (Crowdsourced Family Tree Platform)
- **إصدار الواجهات**: v1.0.0
- **المواصفة البرمجية القياسية**: OpenAPI 3.0 Standard
- **مسار التوثيق في المشروع**: [OpenAPI-Specification.md](file:///c:/Users/ASUS/Documents/Drive%20D/my%20apps%20and%20programs/FamilyTree/docs/OpenAPI-Specification.md)

---

## 📌 المسارات والروابط الأساسية (Base Server URLs)

- **بيئة التطوير المحلية**: `http://localhost:3000/api/v1`
- **بيئة الإنتاج الحية**: `https://familytree.app/api/v1`

---

## 🔐 نظام المصادقة والصلاحيات (Authentication & RBAC)

تستخدم الواجهات الهوية الرقمية ورؤوس الطلب (Headers) للتحقق من هويات المستخدمين والصلاحيات:
- `x-user-email`: البريد الإلكتروني الموثق للمستخدم.
- `Authorization`: رمز الوصول المعياري `Bearer <JWT_TOKEN>`.

---

## 📑 فهرس واجهات البرمجة (API v1 Routes Index)

1. [المصادقة وتسجيل الحسابات (`/auth/register`)](#1-post-authregister)
2. [إدارة وقائمة أفراد شجرة العائلة (`/persons`)](#2-get--post-persons)
3. [فحص التكرارات والمطابقة الذكية (`/dedup/check`)](#3-post-dedupcheck)
4. [تسجيل وحفظ عقود الزواج (`/marriages`)](#4-post-marriages)
5. [حذف وتنظيف العلاقات المباشرة (`/relationships`)](#5-delete-relationships)
6. [رفع طلبات المطالبة وتوثيق النسب (`/claim/request`)](#6-post-claimrequest)
7. [الموافقة على دمج السجلات المكررة (`/review/merge`)](#7-post-reviewmerge)
8. [جلب شبكة رسم الكانفاس (`/tree/canvas`)](#8-get-treecanvas)

---

### 1️⃣ POST `/auth/register`
**الوصف**: تسجيل مستخدم جديد بالمنظومة أو جلب بيانات حسابه القائم.

#### طلب البيانات (Request Body):
```json
{
  "email": "user@example.com",
  "full_name": "عبدالله سلمان العلي",
  "phone": "+966500000000"
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: تم تسجّيل أو استرجاع بيانات الحساب بنجاح.
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "عبدالله سلمان العلي",
    "role": "USER",
    "created_at": "2026-07-30T15:00:00Z"
  }
}
```
- **`400 Bad Request`**: بيانات البريد الإلكتروني أو الاسم ناقصة أو غير صحيحة.

---

### 2️⃣ GET / POST `/persons`
**الوصف**: استعلام أو إضافة فرد جديد إلى شجرة العائلة الكبرى.

#### طلب إنشاء فرد جديد (POST Request Body):
```json
{
  "first_name": "أحمد",
  "father_name": "محمد",
  "grand_father_name": "علي",
  "family_name": "العلي",
  "gender": "MALE",
  "is_alive": true,
  "birth_year": 1990,
  "photo_url": "https://example.com/photo.jpg"
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: تم إنشاء الفرد بنجاح وإرجاع معرف السجل الحقيقي.
```json
{
  "person": {
    "id": 42,
    "first_name": "أحمد",
    "family_name": "العلي",
    "gender": "MALE",
    "created_at": "2026-07-30T15:00:00Z"
  }
}
```

---

### 3️⃣ POST `/dedup/check`
**الوصف**: فحص التكرارات والمطابقة الذكية للأفراد المقترح إضافتهم لمنع ازدواجية البيانات.

#### طلب البيانات (Request Body):
```json
{
  "first_name": "محمد",
  "father_name": "علي",
  "family_name": "العلي"
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: استرجاع قائمة الأفراد المطابقين بنسب المئوية لدرجة التشابه الهجائي (Levenshtein Score).

---

### 4️⃣ POST `/marriages`
**الوصف**: إنشاء وتسجيل عقد زواج بين زوجين أو إضافة زوجة خارجية.

#### طلب البيانات (Request Body):
```json
{
  "husband_id": 1,
  "wife_id": 2,
  "external_spouse_name": "فاطمة السعد",
  "marriage_order": 1
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: تم حفظ سجل الزواج بنجاح.
- **`401 Unauthorized`**: يلزم تسجيل الدخول لإصدار وتمرير عقود الزوجية.

---

### 5️⃣ DELETE `/relationships`
**الوصف**: حذف علاقة مباشرة وتنظيف العقد اليتيمة (Orphan Nodes) تلقائياً من المنظومة.

#### رؤوس الطلب (Headers):
- `x-user-email`: `user@example.com`

#### طلب البيانات (Request Body):
```json
{
  "relationship_id": 105
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: تم حذف العلاقة بنجاح وتنظيف الأفراد المعزولين.
- **`403 Forbidden`**: لا تملك الصلاحيات الكافية لحذف هذه العلاقة.

---

### 6️⃣ POST `/claim/request`
**الوصف**: تقديم طلب مطالبة وتوثيق ملكية بطاقة نسب من قِبل فرد عائلي.

#### طلب البيانات (Request Body):
```json
{
  "person_id": 15,
  "national_id": "1098765432",
  "proof_document": "identity_copy.pdf"
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: تم رفع طلب المطالبة وهو بانتظار اعتماد المراجع.
- **`409 Conflict`**: الملف الشخصي تم المطالبة به وتوثيقه مسبقاً من عضو آخر.

---

### 7️⃣ POST `/review/merge`
**الوصف**: الموافقة على طلبات دمج السجلات المكررة (خاصة بالمراجعين والمدراء).

#### طلب البيانات (Request Body):
```json
{
  "merge_request_id": 8
}
```

#### الاستجابات المرجعة (Responses):
- **`200 OK`**: تم دمج الفرد المكرر وإعادة ربط كافة علاقاته بالسجل الأساسي.
- **`403 Forbidden`**: عفواً لا تملك صلاحيات مراجع فرع أو مدير بالمنظومة.

---

### 8️⃣ GET `/tree/canvas`
**الوصف**: جلب الهيكل التفاعلي الكامل المكون من العقد (Nodes) والروابط (Edges) للعرض التفاعلي السريع في React Flow.

#### الاستجابات المرجعة (Responses):
- **`200 OK`**:
```json
{
  "nodes": [
    { "id": "1", "data": { "label": "محمد العلي" }, "position": { "x": 0, "y": 0 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" }
  ]
}
```
