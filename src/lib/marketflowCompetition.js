const LADDER = [
  { min: 0, label: 'Foundation', tone: 'text' },
  { min: 250, label: 'Structure', tone: 'blue' },
  { min: 430, label: 'Precision', tone: 'accent' },
  { min: 610, label: 'Competitive', tone: 'green' },
  { min: 780, label: 'Elite', tone: 'warn' },
  { min: 910, label: 'Apex', tone: 'purple' },
];

const RIVAL_NAMES = [
  'Alpha London',
  'Nova Capital',
  'Pure Liquidity',
  'Vertex Macro',
  'Opening Range',
  'Delta Session',
  'North Desk',
  'Prime Flow',
  'Sharp Execution',
  'Axiom Setups',
  'Blueprint FX',
  'Risk Structure',
  'Edge Control',
  'Steady Volume',
  'Session Theory',
];

function clamp(value, min = 0, max = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function hashValue(input = '') {
  return String(input || '').split('').reduce((sum, char, index) => (
    (sum * 31 + char.charCodeAt(0) + index) % 2147483647
  ), 7);
}

export function getCompetitionDayStamp(now = new Date()) {
  const localNow = now instanceof Date ? now : new Date(now);
  const shifted = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000));
  return shifted.toISOString().slice(0, 10);
}

function pickDivision(progress = 0, isTopTier = false) {
  if (isTopTier) return 'I';
  if (progress >= 68) return 'I';
  if (progress >= 34) return 'II';
  return 'III';
}

