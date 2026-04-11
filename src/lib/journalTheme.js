const BASE_THEME = {
  bg: '#030508',
  card: '#0C1422',
  high: '#111B2E',
  deep: '#07090F',
  text0: '#FFFFFF',
  text1: '#E8EEFF',
  text2: '#7A90B8',
  text3: '#334566',
  text4: '#1E2E45',
  border: '#162034',
  borderHi: '#1E2E48',
  accent: '#06E6FF',
  secondary: '#00FF88',
  teal: '#00F5D4',
  green: '#00FF88',
  blue: '#4D7CFF',
  purple: '#A78BFA',
  pink: '#FB7185',
  gold: '#FFD700',
  warn: '#FFB31A',
  orange: '#FF6B35',
  danger: '#FF3D57',
};

export const JOURNAL_THEME_KEY = 'mfj_elite_sidebar_accent';

export const JOURNAL_THEME_CHOICES = [
  { value: '#F5F7FA', secondary: '#9AA4B2', label: 'Mono' },
  { value: '#FFD700', secondary: '#FF9A3C', label: 'Gold' },
  { value: '#06E6FF', secondary: '#00FF88', label: 'Aqua' },
  { value: '#00FF88', secondary: '#7CFFB2', label: 'Emerald' },
  { value: '#A78BFA', secondary: '#6EE7FF', label: 'Iris' },
  { value: '#FB7185', secondary: '#FDBA74', label: 'Rose' },
  { value: '#F97316', secondary: '#FACC15', label: 'Amber' },
];

const THEME_OVERRIDES = {
  '#F5F7FA': {
    accent: '#F5F7FA',
    secondary: '#9AA4B2',
    teal: '#E5E7EB',
    green: '#F5F7FA',
    blue: '#CBD5E1',
    purple: '#A1A1AA',
    pink: '#E4E4E7',
    gold: '#FFFFFF',
    warn: '#D4D4D8',
    orange: '#A1A1AA',
    danger: '#737373',
  },
  '#FFD700': {
    accent: '#FFD700',
    secondary: '#FF9A3C',
    teal: '#FFE066',
    green: '#FCD34D',
    blue: '#F59E0B',
    purple: '#FDBA74',
    pink: '#F97316',
    gold: '#FFF3B0',
    warn: '#FBBF24',
    orange: '#FB923C',
    danger: '#F87171',
  },
  '#06E6FF': {
    accent: '#06E6FF',
    secondary: '#00FF88',
    teal: '#00F5D4',
    green: '#00FF88',
    blue: '#4D7CFF',
    purple: '#A78BFA',
    pink: '#FB7185',
    gold: '#FFD700',
    warn: '#FFB31A',
    orange: '#FF6B35',
    danger: '#FF3D57',
  },
  '#00FF88': {
    accent: '#00FF88',
    secondary: '#7CFFB2',
    teal: '#5AF7D3',
    green: '#00FF88',
    blue: '#22C55E',
    purple: '#86EFAC',
    pink: '#A7F3D0',
    gold: '#D9F99D',
    warn: '#84CC16',
    orange: '#65A30D',
    danger: '#EF4444',
  },
  '#A78BFA': {
    accent: '#A78BFA',
    secondary: '#6EE7FF',
    teal: '#7DD3FC',
    green: '#C4B5FD',
    blue: '#60A5FA',
    purple: '#A78BFA',
    pink: '#F9A8D4',
    gold: '#FDE68A',
    warn: '#FDBA74',
    orange: '#FB7185',
    danger: '#F43F5E',
  },
  '#FB7185': {
    accent: '#FB7185',
    secondary: '#FDBA74',
    teal: '#FDA4AF',
    green: '#FDBA74',
    blue: '#F9A8D4',
    purple: '#F472B6',
    pink: '#FB7185',
    gold: '#FDE68A',
    warn: '#FDBA74',
    orange: '#FB923C',
    danger: '#EF4444',
  },
  '#F97316': {
    accent: '#F97316',
    secondary: '#FACC15',
    teal: '#FDBA74',
    green: '#FACC15',
    blue: '#FB923C',
    purple: '#FDBA74',
    pink: '#FCA5A5',
    gold: '#FDE68A',
    warn: '#F59E0B',
    orange: '#F97316',
    danger: '#EF4444',
  },
};

function toRgbTuple(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function isMonoTheme(theme) {
  return theme?.choice?.value === '#F5F7FA';
}

export function getJournalTheme(plan, storedValue) {
  if (plan === 'elite') {
    const choice = JOURNAL_THEME_CHOICES.find((item) => item.value === storedValue) || JOURNAL_THEME_CHOICES[2];
    return {
      ...BASE_THEME,
      ...THEME_OVERRIDES[choice.value],
      choice,
    };
  }

  if (plan === 'starter') {
    return {
      ...BASE_THEME,
      accent: '#00F5D4',
      secondary: '#06E6FF',
      teal: '#00F5D4',
      green: '#00FF88',
      choice: null,
    };
  }

  if (plan === 'trial') {
    return {
      ...BASE_THEME,
      accent: '#FB923C',
      secondary: '#FFD166',
      teal: '#FDBA74',
      green: '#FDE68A',
      blue: '#F59E0B',
      purple: '#FDBA74',
      pink: '#FCA5A5',
      gold: '#FFE082',
      warn: '#F59E0B',
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
    '--mf-app-filter': isMonoTheme(theme) ? 'grayscale(1) saturate(0.08) contrast(1.03)' : 'none',
  };

  Object.entries(entries).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.setAttribute('data-journal-tone', isMonoTheme(theme) ? 'mono' : 'default');
}
