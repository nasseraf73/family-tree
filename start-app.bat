@echo off
chcp 65001 > NUL
title Family Tree Web App

echo ===================================================
echo     تطبيق شجرة العائلة - Family Tree Web App
echo ===================================================
echo.
echo 1. جاري تشغيل الخادم والصفحة...
echo 2. يمكنك الوصول للتطبيق على: http://localhost:3000
echo.
echo لإيقاف الخادم اغلق هذه النافذة أو اضغط Ctrl+C
echo ===================================================
echo.

start http://localhost:3000
npm run dev
pause
