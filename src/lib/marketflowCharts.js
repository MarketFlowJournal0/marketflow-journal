import { shade } from './colorAlpha';

export const CHART_MOTION = {
  isAnimationActive: true,
  animationBegin: 90,
  animationDuration: 1560,
  animationEasing: 'ease-out',
};

export const CHART_MOTION_SOFT = {
  isAnimationActive: true,
  animationBegin: 120,
  animationDuration: 2100,
  animationEasing: 'ease-out',
};

export const CHART_GRID = {
  stroke: 'rgba(var(--mf-border-rgb, 22, 32, 52),0.42)',
  strokeDasharray: '2 10',
  vertical: false,
};

export const CHART_GRID_FULL = {
  stroke: 'rgba(var(--mf-border-rgb, 22, 32, 52),0.38)',
  strokeDasharray: '2 10',
};

export const CHART_AXIS = {
  axisLine: false,
  tickLine: false,
  tickMargin: 10,
  tick: {
    fill: 'var(--mf-text-2,#7A90B8)',
    fontSize: 10,
    fontWeight: 600,
  },
};

export const CHART_AXIS_SMALL = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  tick: {
    fill: 'var(--mf-text-3,#334566)',
    fontSize: 9,
    fontWeight: 700,
  },
};

export function chartCursor(color = 'var(--mf-accent,#06E6FF)') {
  return {
    stroke: shade(color, 0.24),
    strokeWidth: 1,
    strokeDasharray: '4 8',
  };
}

export function chartTooltipStyle(color = 'var(--mf-accent,#06E6FF)') {
  return {
    background: 'linear-gradient(180deg, rgba(10,16,28,0.96), rgba(6,10,18,0.99))',
    border: `1px solid ${shade(color, 0.14)}`,
    borderRadius: 18,
    fontSize: 11,
    boxShadow: `0 26px 70px rgba(0,0,0,0.62), 0 0 0 1px ${shade(color, 0.05)}, 0 0 32px ${shade(color, 0.1)}`,
    backdropFilter: 'blur(22px) saturate(1.15)',
  };
}

export function chartActiveDot(color = 'var(--mf-accent,#06E6FF)', radius = 5, stroke = 'var(--mf-deep,#07090F)') {
  return {
    r: radius + 0.5,
    fill: color,
    stroke,
    strokeWidth: 2.5,
    style: {
      filter: `drop-shadow(0 0 18px ${shade(color, 0.58)})`,
    },
  };
}
