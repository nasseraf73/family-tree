import { test, expect } from '@playwright/test';

test.describe('اختبارات المتصفح الشاملة (E2E Tests - Family Tree App)', () => {

  test('يجب فتح الصفحة الرئيسية والتحقق من العناصر الأساسية', async ({ page }) => {
    await page.goto('/');

    // التحقق من وجود العنوان والشعار أو النص الرئيسي
    await expect(page).toHaveTitle(/شجرة العائلة|Family Tree/i);
    
    // التحقق من وجود شريط التنقل
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('يجب التنقل إلى صفحة الشجرة الكبرى وتفحص الكانفاس', async ({ page }) => {
    await page.goto('/tree');

    // التأكد من تحميل صفحة الشجرة الكبرى
    await expect(page).toHaveURL(/\/tree/);

    // التأكد من وجود حاوي React Flow / Canvas
    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('يجب التنقل إلى صفحة إنفوجرافيك وإحصائيات الشجرة', async ({ page }) => {
    await page.goto('/infographic');

    // التأكد من تحميل صفحة الإحصائيات
    await expect(page).toHaveURL(/\/infographic/);
    
    // التأكد من وجود العناوين والإحصائيات
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

});
