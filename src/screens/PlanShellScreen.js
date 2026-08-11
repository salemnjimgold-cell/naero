import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEPTH, SPACING } from '../theme';
import StateView from '../components/contextual/StateView';

export default function PlanShellScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tx = (key) => t(`compass3c.plan.${key}`);
  return <View style={[styles.screen, { paddingTop: insets.top + SPACING.xxl }]}><StateView icon="list-outline" title={tx('title')} body={`${tx('body')}\n\n${tx('empty')}\n\n${tx('unavailable')}`} /></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: DEPTH.canvas, justifyContent: 'center' } });
