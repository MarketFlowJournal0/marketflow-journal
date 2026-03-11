// api/stripe-webhook.js
// Vercel Serverless Function — gère tous les événements Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map Price ID → plan name
const PRICE_TO_PLAN = {
  'price_1T97lcRrHTdWtpEZUhmUeTTk': 'starter',
  'price_1T97mJRrHTdWtpEZAfccumX3': 'starter',
  'price_1T97psRrHTdWtpEZyNf4dG6a': 'pro',
  'price_1T97qBRrHTdWtpEZJ6b8f3ga': 'pro',
  'price_1T97qXRrHTdWtpEZnWH1JSb5': 'elite',
  'price_1T97r3RrHTdWtpEZTCMcR9rb': 'elite',
};

// Désactiver le body parser Vercel (Stripe a besoin du raw body)
module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Mettre à jour le profil Supabase via stripe_customer_id
async function updateByCustomer(customerId, updates) {
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  if (!users?.length) {
    console.warn('No user found for customer:', customerId);
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', users[0].id);

  if (error) console.error('Supabase update error:', error);
  else console.log(`✓ Updated user ${users[0].id}:`, updates);
}

// Mettre à jour via email (fallback)
async function updateByEmail(email, updates) {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find(u => u.email === email);
  if (!authUser) { console.warn('No auth user for email:', email); return; }

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', authUser.id);

  if (error) console.error('Supabase update by email error:', error);
  else console.log(`✓ Updated user by email ${email}:`, updates);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig     = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`→ Webhook: ${event.type}`);

  try {
    switch (event.type) {

      // ── Checkout complété ─────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const customerId     = session.customer;
        const subscriptionId = session.subscription;
        const customerEmail  = session.customer_details?.email || session.customer_email;

        // Récupérer le plan depuis le subscriptionId
        const sub     = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId] || 'starter';
        const trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;

        const updates = {
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          subscription_status: sub.status, // 'trialing' ou 'active'
          trial_end: trialEnd,
        };

        // Essayer d'abord via metadata userId (le plus fiable)
        const userId = session.metadata?.supabase_user_id || sub.metadata?.supabase_user_id;
        if (userId) {
          await supabase.from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId);
          console.log(`✓ Linked checkout to user ${userId}`);
        } else if (customerEmail) {
          await updateByEmail(customerEmail, updates);
        }
        break;
      }

      // ── Abonnement mis à jour (trial → active, changement de plan...) ─────
      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId] || 'starter';
        const trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;

        await updateByCustomer(sub.customer, {
          plan,
          subscription_status:    sub.status,
          stripe_subscription_id: sub.id,
          trial_end: trialEnd,
        });
        break;
      }

      // ── Abonnement supprimé / annulé ──────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await updateByCustomer(sub.customer, {
          subscription_status: 'canceled',
          plan: 'free',
        });
        break;
      }

      // ── Paiement réussi (renouvellement) ──────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle') {
          await updateByCustomer(invoice.customer, {
            subscription_status: 'active',
          });
        }
        break;
      }

      // ── Paiement échoué ───────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await updateByCustomer(invoice.customer, {
          subscription_status: 'past_due',
        });
        break;
      }

      // ── Trial se termine bientôt (J-3) ───────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object;
        console.log(`Trial ending soon for customer: ${sub.customer}`);
        // Ici tu peux envoyer un email de rappel via Supabase Edge Functions
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};