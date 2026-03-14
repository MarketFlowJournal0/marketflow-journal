// api/create-checkout-session.js
// Vercel Serverless Function

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

  const { priceId, email, userId } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId requis' });

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://marketflowjournal.com';

  try {
    // Chercher si l'user a déjà un customer Stripe
    let customerId = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      customerId = profile?.stripe_customer_id || null;
    }

    // Vérifier que le customer existe vraiment dans Stripe (live vs test mismatch)
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err) {
        // Customer inexistant dans cet environnement (ex: ID test utilisé en live) → reset
        console.log(`Customer ${customerId} introuvable dans Stripe, création d'un nouveau`);
        customerId = null;
        if (userId) {
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: null })
            .eq('id', userId);
        }
      }
    }

    // Créer le customer Stripe si besoin
    if (!customerId && (email || userId)) {
      const customer = await stripe.customers.create({
        ...(email ? { email } : {}),
        metadata: { supabase_user_id: userId || '' },
      });
      customerId = customer.id;

      // Sauvegarder immédiatement le customer_id dans Supabase
      if (userId) {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      // Customer existant ou email
      ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),

      // Essai gratuit 14 jours — TOUJOURS collecter la CB dès le checkout
      subscription_data: {
        trial_period_days: 14,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        metadata: { supabase_user_id: userId || '' },
      },

      // FORCER la collecte de la CB même pendant le trial
      payment_method_collection: 'always',

      success_url: `${BASE_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${BASE_URL}/plan`,

      allow_promotion_codes:      true,
      billing_address_collection: 'auto',
      locale: 'fr',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};