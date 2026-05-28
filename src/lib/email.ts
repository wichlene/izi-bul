const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'İzi Bul <onboarding@resend.dev>';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emrckc52@gmail.com';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!RESEND_API_KEY) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) console.error('[email] failed:', await res.text());
  } catch (err) {
    console.error('[email] error:', err);
  }
}
