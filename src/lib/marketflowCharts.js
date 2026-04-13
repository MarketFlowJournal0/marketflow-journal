import { shade } from './colorAlpha';

export const CHART_MOTION = {
  isAnimationActive: true,
  animationBegin: 90,
  animationDuration: 900,
  animationEasing: 'ease-out',
};

export const CHART_MOTION_SOFT = {
  isAnimationActive: true,
  animationBegin: 120,
  animationDuration: 1150,
  animationEasing: 'ease-out',
};

export const CHART_GRID = {
  stroke: 'rgba(var(--mf-border-rgb, 22, 32, 52),0.72)',
  strokeDasharray: '4 8',
  vertical: false,
};

export const CHART_GRID_FULL = {
  stroke: 'rgba(var(--mf-border-rgb, 22, 32, 52),0.62)',
  strokeDasharray: '4 8',
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
    stroke: shade(color, 0.32),
    strokeWidth: 1,
    strokeDasharray: '5 6',
  };
}

export function chartTooltipStyle(color = 'var(--mf-accent,#06E6FF)') {
  return {
    background: 'linear-gradient(180deg, rgba(11,18,31,0.96), rgba(7,12,22,0.98))',
    border: `1px solid ${shade(color, 0.2)}`,
    borderRadius: 14,
    fontSize: 11,
    boxShadow: `0 18px 48px rgba(0,0,0,0.56), 0 0 0 1px ${shade(color, 0.08)}, 0 0 36px ${shade(color, 0.14)}`,
    backdropFilter: 'blur(18px) saturate(1.18)',
  };
}

export function chartActiveDot(color = 'var(--mf-accent,#06E6FF)', radius = 5, stroke = 'var(--mf-deep,#07090F)') {
  return {
    r: radius,
    fill: color,
    stroke,
    strokeWidth: 2.5,
    style: {
      filter: `drop-shadow(0 0 12px ${shade(color, 0.75)})`,
    },
  };
}
