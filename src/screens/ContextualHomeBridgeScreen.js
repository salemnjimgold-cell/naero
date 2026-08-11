import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ACCENT, BORDER, DEPTH, FONTS, RADIUS, SPACING, TEXT } from '../theme';
import { useApp } from '../context/AppContext';

export default function ContextualHomeBridgeScreen() {
  const { t } = useTranslation();
  const { onboardingContext } = useApp();
  const insets = useSafeAreaInsets();
  const tx = (key) => t(`compass3c.home.${key}`);
  const place = onboardingContext?.municipality ? `${onboardingContext.municipality}, ${onboardingContext.country}` : tx('unknown');
  return <View style={[styles.screen, { paddingTop: insets.top + SPACING.huge }]}><Text accessibilityRole="header" style={styles.title}>{tx('title')}</Text><Text style={styles.welcome}>{tx('welcome')}</Text><View style={styles.card}><Text style={styles.label}>{tx('context')}</Text><Text style={styles.place}>{place}</Text>{onboardingContext?.region ? <Text style={styles.region}>{onboardingContext.region}</Text> : null}</View><Text style={styles.note}>{tx('note')}</Text></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: DEPTH.canvas, paddingHorizontal: SPACING.xl }, title: { ...FONTS.h1, color: TEXT.primary }, welcome: { ...FONTS.body, color: TEXT.secondary, marginTop: SPACING.sm, marginBottom: SPACING.xxl }, card: { borderWidth: 1, borderColor: BORDER.subtle, backgroundColor: DEPTH.surface, borderRadius: RADIUS.lg, padding: SPACING.xl }, label: { ...FONTS.captionBold, color: ACCENT.light, marginBottom: SPACING.sm }, place: { ...FONTS.h2, color: TEXT.primary }, region: { ...FONTS.body, color: TEXT.secondary, marginTop: SPACING.xs }, note: { ...FONTS.body, color: TEXT.tertiary, marginTop: SPACING.xxl } });
