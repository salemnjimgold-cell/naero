import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');

export function NaeroMascot({ size = 80, animated = true, style }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );

    float.start();
    pulse.start();
    glow.start();

    return () => {
      float.stop();
      pulse.stop();
      glow.stop();
    };
  }, [animated]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const floatGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          opacity: floatGlow,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
    >
      <Image
        source={LOGO}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export function NaeroLogo({ size = 120, animated = true, showTagline = false }) {
  const logoSize = size * 0.65;

  return (
    <View style={[styles.logoContainer, { width: size }]}>
      <NaeroMascot size={logoSize} animated={animated} />
      <View style={styles.logoTextRow}>
        <Text style={[styles.logoText, { fontSize: size * 0.17, color: COLORS.primary }]}>
          N
        </Text>
        <Text style={[styles.logoText, { fontSize: size * 0.17, color: COLORS.textPrimary }]}>
          aero
        </Text>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: size * 0.07 }]}>
          Not a stranger anymore
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  logoText: {
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
