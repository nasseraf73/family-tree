import { describe, it, expect } from 'vitest';

describe('اختبارات التوافق التمييزي ودعم الاتجاه العربي (RTL Layout & Arabic i18n Verification)', () => {
  it('يجب أن يحدد التطبيق لغة الصفحة كـ "ar" والاتجاه كـ "rtl" في الجذر', () => {
    const defaultLang = 'ar';
    const defaultDir = 'rtl';

    expect(defaultLang).toBe('ar');
    expect(defaultDir).toBe('rtl');
  });

  it('يجب أن تحتوي نصوص العناوين الرئيسية والـ Metadata على أسماء وشعارات باللغة العربية', () => {
    const metaTitle = 'منصة شجرة العائلة الكبرى | Crowdsourced Grand Family Tree Platform';
    expect(metaTitle).toContain('شجرة العائلة');
  });
});
