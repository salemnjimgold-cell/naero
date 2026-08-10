import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../theme';
import Text from './Text';
import Button from './Button';

export default function ErrorState({
  message = 'Something went wrong',
  onRetry,
  supportLink,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
      </View>
      <Text variant="bodyBold" color="primary" align="center" style={styles.title}>
        {message}
      </Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="secondary"
          size="sm"
          style={styles.retry}
        />
      )}
      {supportLink && (
        <Text variant="caption" color="tertiary" align="center" style={styles.support}>
          {supportLink}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  retry: {
    marginTop: SPACING.md,
  },
  support: {
    marginTop: SPACING.xs,
  },
});
