import React from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');

export function LoadingState({ message, mascotSize = 72 }) {
  return (
    <View style={styles.container}>
      <Image
        source={LOGO}
        style={{ width: mascotSize, height: mascotSize }}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="small"
        color={COLORS.primary}
        style={styles.spinner}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.xl,
  },
  spinner: {
    marginTop: SPACING.lg,
  },
  message: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
