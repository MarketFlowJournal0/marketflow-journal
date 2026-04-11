const RGB_TOKEN_MAP = [
  { tokens: ['--mf-accent', '--accent'], rgb: '--mf-accent-rgb', fallback: '6, 230, 255' },
  { tokens: ['--mf-accent-secondary'], rgb: '--mf-accent-secondary-rgb', fallback: '0, 255, 136' },
  { tokens: ['--mf-teal', '--teal'], rgb: '--mf-teal-rgb', fallback: '0, 245, 212' },
  { tokens: ['--mf-green', '--green'], rgb: '--mf-green-rgb', fallback: '0, 255, 136' },
  { tokens: ['--mf-blue'], rgb: '--mf-blue-rgb', fallback: '77, 124, 255' },
  { tokens: ['--mf-purple'], rgb: '--mf-purple-rgb', fallback: '167, 139, 250' },
  { tokens: ['--mf-pink'], rgb: '--mf-pink-rgb', fallback: '251, 113, 133' },
  { tokens: ['--mf-gold', '--gold'], rgb: '--mf-gold-rgb', fallback: '255, 215, 0' },
  { tokens: ['--mf-warn'], rgb: '--mf-warn-rgb', fallback: '255, 179, 26' },
  { tokens: ['--mf-orange'], rgb: '--mf-orange-rgb', fallback: '255, 107, 53' },
  { tokens: ['--mf-danger', '--red'], rgb: '--mf-danger-rgb', fallback: '255, 61, 87' },
  { tokens: ['--mf-bg', '--bg'], rgb: '--mf-bg-rgb', fallback: '3, 5, 8' },
  { tokens: ['--mf-card', '--bg-card'], rgb: '--mf-card-rgb', fallback: '12, 20, 34' },
  { tokens: ['--mf-high', '--bg-high'], rgb: '--mf-high-rgb', fallback: '17, 27, 46' },
  { tokens: ['--mf-deep'], rgb: '--mf-deep-rgb', fallback: '7, 9, 15' },
  { tokens: ['--mf-border', '--brd'], rgb: '--mf-border-rgb', fallback: '22, 32, 52' },
  { tokens: ['--mf-border-hi', '--brd-hi'], rgb: '--mf-border-hi-rgb', fallback: '30, 46, 72' },
  { tokens: ['--mf-text-0', '--t0'], rgb: '--mf-text-0-rgb', fallback: '255, 255, 255' },
  { tokens: ['--mf-text-1', '--t1'], rgb: '--mf-text-1-rgb', fallback: '232, 238, 255' },
  { tokens: ['--mf-text-2', '--t2'], rgb: '--mf-text-2-rgb', fallback: '122, 144, 184' },
  { tokens: ['--mf-text-3', '--t3'], rgb: '--mf-text-3-rgb', fallback: '51, 69, 102' },
  { tokens: ['--mf-text-4', '--t4'], rgb: '--mf-text-4-rgb', fallback: '30, 46, 69' },
];

function clampOpacity(value) {
  if (typeof value === 'number') return Math.max(0, Math.min(1, value));
  if (typeof value === 'string' && /^[0-9A-Fa-f]{2}$/.test(value)) {
    return Math.max(0, Math.min(1, Number.parseInt(value, 16) / 255));
  }
  return 1;
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '').trim();
  if (![3, 6].includes(normalized.length)) return null;
  const full = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function rgbVarForColor(color, alpha) {
  const match = RGB_TOKEN_MAP.find((entry) => entry.tokens.some((token) => color.includes(token)));
  if (!match) return null;
  return `rgba(var(${match.rgb}, ${match.fallback}),${clampOpacity(alpha)})`;
}

export function shade(color, alpha = 'FF') {
  if (!color) return `rgba(255,255,255,${clampOpacity(alpha)})`;

  if (typeof color === 'string' && color.includes('var(')) {
    const variableShade = rgbVarForColor(color, alpha);
    if (variableShade) return variableShade;
  }

  if (typeof color === 'string' && color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampOpacity(alpha)})`;
  }

  const rgbaMatch = typeof color === 'string' && color.match(/rgba?\(([^)]+)\)/i);
  if (rgbaMatch) {
    const channels = rgbaMatch[1].split(',').slice(0, 3).map((part) => part.trim());
    if (channels.length === 3) return `rgba(${channels.join(', ')}, ${clampOpacity(alpha)})`;
  }

  return color;
}

export function alpha(color, opacity = 1) {
  return shade(color, opacity);
}
