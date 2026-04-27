const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Supabase service role is not configured.',
      requiredEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const dayStamp = getDayStamp();

  try {
    const { data: trades, error } = await supabase
      .from('trades')
      .select('user_id, profit_loss, profit, pnl, status, open_date, date, session, symbol, pair, setup, notes, psychology_score, extra');

    if (error) throw error;

    const profileMap = await loadProfileMap(supabase);
    const snapshots = buildSnapshots(trades || [], dayStamp, profileMap);

    if (!snapshots.length) {
      return res.status(200).json({
        ok: true,
        dayStamp,
        refreshed: 0,
        message: 'No trades available for leaderboard refresh.',
      });
    }

    const { error: upsertError } = await supabase
      .from('leaderboard_daily_snapshots')
      .upsert(snapshots, { onConflict: 'id' });

    if (upsertError) {
      return res.status(200).json({
        ok: false,
        actionRequired: 'Create the leaderboard_daily_snapshots table in Supabase.',
        dayStamp,
        refreshed: 0,
        detail: upsertError.message,
        tableSql: 'create table if not exists leaderboard_daily_snapshots (id text primary key, user_id uuid not null, display_name text, day_stamp date not null, score int not null, position_seed int not null, total_trades int not null, pnl numeric not null, win_rate numeric not null, profit_factor numeric not null, max_drawdown numeric not null, updated_at timestamptz not null default now());',
      });
    }

    return res.status(200).json({
      ok: true,
      dayStamp,
      refreshed: snapshots.length,
      nextRefresh: 'Daily via Vercel Cron',
    });
  } catch (error) {
    console.error('leaderboard refresh error:', error);
    return res.status(500).json({ error: 'Leaderboard refresh failed', detail: error.message });
  }
};

async function loadProfileMap(supabase) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, name');

  if (error || !Array.isArray(data)) return new Map();

  return data.reduce((map, profile) => {
    map.set(profile.id, profile.full_name || profile.name || String(profile.email || '').split('@')[0] || 'MarketFlow Trader');
    return map;
  }, new Map());
}

function buildSnapshots(trades = [], dayStamp, profileMap = new Map()) {
  const grouped = trades.reduce((map, trade) => {
    if (!trade.user_id) return map;
    if (!map.has(trade.user_id)) map.set(trade.user_id, []);
    map.get(trade.user_id).push(trade);
    return map;
  }, new Map());

  return Array.from(grouped.entries()).map(([userId, userTrades]) => {
    const closed = userTrades.filter((trade) => ['TP', 'SL', 'BE', 'tp', 'sl', 'be'].includes(String(trade.status || '').toLowerCase()) || getPnl(trade) !== 0);
    const wins = closed.filter((trade) => getPnl(trade) > 0);
    const losses = closed.filter((trade) => getPnl(trade) < 0);
    const pnl = closed.reduce((sum, trade) => sum + getPnl(trade), 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((sum, trade) => sum + Math.max(0, getPnl(trade)), 0);
    const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + Math.min(0, getPnl(trade)), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const maxDrawdown = calculateMaxDrawdown(closed);
    const hygiene = calculateHygiene(closed);
    const cadence = calculateCadence(closed);
    const edge = clamp((profitFactor / 2.6) * 100);
    const consistency = clamp((winRate / 63) * 100 + (pnl > 0 ? 8 : 0));
    const risk = clamp(100 - ((Math.abs(maxDrawdown) / 12) * 100));
    const depth = clamp((closed.length / 120) * 100);
    const score = Math.round((
      (hygiene * 0.24)
      + (edge * 0.24)
      + (consistency * 0.18)
      + (risk * 0.16)
      + (depth * 0.10)
      + (cadence * 0.08)
    ) * 10);

    return {
      id: `${dayStamp}:${userId}`,
      user_id: userId,
      display_name: profileMap.get(userId) || 'MarketFlow Trader',
      day_stamp: dayStamp,
      score,
      position_seed: hashValue(`${dayStamp}:${userId}:${score}`),
      total_trades: closed.length,
      pnl,
      win_rate: Number(winRate.toFixed(2)),
      profit_factor: Number(profitFactor.toFixed(2)),
      max_drawdown: Number(maxDrawdown.toFixed(2)),
      updated_at: new Date().toISOString(),
    };
  });
}

function getPnl(trade = {}) {
  const value = Number(trade.profit_loss ?? trade.profit ?? trade.pnl ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function calculateMaxDrawdown(trades = []) {
  const sorted = [...trades].sort((left, right) => new Date(left.open_date || left.date || 0) - new Date(right.open_date || right.date || 0));
  let running = 0;
  let peak = 0;
  let drawdown = 0;
  sorted.forEach((trade) => {
    running += getPnl(trade);
    peak = Math.max(peak, running);
    const current = peak > 0 ? ((running - peak) / peak) * 100 : 0;
    drawdown = Math.min(drawdown, current);
  });
  return drawdown;
}

function calculateHygiene(trades = []) {
  if (!trades.length) return 0;
  const setup = percentage(trades, (trade) => String(trade.setup || trade.extra?.setup || '').trim());
  const session = percentage(trades, (trade) => String(trade.session || trade.extra?.session || '').trim());
  const notes = percentage(trades, (trade) => String(trade.notes || trade.comment || '').trim());
  const psychology = percentage(trades, (trade) => trade.psychology_score != null || trade.extra?.psychology_score != null);
  return Math.round((setup + session + notes + psychology) / 4);
}

function calculateCadence(trades = []) {
  const days = new Set(trades.map((trade) => String(trade.open_date || trade.date || '').slice(0, 10)).filter(Boolean));
  return clamp(days.size * 8);
}

function percentage(items, predicate) {
  if (!items.length) return 0;
  return Math.round((items.filter(predicate).length / items.length) * 100);
}

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function getDayStamp() {
  const date = new Date();
  return date.toISOString().slice(0, 10);
}

function hashValue(input = '') {
  return String(input || '').split('').reduce((sum, char, index) => (
    (sum * 31 + char.charCodeAt(0) + index) % 2147483647
  ), 19);
}
