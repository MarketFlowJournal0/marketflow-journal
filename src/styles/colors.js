// ============================================================
// 🎨 MARKETFLOW JOURNAL — OFFICIAL PALETTE
// Extracted from logo: deep night background + cyan/turquoise + green
// ============================================================

export const C = {

  // ── BACKGROUNDS ────────────────────────────────────────
  bgDeep:      '#0D1117',   // ultra dark background (body, sidebar)
  bgPrimary:   '#131B2E',   // main pages background
  bgCard:      '#1A2235',   // cards / panels background
  bgElevated:  '#1F2A40',   // elevated background (modals, dropdowns)
  bgHover:     '#243047',   // hover on rows/items
  bgInput:     '#0D1117',   // inputs background

  // ── MAIN ACCENTS ───────────────────────────────────────
  cyan:        '#00D4FF',   // vivid cyan — "FLOW" in the logo
  cyanDim:     '#0EA5E9',   // moderate cyan — main actions
  cyanDeep:    '#0369A1',   // deep cyan — button hover

  teal:        '#00C9A7',   // teal — middle logo gradient
  green:       '#00E676',   // vivid green — logo arrow, gains
  greenDim:    '#10B981',   // moderate green — success, Long
  greenDeep:   '#065F46',   // deep green — gain badges bg

  // ── SIGNATURE GRADIENT ─────────────────────────────────
  gradMain:    'linear-gradient(135deg, #00D4FF, #00E676)',
  gradSubtle:  'linear-gradient(135deg, #0EA5E9, #10B981)',
  gradCard:    'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,230,118,0.08))',

  // ── FUNCTIONAL STATES ──────────────────────────────────
  success:     '#00E676',   // gains / wins
  successBg:   '#003320',   // gain badge bg
  danger:      '#FF4757',   // losses
  dangerBg:    '#2D0A0F',   // loss badge bg
  warning:     '#FFB300',   // alerts
  warningBg:   '#2D1F00',   // alert badge bg

  // ── TEXTS ──────────────────────────────────────────────
  textPrimary:   '#E8EEFF',   // warm white
  textSecondary: '#8B9BB4',   // "JOURNAL" in the logo
  textMuted:     '#4A5568',   // very subtle
  textAccent:    '#00D4FF',   // cyan text

  // ── BORDERS ────────────────────────────────────────────
  border:      '#1E2D45',   // subtle border
  borderLight: '#243454',   // slightly visible border
  borderAccent:'#00D4FF33', // cyan border 20% opacity

  // ── MISC ───────────────────────────────────────────────
  shadow:      '0 4px 24px rgba(0, 212, 255, 0.08)',
  shadowCard:  '0 2px 12px rgba(0, 0, 0, 0.4)',
};

// Inline style helpers
export const S = {
  bgDeep:      { backgroundColor: C.bgDeep },
  bgPrimary:   { backgroundColor: C.bgPrimary },
  bgCard:      { backgroundColor: C.bgCard },
  bgElevated:  { backgroundColor: C.bgElevated },
  textPrimary: { color: C.textPrimary },
  textSecondary:{ color: C.textSecondary },
  textMuted:   { color: C.textMuted },
  textCyan:    { color: C.cyan },
  borderStd:   { borderColor: C.border },
  borderLight: { borderColor: C.borderLight },
  cardBase:    { backgroundColor: C.bgCard, borderColor: C.border },
};

export default C;
