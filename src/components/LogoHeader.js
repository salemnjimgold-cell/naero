import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');

export function LogoHeader({ title, subtitle, onProfilePress, style }) {
  const insets = useSafeAreaInsets();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }, style]}>
      <Animated.View style={[styles.glowBg, { opacity: glowOpacity }]} />
      <View style={styles.row}>
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.greeting}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={onProfilePress} style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ScreenLogoHeader({ title, subtitle, onBack, style }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.subContainer, { paddingTop: insets.top + SPACING.md }, style]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : <View style={styles.backBtn} />}
        <View style={styles.logoIconSm}>
          <Image source={LOGO} style={styles.logoImgSm} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subTitle} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subSubtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  subContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  glowBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginRight: SPACING.md,
  },
  logoImg: {
    width: 40,
    height: 40,
  },
  titleSection: {
    flex: 1,
  },
  greeting: {
    ...FONTS.h0,
    color: COLORS.textPrimary,
    fontSize: 26,
  },
  subtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  logoIconSm: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  logoImgSm: {
    width: 32,
    height: 32,
  },
  subTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  subSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});
