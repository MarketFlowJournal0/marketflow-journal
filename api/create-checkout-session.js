// api/create-checkout-session.js
// Vercel Serverless Function — place ce fichier dans /api/ à la racine du projet

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, email } = req.body;

  if (!priceId) {
    return res.status(400).json({ error: 'priceId requis' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      // Essai gratuit 14 jours
      subscription_data: {
        trial_period_days: 14,
      },

      // Pré-remplir l'email si dispo
      ...(email ? { customer_email: email } : {}),

      // URLs de retour
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://marketflowjournal.com'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL  || 'https://marketflowjournal.com'}?payment=cancelled`,

      // Activer Link, Apple Pay, Google Pay automatiquement
      payment_method_collection: 'if_required',

      // Permettre code promo
      allow_promotion_codes: true,

      // Infos de facturation
      billing_address_collection: 'auto',

      locale: 'fr',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};