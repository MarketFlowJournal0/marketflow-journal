const BASE_THEME = {
  bg: '#090D12',
  card: '#11171F',
  high: '#171F28',
  deep: '#070A0E',
  text0: '#F5F7FA',
  text1: '#DBE2EA',
  text2: '#94A2B3',
  text3: '#5F6D7F',
  text4: '#34414F',
  border: '#202932',
  borderHi: '#2D3945',
  accent: '#6E7F99',
  secondary: '#9AA8B8',
  teal: '#7F97A8',
  green: '#5F8F78',
  blue: '#7187B0',
  purple: '#7B769C',
  pink: '#A27A84',
  gold: '#B39A61',
  warn: '#C3964F',
  orange: '#AE7D4B',
  danger: '#A35E66',
};

export const JOURNAL_THEME_KEY = 'mfj_elite_sidebar_accent';
export const JOURNAL_THEME_CUSTOM_KEY = 'mfj_elite_custom_accent';
export const JOURNAL_THEME_CUSTOM_VALUE = 'custom';
export const DEFAULT_JOURNAL_THEME_VALUE = '#6E7F99';
export const DEFAULT_JOURNAL_CUSTOM_ACCENT = '#707D98';

export const JOURNAL_THEME_CHOICES = [
  { value: '#D4D7DD', label: 'Mono', neutral: true },
  { value: '#8F9BAC', label: 'Slate' },
  { value: '#6E7F99', label: 'Steel' },
  { value: '#667DC0', label: 'Cobalt' },
  { value: '#5F8F78', label: 'Forest' },
  { value: '#AE7D4B', label: 'Copper' },
  { value: '#B39A61', label: 'Gold' },
  { value: '#8A626A', label: 'Burgundy' },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeHexColor(value) {
  const normalized = String(value || '').trim().replace('#', '');
  if (![3, 6].includes(normalized.length) || /[^0-9A-Fa-f]/.test(normalized)) return null;

  const full = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;

  return `#${full.toUpperCase()}`;
}

function hexToRgbObject(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness * 100 };
  }

  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);

  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) + (green < blue ? 6 : 0);
  else if (max === green) hue = ((blue - red) / delta) + 2;
  else hue = ((red - green) / delta) + 4;

  return {
    h: hue * 60,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hueToRgb(first, second, hue) {
  let nextHue = hue;
  if (nextHue < 0) nextHue += 1;
  if (nextHue > 1) nextHue -= 1;
  if (nextHue < (1 / 6)) return first + ((second - first) * 6 * nextHue);
  if (nextHue < (1 / 2)) return second;
  if (nextHue < (2 / 3)) return first + ((second - first) * ((2 / 3) - nextHue) * 6);
  return first;
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }

  const second = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - (lightness * saturation);
  const first = (2 * lightness) - second;

  return {
    r: Math.round(hueToRgb(first, second, hue + (1 / 3)) * 255),
    g: Math.round(hueToRgb(first, second, hue) * 255),
    b: Math.round(hueToRgb(first, second, hue - (1 / 3)) * 255),
  };
}

function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l));
}

function rotateHue(hue, offset) {
  return ((hue + offset) % 360 + 360) % 360;
}

