# 📡 دليل المراقبة والربط المباشر ببيئات التنبيه السريع (Monitoring & Observability Guide)

يوثق هذا الدليل كيفية ربط وتفعيل أنظمة المراقبة التلقائية، تتبع الأخطاء البرمجية المباشرة (Error Tracking via Sentry)، وتأمين استقرار بيئة الإنتاج لمنصة شجرة العائلة الكبرى.

---

## 🐞 1. تفعيل وتكوين نظام تتبع الأخطاء المباشر (Sentry Error Tracking)

### أ. التثبيت والتهيئة في Next.js
يتم تفعيل حزمة Sentry الرسمية لمنصة Next.js عبر الأوامر التالية:

```bash
npm install @sentry/nextjs
```

### ب. ملف التكوين القياسي (`sentry.client.config.ts`)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'production',
});
```

### ج. تتبع أخطاء الـ API وحواجز الأخطاء
يتم تجميع وتوثيق الأخطاء المرفوعة تلقائياً مع تفاصيل عنوان IP، رمز الـ HTTP، والـ Stack trace الكامل لمساعدة فريق الصيانة في حل الاستثناءات لحظياً.

---

## ⚡ 2. مراقبة الأداء واستجابة الكانفاس (Performance Metrics & Web Vitals)

### أ. المؤشرات القياسية المستهدفة (Core Web Vitals Thresholds)

- **FCP (First Contentful Paint)**: أقل من `1.2` ثانية.
- **LCP (Largest Contentful Paint)**: أقل من `2.5` ثانية.
- **FID / INP (Interaction to Next Paint)**: أقل من `100ms` للحد الأدنى لتفاعل عقد الكانفاس.
- **CLS (Cumulative Layout Shift)**: أقل من `0.1` لضمان استقرار الرسم البياني في React Flow عند التكبير والتحريك.

### ب. مراقبة استجابة الـ API Endpoints
تعتمد واجهات البرمجة على الحد الأقصى المسموح لزمن الاستجابة:
- `GET /api/v1/tree/canvas`: أقل من `200ms` للشبكات التي تحتوي حتى 2000 فرد.
- `POST /api/v1/persons`: أقل من `150ms` شاملة الفحص التلقائي للتكرار والـ ORM query.

---

## 🔒 3. مراقبة جدار الحظر والـ Middleware Rate Limiting

يتم تتبع وتنبيه مسؤولي النظام عند تكرار استجابة `429 Too Many Requests` من [middleware.ts](file:///c:/Users/ASUS/Documents/Drive%20D/my%20apps%20and%20programs/FamilyTree/src/middleware.ts):

- **حد الحظر التلقائي**: 60 طلباً / دقيقة للعنوان الواحد.
- **التنبيه الفوري**: إذا تجاوز معدل الـ Blocked Requests نسبة 5% من إجمالي حركة المرور، يتم إرسال تنبيه آلي عبر Webhook لغرفة العمليات (Slack / Telegram Bot).

---

## 📝 4. إدارة وتسجيل السجلات التجميعية (Structured Logging)

ينصح بتأطير السجلات عبر مكتبة `pino` أو `winston` بدلاً من `console.error` المباشرة لتأمين السجلات بصيغة JSON قابلة للبحث والفلترة:

```json
{
  "timestamp": "2026-07-30T15:00:00Z",
  "level": "error",
  "module": "api/v1/persons",
  "message": "Database connection timeout during root insert",
  "context": { "user_id": 12, "person_name": "سلمان" }
}
```
