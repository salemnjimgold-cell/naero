import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

export default function Card({
  children,
  onPress,
  padding = SPACING.lg,
  radius = RADIUS.lg,
  style,
}) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.card,
        {
          padding,
          borderRadius: radius,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

export function CardRow({ children, style }) {
  return (
    <View style={[styles.row, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
