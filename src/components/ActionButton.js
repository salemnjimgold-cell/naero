import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radii, type, shadows } from '../theme/design-tokens';

export default function ActionButton({ title, onPress, loading, disabled, style, textStyle }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} size="small" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.brand.amber,
    borderRadius: radii.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    ...shadows.amber,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...type.scale.btn,
    color: colors.text.inverse,
  },
});
