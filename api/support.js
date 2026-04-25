const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@marketflowjournal.com';

async function sendEmail(payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Unable to send email.';
    throw new Error(message);
  }
  return data;
}

function clean(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Support email is not configured.' });
  }

  const body = req.body || {};
  const name = clean(body.name, 120);
  const email = clean(body.email, 180);
  const category = clean(body.category || 'general', 80);
  const subject = clean(body.subject || 'MarketFlow support request', 180);
  const message = clean(body.message, 6000);
  const plan = clean(body.plan || 'public', 80);

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  const safeSubject = `[MarketFlow Support] ${subject || category}`;
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');

  try {
    const data = await sendEmail({
      from: `MarketFlow Support <${SUPPORT_EMAIL}>`,
      to: SUPPORT_EMAIL,
      reply_to: email,
      subject: safeSubject,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#050914;color:#E8EEFF;border:1px solid #17233A;border-radius:18px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#FFFFFF;">New support request</h1>
          <div style="background:#0B1322;border:1px solid #17233A;border-radius:14px;padding:18px;margin-bottom:18px;">
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Name:</strong> ${name || 'Not provided'}</p>
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Email:</strong> ${email}</p>
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Category:</strong> ${category}</p>
            <p style="margin:0;color:#8EA0B8;"><strong style="color:#FFFFFF;">Plan:</strong> ${plan}</p>
          </div>
          <div style="background:#0B1322;border:1px solid #17233A;border-radius:14px;padding:18px;">
            <h2 style="margin:0 0 10px;font-size:15px;color:#14C9E5;">Message</h2>
            <p style="margin:0;color:#DCE7F2;line-height:1.7;">${escapedMessage}</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (error) {
    console.error('Support API error:', error);
    return res.status(500).json({ error: error.message || 'Unable to send support request.' });
  }
};
