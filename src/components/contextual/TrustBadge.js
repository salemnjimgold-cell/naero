import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeModeContext';
import Text from '../Text';
import presentation from './trustPresentation';
export const TRUST_PRESENTATION = presentation.TRUST_PRESENTATION;

export default function TrustBadge({ trustClass, variant = 'normal', style }) {
  const { t } = useTranslation();
  const { theme } = useThemeMode();
  const config = TRUST_PRESENTATION[trustClass];
  if (!config) return null;
  const tones = {
    official: { color: theme.colors.text.primary, background: theme.colors.background.raised, border: theme.colors.border.strong },
    verified: { color: theme.colors.action.primary, background: theme.colors.action.subtle, border: theme.colors.action.primary },
    external: { color: theme.colors.status.info, background: theme.colors.background.surface, border: theme.colors.status.info },
    community: { color: theme.colors.progress.user, background: theme.colors.progress.subtle, border: theme.colors.progress.user },
    ai: { color: theme.colors.status.info, background: theme.colors.background.surface, border: theme.colors.border.default },
  };
  const tone = tones[config.tone];
  const label = t(`contextual.trust.${trustClass}`);
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={t('contextual.a11y.trustLabel', { label })} style={[styles.base, variant === 'compact' && styles.compact, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', backgroundColor: tone.background, borderColor: tone.border, borderWidth: config.borderWidth, borderStyle: config.borderStyle || 'solid' }, style]}>
      <Ionicons name={config.icon} size={variant === 'compact' ? theme.icons.metadata : theme.icons.inline} color={tone.color} accessible={false} />
      <Text variant={variant === 'compact' ? 'smallBold' : 'captionBold'} style={{ color: tone.color, flexShrink: 1 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ base: { alignSelf: 'flex-start', alignItems: 'center', gap: 6, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 6, minHeight: 32 }, compact: { paddingHorizontal: 8, paddingVertical: 4, minHeight: 28 } });
