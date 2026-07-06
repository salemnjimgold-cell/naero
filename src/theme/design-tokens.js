// Naero Design System v1 — Design Tokens
// Production-ready for React Native
// Approved — do not modify without design review

export const colors = {
  brand: {
    cyan: '#06B6D4',
    purple: '#6366F1',
    amber: '#F59E0B',
  },
  bg: {
    canvas: '#0C0E1A',
    surface: '#131626',
    elevated: '#1A1D33',
    glass: 'rgba(18, 20, 33, 0.85)',
    emergency: 'rgba(220, 38, 38, 0.10)',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#5A6B80',
    link: '#06B6D4',
    inverse: '#0C0E1A',
    danger: '#EF4444',
    success: '#22C55E',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    muted: 'rgba(255, 255, 255, 0.10)',
    focus: '#06B6D4',
    danger: '#EF4444',
  },
  icon: {
    cyan: '#06B6D4',
    purple: '#6366F1',
    amber: '#F59E0B',
    violet: '#8B5CF6',
    muted: '#94A3B8',
    danger: '#EF4444',
  },
  specific: {
    emergency: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  full: 9999,
};

export const type = {
  family: {
    ios: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    android: '"Inter", Roboto, "Noto Sans", sans-serif',
  },
  scale: {
    h1: { fontSize: 22, fontWeight: '700', lineHeight: 26, letterSpacing: -0.5 },
    bodyLg: { fontSize: 17, fontWeight: '500', lineHeight: 22, letterSpacing: 0 },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 20, letterSpacing: 0 },
    caption: { fontSize: 13, fontWeight: '500', lineHeight: 16, letterSpacing: 0 },
    label: { fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 1 },
    btn: { fontSize: 15, fontWeight: '600', lineHeight: 20, letterSpacing: 0 },
    input: { fontSize: 16, fontWeight: '500', lineHeight: 20, letterSpacing: 0 },
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 48,
    elevation: 16,
  },
  glow: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
  amber: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 0,
  },
};

export const motion = {
  duration: {
    instant: 50,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 800,
  },
  spring: {
    gentle: { damping: 12, stiffness: 100, mass: 1 },
    snappy: { damping: 15, stiffness: 200, mass: 1 },
  },
};

export const layout = {
  marginH: 20,
  marginV: 16,
  topSafe: 60,
  bottomSafe: 34,
  maxWidth: 428,
};

export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
};
