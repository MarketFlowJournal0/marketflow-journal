// api/stripe-webhook.js
// Handles Stripe events: trial expiry, payment failures, subscription changes

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@marketflowjournal.com';
const PUBLIC_SITE_URL = getBaseUrl(
  process.env.NEXT_PUBLIC_SITE_URL
  || process.env.PUBLIC_SITE_URL
  || 'https://marketflowjournal.com'
);
const APP_URL = getBaseUrl(
  process.env.NEXT_PUBLIC_APP_URL
  || process.env.APP_URL
  || PUBLIC_SITE_URL
);

function getBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

async function sendEmail(payload) {
  if (!process.env.RESEND_API_KEY) return null;
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
    throw new Error(data?.message || data?.error || 'Unable to send email.');
  }
  return data;
}

const PRICE_PLAN_MAP = {
  price_1T9t9L2Ouddv7uendIMAR6IP: 'starter',
  price_1TDQ7w2Ouddv7ueno5CuaNTH: 'starter',
  price_1T9t9U2Ouddv7uenfg38PRZ2: 'pro',
  price_1T9t9U2Ouddv7uenK6oT1O13: 'pro',
  price_1T9t9L2Ouddv7uen4DXuOatj: 'elite',
  price_1T9t9K2Ouddv7uennnWOJ44p: 'elite',
};

async function getRawBody(req) {
  if (req.rawBody) {
    return Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody);
  }
  if (typeof req.text === 'function') {
    return Buffer.from(await req.text());
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length) return Buffer.concat(chunks);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return Buffer.from(JSON.stringify(req.body || {}));
}

function getPlanIdFromSubscription(subscription) {
  return (
    subscription?.metadata?.plan_id
    || subscription?.items?.data?.[0]?.price?.metadata?.plan_id
    || PRICE_PLAN_MAP[subscription?.items?.data?.[0]?.price?.id]
    || null
  );
}

