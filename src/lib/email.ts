// Email Notification Utility for FamilyTree App

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  actionUrl?: string;
  actionText?: string;
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
          .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; }
          .content { padding: 24px; line-height: 1.6; }
          .title { font-size: 18px; font-weight: 700; color: #34d399; margin-bottom: 12px; }
          .body-text { color: #cbd5e1; font-size: 14px; margin-bottom: 20px; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; text-align: center; }
          .footer { background-color: #0f172a; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>منصة شجرة العائلة الكبرى</h1>
          </div>
          <div class="content">
            <div class="title">${payload.title}</div>
            <div class="body-text">${payload.bodyHtml}</div>
            ${payload.actionUrl ? `<div style="text-align: center; margin-top: 24px;"><a href="${payload.actionUrl}" class="btn">${payload.actionText || 'عرض التفاصيل'}</a></div>` : ''}
          </div>
          <div class="footer">
            هذا إشعار تلقائي من منصة شجرة العائلة • جميع الحقوق محفوظة
          </div>
        </div>
      </body>
      </html>
    `;

    if (!resendApiKey) {
      console.log(`[LOCAL EMAIL SIMULATION] To: ${payload.to} | Subject: ${payload.subject}`);
      return { success: true };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'شجرة العائلة <notifications@resend.dev>',
        to: [payload.to],
        subject: payload.subject,
        html: htmlContent,
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errData = await response.json();
      console.error('Resend Email Error:', errData);
      return { success: false, error: errData.message || 'فشل إرسال البريد' };
    }
  } catch (err) {
    console.error('Email notification failed:', err);
    return { success: false, error: (err as Error).message };
  }
}
