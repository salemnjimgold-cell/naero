import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeModeContext';
import Text from '../Text';

const PRESENTATION = Object.freeze({ current: ['checkmark-circle-outline', 'success'], review_due: ['time-outline', 'warning'], outdated: ['alert-circle-outline', 'danger'], date_unknown: ['help-circle-outline', 'secondary'] });

export default function FreshnessLabel({ freshness, dateLabel = null, compact = false, style }) {
  const { t } = useTranslation();
  const { theme } = useThemeMode();
  const config = PRESENTATION[freshness] || PRESENTATION.date_unknown;
  const color = config[1] === 'secondary' ? theme.colors.text.secondary : theme.colors.status[config[1]];
  const label = t(`contextual.freshness.${PRESENTATION[freshness] ? freshness : 'date_unknown'}`);
  const full = dateLabel ? t('contextual.freshness.withDate', { label, date: dateLabel }) : label;
  return <View accessible accessibilityRole="text" accessibilityLabel={t('contextual.a11y.freshnessLabel', { label: full })} style={[styles.row, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }, style]}><Ionicons name={config[0]} size={compact ? theme.icons.metadata : theme.icons.inline} color={color} accessible={false} /><Text variant={compact ? 'small' : 'caption'} style={{ color, flexShrink: 1 }}>{full}</Text></View>;
}
const styles = StyleSheet.create({ row: { alignItems: 'center', gap: 6, minHeight: 24 } });
