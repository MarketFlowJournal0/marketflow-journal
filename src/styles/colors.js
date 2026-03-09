// ============================================================
// 🎨 MARKETFLOW JOURNAL — PALETTE OFFICIELLE
// Extraite du logo : fond nuit profond + cyan/turquoise + vert
// ============================================================

export const C = {

  // ── FONDS ────────────────────────────────────────────────
  bgDeep:      '#0D1117',   // fond ultra sombre (body, sidebar)
  bgPrimary:   '#131B2E',   // fond principal pages
  bgCard:      '#1A2235',   // fond cards / panels
  bgElevated:  '#1F2A40',   // fond élevé (modals, dropdowns)
  bgHover:     '#243047',   // hover sur lignes/items
  bgInput:     '#0D1117',   // fond inputs

  // ── ACCENTS PRINCIPAUX ────────────────────────────────────
  cyan:        '#00D4FF',   // cyan vif — "FLOW" dans le logo
  cyanDim:     '#0EA5E9',   // cyan modéré — actions principales
  cyanDeep:    '#0369A1',   // cyan profond — hover boutons

  teal:        '#00C9A7',   // teal — gradient logo milieu
  green:       '#00E676',   // vert vif — flèche logo, gains
  greenDim:    '#10B981',   // vert modéré — succès, Long
  greenDeep:   '#065F46',   // vert profond — bg badges gain

  // ── GRADIENT SIGNATURE ───────────────────────────────────
  gradMain:    'linear-gradient(135deg, #00D4FF, #00E676)',
  gradSubtle:  'linear-gradient(135deg, #0EA5E9, #10B981)',
  gradCard:    'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,230,118,0.08))',

  // ── ÉTATS FONCTIONNELS ────────────────────────────────────
  success:     '#00E676',   // gains / wins
  successBg:   '#003320',   // bg badge gain
  danger:      '#FF4757',   // pertes / losses
  dangerBg:    '#2D0A0F',   // bg badge perte
  warning:     '#FFB300',   // alertes
  warningBg:   '#2D1F00',   // bg badge alerte

  // ── TEXTES ───────────────────────────────────────────────
  textPrimary:   '#E8EEFF',   // blanc chaud
  textSecondary: '#8B9BB4',   // "JOURNAL" dans le logo
  textMuted:     '#4A5568',   // très discret
  textAccent:    '#00D4FF',   // texte cyan

  // ── BORDURES ─────────────────────────────────────────────
  border:      '#1E2D45',   // bordure subtile
  borderLight: '#243454',   // bordure légèrement visible
  borderAccent:'#00D4FF33', // bordure cyan 20% opacité

  // ── DIVERS ───────────────────────────────────────────────
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