// api/create-billing-portal.js
// Ouvre le portail Stripe pour gérer CB, annuler, changer de plan

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { getAppBaseUrl } = require('../server/lib/url-config');
const { applyRateLimit, handleCors, requireSupabaseUser, sendServerError } = require('../server/lib/api-security');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (handleCors(req, res, { methods: 'POST, OPTIONS' })) return;
  if (!applyRateLimit(req, res, { keyPrefix: 'billing-portal', limit: 20, windowMs: 60_000 })) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await requireSupabaseUser(supabase, req, {
    requireConfirmedEmail: process.env.REQUIRE_CONFIRMED_EMAIL === 'true',
  });
  if (!auth.user) return res.status(auth.status).json({ error: auth.error });

  const { userId: requestedUserId } = req.body || {};
  const userId = auth.user.id;
  if (requestedUserId && requestedUserId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const BASE_URL = getAppBaseUrl();

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'Aucun compte Stripe associé' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: `${BASE_URL}/plan`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('Billing portal error:', err.message);
    return sendServerError(res, 'Unable to open billing portal.');
  }
};
