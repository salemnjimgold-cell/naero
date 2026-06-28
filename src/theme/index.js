export const COLORS = {
  bg: '#070B14',
  bgLight: '#0A0F1E',
  surface: 'rgba(15,23,42,0.6)',
  surfaceLight: 'rgba(15,23,42,0.85)',
  card: '#0F172A',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderHover: 'rgba(255,255,255,0.15)',

  primary: '#06B6D4',
  primaryLight: '#22D3EE',
  primaryDark: '#0891B2',
  secondary: '#10B981',
  secondaryDark: '#059669',
  accent: '#3B82F6',
  purple: '#6366F1',
  eyeGlow: '#00E5FF',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textMuted: '#475569',

  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',

  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const GRADIENTS = {
  primary: ['#06B6D4', '#10B981'],
  primaryReverse: ['#10B981', '#06B6D4'],
  logo: ['#00E5FF', '#6366F1'],
  glass: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'],
  glassHover: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
  dark: ['#070B14', '#0A1222', '#04070D'],
  glow: ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0)'],
};

export const FONTS = {
  h0: { fontSize: 42, fontWeight: '800', lineHeight: 48, letterSpacing: -1.5 },
  h1: { fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -1 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 30, letterSpacing: -0.5 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  smallBold: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  tab: { fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.3 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glowStrong: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
};
