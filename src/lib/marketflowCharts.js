import { shade } from './colorAlpha';

export const CHART_MOTION = {
  isAnimationActive: true,
  animationBegin: 110,
  animationDuration: 1380,
  animationEasing: 'ease-out',
};

export const CHART_MOTION_SOFT = {
  isAnimationActive: true,
  animationBegin: 140,
  animationDuration: 1820,
  animationEasing: 'ease-out',
};

export const CHART_GRID = {
  stroke: 'rgba(var(--mf-border-rgb, 22, 32, 52),0.58)',
  strokeDasharray: '3 9',
  vertical: false,
};

export const CHART_GRID_FULL = {
  stroke: 'rgba(var(--mf-border-rgb, 22, 32, 52),0.54)',
  strokeDasharray: '3 9',
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
    background: 'linear-gradient(180deg, rgba(9,15,26,0.94), rgba(6,10,18,0.985))',
    border: `1px solid ${shade(color, 0.16)}`,
    borderRadius: 16,
    fontSize: 11,
    boxShadow: `0 22px 56px rgba(0,0,0,0.56), 0 0 0 1px ${shade(color, 0.06)}, 0 0 28px ${shade(color, 0.08)}`,
    backdropFilter: 'blur(20px) saturate(1.12)',
  };
}

export function chartActiveDot(color = 'var(--mf-accent,#06E6FF)', radius = 5, stroke = 'var(--mf-deep,#07090F)') {
  return {
    r: radius,
    fill: color,
    stroke,
    strokeWidth: 2.5,
    style: {
      filter: `drop-shadow(0 0 14px ${shade(color, 0.5)})`,
    },
  };
}