function toRgbTuple(hex) {
  const rgb = hexToRgbObject(hex);
  if (!rgb) return '255, 255, 255';
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

function deriveNeutralAccentFamily(color) {
  const neutral = normalizeHexColor(color) || '#D4D7DD';
  const hsl = rgbToHsl(hexToRgbObject(neutral));
  const hue = hsl.h;
  const saturation = clamp(hsl.s, 0, 10);

  return {
    accent: neutral,
    secondary: hslToHex(hue, saturation, 76),
    teal: hslToHex(hue, saturation, 65),
    blue: hslToHex(hue, saturation, 58),
    purple: hslToHex(hue, saturation, 56),
    pink: hslToHex(hue, saturation, 70),
    orange: hslToHex(hue, saturation, 52),
  };
}

function deriveAccentFamily(color, { neutral = false } = {}) {
  if (neutral) return deriveNeutralAccentFamily(color);

  const accent = normalizeHexColor(color) || DEFAULT_JOURNAL_THEME_VALUE;
  const rgb = hexToRgbObject(accent);
  if (!rgb) return deriveAccentFamily(DEFAULT_JOURNAL_THEME_VALUE);

  const { h, s, l } = rgbToHsl(rgb);
  const saturation = clamp(s, 18, 58);
  const lightness = clamp(l, 42, 62);

  return {
    accent,
    secondary: hslToHex(h, clamp(saturation - 8, 10, 40), clamp(lightness + 18, 58, 80)),
    teal: hslToHex(rotateHue(h, -8), clamp(saturation - 4, 12, 44), clamp(lightness + 8, 48, 70)),
    blue: hslToHex(rotateHue(h, -18), clamp(saturation + 2, 16, 54), clamp(lightness - 2, 38, 62)),
    purple: hslToHex(rotateHue(h, 10), clamp(saturation - 2, 14, 46), clamp(lightness + 2, 42, 66)),
    pink: hslToHex(rotateHue(h, 22), clamp(saturation - 6, 12, 42), clamp(lightness + 4, 46, 70)),
    orange: hslToHex(rotateHue(h, -30), clamp(saturation - 2, 14, 50), clamp(lightness - 4, 40, 60)),
  };
}

export function getJournalThemeChoice(value) {
  const normalized = normalizeHexColor(value);
  return JOURNAL_THEME_CHOICES.find((choice) => choice.value === normalized) || null;
}

function buildThemedAccent(choiceValue, customAccent) {
  if (choiceValue === JOURNAL_THEME_CUSTOM_VALUE) {
    return deriveAccentFamily(customAccent || DEFAULT_JOURNAL_CUSTOM_ACCENT);
  }

  const choice = getJournalThemeChoice(choiceValue);
  if (choice) {
    return deriveAccentFamily(choice.value, { neutral: choice.neutral });
  }

  return deriveAccentFamily(normalizeHexColor(choiceValue) || DEFAULT_JOURNAL_THEME_VALUE);
}

export function getJournalTheme(plan, storedValue, customAccent) {
  const normalizedPlan = String(plan || '').toLowerCase();

  if (normalizedPlan === 'elite') {
    const accentTheme = buildThemedAccent(storedValue, customAccent);
    return {
      ...BASE_THEME,
      ...accentTheme,
      choice: storedValue === JOURNAL_THEME_CUSTOM_VALUE
        ? { value: JOURNAL_THEME_CUSTOM_VALUE, label: 'Custom' }
        : (getJournalThemeChoice(storedValue) || null),
    };
  }

  if (normalizedPlan === 'pro') {
    const choice = getJournalThemeChoice(storedValue);
    return {
      ...BASE_THEME,
      ...buildThemedAccent(storedValue || DEFAULT_JOURNAL_THEME_VALUE, customAccent),
      choice,
    };
  }

  if (normalizedPlan === 'starter') {
    return {
      ...BASE_THEME,
      ...deriveAccentFamily('#7C8B9F'),
      choice: null,
    };
  }

  if (normalizedPlan === 'trial') {
    return {
      ...BASE_THEME,
      ...deriveAccentFamily('#A28666'),
      choice: null,
    };
  }

  return {
    ...BASE_THEME,
    choice: null,
  };
}

export function applyJournalTheme(theme) {
  if (typeof document === 'undefined' || !theme) return;

  const root = document.documentElement;
  const entries = {
    '--bg': theme.bg,
    '--bg-sidebar': theme.deep,
    '--bg-card': theme.card,
    '--bg-high': theme.high,
    '--bg-input': `rgba(${toRgbTuple(theme.text0)}, 0.04)`,
    '--accent': theme.accent,
    '--teal': theme.teal,
    '--green': theme.green,
    '--red': theme.danger,
    '--gold': theme.gold,
    '--t0': theme.text0,
    '--t1': theme.text1,
    '--t2': theme.text2,
    '--t3': theme.text3,
    '--t4': theme.text4,
    '--brd': theme.border,
    '--brd-hi': theme.borderHi,
    '--mf-bg': theme.bg,
    '--mf-card': theme.card,
    '--mf-high': theme.high,
    '--mf-deep': theme.deep,
    '--mf-text-0': theme.text0,
    '--mf-text-1': theme.text1,
    '--mf-text-2': theme.text2,
    '--mf-text-3': theme.text3,
    '--mf-text-4': theme.text4,
    '--mf-border': theme.border,
    '--mf-border-hi': theme.borderHi,
    '--mf-accent': theme.accent,
    '--mf-accent-secondary': theme.secondary,
    '--mf-teal': theme.teal,
    '--mf-green': theme.green,
    '--mf-blue': theme.blue,
    '--mf-purple': theme.purple,
    '--mf-pink': theme.pink,
    '--mf-gold': theme.gold,
    '--mf-warn': theme.warn,
    '--mf-orange': theme.orange,
    '--mf-danger': theme.danger,
    '--mf-bg-rgb': toRgbTuple(theme.bg),
    '--mf-card-rgb': toRgbTuple(theme.card),
    '--mf-high-rgb': toRgbTuple(theme.high),
    '--mf-deep-rgb': toRgbTuple(theme.deep),
    '--mf-text-0-rgb': toRgbTuple(theme.text0),
    '--mf-text-1-rgb': toRgbTuple(theme.text1),
    '--mf-text-2-rgb': toRgbTuple(theme.text2),
    '--mf-text-3-rgb': toRgbTuple(theme.text3),
    '--mf-text-4-rgb': toRgbTuple(theme.text4),
    '--mf-border-rgb': toRgbTuple(theme.border),
    '--mf-border-hi-rgb': toRgbTuple(theme.borderHi),
    '--mf-accent-rgb': toRgbTuple(theme.accent),
    '--mf-accent-secondary-rgb': toRgbTuple(theme.secondary),
    '--mf-teal-rgb': toRgbTuple(theme.teal),
    '--mf-green-rgb': toRgbTuple(theme.green),
    '--mf-blue-rgb': toRgbTuple(theme.blue),
    '--mf-purple-rgb': toRgbTuple(theme.purple),
    '--mf-pink-rgb': toRgbTuple(theme.pink),
    '--mf-gold-rgb': toRgbTuple(theme.gold),
    '--mf-warn-rgb': toRgbTuple(theme.warn),
    '--mf-orange-rgb': toRgbTuple(theme.orange),
    '--mf-danger-rgb': toRgbTuple(theme.danger),
    '--mf-app-filter': 'none',
  };

  Object.entries(entries).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
