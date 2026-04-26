// api/create-billing-portal.js
// Ouvre le portail Stripe pour gérer CB, annuler, changer de plan

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marketflowjournal.com';

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
    return res.status(500).json({ error: err.message });
  }
};
