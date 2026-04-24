const BASE_THEME = {
  bg: '#01040A',
  card: '#060D18',
  high: '#0B1525',
  deep: '#02050B',
  text0: '#F7FAFC',
  text1: '#DCE7F2',
  text2: '#8EA0B8',
  text3: '#46566E',
  text4: '#26364C',
  border: '#142033',
  borderHi: '#1F2F47',
  accent: '#14C9E5',
  secondary: '#DCE4EF',
  teal: '#00D2B8',
  green: '#00D2B8',
  blue: '#1DC9FF',
  purple: '#6885FF',
  pink: '#DF5F7A',
  gold: '#D7B36A',
  warn: '#FFB31A',
  orange: '#FF8B3D',
  danger: '#FF3D57',
};

export const JOURNAL_THEME_KEY = 'mfj_elite_sidebar_accent';
export const JOURNAL_THEME_CUSTOM_KEY = 'mfj_elite_custom_accent';
export const JOURNAL_THEME_CUSTOM_VALUE = 'custom';
export const DEFAULT_JOURNAL_THEME_VALUE = '#14C9E5';
export const DEFAULT_JOURNAL_CUSTOM_ACCENT = '#4C4CDD';

export const JOURNAL_THEME_CHOICES = [
  { value: '#D7DBE4', label: 'Mono', neutral: true },
  { value: '#14C9E5', label: 'Aqua' },
  { value: '#00D2B8', label: 'Teal' },
  { value: '#4D7CFF', label: 'Cobalt' },
  { value: '#8B5CF6', label: 'Iris' },
  { value: '#FB7185', label: 'Rose' },
  { value: '#FF7A59', label: 'Coral' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#D7B36A', label: 'Gold' },
  { value: '#EF4444', label: 'Crimson' },
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

function deriveNeutralAccentFamily(color) {
  const neutral = normalizeHexColor(color) || '#D7DBE4';
  const hsl = rgbToHsl(hexToRgbObject(neutral));
  const hue = hsl.h;
  const saturation = clamp(hsl.s, 0, 12);

  return {
    accent: neutral,
    secondary: hslToHex(hue, saturation, 78),
    teal: hslToHex(hue, saturation, 74),
    blue: hslToHex(hue, saturation, 69),
    purple: hslToHex(hue, saturation, 72),
    pink: hslToHex(hue, saturation, 80),
    orange: hslToHex(hue, saturation, 67),
  };
}

function deriveAccentFamily(color, { neutral = false } = {}) {
  if (neutral) return deriveNeutralAccentFamily(color);

  const accent = normalizeHexColor(color) || DEFAULT_JOURNAL_THEME_VALUE;
  const rgb = hexToRgbObject(accent);
  if (!rgb) return deriveAccentFamily(DEFAULT_JOURNAL_THEME_VALUE);

  const { h, s, l } = rgbToHsl(rgb);
  const saturation = clamp(s < 28 ? s + 28 : s, 26, 96);
  const lightness = clamp(l, 36, 68);

  return {
    accent,
    secondary: hslToHex(h, clamp(saturation + 4, 24, 98), clamp(lightness + 14, 48, 82)),
    teal: hslToHex(rotateHue(h, -8), clamp(saturation + 6, 28, 98), clamp(lightness + 8, 44, 78)),
    blue: hslToHex(rotateHue(h, -18), clamp(saturation + 8, 28, 100), clamp(lightness - 2, 34, 70)),
    purple: hslToHex(rotateHue(h, 14), clamp(saturation + 2, 24, 98), clamp(lightness + 9, 42, 78)),
    pink: hslToHex(rotateHue(h, 24), clamp(saturation - 4, 20, 90), clamp(lightness + 13, 48, 84)),
    orange: hslToHex(rotateHue(h, -26), clamp(saturation + 8, 30, 100), clamp(lightness + 10, 46, 80)),
  };
}

function toRgbTuple(hex) {
  const rgb = hexToRgbObject(hex);
  if (!rgb) return '255, 255, 255';
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export function getJournalThemeChoice(value) {
  const normalized = normalizeHexColor(value);
  return JOURNAL_THEME_CHOICES.find((choice) => choice.value === normalized) || null;
}

function buildThemedAccent(choiceValue, customAccent) {
  if (choiceValue === JOURNAL_THEME_CUSTOM_VALUE) {
    return deriveAccentFamily(customAccent || DEFAULT_JOURNAL_CUSTOM_ACCENT);
  }

  const choice = getJournalThemeChoice(choiceValue) || getJournalThemeChoice(DEFAULT_JOURNAL_THEME_VALUE);
  return deriveAccentFamily(choice?.value, { neutral: choice?.neutral });
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
        : (getJournalThemeChoice(storedValue) || getJournalThemeChoice(DEFAULT_JOURNAL_THEME_VALUE)),
    };
  }

  if (normalizedPlan === 'pro') {
    const choice = getJournalThemeChoice(storedValue) || getJournalThemeChoice(DEFAULT_JOURNAL_THEME_VALUE);
    return {
      ...BASE_THEME,
      ...deriveAccentFamily(choice?.value, { neutral: choice?.neutral }),
      choice,
    };
  }

  if (normalizedPlan === 'starter') {
    return {
      ...BASE_THEME,
      accent: '#14C9E5',
      secondary: '#DCE4EF',
      teal: '#00D2B8',
      blue: '#1DC9FF',
      purple: '#6885FF',
      pink: '#7FBFCE',
      orange: '#5ACEC6',
      choice: null,
    };
  }

  if (normalizedPlan === 'trial') {
    return {
      ...BASE_THEME,
      accent: '#FB923C',
      secondary: '#FDBA74',
      teal: '#FDB27A',
      blue: '#F59E0B',
      purple: '#F8B86A',
      pink: '#FFD2A3',
      orange: '#FB923C',
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

  root.setAttribute('data-journal-tone', 'subtle');
}
