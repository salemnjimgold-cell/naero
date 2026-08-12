import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, type } from '../theme';

export default function SocialAuthButton({ icon, iconComponent, title, onPress, loading, disabled, style }) {
  const isDisabled = disabled || loading;
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };
  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.primary} size="small" />
      ) : iconComponent ? (
        <View style={styles.icon}>{iconComponent}</View>
      ) : (
        <Ionicons name={icon} size={20} color={colors.text.primary} style={styles.icon} />
      )}
      <Text style={[styles.text, isDisabled && styles.textDisabled]}>{title}</Text>
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
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  icon: {
    marginRight: spacing.md,
  },
  text: {
    ...type.scale.btn,
    color: colors.text.primary,
  },
  textDisabled: {
    color: colors.text.muted,
  },
});
