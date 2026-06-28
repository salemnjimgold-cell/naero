import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export function GlassCard({ children, style, glow = false, onPress }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      style={[
        styles.card,
        glow && styles.glow,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
}

export function GlassCardDark({ children, style, glow = false }) {
  return (
    <View style={[styles.card, styles.dark, glow && styles.glow, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.large,
  },
  dark: {
    backgroundColor: COLORS.surfaceLight,
  },
  glow: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
});
