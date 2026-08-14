import React from 'react';
import { I18nManager, Linking, Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
const { attributionLinks } = require('../domain/placeAttribution');

export default function PlaceAttributionLinks({ attributions, color, textStyle }) {
  const links = attributionLinks(attributions);
  if (!links.length) return null;
  return <View accessibilityRole="summary" accessibilityLabel={links.map((link) => link.label).join('. ')} style={[styles.row, I18nManager.isRTL && styles.rtlRow]}>
    {links.map((link) => <Pressable key={link.url} accessibilityRole="link" accessibilityLabel={link.label} onPress={() => Linking.openURL(link.url)} hitSlop={8}>
      <Text variant="caption" style={[styles.link, { color }, textStyle]}>{link.label}</Text>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  rtlRow: { flexDirection: 'row-reverse' },
  link: { textDecorationLine: 'underline' },
});
