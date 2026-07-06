import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, type } from '../theme/design-tokens';

export default function SocialAuthButton({ icon, title, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Ionicons name={icon} size={20} color={colors.text.primary} style={styles.icon} />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing['2xl'],
  },
  icon: {
    marginRight: spacing.md,
  },
  text: {
    ...type.scale.btn,
    color: colors.text.primary,
  },
});
