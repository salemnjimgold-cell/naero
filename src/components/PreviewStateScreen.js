import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StateView from './contextual/StateView';
import { useTranslation } from 'react-i18next';
import { DEPTH, SPACING } from '../theme';

export default function PreviewStateScreen({ icon, titleKey, bodyKey, navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return <View style={[styles.screen, { paddingTop: insets.top + SPACING.lg }]}>
    <StateView
      icon={icon}
      title={t('gate1.preview.title', { feature: t(titleKey) })}
      body={t(bodyKey)}
      primaryAction={{ label: t('gate1.preview.discover'), onPress: () => navigation.navigate('Main', { screen: 'World' }) }}
    />
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: DEPTH.canvas } });
