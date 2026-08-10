import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeModeContext';
import Text from '../Text';

export function formatJurisdiction(jurisdiction, t) {
  if (!jurisdiction?.country) return null;
  const locality = jurisdiction.serviceArea?.name || jurisdiction.municipality?.name || jurisdiction.region?.name;
  const country = jurisdiction.country.name || jurisdiction.country.id;
  const level = jurisdiction.serviceArea ? 'service_area' : jurisdiction.municipality ? 'municipality' : jurisdiction.region ? 'region' : 'country';
  return locality ? t('contextual.jurisdiction.localityCountry', { locality, country }) : t('contextual.jurisdiction.level', { name: country, level: t(`contextual.jurisdiction.levels.${level}`) });
}

export default function JurisdictionLabel({ jurisdiction, style }) {
  const { t } = useTranslation(); const { theme } = useThemeMode(); const label = formatJurisdiction(jurisdiction, t); if (!label) return null;
  return <View accessible accessibilityRole="text" accessibilityLabel={t('contextual.a11y.jurisdictionLabel', { label })} style={[styles.row, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }, style]}><Ionicons name="location-outline" size={theme.icons.metadata} color={theme.colors.text.secondary} accessible={false} /><Text variant="caption" style={{ color: theme.colors.text.secondary, flexShrink: 1 }}>{label}</Text></View>;
}
const styles = StyleSheet.create({ row: { alignItems: 'center', gap: 6, minHeight: 24 } });
