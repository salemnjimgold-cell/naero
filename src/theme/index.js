// ═══════════════════════════════════════════════════════════════════════════════
// Naero Design System — "Deep Sea"
// Frozen palette. No further exploration.
// Blue is brand. Green is success only.
// Calm · Premium · Timeless · Trustworthy · Elegant
// ═══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────── DEPTH ───────────────────────────────────────
// Deep ocean darkness. Not black. Not cold. Vast and calm.

export const DEPTH = {
  canvas:   '#08111F',  // deep ocean floor
  surface:  '#101A2C',  // dark water
  elevated: '#18253D',  // rising current
  overlay:  'rgba(0,0,0,0.70)',
};

// ──────────────────────────────── ACCENT ──────────────────────────────────────
// Blue — the compass needle. The brand. The guide.

export const ACCENT = {
  primary:  '#3B82F6',  // sapphire blue — primary brand
  soft:     'rgba(59,130,246,0.10)',
  border:   'rgba(59,130,246,0.20)',
  glow:     'rgba(59,130,246,0.08)',
  dark:     '#2563EB',  // deeper blue
  light:    '#60A5FA',  // secondary accent — lighter blue
};

// ──────────────────────────────── WARM ────────────────────────────────────────
// Muted gold — progress, saved items, achievements.
// Subtle. Not competing with blue.

export const WARM = {
  primary:  '#94A3B8',  // muted — neutral warmth
  soft:     'rgba(148,163,184,0.08)',
  border:   'rgba(148,163,184,0.15)',
};

// ──────────────────────────────── TEXT ────────────────────────────────────────
// Cool, clean, readable. Not warm cream. Premium slate.

export const TEXT = {
  primary:   '#F8FAFC',  // near-white — clean, premium
  secondary: '#CBD5E1',  // cool gray — supporting text
  tertiary:  '#94A3B8',  // muted gray — labels, hints
  muted:     '#475569',  // barely there — disabled
  link:      '#3B82F6',  // blue — interactive
  inverse:   '#08111F',  // canvas — for text on light backgrounds
  danger:    '#EF4444',  // red — error only
  success:   '#22C55E',  // green — success only
  warning:   '#F59E0B',  // amber — warning only
};

// ──────────────────────────────── BORDER ──────────────────────────────────────
// Cool white. Structural. Not decorative.

export const BORDER = {
  subtle:  'rgba(248,250,252,0.06)',  // cards, dividers
  default: 'rgba(248,250,252,0.10)',  // inputs, active
  strong:  'rgba(248,250,252,0.15)',  // sections
  ghost:   'rgba(248,250,252,0.04)',  // button/input backgrounds
  focus:   '#3B82F6',                 // focus ring
  danger:  '#EF4444',                 // error border
};

// ──────────────────────────────── STATUS ──────────────────────────────────────
// Green = success only. Red = error only. Amber = warning only.

export const STATUS = {
  success: '#22C55E',  // green — completed, verified, active
  warning: '#F59E0B',  // amber — caution
  error:   '#EF4444',  // red — error, destructive
  info:    '#3B82F6',  // blue — informational (same as accent)
};

// ═══════════════════════════════════════════════════════════════════════════════
// Modern Token Map — backward-compatible flat exports
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Depths
  bg:            DEPTH.canvas,
  bgLight:       '#0A1525',
  surface:       'rgba(16,26,44,0.6)',
  surfaceLight:  'rgba(16,26,44,0.85)',
  card:          DEPTH.surface,
  cardBorder:    BORDER.subtle,
  cardBorderHover: BORDER.default,
  ghost:         BORDER.ghost,

  // Accent — blue is the sole primary
  primary:       ACCENT.primary,
  primaryLight:  ACCENT.light,
  primaryDark:   ACCENT.dark,
  secondary:     ACCENT.light,
  secondaryDark: ACCENT.primary,
  accent:        ACCENT.primary,

  // Text
  textPrimary:   TEXT.primary,
  textSecondary: TEXT.secondary,
  textTertiary:  TEXT.tertiary,
  textMuted:     TEXT.muted,

  // Status
  error:   STATUS.error,
  warning:  STATUS.warning,
  success:  STATUS.success,
  info:     STATUS.info,

  // Accent aliases (used by Profile, Settings, Notifications)
  purple:   ACCENT.light,   // lighter blue alias for "purple" references

  // Utility
  overlay:     DEPTH.overlay,
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
};

// ────────────────────────────── GRADIENTS ─────────────────────────────────────
// Blue-primary. One gradient per screen maximum.

export const GRADIENTS = {
  primary:      ['#3B82F6', '#2563EB'],
  primaryReverse: ['#2563EB', '#3B82F6'],
  blue:         ['#3B82F6', '#60A5FA'],
  warm:         ['#94A3B8', '#64748B'],
  glow:         ['rgba(59,130,246,0.12)', 'rgba(59,130,246,0)'],
  glass:        ['rgba(248,250,252,0.04)', 'rgba(248,250,252,0.01)'],
  glassHover:   ['rgba(248,250,252,0.08)', 'rgba(248,250,252,0.02)'],
  dark:         [DEPTH.canvas, '#0A1525', '#06101C'],
};

// ──────────────────────────────── TYPOGRAPHY ──────────────────────────────────

