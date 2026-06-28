import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');

export function EmptyState({ title, message, mascotSize = 80 }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Image
        source={LOGO}
        style={{ width: mascotSize, height: mascotSize }}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title || t('common.noData')}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
  },
  title: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  message: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
