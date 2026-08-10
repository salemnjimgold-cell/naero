import React from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeModeContext';
import Text from '../Text';

export default function StateView({ icon = 'information-circle-outline', title, body, primaryAction, secondaryAction, tone = 'neutral', accessibilityLiveRegion = 'polite', style }) {
  const { theme } = useThemeMode();
  const color = tone === 'danger' ? theme.colors.status.danger : tone === 'warning' ? theme.colors.status.warning : tone === 'info' ? theme.colors.status.info : theme.colors.text.secondary;
  const Action = ({ action, primary }) => action ? <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} style={({ pressed }) => [styles.action, { minHeight: theme.touchTargets.preferred, borderColor: primary ? theme.colors.action.primary : theme.colors.border.default, backgroundColor: primary ? theme.colors.action.primary : 'transparent', opacity: pressed ? 0.82 : 1 }]}><Text variant="bodyStrong" style={{ color: primary ? theme.colors.text.onAction : theme.colors.text.primary, textAlign: 'center' }}>{action.label}</Text></Pressable> : null;
  return <View accessible accessibilityLiveRegion={accessibilityLiveRegion} style={[styles.base, style]}><Ionicons name={icon} size={theme.icons.prominent} color={color} accessible={false} /><Text variant="h3" accessibilityRole="header" style={{ color: theme.colors.text.primary, textAlign: 'center' }}>{title}</Text>{body ? <Text variant="body" style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>{body}</Text> : null}<View style={[styles.actions, { flexDirection: I18nManager.isRTL ? 'column' : 'column' }]}><Action action={primaryAction} primary /><Action action={secondaryAction} /></View></View>;
}

export function InlineLoading({ label }) { const { theme } = useThemeMode(); return <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.loading}><View style={[styles.loadingDot, { backgroundColor: theme.colors.action.primary }]} /><Text variant="body" style={{ color: theme.colors.text.secondary }}>{label}</Text></View>; }
const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }, actions: { width: '100%', gap: 8, marginTop: 4 }, action: { width: '100%', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: 8 }, loading: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, loadingDot: { width: 8, height: 8, borderRadius: 4 } });
