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

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];
const SUBSCRIPTION_PRIORITY = {
  active: 5,
  trialing: 4,
  past_due: 3,
  unpaid: 2,
  canceled: 1,
  incomplete: 0,
  incomplete_expired: 0,
  paused: 0,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email, sessionId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!accessToken) return res.status(401).json({ error: 'Authorization required' });

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData?.user?.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    if (authData.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, email, plan, subscription_status, stripe_customer_id, stripe_subscription_id, trial_end')
      .eq('id', userId)
      .maybeSingle();

    let customer = null;
    let subscription = null;

    if (sessionId) {
      const resolved = await resolveFromCheckoutSession(sessionId, userId, email);
      customer = resolved.customer;
      subscription = resolved.subscription;
    }

    if (!customer) {
      customer = await resolveCustomer({
        userId,
        email: email || currentProfile?.email || null,
        profileCustomerId: currentProfile?.stripe_customer_id || null,
      });
    }

    if (customer && !subscription) {
      subscription = await resolveSubscription(customer.id, currentProfile?.stripe_subscription_id || null);
    }

    const profilePatch = buildProfilePatch({
      currentProfile,
      userId,
      email: email || currentProfile?.email || customer?.email || null,
      customer,
      subscription,
    });

    if (!profilePatch) {
      return res.status(200).json({
        synced: false,
        profile: currentProfile || null,
      });
    }

    const { data: savedProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(profilePatch, { onConflict: 'id' })
      .select('id, email, plan, subscription_status, stripe_customer_id, stripe_subscription_id, trial_end')
      .single();

    if (upsertError) {
      console.error('sync-subscription upsert error:', upsertError);
      return res.status(500).json({ error: upsertError.message });
    }

    return res.status(200).json({
      synced: true,
      profile: savedProfile,
    });
  } catch (error) {
    console.error('sync-subscription error:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync subscription' });
  }
};

async function resolveFromCheckoutSession(sessionId, userId, email) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    const sessionUserId = session?.metadata?.supabase_user_id || session?.subscription?.metadata?.supabase_user_id || null;
    const sessionEmail = session?.customer_details?.email || session?.customer_email || session?.customer?.email || null;
    const allowed = Boolean(
      (sessionUserId && sessionUserId === userId) ||
      (email && sessionEmail && String(email).toLowerCase() === String(sessionEmail).toLowerCase())
    );

    if (!allowed) {
      return { customer: null, subscription: null };
    }

    const customer = typeof session.customer === 'object'
      ? session.customer
      : session.customer
        ? await stripe.customers.retrieve(session.customer)
        : null;

    const subscription = typeof session.subscription === 'object'
      ? session.subscription
      : session.subscription
        ? await stripe.subscriptions.retrieve(session.subscription)
        : null;

    if (customer?.id && userId && customer.metadata?.supabase_user_id !== userId) {
      await stripe.customers.update(customer.id, {
        metadata: {
          ...(customer.metadata || {}),
          supabase_user_id: userId,
        },
      });
    }

    return { customer, subscription };
  } catch (error) {
    console.error('resolveFromCheckoutSession error:', error);
    return { customer: null, subscription: null };
  }
}

async function resolveCustomer({ userId, email, profileCustomerId }) {
  if (profileCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(profileCustomerId);
      if (!customer.deleted) {
        if (userId && customer.metadata?.supabase_user_id !== userId) {
          await stripe.customers.update(customer.id, {
            metadata: {
              ...(customer.metadata || {}),
              supabase_user_id: userId,
            },
          });
        }
        return customer;
      }
    } catch (error) {
      console.error('resolveCustomer existing id error:', error);
    }
  }

  if (!email) return null;

  const list = await stripe.customers.list({ email, limit: 10 });
  const customer = list.data.find((entry) => entry.metadata?.supabase_user_id === userId)
    || list.data[0]
    || null;

  if (customer && userId && customer.metadata?.supabase_user_id !== userId) {
    await stripe.customers.update(customer.id, {
      metadata: {
        ...(customer.metadata || {}),
        supabase_user_id: userId,
      },
    });
  }

  return customer;
}

async function resolveSubscription(customerId, preferredSubscriptionId) {
  if (!customerId) return null;

  if (preferredSubscriptionId) {
    try {
      const preferred = await stripe.subscriptions.retrieve(preferredSubscriptionId);
      if (preferred?.customer === customerId) return preferred;
    } catch (error) {
      console.error('resolveSubscription preferred error:', error);
    }
  }

  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20,
  });

  if (!list.data.length) return null;

  return [...list.data].sort((left, right) => {
    const leftPriority = SUBSCRIPTION_PRIORITY[left.status] ?? -1;
    const rightPriority = SUBSCRIPTION_PRIORITY[right.status] ?? -1;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    return (right.created || 0) - (left.created || 0);
  })[0];
}

function buildProfilePatch({ currentProfile, userId, email, customer, subscription }) {
  const patch = {
    id: userId,
    email: email || currentProfile?.email || null,
  };

  if (customer?.id) {
    patch.stripe_customer_id = customer.id;
  }

  if (subscription?.id) {
    const stripePlanId =
      subscription.metadata?.plan_id
      || subscription.items?.data?.[0]?.price?.metadata?.plan_id
      || PRICE_PLAN_MAP[subscription.items?.data?.[0]?.price?.id]
      || currentProfile?.plan
      || 'trial';

    patch.plan = stripePlanId;
    patch.subscription_status = subscription.status || currentProfile?.subscription_status || null;
    patch.stripe_subscription_id = subscription.id;
    patch.trial_end = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : currentProfile?.trial_end || null;
  } else if (customer?.id) {
    const trialExpired = currentProfile?.trial_end && new Date(currentProfile.trial_end) <= new Date();
    patch.subscription_status = trialExpired
      ? 'canceled'
      : currentProfile?.subscription_status || null;
    patch.stripe_subscription_id = ACTIVE_STATUSES.includes(currentProfile?.subscription_status)
      ? currentProfile?.stripe_subscription_id || null
      : null;
  }

  const hasMeaningfulChange =
    !currentProfile
    || patch.email !== currentProfile.email
    || (patch.plan && patch.plan !== currentProfile.plan)
    || (patch.subscription_status && patch.subscription_status !== currentProfile.subscription_status)
    || (patch.stripe_customer_id && patch.stripe_customer_id !== currentProfile.stripe_customer_id)
    || (patch.stripe_subscription_id !== undefined && patch.stripe_subscription_id !== currentProfile.stripe_subscription_id)
    || (patch.trial_end !== undefined && patch.trial_end !== currentProfile.trial_end);

  return hasMeaningfulChange ? patch : null;
}
