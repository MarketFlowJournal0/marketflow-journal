// api/stripe-webhook.js
// Vercel Serverless Function — place ce fichier dans /api/ à la racine du projet

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Supabase admin client (service role pour bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map Price ID → plan name
const PRICE_TO_PLAN = {
  'price_1T97lcRrHTdWtpEZUhmUeTTk': 'starter',  // Starter mensuel
  'price_1T97mJRrHTdWtpEZAfccumX3': 'starter',  // Starter annuel
  'price_1T97psRrHTdWtpEZyNf4dG6a': 'pro',      // Pro mensuel
  'price_1T97qBRrHTdWtpEZJ6b8f3ga': 'pro',      // Pro annuel
  'price_1T97qXRrHTdWtpEZnWH1JSb5': 'elite',    // Elite mensuel
  'price_1T97r3RrHTdWtpEZTCMcR9rb': 'elite',    // Elite annuel
};

// Désactiver le body parser Vercel (Stripe a besoin du raw body)
export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function updateUserPlan(stripeCustomerId, plan, status = 'active') {
  // Trouver l'utilisateur Supabase via stripe_customer_id
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .limit(1);

  if (error || !users?.length) {
    console.error('User not found for customer:', stripeCustomerId);
    return;
  }

  const userId = users[0].id;

  // Mettre à jour le plan
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      plan,
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating plan:', updateError);
  } else {
    console.log(`✓ Updated user ${userId} to plan: ${plan} (${status})`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Webhook received: ${event.type}`);

  try {
    switch (event.type) {

      // ── Checkout complété (nouveau abonné) ─────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const customerId     = session.customer;
        const subscriptionId = session.subscription;
        const customerEmail  = session.customer_email || session.customer_details?.email;

        // Récupérer les détails de l'abonnement pour connaître le price_id
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || 'starter';

        // Si l'user existe par email, lier le customer_id Stripe
        if (customerEmail) {
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('email', customerEmail);
        }
        break;
      }

      // ── Abonnement mis à jour (upgrade/downgrade/renouvellement) ───────────
      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const plan   = PRICE_TO_PLAN[priceId] || 'starter';
        const status = sub.status; // active, past_due, trialing...
        await updateUserPlan(sub.customer, plan, status);
        break;
      }

      // ── Abonnement annulé ──────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await updateUserPlan(sub.customer, 'starter', 'cancelled');
        break;
      }

      // ── Paiement échoué ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await updateUserPlan(invoice.customer, 'starter', 'past_due');
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  return res.status(200).json({ received: true });
};