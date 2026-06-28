import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

export function CategoryGrid({ categories, onPress, columns = 5 }) {
  return (
    <View style={styles.grid}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.item, { width: `${100 / columns}%` }]}
          onPress={() => onPress?.(cat)}
          activeOpacity={0.6}
        >
          <View style={[styles.iconWrap, { backgroundColor: cat.color + '18' }]}>
            <Ionicons name={cat.icon} size={22} color={cat.color} />
          </View>
          <Text style={styles.label} numberOfLines={2}>{cat.id}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function QuickActionButton({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: color + '15' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={26} color={color} />
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
  },
  item: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  quickBtn: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickLabel: {
    ...FONTS.captionBold,
    marginTop: 6,
  },
});
