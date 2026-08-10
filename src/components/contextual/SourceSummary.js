import React from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeModeContext';
import { formatProvenanceDate } from '../../domain/provenance';
import Text from '../Text';
import TrustBadge from './TrustBadge';
import FreshnessLabel from './FreshnessLabel';
import JurisdictionLabel from './JurisdictionLabel';

export default function SourceSummary({ provenance, locale = 'en', onPress, compact = true, style }) {
  const { t } = useTranslation(); const { theme } = useThemeMode(); if (!provenance?.trustClass) return null;
  const publisher = provenance.authority || provenance.publisher;
  const relevantDate = provenance.verifiedAt || provenance.updatedAt || provenance.retrievedAt || null;
  const formattedDate = formatProvenanceDate(relevantDate, locale);
  const content = <View style={styles.content}><View style={[styles.top, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}><TrustBadge trustClass={provenance.trustClass} variant="compact" />{publisher ? <Text variant="caption" numberOfLines={compact ? 2 : undefined} style={{ color: theme.colors.text.secondary, flex: 1 }}>{publisher}</Text> : null}</View>{!compact && <JurisdictionLabel jurisdiction={provenance.jurisdiction} />}<FreshnessLabel freshness={provenance.freshness} dateLabel={formattedDate} compact /></View>;
  if (!onPress) return <View style={[styles.base, { borderColor: theme.colors.border.subtle }, style]}>{content}</View>;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t('contextual.a11y.openSourceDetails')} style={({ pressed }) => [styles.base, styles.interactive, { borderColor: pressed ? theme.colors.border.focus : theme.colors.border.subtle, minHeight: theme.touchTargets.minimum }, style]}>{content}</Pressable>;
}
const styles = StyleSheet.create({ base: { borderTopWidth: 1, paddingTop: 10 }, interactive: { paddingVertical: 8 }, content: { gap: 6 }, top: { alignItems: 'center', gap: 8 } });
