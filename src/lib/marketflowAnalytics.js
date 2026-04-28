const SESSION_ORDER = ['Tokyo / Asia', 'London', 'New York', 'Other'];

export function toAnalyticsNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes(':')) return null;

  let normalized = trimmed.replace(/\s+/g, '').replace(/[$€£¥%]/g, '');
  if (!normalized) return null;

  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;

  if (commaCount && dotCount) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (commaCount === 1 && dotCount === 0) {
    normalized = normalized.replace(',', '.');
  } else if (commaCount > 1 && dotCount === 0) {
    normalized = normalized.replace(/,/g, '');
  }

  if (!/^[-+]?\d*\.?\d+$/.test(normalized)) return null;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatAnalyticsMoney(value, digits = 2) {
  const numeric = toAnalyticsNumber(value) ?? 0;
  const absolute = Math.abs(numeric).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (numeric > 0) return `+$${absolute}`;
  if (numeric < 0) return `-$${absolute}`;
  return `$${absolute}`;
}

export function formatAnalyticsPercent(value, digits = 1) {
  const numeric = toAnalyticsNumber(value);
  if (numeric == null) return '--';
  return `${numeric.toFixed(digits)}%`;
}

export function formatAnalyticsFactor(value) {
  const numeric = toAnalyticsNumber(value);
  if (numeric == null) return '--';
  if (!Number.isFinite(numeric)) return '∞';
  return `${numeric.toFixed(2)}x`;
}

export function formatAnalyticsRR(value) {
  const numeric = toAnalyticsNumber(value);
  if (numeric == null || numeric <= 0) return '--';
  return `1:${numeric.toFixed(2)}`;
}

export function getTradePnl(trade = {}) {
  return toAnalyticsNumber(trade.profit_loss ?? trade.pnl) ?? 0;
}

export function getTradeOutcome(trade = {}) {
  const raw = String(trade.status || trade.result || trade.extra?.result || '').trim().toLowerCase();
  if (['tp', 'take profit', 'takeprofit', 'win', 'winner', 'profit', 'target'].includes(raw)) return 'TP';
  if (['sl', 'stop loss', 'stoploss', 'loss', 'loser', 'stop'].includes(raw)) return 'SL';
  if (['be', 'break even', 'break-even', 'breakeven', 'flat'].includes(raw)) return 'BE';

  const pnl = getTradePnl(trade);
  if (pnl > 0) return 'TP';
  if (pnl < 0) return 'SL';
  return 'BE';
}

export function getTradeRR(trade = {}) {
  const rr = toAnalyticsNumber(
    trade.metrics?.rrReel
    ?? trade.rrActual
    ?? trade.rr_actual
    ?? trade.rr
    ?? trade.extra?.rr_actual
    ?? trade.extra?.rrActual
    ?? trade.extra?.rr
  );
  if (rr != null && rr > 0) return rr;
  const outcome = getTradeOutcome(trade);
  if (outcome === 'TP' || outcome === 'SL') return 1;
  return 0;
}

export function getTradeSignedR(trade = {}) {
  const outcome = getTradeOutcome(trade);
  if (outcome === 'TP') return getTradeRR(trade) || 1;
  if (outcome === 'SL') return -1;
  return 0;
}

