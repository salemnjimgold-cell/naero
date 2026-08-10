import React from 'react';
import { Text as RNText, StyleSheet, I18nManager } from 'react-native';
import { FONTS, COLORS } from '../theme';

const variantMap = {
  display: FONTS.h0,
  h1: FONTS.h1,
  h2: FONTS.h2,
  h3: FONTS.h3,
  body: FONTS.body,
  bodyBold: FONTS.bodyBold,
  caption: FONTS.caption,
  captionBold: FONTS.captionBold,
  small: FONTS.small,
  smallBold: FONTS.smallBold,
  tab: FONTS.tab,
};

const colorMap = {
  primary: COLORS.textPrimary,
  secondary: COLORS.textSecondary,
  tertiary: COLORS.textTertiary,
  muted: COLORS.textMuted,
  brand: COLORS.primary,
  error: COLORS.error,
  warning: COLORS.warning,
  success: COLORS.success,
  white: COLORS.white,
};

export default function Text({
  variant = 'body',
  color = 'primary',
  style,
  align,
  numberOfLines,
  accessibilityLabel,
  accessibilityRole,
  children,
}) {
  const fontStyle = variantMap[variant] || FONTS.body;
  const colorStyle = colorMap[color] || color || COLORS.textPrimary;

  return (
    <RNText
      style={[
        fontStyle,
        { color: colorStyle },
        align === 'center' && { textAlign: 'center' },
        align === 'right' && { textAlign: 'right' },
        style,
      ]}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </RNText>
  );
}
