// api/mt-sync.js
// Endpoint Vercel serverless — reçoit les trades depuis l'EA MT4/MT5

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // clé service (pas anon) — accès total
)

export default async function handler(req, res) {
  // CORS — important pour que l'EA puisse appeler depuis n'importe où
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { api_token, trades } = req.body

    // 1. Validation basique
    if (!api_token || !trades || !Array.isArray(trades)) {
      return res.status(400).json({ error: 'api_token and trades[] required' })
    }

    if (trades.length === 0) {
      return res.status(200).json({ inserted: 0, message: 'No trades to sync' })
    }

    if (trades.length > 500) {
      return res.status(400).json({ error: 'Max 500 trades per request' })
    }

    // 2. Vérifier le token et récupérer le compte
    const { data: account, error: accountError } = await supabase
      .from('broker_accounts')
      .select('id, user_id, broker_type, is_active')
      .eq('api_token', api_token)
      .single()

    if (accountError || !account) {
      return res.status(401).json({ error: 'Invalid api_token' })
    }

    if (!account.is_active) {
      return res.status(403).json({ error: 'Account is disabled' })
    }

    // 3. Récupérer les tickets déjà existants (dédoublonnage)
    const incomingTickets = trades
      .map(t => t.ticket?.toString())
      .filter(Boolean)

    let existingTickets = new Set()

    if (incomingTickets.length > 0) {
      const { data: existing } = await supabase
        .from('trades')
        .select('ticket')
        .eq('user_id', account.user_id)
        .eq('account_id', account.id)
        .in('ticket', incomingTickets)

      if (existing) {
        existing.forEach(t => existingTickets.add(t.ticket))
      }
    }

    // 4. Filtrer les nouveaux trades uniquement
    const newTrades = trades
      .filter(t => t.ticket && !existingTickets.has(t.ticket.toString()))
      .map(t => ({
        user_id:     account.user_id,
        account_id:  account.id,
        source:      account.broker_type, // 'mt4' ou 'mt5'
        ticket:      t.ticket?.toString(),
        symbol:      t.symbol || null,
        direction:   normalizeDirection(t.type || t.direction),
        volume:      parseFloat(t.volume || t.lots) || null,
        open_price:  parseFloat(t.open_price || t.openPrice) || null,
        close_price: parseFloat(t.close_price || t.closePrice) || null,
        open_time:   parseTimestamp(t.open_time || t.openTime),
        close_time:  parseTimestamp(t.close_time || t.closeTime),
        profit:      parseFloat(t.profit) || 0,
        commission:  parseFloat(t.commission) || 0,
        swap:        parseFloat(t.swap) || 0,
        stop_loss:   parseFloat(t.sl || t.stop_loss) || null,
        take_profit: parseFloat(t.tp || t.take_profit) || null,
        comment:     t.comment || null,
        extra:       buildExtra(t),
      }))

    if (newTrades.length === 0) {
      // Mettre à jour last_sync_at quand même
      await supabase
        .from('broker_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', account.id)

      return res.status(200).json({ inserted: 0, message: 'All trades already synced' })
    }

    // 5. Insertion en batch
    const { error: insertError } = await supabase
      .from('trades')
      .insert(newTrades)

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to insert trades', detail: insertError.message })
    }

    // 6. Mettre à jour last_sync_at
    await supabase
      .from('broker_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', account.id)

    return res.status(200).json({
      inserted: newTrades.length,
      skipped:  trades.length - newTrades.length,
      message: `${newTrades.length} trades synced successfully`
    })

  } catch (err) {
    console.error('mt-sync error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// --- Helpers ---

function normalizeDirection(raw) {
  if (!raw) return null
  const v = raw.toString().toLowerCase()
  if (v === '0' || v === 'buy')  return 'buy'
  if (v === '1' || v === 'sell') return 'sell'
  return v
}

function parseTimestamp(raw) {
  if (!raw) return null
  // MT4 envoie parfois "2024.03.15 10:30:00" au lieu d'ISO
  if (typeof raw === 'string' && raw.includes('.')) {
    raw = raw.replace(/\./g, '-').replace(' ', 'T')
  }
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function buildExtra(t) {
  // Conserver tous les champs non-standard dans extra (jsonb)
  const knownFields = new Set([
    'ticket','symbol','type','direction','volume','lots',
    'open_price','openPrice','close_price','closePrice',
    'open_time','openTime','close_time','closeTime',
    'profit','commission','swap','sl','stop_loss','tp','take_profit','comment'
  ])
  const extra = {}
  for (const [k, v] of Object.entries(t)) {
    if (!knownFields.has(k) && v !== null && v !== undefined && v !== '') {
      extra[k] = v
    }
  }
  return Object.keys(extra).length > 0 ? extra : null
}