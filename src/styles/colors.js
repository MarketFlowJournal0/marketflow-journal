// ============================================================
// 🎨 MARKETFLOW JOURNAL — OFFICIAL PALETTE
// Extracted from logo: deep night background + cyan/turquoise + green
// ============================================================

export const C = {

  // ── BACKGROUNDS ────────────────────────────────────────
  bgDeep:      '#01040A',   // landing baseline background
  bgPrimary:   '#040B13',   // main pages background
  bgCard:      '#060D18',   // cards / panels background
  bgElevated:  '#0B1525',   // elevated background (modals, dropdowns)
  bgHover:     '#101D30',   // hover on rows/items
  bgInput:     'rgba(255,255,255,0.025)',   // inputs background

  // ── MAIN ACCENTS ───────────────────────────────────────
  cyan:        '#14C9E5',   // metallic cyan from the landing DA
  cyanDim:     '#1DC9FF',   // moderate cyan
  cyanDeep:    '#0B7EA0',   // deep cyan hover

  teal:        '#00D2B8',   // teal from the MF mark
  green:       '#00D2B8',   // gains/success within the current DA
  greenDim:    '#0BAE9E',   // moderate teal
  greenDeep:   '#064E48',   // deep gain badges bg

  // ── SIGNATURE GRADIENT ─────────────────────────────────
  gradMain:    'linear-gradient(135deg, #DCE4EF, #14C9E5 46%, #00D2B8)',
  gradSubtle:  'linear-gradient(135deg, #14C9E5, #00D2B8)',
  gradCard:    'linear-gradient(145deg, rgba(13,23,38,0.68), rgba(4,9,18,0.82))',

  // ── FUNCTIONAL STATES ──────────────────────────────────
  success:     '#00D2B8',   // gains / wins
  successBg:   '#032F2C',   // gain badge bg
  danger:      '#FF4757',   // losses
  dangerBg:    '#2D0A0F',   // loss badge bg
  warning:     '#D7B36A',   // alerts
  warningBg:   '#2D1F00',   // alert badge bg

  // ── TEXTS ──────────────────────────────────────────────
  textPrimary:   '#DCE7F2',   // warm white
  textSecondary: '#8EA0B8',   // secondary copy
  textMuted:     '#46566E',   // very subtle
  textAccent:    '#14C9E5',   // cyan text

  // ── BORDERS ────────────────────────────────────────────
  border:      '#142033',   // subtle border
  borderLight: '#1F2F47',   // slightly visible border
  borderAccent:'#14C9E533', // cyan border 20% opacity

  // ── MISC ───────────────────────────────────────────────
  shadow:      '0 18px 58px rgba(0, 0, 0, 0.30)',
  shadowCard:  '0 28px 80px rgba(0, 0, 0, 0.44)',
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
