import React, { useId } from 'react';

function normalizeHex(value) {
  if (typeof value !== 'string') return '#06E6FF';
  const cleaned = value.trim().replace('#', '');
  if (cleaned.length === 3) {
    return `#${cleaned.split('').map((part) => part + part).join('')}`;
  }
  if (cleaned.length === 6) {
    return `#${cleaned}`;
  }
  return '#06E6FF';
}

function withAlpha(hex, alpha) {
  const normalized = normalizeHex(hex).replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function MarketFlowMark({
  size = 40,
  accent = '#06E6FF',
  secondary = '#69F5DE',
  style,
}) {
  const id = useId().replace(/:/g, '');
  const trendGradientId = `mf-mark-trend-${id}`;
  const barGradientId = `mf-mark-bars-${id}`;
  const glowGradientId = `mf-mark-glow-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', ...style }}
    >
      <defs>
        <linearGradient id={trendGradientId} x1="14" y1="44" x2="52" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={withAlpha(secondary, 0.82)} />
          <stop offset="0.52" stopColor={accent} />
          <stop offset="1" stopColor={secondary} />
        </linearGradient>
        <linearGradient id={barGradientId} x1="18" y1="49" x2="40" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={withAlpha('#EAF3FF', 0.36)} />
          <stop offset="0.55" stopColor={withAlpha(accent, 0.56)} />
          <stop offset="1" stopColor={withAlpha(secondary, 0.78)} />
        </linearGradient>
        <radialGradient id={glowGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 31) rotate(90) scale(24)">
          <stop offset="0" stopColor={withAlpha(accent, 0.16)} />
          <stop offset="0.55" stopColor={withAlpha(secondary, 0.08)} />
          <stop offset="1" stopColor={withAlpha(accent, 0)} />
        </radialGradient>
      </defs>

      <circle cx="32" cy="31" r="24" fill={`url(#${glowGradientId})`} />

      <path
        d="M12.5 15V49.5H51.5"
        stroke={withAlpha(accent, 0.18)}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path d="M18 39.5V49" stroke={`url(#${barGradientId})`} strokeWidth="4.6" strokeLinecap="round" opacity="0.82" />
      <path d="M27.5 32.5V49" stroke={`url(#${barGradientId})`} strokeWidth="4.6" strokeLinecap="round" opacity="0.88" />
      <path d="M37 24V49" stroke={`url(#${barGradientId})`} strokeWidth="4.6" strokeLinecap="round" />

      <path
        d="M14.5 42.5C19.2 40.9 23.3 37.8 27 33.9C29.2 31.6 31.4 30.2 34 28.5C37 26.6 39.2 23.9 41.5 21C44 17.9 47 15.5 51.5 13.4"
        stroke={`url(#${trendGradientId})`}
        strokeWidth="4.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 42.5C19.2 40.9 23.3 37.8 27 33.9C29.2 31.6 31.4 30.2 34 28.5C37 26.6 39.2 23.9 41.5 21C44 17.9 47 15.5 51.5 13.4"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46.8 13.5L51.5 13L50.4 17.7"
        stroke={withAlpha(secondary, 0.96)}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