async function findProfileUserId({ userId, customerId, email }) {
  if (userId) return userId;

  if (customerId) {
    const { data: profileByCustomer } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (profileByCustomer?.id) return profileByCustomer.id;
  }

  if (email) {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (profileByEmail?.id) return profileByEmail.id;
  }

  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerName = session.customer_details?.name || customerEmail?.split('@')[0] || 'Trader';
        let userId = session.metadata?.supabase_user_id || null;
        let planId = session.metadata?.plan_id || null;
        let subscription = null;

        if (subscriptionId) {
          try {
            subscription = await stripe.subscriptions.retrieve(subscriptionId);
            userId = userId || subscription.metadata?.supabase_user_id || null;
            planId = planId || getPlanIdFromSubscription(subscription);
          } catch (subErr) {
            console.error('Failed to retrieve subscription metadata:', subErr);
          }
        }

        const targetUserId = await findProfileUserId({
          userId,
          customerId,
          email: customerEmail || null,
        });

        if (targetUserId && subscriptionId) {
          const trialEnd = subscription?.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null;
          const checkoutProfilePatch = {
            id: targetUserId,
            email: customerEmail || null,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription?.status || 'trialing',
            plan: planId || null,
          };

          if (customerId && trialEnd) {
            try {
              const customer = await stripe.customers.retrieve(customerId);
              await stripe.customers.update(customerId, {
                metadata: {
                  ...(customer?.metadata || {}),
                  supabase_user_id: targetUserId,
                  mfj_trial_used: 'true',
                  mfj_trial_started_at: subscription?.trial_start
                    ? new Date(subscription.trial_start * 1000).toISOString()
                    : new Date().toISOString(),
                  mfj_trial_end: trialEnd,
                },
              });
            } catch (metadataErr) {
              console.error('Failed to mark trial as used:', metadataErr.message);
            }
            checkoutProfilePatch.trial_end = trialEnd;
          }

          await supabase
            .from('profiles')
            .upsert(checkoutProfilePatch, { onConflict: 'id' });

          // Send welcome email
          try {
            await sendEmail({
              from: `MarketFlow Support <${SUPPORT_EMAIL}>`,
              to: customerEmail,
              subject: `Welcome to MarketFlow Journal, ${customerName}`,
              html: `
                <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0C1422;border-radius:16px;border:1px solid #162034;color:#E8EEFF;">
                  <div style="text-align:center;margin-bottom:28px;">
                    <h1 style="color:#FFFFFF;margin:0 0 8px;font-size:24px;font-weight:800;">Welcome to MarketFlow, ${customerName}!</h1>
                    <p style="color:#7A90B8;margin:0;font-size:14px;">Your 14-day free trial has started. Let's make it count.</p>
                  </div>
                  <div style="background:rgba(6,230,255,0.06);border:1px solid rgba(6,230,255,0.15);border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="color:#06E6FF;margin:0;font-size:13px;font-weight:600;">Your trial is active</p>
                    <p style="color:#E8EEFF;margin:8px 0 0;font-size:13px;">You have full access to all features for the next 14 days. No charge until your trial ends.</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.03);border:1px solid #162034;border-radius:12px;padding:18px;margin-bottom:24px;">
                    <p style="color:#FFFFFF;margin:0 0 12px;font-size:14px;font-weight:700;">Quick start guide:</p>
                    <ol style="color:#7A90B8;margin:0;padding-left:20px;font-size:13px;line-height:2;">
                      <li>Import your trades via CSV or connect your broker</li>
                      <li>Check your Dashboard for key performance metrics</li>
                      <li>Use Analytics Pro to find your edge</li>
                      <li>Try the AI Coach for personalized insights</li>
                    </ol>
                  </div>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06E6FF,#00FF88);color:#030508;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Go to Dashboard</a>
                  </div>
                  <div style="border-top:1px solid #162034;padding-top:16px;text-align:center;">
                    <p style="color:#334566;margin:0;font-size:12px;">MarketFlow Journal - Trade smarter, not harder.</p>
                    <p style="color:#334566;margin:8px 0 0;font-size:11px;">Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#06E6FF;text-decoration:none;">${SUPPORT_EMAIL}</a>.</p>
                  </div>
                </div>
              `,
            });
          } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
          }

          // Send marketing email (delayed)
          try {
            await sendEmail({
              from: `MarketFlow Support <${SUPPORT_EMAIL}>`,
              to: customerEmail,
              subject: '3 tips to get the most out of MarketFlow Journal',
              html: `
                <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0C1422;border-radius:16px;border:1px solid #162034;color:#E8EEFF;">
                  <div style="text-align:center;margin-bottom:28px;">
                    <h2 style="color:#FFFFFF;margin:0 0 8px;font-size:20px;font-weight:800;">3 Tips to Master Your Trading Journal</h2>
                    <p style="color:#7A90B8;margin:0;font-size:14px;">Here's how top traders use MarketFlow to level up.</p>
                  </div>
                  <div style="margin-bottom:24px;">
                    <div style="display:flex;gap:12px;margin-bottom:16px;">
                      <div style="width:32px;height:32px;border-radius:8px;background:rgba(6,230,255,0.1);border:1px solid rgba(6,230,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;">1</div>
                      <div>
                        <p style="color:#FFFFFF;margin:0 0 4px;font-size:14px;font-weight:700;">Log every trade, every time</p>
                        <p style="color:#7A90B8;margin:0;font-size:13px;line-height:1.6;">The more data you collect, the better insights you get. Import your MT4/MT5 trades automatically or use our universal CSV importer.</p>
                      </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:16px;">
                      <div style="width:32px;height:32px;border-radius:8px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;">2</div>
                      <div>
                        <p style="color:#FFFFFF;margin:0 0 4px;font-size:14px;font-weight:700;">Track your psychology</p>
                        <p style="color:#7A90B8;margin:0;font-size:13px;line-height:1.6;">80% of trading is mental. Use the Psychology Tracker to identify tilt, FOMO, and revenge trading patterns before they cost you money.</p>
                      </div>
                    </div>
                    <div style="display:flex;gap:12px;">
                      <div style="width:32px;height:32px;border-radius:8px;background:rgba(176,110,255,0.1);border:1px solid rgba(176,110,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;">3</div>
                      <div>
                        <p style="color:#FFFFFF;margin:0 0 4px;font-size:14px;font-weight:700;">Ask the AI Coach</p>
                        <p style="color:#7A90B8;margin:0;font-size:13px;line-height:1.6;">Our AI analyzes your patterns and gives personalized recommendations. It's like having a trading mentor available 24/7.</p>
                      </div>
                    </div>
                  </div>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06E6FF,#00FF88);color:#030508;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Start Trading Smarter</a>
                  </div>
                  <div style="border-top:1px solid #162034;padding-top:16px;text-align:center;">
                    <p style="color:#334566;margin:0;font-size:12px;">MarketFlow Journal - Trade smarter, not harder.</p>
                    <p style="color:#334566;margin:8px 0 0;font-size:11px;">You're receiving this because you signed up for MarketFlow Journal. <a href="${PUBLIC_SITE_URL}" style="color:#06E6FF;text-decoration:none;">Unsubscribe</a> anytime.</p>
                  </div>
                </div>
              `,
            });
          } catch (emailErr) {
            console.error('Failed to send marketing email:', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        const customerId = sub.customer;
        const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
        const planId = getPlanIdFromSubscription(sub);
        const targetUserId = await findProfileUserId({
          userId,
          customerId,
          email: customer?.email || null,
        });

        if (targetUserId) {
          const profilePatch = {
            id: targetUserId,
            subscription_status: sub.status,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            plan: planId || sub.metadata?.plan_id || null,
          };

          if (sub.trial_end) {
            const trialEnd = new Date(sub.trial_end * 1000).toISOString();
            profilePatch.trial_end = trialEnd;

            try {
              await stripe.customers.update(customerId, {
                metadata: {
                  ...(customer?.metadata || {}),
                  supabase_user_id: targetUserId,
                  mfj_trial_used: 'true',
                  mfj_trial_started_at: sub.trial_start
                    ? new Date(sub.trial_start * 1000).toISOString()
                    : customer?.metadata?.mfj_trial_started_at || new Date().toISOString(),
                  mfj_trial_end: trialEnd,
                },
              });
            } catch (metadataErr) {
              console.error('Failed to persist trial metadata:', metadataErr.message);
            }
          }

          await supabase
            .from('profiles')
            .upsert(profilePatch, { onConflict: 'id' });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        const customerId = sub.customer;
        const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
        const targetUserId = await findProfileUserId({
          userId,
          customerId,
          email: customer?.email || null,
        });

        if (targetUserId) {
          const profilePatch = {
            id: targetUserId,
            subscription_status: 'canceled',
            stripe_subscription_id: null,
          };

          if (sub.trial_end) {
            profilePatch.trial_end = new Date(sub.trial_end * 1000).toISOString();
          }

          await supabase
            .from('profiles')
            .upsert(profilePatch, { onConflict: 'id' });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const amount = (invoice.amount_due / 100).toFixed(2);
        const currency = (invoice.currency || 'usd').toUpperCase();

        const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
        const targetUserId = await findProfileUserId({
          customerId,
          email: customer?.email || null,
        });

        const { data: profile } = targetUserId
          ? await supabase
            .from('profiles')
            .select('id, email, plan')
            .eq('id', targetUserId)
            .maybeSingle()
          : { data: null };

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);

          try {
            await sendEmail({
              from: `MarketFlow Support <${SUPPORT_EMAIL}>`,
              to: profile.email,
              subject: 'Payment Failed - Your MarketFlow Journal Subscription',
              html: `
                <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0C1422;border-radius:16px;border:1px solid #162034;color:#E8EEFF;">
                  <div style="text-align:center;margin-bottom:24px;">
                    <h2 style="color:#FFFFFF;margin:0 0 8px;font-size:20px;">Payment Failed</h2>
                    <p style="color:#7A90B8;margin:0;font-size:14px;">We couldn't process your subscription payment</p>
                  </div>
                  <div style="background:rgba(255,61,87,0.08);border:1px solid rgba(255,61,87,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="color:#FF5570;margin:0;font-size:13px;font-weight:600;">What happened:</p>
                    <p style="color:#E8EEFF;margin:8px 0 0;font-size:13px;line-height:1.6;">
                      We attempted to charge <strong style="color:#FFFFFF;">$${amount} ${currency}</strong> for your <strong style="color:#FFFFFF;">${profile.plan || 'subscription'}</strong> plan, but the payment was declined by your bank.
                    </p>
                  </div>
                  <div style="background:rgba(255,255,255,0.03);border:1px solid #162034;border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="color:#7A90B8;margin:0 0 8px;font-size:13px;font-weight:600;">Your free trial has ended. Access to your trading journal is now restricted until payment is processed.</p>
                    <p style="color:#7A90B8;margin:0;font-size:13px;line-height:1.6;">To restore full access, please update your payment method below:</p>
                  </div>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${APP_URL}/plan" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06E6FF,#00FF88);color:#030508;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Update Payment Method</a>
                  </div>
                  <div style="border-top:1px solid #162034;padding-top:16px;text-align:center;">
                    <p style="color:#334566;margin:0;font-size:12px;">MarketFlow Journal - Trade smarter.</p>
                  </div>
                </div>
              `,
            });
          } catch (emailErr) {
            console.error('Failed to send payment failure email:', emailErr);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = sub?.metadata?.supabase_user_id;
            const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
            const targetUserId = await findProfileUserId({
              userId,
              customerId,
              email: customer?.email || null,
            });

            if (targetUserId) {
              await supabase
                .from('profiles')
                .upsert({
                  id: targetUserId,
                  subscription_status: 'active',
                  stripe_customer_id: customerId,
                  stripe_subscription_id: sub.id,
                  plan: getPlanIdFromSubscription(sub),
                }, { onConflict: 'id' });
            }
          } catch (stripeErr) {
            console.error('Failed to retrieve subscription:', stripeErr);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
