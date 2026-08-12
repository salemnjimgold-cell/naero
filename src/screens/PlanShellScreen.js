import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../theme';
import { useThemeMode } from '../theme/ThemeModeContext';
import StateView from '../components/contextual/StateView';

export default function PlanShellScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeMode();
  const tx = (key) => t(`compass3c.plan.${key}`);
  return <View style={[styles.screen, { paddingTop: insets.top + SPACING.xxl, backgroundColor: theme.colors.background.canvas }]}><StateView icon="list-outline" title={tx('title')} body={`${tx('body')}\n\n${tx('empty')}\n\n${tx('unavailable')}`} /></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center' } });
