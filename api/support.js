const { createClient } = require('@supabase/supabase-js');
const {
  applyRateLimit,
  getBearerToken,
  getClientIp,
  handleCors,
  sendServerError,
} = require('../server/lib/api-security');

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@marketflowjournal.com';
const SUPPORT_TO_EMAIL = process.env.SUPPORT_TO_EMAIL || process.env.SUPPORT_INBOX_EMAIL || SUPPORT_EMAIL;
const SUPPORT_FROM_EMAIL = process.env.SUPPORT_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || SUPPORT_EMAIL;
const SUPPORT_FROM_NAME = process.env.SUPPORT_FROM_NAME || 'MarketFlow Support';

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

async function sendEmail(payload) {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error('Resend API key is not configured.');
    error.code = 'RESEND_NOT_CONFIGURED';
    throw error;
  }

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

function escapeHtml(value) {
  return clean(value, 10000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPriority(category, plan) {
  const normalizedCategory = String(category || '').toLowerCase();
  const normalizedPlan = String(plan || '').toLowerCase();
  if (normalizedPlan === 'elite') return 'priority';
  if (['billing', 'access', 'subscription'].some((item) => normalizedCategory.includes(item))) return 'high';
  if (normalizedPlan === 'pro') return 'standard';
  return 'normal';
}

async function getAuthenticatedUser(req) {
  if (!supabase) return null;
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user;
  } catch (_) {
    return null;
  }
}

async function createSupportRequest(payload) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase service role is not configured.') };
  }

  const { data, error } = await supabase
    .from('support_requests')
    .insert(payload)
    .select('id')
    .single();

  return { data, error };
}

async function updateSupportRequest(id, patch) {
  if (!supabase || !id) return;
  const { error } = await supabase
    .from('support_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Support ticket update failed:', error.message);
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res, { methods: 'POST, OPTIONS' })) return;
  if (!(await applyRateLimit(req, res, { category: 'support', keyPrefix: 'support' }))) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const name = clean(body.name, 120);
  const email = clean(body.email, 180);
  const category = clean(body.category || 'general', 80);
  const subject = clean(body.subject || 'MarketFlow support request', 180);
  const message = clean(body.message, 6000);
  const plan = clean(body.plan || 'public', 80);
  const source = clean(body.source || 'journal_support', 80);

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  const authUser = await getAuthenticatedUser(req);
  const priority = getPriority(category, plan);
  const userAgent = clean(req.headers['user-agent'] || '', 512);
  const ipAddress = getClientIp(req);

  const ticketPayload = {
    user_id: authUser?.id || null,
    email,
    name: name || null,
    category,
    subject,
    message,
    plan,
    priority,
    status: 'queued',
    email_status: 'pending',
    source,
    user_agent: userAgent || null,
    ip_address: ipAddress || null,
  };

  const { data: ticket, error: ticketError } = await createSupportRequest(ticketPayload);
  const ticketId = ticket?.id || null;

  if (ticketError) {
    console.error('Support ticket creation failed:', ticketError.message);
  }

  const safeSubject = `[MarketFlow Support] ${subject || category}`;
  const htmlMessage = escapeHtml(message).replace(/\n/g, '<br />');

  try {
    const data = await sendEmail({
      from: `${SUPPORT_FROM_NAME} <${SUPPORT_FROM_EMAIL}>`,
      to: SUPPORT_TO_EMAIL,
      reply_to: email,
      subject: safeSubject,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:660px;margin:0 auto;padding:28px;background:#050914;color:#E8EEFF;border:1px solid #17233A;border-radius:18px;">
          <p style="margin:0 0 10px;color:#14C9E5;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${ticketId ? `Ticket ${ticketId}` : 'New support request'}</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#FFFFFF;">${escapeHtml(subject || 'Support request')}</h1>
          <div style="background:#0B1322;border:1px solid #17233A;border-radius:14px;padding:18px;margin-bottom:18px;">
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Name:</strong> ${escapeHtml(name || 'Not provided')}</p>
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Category:</strong> ${escapeHtml(category)}</p>
            <p style="margin:0 0 8px;color:#8EA0B8;"><strong style="color:#FFFFFF;">Plan:</strong> ${escapeHtml(plan)}</p>
            <p style="margin:0;color:#8EA0B8;"><strong style="color:#FFFFFF;">Priority:</strong> ${escapeHtml(priority)}</p>
          </div>
          <div style="background:#0B1322;border:1px solid #17233A;border-radius:14px;padding:18px;">
            <h2 style="margin:0 0 10px;font-size:15px;color:#14C9E5;">Message</h2>
            <p style="margin:0;color:#DCE7F2;line-height:1.7;">${htmlMessage}</p>
          </div>
        </div>
      `,
    });

    await updateSupportRequest(ticketId, {
      status: 'sent',
      email_status: 'sent',
      email_error: null,
      resend_id: data?.id || null,
    });

    return res.status(200).json({ ok: true, ticketId, id: data?.id || null });
  } catch (error) {
    console.error('Support email delivery failed:', {
      ticketId,
      message: error.message,
    });

    await updateSupportRequest(ticketId, {
      status: ticketId ? 'queued' : 'failed',
      email_status: 'failed',
      email_error: clean(error.message, 500),
    });

    if (ticketId) {
      return res.status(202).json({
        ok: true,
        queued: true,
        ticketId,
        message: 'Support request saved. Email delivery is being repaired.',
      });
    }

    return sendServerError(res, 'Support request could not be saved. Email delivery is not configured yet.');
  }
};
