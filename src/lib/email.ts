import nodemailer from 'nodemailer';

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  actionUrl?: string;
  actionText?: string;
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<{ success: boolean; error?: string }> {
  console.log(`[EMAIL DISPATCH START] Target: ${payload.to} | Subject: ${payload.subject}`);
  
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`[EMAIL CONFIG STATUS] BREVO_API_KEY: ${brevoApiKey ? 'PRESENT (' + brevoApiKey.substring(0, 10) + '...)' : 'MISSING'} | RESEND_API_KEY: ${resendApiKey ? 'PRESENT' : 'MISSING'}`);

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

  // Method 1: Brevo HTTPS REST API (Fastest & HTTPS-safe on Vercel)
  if (brevoApiKey) {
    try {
      console.log(`[ATTEMPT 1: BREVO REST API] Sending to ${payload.to}...`);
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'منصة شجرة العائلة الكبرى', email: process.env.EMAIL_FROM || 'nasser.grav.2000@gmail.com' },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: htmlContent,
        }),
      });

      const brevoData = await brevoRes.json();
      if (brevoRes.ok) {
        console.log(`[SUCCESS: BREVO REST API] Message Sent! ID:`, brevoData.messageId || brevoData);
        return { success: true };
      } else {
        console.error(`[FAILED: BREVO REST API] Status: ${brevoRes.status} | Details:`, brevoData);
      }
    } catch (brevoErr) {
      console.error('[ERROR: BREVO REST API EXCEPTION]', brevoErr);
    }

    // Method 2: Brevo SMTP Relay via Nodemailer
    try {
      console.log(`[ATTEMPT 2: BREVO SMTP RELAY] Sending to ${payload.to}...`);
      const transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER || 'b4d66f001@smtp-brevo.com',
          pass: brevoApiKey,
        },
      });

      const info = await transporter.sendMail({
        from: '"منصة شجرة العائلة الكبرى" <b4d66f001@smtp-brevo.com>',
        to: payload.to,
        subject: payload.subject,
        html: htmlContent,
      });

      console.log(`[SUCCESS: BREVO SMTP RELAY] Message Sent! ID: ${info.messageId}`);
      return { success: true };
    } catch (smtpErr) {
      console.error('[ERROR: BREVO SMTP RELAY EXCEPTION]', smtpErr);
    }
  }

  // Method 3: Resend API Fallback
  if (resendApiKey) {
    try {
      console.log(`[ATTEMPT 3: RESEND API] Sending to ${payload.to}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: [payload.to],
          subject: payload.subject,
          html: htmlContent,
        }),
      });

      const resendData = await response.json();
      if (response.ok) {
        console.log(`[SUCCESS: RESEND API] Message Sent! ID:`, resendData.id);
        return { success: true };
      } else {
        console.error(`[FAILED: RESEND API] Status: ${response.status} | Details:`, resendData);
      }
    } catch (resendErr) {
      console.error('[ERROR: RESEND API EXCEPTION]', resendErr);
    }
  }

  console.warn(`[WARNING: NO EMAIL SERVICE SUCCEEDED OR KEYS MISSING] Check Environment Variables.`);
  return { success: false, error: 'تعذر إرسال الإشعار البريدي، يرجى التحقق من مفاتيح الربط البيئية' };
}
