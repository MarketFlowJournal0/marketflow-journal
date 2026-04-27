const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({
      configured: false,
      rows: [],
      message: 'Leaderboard storage is not configured.',
    });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const requestedDay = typeof req.query.day === 'string' ? req.query.day : '';

  try {
    const dayStamp = requestedDay || await getLatestDayStamp(supabase);
    if (!dayStamp) {
      return res.status(200).json({ configured: true, rows: [], dayStamp: null });
    }

    const { data, error } = await supabase
      .from('leaderboard_daily_snapshots')
      .select('user_id, display_name, day_stamp, score, total_trades, pnl, win_rate, profit_factor, max_drawdown, updated_at')
      .eq('day_stamp', dayStamp)
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(200).json({
        configured: false,
        rows: [],
        dayStamp,
        message: error.message,
      });
    }

    return res.status(200).json({
      configured: true,
      dayStamp,
      refreshedAt: data?.[0]?.updated_at || null,
      rows: (data || []).map((row, index) => ({
        ...row,
        position: index + 1,
      })),
    });
  } catch (error) {
    console.error('leaderboard api error:', error);
    return res.status(500).json({ error: 'Unable to load leaderboard', detail: error.message });
  }
};

async function getLatestDayStamp(supabase) {
  const { data, error } = await supabase
    .from('leaderboard_daily_snapshots')
    .select('day_stamp')
    .order('day_stamp', { ascending: false })
    .limit(1);

  if (error || !data?.[0]?.day_stamp) return '';
  return data[0].day_stamp;
}