export function getTradeDateValue(trade = {}) {
  const rawDate = trade.open_date || trade.date || '';
  if (!rawDate) return null;

  if (trade.time && /^\d{1,2}:\d{2}/.test(String(trade.time).trim())) {
    const composed = `${rawDate.split('T')[0]}T${String(trade.time).trim()}`;
    const composedDate = new Date(composed);
    if (!Number.isNaN(composedDate.getTime())) return composedDate;
  }

  const direct = new Date(rawDate);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

export function getTradeDateKey(trade = {}) {
  const date = getTradeDateValue(trade);
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

export function getTradeDateLabel(trade = {}) {
  const date = getTradeDateValue(trade);
  if (!date) return '--';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getTradeHour(trade = {}) {
  if (trade.time && /^\d{1,2}:\d{2}/.test(String(trade.time).trim())) {
    return Number(String(trade.time).trim().split(':')[0]);
  }
  const date = getTradeDateValue(trade);
  return date ? date.getHours() : null;
}

export function normalizeSessionLabel(value = '') {
  if (value === 'NY') return 'New York';
  if (value === 'Asia') return 'Tokyo / Asia';
  if (value === 'London') return 'London';
  return value || 'Other';
}

export function sortTradesChronologically(trades = []) {
  return [...trades].sort((left, right) => {
    const leftDate = getTradeDateValue(left)?.getTime() ?? 0;
    const rightDate = getTradeDateValue(right)?.getTime() ?? 0;
    return leftDate - rightDate;
  });
}

export function buildEquityDrawdownSeries(trades = []) {
  const sorted = sortTradesChronologically(trades);
  let equity = 0;
  let peak = 0;
  let rEquity = 0;
  let rPeak = 0;

  return sorted.map((trade, index) => {
    const pnl = getTradePnl(trade);
    const outcome = getTradeOutcome(trade);
    const r = getTradeSignedR(trade);
    equity += pnl;
    peak = Math.max(peak, equity, 0);
    rEquity += r;
    rPeak = Math.max(rPeak, rEquity, 0);

    const drawdownCash = equity - peak;
    const drawdownPct = peak > 0 ? (drawdownCash / peak) * 100 : 0;
    const rDrawdown = rEquity - rPeak;

    return {
      index: index + 1,
      dateKey: getTradeDateKey(trade),
      dateLabel: getTradeDateLabel(trade),
      pnl,
      equity: Number(equity.toFixed(2)),
      peak: Number(peak.toFixed(2)),
      drawdownCash: Number(drawdownCash.toFixed(2)),
      drawdownPct: Number(drawdownPct.toFixed(2)),
      r: Number(r.toFixed(2)),
      rEquity: Number(rEquity.toFixed(2)),
      rDrawdown: Number(rDrawdown.toFixed(2)),
      outcome,
      isWin: outcome === 'TP',
      symbol: trade.symbol || trade.pair || '--',
      session: normalizeSessionLabel(trade.session),
    };
  });
}

export function summarizeTradeSet(trades = []) {
  const sorted = sortTradesChronologically(trades);
  const wins = sorted.filter((trade) => getTradeOutcome(trade) === 'TP');
  const losses = sorted.filter((trade) => getTradeOutcome(trade) === 'SL');
  const breakeven = sorted.filter((trade) => getTradeOutcome(trade) === 'BE');
  const decisiveTrades = wins.length + losses.length;
  const totalPnL = sorted.reduce((sum, trade) => sum + getTradePnl(trade), 0);
  const grossWin = wins.reduce((sum, trade) => sum + getTradePnl(trade), 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + getTradePnl(trade), 0));
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const pnlProfitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Number.POSITIVE_INFINITY : 0;
  const winRs = wins.map(getTradeRR).filter((value) => value != null && value > 0);
  const avgRR = winRs.length ? winRs.reduce((sum, value) => sum + value, 0) / winRs.length : null;
  const grossRWin = wins.reduce((sum, trade) => sum + Math.max(0, getTradeSignedR(trade)), 0);
  const grossRLoss = losses.length;
  const totalR = sorted.reduce((sum, trade) => sum + getTradeSignedR(trade), 0);
  const rrRatio = grossRLoss > 0 ? grossRWin / grossRLoss : grossRWin > 0 ? Number.POSITIVE_INFINITY : 0;
  const expectancy = sorted.length ? totalPnL / sorted.length : 0;
  const expectancyR = decisiveTrades ? totalR / decisiveTrades : 0;
  const winRate = decisiveTrades ? (wins.length / decisiveTrades) * 100 : 0;
  const series = buildEquityDrawdownSeries(sorted);
  const maxDrawdownCash = series.length ? Math.min(...series.map((row) => row.drawdownCash)) : 0;
  const maxDrawdownPct = series.length ? Math.min(...series.map((row) => row.drawdownPct)) : 0;
  const maxDrawdownR = series.length ? Math.min(...series.map((row) => row.rDrawdown)) : 0;

  let streak = 0;
  let bestWinStreak = 0;
  let bestLossStreak = 0;
  let currentSLStreak = 0;
  let maxConsecutiveSL = 0;
  let currentDirection = 0;

  sorted.forEach((trade) => {
    const outcome = getTradeOutcome(trade);
    const direction = outcome === 'TP' ? 1 : outcome === 'SL' ? -1 : 0;
    if (!direction) return;
    if (direction === currentDirection) streak += direction;
    else {
      streak = direction;
      currentDirection = direction;
    }
    if (streak > bestWinStreak) bestWinStreak = streak;
    if (streak < bestLossStreak) bestLossStreak = streak;
    currentSLStreak = outcome === 'SL' ? currentSLStreak + 1 : 0;
    maxConsecutiveSL = Math.max(maxConsecutiveSL, currentSLStreak);
  });

  const activeDays = new Set(sorted.map(getTradeDateKey).filter(Boolean)).size;

  return {
    totalTrades: sorted.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    totalPnL,
    grossWin,
    grossLoss,
    grossRWin,
    grossRLoss,
    totalR,
    avgWin,
    avgLoss,
    avgRR,
    expectancy,
    expectancyR,
    winRate,
    profitFactor: rrRatio,
    pnlProfitFactor,
    rrRatio,
    maxDrawdownCash,
    maxDrawdownPct,
    maxDrawdownR,
    maxConsecutiveSL,
    currentSLStreak,
    activeDays,
    tradesPerDay: activeDays ? sorted.length / activeDays : 0,
    currentStreak: streak,
    bestWinStreak,
    bestLossStreak: Math.abs(bestLossStreak),
    series,
  };
}

export function buildRollingWinRateSeries(trades = [], windowSize = 12) {
  const sorted = sortTradesChronologically(trades);
  let wins = 0;
  let decisive = 0;

  return sorted.map((trade, index) => {
    const outcome = getTradeOutcome(trade);
    if (outcome === 'TP') wins += 1;
    if (outcome === 'TP' || outcome === 'SL') decisive += 1;
    const windowTrades = sorted.slice(Math.max(0, index - windowSize + 1), index + 1);
    const windowDecisive = windowTrades.filter((item) => ['TP', 'SL'].includes(getTradeOutcome(item)));
    const windowWins = windowDecisive.filter((item) => getTradeOutcome(item) === 'TP').length;
    return {
      index: index + 1,
      dateKey: getTradeDateKey(trade),
      dateLabel: getTradeDateLabel(trade),
      cumulativeWinRate: Number(((wins / Math.max(decisive, 1)) * 100).toFixed(2)),
      rollingWinRate: Number(((windowWins / Math.max(windowDecisive.length, 1)) * 100).toFixed(2)),
      pnl: getTradePnl(trade),
      outcome,
      r: getTradeSignedR(trade),
      session: normalizeSessionLabel(trade.session),
      symbol: trade.symbol || trade.pair || '--',
    };
  });
}

function buildBreakdown(trades, getKey, minTrades = 1) {
  const map = new Map();

  trades.forEach((trade) => {
    const key = getKey(trade);
    if (!key) return;
    const current = map.get(key) || { key, trades: 0, wins: 0, losses: 0, breakeven: 0, pnl: 0, r: 0 };
    current.trades += 1;
    const outcome = getTradeOutcome(trade);
    const pnl = getTradePnl(trade);
    if (outcome === 'TP') current.wins += 1;
    else if (outcome === 'SL') current.losses += 1;
    else current.breakeven += 1;
    current.pnl += pnl;
    current.r += getTradeSignedR(trade);
    map.set(key, current);
  });

  return [...map.values()]
    .filter((entry) => entry.trades >= minTrades)
    .map((entry) => ({
      ...entry,
      pnl: Number(entry.pnl.toFixed(2)),
      r: Number(entry.r.toFixed(2)),
      winRate: Number(((entry.wins / Math.max(entry.wins + entry.losses, 1)) * 100).toFixed(1)),
    }));
}

export function buildWinRateInsights(trades = []) {
  const sessionBreakdown = buildBreakdown(trades, (trade) => normalizeSessionLabel(trade.session), 2)
    .sort((left, right) => right.winRate - left.winRate);
  const hourBreakdown = buildBreakdown(trades, (trade) => {
    const hour = getTradeHour(trade);
    return Number.isInteger(hour) ? `${String(hour).padStart(2, '0')}:00` : '';
  }, 2).sort((left, right) => right.winRate - left.winRate);
  const setupBreakdown = buildBreakdown(trades, (trade) => String(trade.setup || '').trim(), 2)
    .sort((left, right) => right.winRate - left.winRate);

  const insights = [];
  const bestSession = sessionBreakdown[0];
  const worstSession = [...sessionBreakdown].sort((left, right) => left.winRate - right.winRate)[0];
  const bestHour = hourBreakdown[0];
  const weakestSetup = [...setupBreakdown].sort((left, right) => left.winRate - right.winRate)[0];
  const summary = summarizeTradeSet(trades);

  if (bestSession) {
    insights.push({
      id: 'best-session',
      tone: 'positive',
      title: `${bestSession.key} is leading your book`,
      body: `${formatAnalyticsPercent(bestSession.winRate)} win rate across ${bestSession.trades} trades. Lean into that session when conditions match your playbook.`,
    });
  }

  if (worstSession && worstSession.key !== bestSession?.key) {
    insights.push({
      id: 'weak-session',
      tone: 'risk',
      title: `${worstSession.key} is dragging consistency`,
      body: `${formatAnalyticsPercent(worstSession.winRate)} win rate with ${formatAnalyticsMoney(worstSession.pnl)}. Reduce size there or tighten the setup filter.`,
    });
  }

  if (bestHour) {
    insights.push({
      id: 'best-hour',
      tone: 'neutral',
      title: `${bestHour.key} is your strongest execution window`,
      body: `${formatAnalyticsPercent(bestHour.winRate)} win rate over ${bestHour.trades} trades. Use it as your anchor hour for the day.`,
    });
  }

  if (weakestSetup) {
    insights.push({
      id: 'setup-review',
      tone: 'risk',
      title: `Review the ${weakestSetup.key} setup`,
      body: `${formatAnalyticsPercent(weakestSetup.winRate)} win rate and ${formatAnalyticsMoney(weakestSetup.pnl)}. Either refine the trigger or drop it from the plan.`,
    });
  }

  if (summary.avgRR != null && summary.avgRR < 1.2) {
    insights.push({
      id: 'rr-review',
      tone: 'risk',
      title: 'Risk-to-reward is capping the upside',
      body: `${formatAnalyticsRR(summary.avgRR)} average R:R means you need a very high hit rate to scale. Let winners breathe a bit longer.`,
    });
  }

  return insights.slice(0, 4);
}

export function buildSessionWinRateSeries(trades = []) {
  return buildBreakdown(trades, (trade) => normalizeSessionLabel(trade.session), 1)
    .sort((left, right) => SESSION_ORDER.indexOf(left.key) - SESSION_ORDER.indexOf(right.key));
}

export function buildHourWinRateSeries(trades = []) {
  return buildBreakdown(trades, (trade) => {
    const hour = getTradeHour(trade);
    return Number.isInteger(hour) ? `${String(hour).padStart(2, '0')}:00` : '';
  }, 1).sort((left, right) => left.key.localeCompare(right.key));
}
