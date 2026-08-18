@echo off
echo ===================================================
echo   تشغيل منصة شجرة العائلة الكبرى (Family Tree)
echo ===================================================
echo.
echo جاري فتح المتصفح على http://localhost:3000 ...
timeout /t 2 >nul
start http://localhost:3000
echo.
echo جاري تشغيل الخادم...
npm run dev
