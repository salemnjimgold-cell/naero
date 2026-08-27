import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StateView from './contextual/StateView';
import { DEPTH, SPACING } from '../theme';

export default function PreviewStateScreen({ icon, title, body, navigation }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, { paddingTop: insets.top + SPACING.lg }]}>
    <StateView
      icon={icon}
      title={`${title} — Preview`}
      body={body}
      primaryAction={{ label: 'Discover real nearby places', onPress: () => navigation.navigate('Main', { screen: 'World' }) }}
    />
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: DEPTH.canvas } });
