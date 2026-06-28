import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../theme';

export function SectionHeader({ title, actionLabel, onAction, icon }) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && <Ionicons name={icon} size={18} color={COLORS.primary} style={styles.icon} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} style={styles.actionBtn}>
          <Text style={styles.action}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginTop: -2,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  action: {
    ...FONTS.captionBold,
    color: COLORS.primary,
  },
});
