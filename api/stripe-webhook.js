// api/stripe-webhook.js
// Handles Stripe events: trial expiry, payment failures, subscription changes

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // For raw body parsing in Vercel, we use the raw body
  const sig = req.headers['stripe-signature'];
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

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
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const planId = session.metadata?.plan_id;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerName = session.customer_details?.name || customerEmail?.split('@')[0] || 'Trader';

        if (userId && subscriptionId) {
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'trialing',
              trial_end: new Date(Date.now() + 14 * 86400000).toISOString(),
              plan: planId || null,
            })
            .eq('id', userId);

          // Send welcome email
          try {
            await resend.emails.send({
              from: 'MarketFlow Journal <welcome@marketflowjournal.com>',
              to: customerEmail,
              subject: `Welcome to MarketFlow Journal, ${customerName}! 🎉`,
              html: `
                <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0C1422;border-radius:16px;border:1px solid #162034;color:#E8EEFF;">
                  <div style="text-align:center;margin-bottom:28px;">
                    <div style="font-size:40px;margin-bottom:12px;">🚀</div>
                    <h1 style="color:#FFFFFF;margin:0 0 8px;font-size:24px;font-weight:800;">Welcome to MarketFlow, ${customerName}!</h1>
                    <p style="color:#7A90B8;margin:0;font-size:14px;">Your 14-day free trial has started. Let's make it count.</p>
                  </div>
                  <div style="background:rgba(6,230,255,0.06);border:1px solid rgba(6,230,255,0.15);border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="color:#06E6FF;margin:0;font-size:13px;font-weight:600;">✅ Your trial is active</p>
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
                    <a href="https://app.marketflowjournal.com/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06E6FF,#00FF88);color:#030508;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Go to Dashboard →</a>
                  </div>
                  <div style="border-top:1px solid #162034;padding-top:16px;text-align:center;">
                    <p style="color:#334566;margin:0;font-size:12px;">MarketFlow Journal — Trade smarter, not harder.</p>
                    <p style="color:#334566;margin:8px 0 0;font-size:11px;">Questions? Reply to this email or visit our <a href="https://marketflowjournal.com/support" style="color:#06E6FF;text-decoration:none;">Support Center</a>.</p>
                  </div>
                </div>
              `,
            });
          } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
          }

          // Send marketing email (delayed)
          try {
            await resend.emails.send({
              from: 'MarketFlow Journal <hello@marketflowjournal.com>',
              to: customerEmail,
              subject: '3 tips to get the most out of MarketFlow Journal 💡',
              html: `
                <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0C1422;border-radius:16px;border:1px solid #162034;color:#E8EEFF;">
                  <div style="text-align:center;margin-bottom:28px;">
                    <div style="font-size:36px;margin-bottom:12px;">💡</div>
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
                    <a href="https://app.marketflowjournal.com/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06E6FF,#00FF88);color:#030508;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Start Trading Smarter →</a>
                  </div>
                  <div style="border-top:1px solid #162034;padding-top:16px;text-align:center;">
                    <p style="color:#334566;margin:0;font-size:12px;">MarketFlow Journal — Trade smarter, not harder.</p>
                    <p style="color:#334566;margin:8px 0 0;font-size:11px;">You're receiving this because you signed up for MarketFlow Journal. <a href="https://marketflowjournal.com" style="color:#06E6FF;text-decoration:none;">Unsubscribe</a> anytime.</p>
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
        const planId = sub.items?.data?.[0]?.price?.metadata?.plan_id;

        let targetUserId = userId;
        if (!targetUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();
          if (profile) targetUserId = profile.id;
        }

        if (targetUserId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: sub.status,
              stripe_subscription_id: sub.id,
              stripe_customer_id: customerId,
              plan: planId || sub.metadata?.plan_id || null,
            })
            .eq('id', targetUserId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        const customerId = sub.customer;

        let targetUserId = userId;
        if (!targetUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();
          if (profile) targetUserId = profile.id;
        }

        if (targetUserId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', targetUserId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const amount = (invoice.amount_due / 100).toFixed(2);
        const currency = (invoice.currency || 'usd').toUpperCase();

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);

          try {
            await resend.emails.send({
              from: 'MarketFlow Journal <noreply@marketflowjournal.com>',
              to: profile.email,
              subject: 'Payment Failed — Your MarketFlow Journal Subscription',
              html: `
                <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0C1422;border-radius:16px;border:1px solid #162034;color:#E8EEFF;">
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
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
                    <a href="https://app.marketflowjournal.com/plan" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06E6FF,#00FF88);color:#030508;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Update Payment Method</a>
                  </div>
                  <div style="border-top:1px solid #162034;padding-top:16px;text-align:center;">
                    <p style="color:#334566;margin:0;font-size:12px;">MarketFlow Journal — Trade smarter.</p>
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

            let targetUserId = userId;
            if (!targetUserId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single();
              if (profile) targetUserId = profile.id;
            }

            if (targetUserId) {
              await supabase
                .from('profiles')
                .update({
                  subscription_status: 'active',
                  trial_end: null,
                })
                .eq('id', targetUserId);
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
