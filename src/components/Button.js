import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';
import Text from './Text';

const variants = {
  primary: {
    bg: COLORS.primary,
    textColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  secondary: {
    bg: COLORS.primary + '12',
    textColor: COLORS.primary,
    borderColor: COLORS.primary + '25',
  },
  ghost: {
    bg: COLORS.transparent,
    textColor: COLORS.primary,
    borderColor: COLORS.transparent,
  },
  danger: {
    bg: COLORS.error,
    textColor: COLORS.white,
    borderColor: COLORS.error,
  },
};

const sizes = {
  sm: { py: SPACING.sm, px: SPACING.lg, height: 36 },
  md: { py: SPACING.md, px: SPACING.xl, height: 44 },
  lg: { py: SPACING.lg, px: SPACING.xxl, height: 52 },
};

export default function Button({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  style,
  textStyle,
  accessibilityLabel,
}) {
  const isDisabled = disabled || loading;
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.82}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.borderColor,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          height: s.height,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} size="small" />
      ) : (
        <View style={[styles.content, iconPosition === 'right' && styles.contentReverse]}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={v.textColor}
              style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
            />
          )}
          <Text
            variant={size === 'sm' ? 'smallBold' : 'bodyBold'}
            color={v.textColor === COLORS.white ? 'white' : 'brand'}
            style={textStyle}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});
