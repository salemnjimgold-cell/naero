import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeModeContext';

export function Skeleton({ width = '100%', height = 16, radius, style }) {
  const { theme } = useThemeMode();
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no" style={[{ width, height, borderRadius: radius ?? theme.radius.control, backgroundColor: theme.colors.border.subtle }, style]} />;
}

export function CardSkeleton({ lines = 3, style }) {
  const { theme } = useThemeMode();
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.card, { backgroundColor: theme.colors.background.surface, borderColor: theme.colors.border.subtle, borderRadius: theme.radius.card }, style]}><Skeleton width="55%" height={20} />{Array.from({ length: lines }, (_, i) => <Skeleton key={i} width={i === lines - 1 ? '72%' : '100%'} />)}</View>;
}

export function SectionSkeleton({ cards = 2, style }) { const { t } = useTranslation(); return <View accessible accessibilityRole="progressbar" accessibilityLabel={t('common.loading')} style={[styles.section, style]}>{Array.from({ length: cards }, (_, i) => <CardSkeleton key={i} />)}</View>; }
const styles = StyleSheet.create({ card: { borderWidth: 1, padding: 16, gap: 12 }, section: { gap: 12 } });
