import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../theme';
import Text from './Text';

function SkeletonLine({ width, delay }) {
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(timer); loop.stop(); };
  }, []);

  return (
    <Animated.View style={[styles.skeletonLine, { width, opacity: shimmer }]} />
  );
}

function LoadingState({ message, type = 'spinner', lines = 4, style }) {
  if (type === 'skeleton') {
    return (
      <View style={[styles.container, style]}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 ? '60%' : '100%'}
            delay={i * 150}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message && (
        <Text variant="body" color="tertiary" align="center" style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
}

export default LoadingState;
export { LoadingState };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.xl,
  },
  message: {
    marginTop: SPACING.lg,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 7,
    width: '100%',
    marginBottom: SPACING.md,
  },
});
