// api/create-checkout-session.js
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

  const { priceId, email, userId, planId } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId required' });

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marketflowjournal.com';
  const sessionMetadata = {
    supabase_user_id: userId || '',
    plan_id: planId || '',
  };

  try {
    let customerId = null;

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      customerId = profile?.stripe_customer_id || null;
    }

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err) {
        customerId = null;
        if (userId) {
          await supabase.from('profiles').update({ stripe_customer_id: null }).eq('id', userId);
        }
      }
    }

    if (!customerId && (email || userId)) {
      const customer = await stripe.customers.create({
        ...(email ? { email } : {}),
        metadata: { supabase_user_id: userId || '' },
      });
      customerId = customer.id;
      if (userId) {
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
      }
    }

    // Check if user already had a trial before
    let trialDays = 14;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_end')
        .eq('id', userId)
        .single();
      if (profile?.trial_end) {
        const trialEndDate = new Date(profile.trial_end);
        if (trialEndDate < new Date()) {
          // Trial already used and expired — no more trial
          trialDays = 0;
        }
      }
    }

    const subscriptionData = {
      trial_period_days: trialDays,
      trial_settings: {
        end_behavior: { missing_payment_method: 'cancel' },
      },
      metadata: {
        ...sessionMetadata,
      },
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),
      metadata: sessionMetadata,
      subscription_data: subscriptionData,
      payment_method_collection: 'always',
      success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/plan`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'en',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
