import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../theme';
import Text from './Text';
import Button from './Button';

const iconMap = {
  home: 'compass-outline',
  explore: 'map-outline',
  community: 'people-outline',
  services: 'briefcase-outline',
  jobs: 'document-text-outline',
  notifications: 'notifications-off-outline',
  search: 'search-outline',
  default: 'compass-outline',
};

const titleMap = {
  home: 'Your journey begins here',
  explore: 'No places yet',
  community: 'Be the first to join',
  services: 'No services yet',
  jobs: 'No job matches yet',
  notifications: 'All quiet',
  search: 'No results found',
  default: 'Nothing here yet',
};

function EmptyState({ variant = 'default', icon, title, message, action, style }) {
  const iconName = icon || iconMap[variant] || iconMap.default;
  const titleText = title || titleMap[variant] || titleMap.default;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Ionicons name={iconName} size={28} color={COLORS.textTertiary} />
      </Animated.View>
      <Text variant="bodyBold" color="tertiary" align="center" style={styles.title}>
        {titleText}
      </Text>
      {message && (
        <Text variant="caption" color="tertiary" align="center" style={styles.message}>
          {message}
        </Text>
      )}
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="secondary"
          size="sm"
          style={styles.action}
        />
      )}
    </View>
  );
}

export default EmptyState;
export { EmptyState };

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  message: {
    maxWidth: 260,
  },
  action: {
    marginTop: SPACING.xl,
  },
});
