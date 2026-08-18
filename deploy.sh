#!/usr/bin/env bash
# ==============================================================================
# سكربت نشر وتحديث مشروع شجرة عائلة النمري (النسخة التجريبية)
# هذا السكربت معزول تماماً ومخصص للعمل على المنفذ 3001
# ==============================================================================

set -e # إيقاف التنفيذ فور حدوث أي خطأ

echo "🚀 [1/5] بدء عملية النشر لمشروع النمري (nammari-tree-staging)..."

# 1. سحب التحديثات إن وجد Git
if [ -d ".git" ]; then
  echo "📥 سحب آخر التحديثات من المستودع..."
  git pull origin main || echo "تخطي git pull..."
fi

# 2. تثبيت الحزم
echo "📦 [2/5] تثبيت حزم الاعتماد (npm install)..."
npm install --production=false

# 3. تشغيل أي تهيئة لقاعدة البيانات (مستقلة تماماً)
echo "🗄️ [3/5] فحص وتهيئة قاعدة البيانات..."
if [ -f "setup_db.js" ]; then
  node setup_db.js || echo "تمت تهيئة الجداول مسبقاً."
fi

# 4. بناء المشروع
echo "⚙️ [4/5] بناء ملفات الإنتاج (Next.js Build)..."
npm run build

# 5. إعادة التشغيل عبر PM2 بدون أي انقطاع
echo "🔄 [5/5] إعادة تشغيل العملية عبر PM2 (Port 3001)..."
if pm2 describe nammari-tree-staging > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo "✅ تم نشر وتحديث مشروع عائلة النمري بنجاح على المنفذ 3001!"