export const FONTS = {
  h0:         { fontSize: 42, fontWeight: '800', lineHeight: 48, letterSpacing: -1.5 },
  h1:         { fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -1 },
  h2:         { fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: -0.5 },
  h3:         { fontSize: 20, fontWeight: '600', lineHeight: 26, letterSpacing: -0.3 },
  body:       { fontSize: 15, fontWeight: '400', lineHeight: 23, letterSpacing: 0.1 },
  bodyBold:   { fontSize: 15, fontWeight: '600', lineHeight: 23, letterSpacing: 0.1 },
  subtitle:   { fontSize: 16, fontWeight: '500', lineHeight: 22, letterSpacing: 0 },
  caption:    { fontSize: 13, fontWeight: '500', lineHeight: 18, letterSpacing: 0.2 },
  captionBold:{ fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0.2 },
  small:      { fontSize: 11, fontWeight: '500', lineHeight: 14, letterSpacing: 0.3 },
  smallBold:  { fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.3 },
  tab:        { fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.3 },
};

// ──────────────────────────────── SPACING ─────────────────────────────────────

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

// ──────────────────────────────── RADIUS ──────────────────────────────────────

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  full: 9999,
};

// ──────────────────────────────── SHADOWS ─────────────────────────────────────
// Minimal. Depth from borders, not shadows.

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: ACCENT.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glowStrong: {
    shadowColor: ACCENT.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ──────────────────────────────── MOTION ──────────────────────────────────────
// Every animation improves understanding. No decorative motion.

export const MOTION = {
  duration: {
    instant:  50,
    fast:     100,
    normal:   200,
    slow:     300,
    slower:   500,
    slowest:  800,
  },
  spring: {
    standard: { damping: 15, stiffness: 200, mass: 1 },
    gentle:   { damping: 18, stiffness: 120, mass: 1 },
    snappy:   { damping: 20, stiffness: 300, mass: 1 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Compat Tokens — backward compatibility for early screens
// ═══════════════════════════════════════════════════════════════════════════════

export const colors = {
  brand: {
    cyan:   ACCENT.primary,
    purple: ACCENT.light,
    amber:  WARM.primary,
  },
  bg: {
    canvas:    DEPTH.canvas,
    surface:   DEPTH.surface,
    elevated:  DEPTH.elevated,
    glass:     'rgba(16,26,44,0.85)',
    emergency: 'rgba(239,68,68,0.10)',
  },
  text: {
    primary:   TEXT.primary,
    secondary: TEXT.secondary,
    muted:     TEXT.muted,
    link:      TEXT.link,
    inverse:   TEXT.inverse,
    danger:    TEXT.danger,
    success:   TEXT.success,
  },
  border: {
    subtle: BORDER.subtle,
    muted:  BORDER.default,
    ghost:  BORDER.ghost,
    focus:  BORDER.focus,
    danger: BORDER.danger,
  },
  icon: {
    cyan:   ACCENT.primary,
    purple: ACCENT.light,
    amber:  WARM.primary,
    violet: ACCENT.light,
    muted:  TEXT.secondary,
    danger: TEXT.danger,
  },
  specific: {
    emergency: STATUS.error,
    success:   STATUS.success,
    warning:   STATUS.warning,
    info:      STATUS.info,
  },
};

export const spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const radii = {
  none: 0,
  sm:   8,
  md:   12,
  lg:   14,
  xl:   16,
  full: 9999,
};

export const type = {
  family: {
    ios:     '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    android: '"Inter", Roboto, "Noto Sans", sans-serif',
  },
  scale: {
    h1:      FONTS.h3,
    bodyLg:  { fontSize: 17, fontWeight: '500', lineHeight: 22, letterSpacing: 0 },
    body:    { fontSize: 15, fontWeight: '400', lineHeight: 23, letterSpacing: 0.1 },
    caption: { fontSize: 13, fontWeight: '500', lineHeight: 18, letterSpacing: 0.2 },
    label:   { fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.3 },
    btn:     { fontSize: 15, fontWeight: '600', lineHeight: 20, letterSpacing: 0 },
    input:   { fontSize: 16, fontWeight: '500', lineHeight: 20, letterSpacing: 0 },
  },
};

export const motion = MOTION;

export const shadows = {
  card:     SHADOWS.small,
  elevated: SHADOWS.medium,
  modal:    SHADOWS.large,
  glow:     SHADOWS.glow,
};

export const layout = {
  marginH:   20,
  marginV:   16,
  topSafe:   60,
  bottomSafe: 34,
  maxWidth:  428,
};

export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Unified theme object — for new components
// ═══════════════════════════════════════════════════════════════════════════════

export const theme = {
  depth:     DEPTH,
  accent:    ACCENT,
  warm:      WARM,
  text:      TEXT,
  border:    BORDER,
  status:    STATUS,
  colors:    COLORS,
  gradients: GRADIENTS,
  fonts:     FONTS,
  spacing:   SPACING,
  radius:    RADIUS,
  shadows:   SHADOWS,
  motion:    MOTION,
  layout,
  hitSlop,
};

// Contextual Compass semantic foundations. Existing exports above remain as a
// transitional Deep Sea compatibility layer until their consumers migrate.
const contextualFoundations = require('./foundations');
export const semanticThemes = contextualFoundations.THEMES;
export const semanticTypography = contextualFoundations.TYPOGRAPHY;
export const semanticSpacing = contextualFoundations.SPACING_SCALE;
export const semanticRadius = contextualFoundations.RADIUS_SCALE;
export const semanticBorders = contextualFoundations.BORDER_WIDTHS;
export const semanticElevation = contextualFoundations.ELEVATION;
export const touchTargets = contextualFoundations.TOUCH_TARGETS;
export const iconSizes = contextualFoundations.ICON_SIZES;
export const semanticMotion = contextualFoundations.MOTION_TOKENS;
