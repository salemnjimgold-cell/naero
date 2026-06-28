import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

export function PrimaryButton({ title, onPress, icon, style, textStyle, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[styles.btnWrap, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBtn}
      >
        {icon && <Ionicons name={icon} size={20} color={COLORS.white} style={styles.btnIcon} />}
        <Text style={[styles.btnText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, icon, style, textStyle }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryBtn, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Ionicons name={icon} size={20} color={COLORS.textPrimary} style={styles.btnIcon} />}
      <Text style={[styles.secondaryText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({ title, onPress, icon, style, textStyle }) {
  return (
    <TouchableOpacity
      style={[styles.ghostBtn, style]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {icon && <Ionicons name={icon} size={18} color={COLORS.primary} style={styles.btnIcon} />}
      <Text style={[styles.ghostText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function IconButton({ icon, onPress, color = COLORS.primary, size = 24, style }) {
  return (
    <TouchableOpacity
      style={[styles.iconBtn, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnWrap: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  disabled: {
    opacity: 0.5,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  btnText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
  btnIcon: {
    marginRight: SPACING.sm,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  secondaryText: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  ghostText: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
