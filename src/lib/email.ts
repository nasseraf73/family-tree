export interface EmailNotificationPayload {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  actionUrl?: string;
  actionText?: string;
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<{ success: boolean; error?: string }> {
  console.log(`[EMAIL] Sending to: ${payload.to} | Subject: ${payload.subject}`);

  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`[EMAIL] BREVO_API_KEY: ${brevoApiKey ? 'YES (' + brevoApiKey.substring(0, 10) + '...)' : 'NO'} | RESEND: ${resendApiKey ? 'YES' : 'NO'}`);

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
        .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 800; }
        .content { padding: 24px; line-height: 1.6; }
        .title { font-size: 18px; font-weight: 700; color: #34d399; margin-bottom: 12px; }
        .body-text { color: #cbd5e1; font-size: 14px; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; }
        .footer { background: #0f172a; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>منصة شجرة العائلة الكبرى</h1></div>
        <div class="content">
          <div class="title">${payload.title}</div>
          <div class="body-text">${payload.bodyHtml}</div>
          ${payload.actionUrl ? `<div style="text-align:center;margin-top:24px"><a href="${payload.actionUrl}" class="btn">${payload.actionText || 'عرض التفاصيل'}</a></div>` : ''}
        </div>
        <div class="footer">هذا إشعار تلقائي من منصة شجرة العائلة • جميع الحقوق محفوظة</div>
      </div>
    </body>
    </html>
  `;

  // Brevo REST API (HTTPS - works on Vercel without SMTP port restrictions)
  if (brevoApiKey) {
    try {
      console.log(`[EMAIL] Calling Brevo REST API...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'منصة شجرة العائلة الكبرى', email: 'nasser.grav.2000@gmail.com' },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: htmlContent,
        }),
      });

      const data = await res.json();
      console.log(`[EMAIL] Brevo response status: ${res.status}`, JSON.stringify(data));

      if (res.ok) {
        console.log(`[EMAIL] SUCCESS via Brevo REST API`);
        return { success: true };
      } else {
        console.error(`[EMAIL] Brevo FAILED: ${res.status}`, data);
      }
    } catch (err) {
      console.error('[EMAIL] Brevo exception:', err);
    }
  }

  // Resend API fallback
  if (resendApiKey) {
    try {
      console.log(`[EMAIL] Calling Resend API...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [payload.to],
          subject: payload.subject,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[EMAIL] SUCCESS via Resend API`);
        return { success: true };
      }
      console.error(`[EMAIL] Resend FAILED:`, data);
    } catch (err) {
      console.error('[EMAIL] Resend exception:', err);
    }
  }

  console.warn(`[EMAIL] ALL METHODS FAILED - no email sent`);
  return { success: false, error: 'تعذر إرسال البريد' };
}