export function buildMarketFlowRank(stats = {}, context = {}) {
  const totalTrades = safeNumber(stats.totalTrades);
  const profitFactor = safeNumber(stats.profitFactor);
  const winRate = safeNumber(stats.winRate);
  const maxDrawdown = Math.abs(safeNumber(stats.maxDrawdown));
  const expectancy = safeNumber(stats.expectancy);
  const hygieneScore = safeNumber(context.hygieneScore);
  const routineScore = safeNumber(context.routineScore);
  const developmentScore = safeNumber(context.developmentScore);
  const positiveDays = safeNumber(context.positiveDays);
  const negativeDays = safeNumber(context.negativeDays);
  const flatDays = safeNumber(context.flatDays);
  const monthPnl = safeNumber(context.monthPnl);
  const activeDays = positiveDays + negativeDays + flatDays;
  const sessionStrength = safeNumber(context.bestSession?.pnl);
  const topPairStrength = safeNumber(context.topPair?.pnl);
  const streakCount = safeNumber(context.currentStreak?.count);
  const streakType = context.currentStreak?.type || 'flat';

  const processScore = clamp((hygieneScore * 0.42) + (routineScore * 0.22) + (developmentScore * 0.36));
  const edgeScore = clamp((profitFactor / 2.6) * 100);
  const consistencyScore = clamp((winRate / 63) * 100 + (expectancy > 0 ? 8 : 0));
  const riskScore = clamp(100 - ((maxDrawdown / 12) * 100));
  const depthScore = clamp((totalTrades / 120) * 100);
  const cadenceBase = activeDays ? ((positiveDays / Math.max(1, activeDays)) * 100) : 0;
  const cadenceScore = clamp((cadenceBase * 0.62) + Math.min(activeDays * 3.1, 38) + (monthPnl > 0 ? 10 : 0));

  const normalized =
    (processScore * 0.22) +
    (edgeScore * 0.23) +
    (consistencyScore * 0.18) +
    (riskScore * 0.16) +
    (depthScore * 0.11) +
    (cadenceScore * 0.10);

  const score = Math.round(normalized * 10);
  const currentTier = [...LADDER].reverse().find((tier) => score >= tier.min) || LADDER[0];
  const nextTier = LADDER.find((tier) => score < tier.min) || null;
  const rangeMin = currentTier.min;
  const rangeMax = nextTier ? nextTier.min : 1000;
  const progress = rangeMax > rangeMin
    ? clamp(((score - rangeMin) / (rangeMax - rangeMin)) * 100)
    : 100;
  const division = pickDivision(progress, !nextTier);

  const fieldSize = 2500;
  const position = Math.max(
    7,
    Math.round(
      fieldSize
      - (score * 2.08)
      - (totalTrades * 0.86)
      - (activeDays * 5.2)
      - Math.min(sessionStrength / 45, 34)
      - Math.min(topPairStrength / 55, 26)
      + (maxDrawdown * 8.5)
    ),
  );
  const percentile = clamp(Math.round(((fieldSize - position) / fieldSize) * 100), 1, 99);
  const weeklyDelta = Math.round(
    (monthPnl > 0 ? Math.min(monthPnl / 180, 36) : Math.max(monthPnl / 220, -32))
    + (streakType === 'win' ? Math.min(streakCount * 3, 12) : 0)
    - (streakType === 'loss' ? Math.min(streakCount * 4, 16) : 0),
  );

  const factors = [
    { label: 'Process', value: Math.round(processScore), tone: 'accent', description: 'Journal quality, workflow, discipline, and regularity.' },
    { label: 'Edge', value: Math.round(edgeScore), tone: 'green', description: 'Profit factor, expectancy, and pair quality.' },
    { label: 'Consistency', value: Math.round(consistencyScore), tone: 'blue', description: 'Stable hit rate and controlled execution.' },
    { label: 'Risk', value: Math.round(riskScore), tone: 'warn', description: 'Drawdown pressure and downside control.' },
    { label: 'Depth', value: Math.round(depthScore), tone: 'purple', description: 'Enough clean sample size to trust the read.' },
    { label: 'Cadence', value: Math.round(cadenceScore), tone: 'teal', description: 'Daily consistency and green trading rhythm.' },
  ];

  const weakestFactor = [...factors].sort((left, right) => left.value - right.value)[0];
  const strongestFactor = [...factors].sort((left, right) => right.value - left.value)[0];

  let focus = 'Keep the journal stable and protect the edge.';
  if (totalTrades < 25) focus = 'Build more sample size before forcing higher rank.';
  else if (weakestFactor.label === 'Process') focus = 'Raise routine and logging discipline.';
  else if (weakestFactor.label === 'Edge') focus = 'Cut weaker setups and protect selectivity.';
  else if (weakestFactor.label === 'Consistency') focus = 'Stabilize execution quality day after day.';
  else if (weakestFactor.label === 'Risk') focus = 'Reduce drawdown pressure before pressing higher.';
  else if (weakestFactor.label === 'Depth') focus = 'Keep feeding the journal with clean executions.';
  else focus = 'Trade with cleaner cadence and review the weak days.';

  return {
    score,
    normalized: Math.round(normalized),
    label: currentTier.label === 'Apex' ? 'Apex' : `${currentTier.label} ${division}`,
    tier: currentTier.label,
    division,
    tone: currentTier.tone,
    nextLabel: nextTier ? nextTier.label : 'Apex',
    nextGap: nextTier ? Math.max(0, nextTier.min - score) : 0,
    progress,
    percentile,
    position,
    fieldSize,
    weeklyDelta,
    focus,
    strongestFactor,
    weakestFactor,
    factors,
    note: context.bestSession
      ? `Strongest live context: ${context.bestSession.s}${context.topPair ? ` / ${context.topPair.p}` : ''}.`
      : 'The competition layer becomes sharper as the journal receives more clean data.',
  };
}

export function buildCompetitionBoard(rank, displayName = 'You', dayStamp = getCompetitionDayStamp()) {
  const safeRank = rank || buildMarketFlowRank({}, {});
  const seed = hashValue(`${dayStamp}-${displayName}-${safeRank.score}-${safeRank.position}`);
  const board = [];

  for (let offset = -4; offset <= 5; offset += 1) {
    const isUser = offset === 0;
    const rivalSeed = seed + (offset * 17);
    const position = Math.max(1, safeRank.position + (offset * 7));
    const score = Math.max(120, Math.min(998, safeRank.score - (offset * -11) + (rivalSeed % 9) - 4));
    const percentile = clamp(Math.round(((safeRank.fieldSize - position) / safeRank.fieldSize) * 100), 1, 99);
    const delta = ((rivalSeed % 13) - 6);
    board.push({
      id: isUser ? 'you' : `rival-${offset + 5}`,
      name: isUser ? displayName : RIVAL_NAMES[(rivalSeed + offset + RIVAL_NAMES.length) % RIVAL_NAMES.length],
      position,
      score,
      percentile,
      trend: delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat',
      delta,
      isUser,
    });
  }

  return board.sort((left, right) => left.position - right.position);
}
