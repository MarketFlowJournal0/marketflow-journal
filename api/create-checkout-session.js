// api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRICE_PLAN_MAP = {
  price_1T9t9L2Ouddv7uendIMAR6IP: 'starter',
  price_1TDQ7w2Ouddv7ueno5CuaNTH: 'starter',
  price_1T9t9U2Ouddv7uenfg38PRZ2: 'pro',
  price_1T9t9U2Ouddv7uenK6oT1O13: 'pro',
  price_1T9t9L2Ouddv7uen4DXuOatj: 'elite',
  price_1T9t9K2Ouddv7uennnWOJ44p: 'elite',
};

const VALID_PLAN_IDS = new Set(['starter', 'pro', 'elite']);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { priceId, email, userId, planId } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId required' });

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marketflowjournal.com';
  const requestedPlanId = VALID_PLAN_IDS.has(planId) ? planId : '';
  const finalPlanId = requestedPlanId || PRICE_PLAN_MAP[priceId] || '';
  const planParam = finalPlanId ? `&plan_id=${encodeURIComponent(finalPlanId)}` : '';
  const sessionMetadata = {
    supabase_user_id: userId || '',
    plan_id: finalPlanId,
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

    if (!customerId && email) {
      try {
        const existingCustomers = await stripe.customers.list({ email, limit: 10 });
        const matchedCustomer = existingCustomers.data.find((customer) => customer.metadata?.supabase_user_id === userId)
          || existingCustomers.data[0]
          || null;
        if (matchedCustomer) {
          customerId = matchedCustomer.id;
          if (userId) {
            await stripe.customers.update(customerId, {
              metadata: {
                ...(matchedCustomer.metadata || {}),
                supabase_user_id: userId,
              },
            });
            await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
          }
        }
      } catch (customerLookupError) {
        console.error('Stripe customer lookup error:', customerLookupError.message);
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

    if (customerId) {
      try {
        const existingSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 20,
        });
        if (existingSubscriptions.data.length > 0) {
          trialDays = 0;
        }
      } catch (subscriptionLookupError) {
        console.error('Stripe subscription lookup error:', subscriptionLookupError.message);
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
      success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}${planParam}`,
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
