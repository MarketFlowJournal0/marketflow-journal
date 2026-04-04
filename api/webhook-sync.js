// api/webhook-sync.js
// Universal webhook endpoint — accepts trades from any platform
// POST /api/webhook-sync?token=YOUR_API_TOKEN

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const token = req.query.token || req.body?.api_token
    if (!token) return res.status(401).json({ error: 'API token required. Add ?token=YOUR_TOKEN to the URL' })

    // Verify token
    const { data: account, error: accountError } = await supabase
      .from('broker_accounts')
      .select('id, user_id, broker_type, is_active')
      .eq('api_token', token)
      .single()

    if (accountError || !account) return res.status(401).json({ error: 'Invalid API token' })
    if (!account.is_active) return res.status(403).json({ error: 'Account is disabled' })

    // Accept single trade or array
    const trades = Array.isArray(req.body) ? req.body : req.body.trades ? (Array.isArray(req.body.trades) ? req.body.trades : [req.body.trades]) : [req.body]

    if (!trades.length || !trades[0]) return res.status(400).json({ error: 'No trade data provided' })

    // Fetch existing tickets
    const tickets = trades.map(t => t.ticket?.toString()).filter(Boolean)
    const { data: existing } = tickets.length ? await supabase.from('trades').select('ticket').eq('account_id', account.id).in('ticket', tickets) : { data: [] }
    const existingSet = new Set((existing || []).map(t => t.ticket?.toString()))

    // Map trades
    const newTrades = trades
      .filter(t => t.ticket && !existingSet.has(t.ticket.toString()))
      .map(t => ({
        user_id: account.user_id,
        account_id: account.id,
        source: account.broker_type,
        ticket: t.ticket.toString(),
        symbol: t.symbol || t.pair || t.instrument || null,
        direction: normalizeDirection(t.type || t.direction || t.side),
        volume: parseFloat(t.volume || t.lots || t.size) || null,
        open_price: parseFloat(t.open_price || t.openPrice || t.entry) || null,
        close_price: parseFloat(t.close_price || t.closePrice || t.exit) || null,
        open_time: parseTimestamp(t.open_time || t.openTime || t.entryTime || t.time),
        close_time: parseTimestamp(t.close_time || t.closeTime || t.exitTime),
        profit: parseFloat(t.profit || t.pnl || t.gross_profit) || 0,
        commission: parseFloat(t.commission || t.comm) || 0,
        swap: parseFloat(t.swap || t.overnight) || 0,
        stop_loss: parseFloat(t.sl || t.stop_loss || t.stopLoss) || null,
        take_profit: parseFloat(t.tp || t.take_profit || t.takeProfit) || null,
        comment: t.comment || t.note || t.description || null,
        extra: buildExtra(t),
      }))

    if (newTrades.length === 0) {
      await supabase.from('broker_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', account.id)
      return res.status(200).json({ inserted: 0, message: 'All trades already synced' })
    }

    const { error: insertError } = await supabase.from('trades').insert(newTrades)
    if (insertError) {
      console.error('Webhook insert error:', insertError)
      return res.status(500).json({ error: 'Failed to insert trades', detail: insertError.message })
    }

    await supabase.from('broker_accounts').update({ last_sync_at: new Date().toISOString(), status: 'connected' }).eq('id', account.id)

    return res.status(200).json({
      inserted: newTrades.length,
      skipped: trades.length - newTrades.length,
      message: `${newTrades.length} trade(s) synced`,
    })

  } catch (err) {
    console.error('webhook-sync error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function normalizeDirection(raw) {
  if (!raw) return null
  const v = raw.toString().toLowerCase()
  if (v === '0' || v === 'buy' || v === 'long') return 'buy'
  if (v === '1' || v === 'sell' || v === 'short') return 'sell'
  return v
}

function parseTimestamp(raw) {
  if (!raw) return null
  if (typeof raw === 'string' && raw.includes('.')) raw = raw.replace(/\./g, '-').replace(' ', 'T')
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function buildExtra(t) {
  const known = new Set(['ticket','symbol','pair','instrument','type','direction','side','volume','lots','size','open_price','openPrice','entry','close_price','closePrice','exit','open_time','openTime','entryTime','time','close_time','closeTime','exitTime','profit','pnl','gross_profit','commission','comm','swap','overnight','sl','stop_loss','stopLoss','tp','take_profit','takeProfit','comment','note','description','api_token','trades'])
  const extra = {}
  for (const [k, v] of Object.entries(t)) {
    if (!known.has(k) && v !== null && v !== undefined && v !== '') extra[k] = v
  }
  return Object.keys(extra).length > 0 ? extra : null
}
