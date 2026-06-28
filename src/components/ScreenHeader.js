import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../theme';

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  rightIcon,
  onRightPress,
  style,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.md }, style]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.rightBtn}>
            <Ionicons name={rightIcon} size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : rightAction || (
          <View style={styles.rightBtn} />
        )}
      </View>
    </View>
  );
}

export function HomeHeader({ title, subtitle, onProfilePress, style }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }, style]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>👋</Text>
          <Text style={styles.homeTitle}>{title}</Text>
          {subtitle && <Text style={styles.homeSubtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={onProfilePress} style={styles.profileBtn}>
          <Ionicons name="person" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    marginBottom: 4,
  },
  homeTitle: {
    ...FONTS.h0,
    color: COLORS.textPrimary,
  },
  homeSubtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
