import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');
const { width, height } = Dimensions.get('window');

function Particle({ delay, size, startX, startY, side, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000 + delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, startX + side * width * 0.25],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, startY - 180 - Math.random() * 100],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.5, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    />
  );
}

function RotatingRing({ size, color, duration, delay }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay || 0),
        Animated.timing(spin, {
          toValue: 1,
          duration: duration || 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.12],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        position: 'absolute',
        borderWidth: 1.5,
        borderColor: color,
        opacity: pulseOpacity,
        transform: [{ rotate }],
      }}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 25,
        friction: 5,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 500,
        delay: 1100,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeOutAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('Onboarding');
      });
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.6, 1.05, 1],
  });

  const logoOpacity = logoAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [0, 1],
  });

  const titleOpacity = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const titleTranslateY = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const taglineOpacity = taglineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const taglineTranslateY = taglineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 0],
  });

  const subtitleOpacity = subtitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const containerOpacity = fadeOutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const containerScale = fadeOutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const particles = [
    { delay: 0, size: 4, startX: width * 0.15, startY: height * 0.3, side: 1, color: COLORS.primary },
    { delay: 300, size: 3, startX: width * 0.85, startY: height * 0.25, side: -1, color: COLORS.secondary },
    { delay: 600, size: 5, startX: width * 0.2, startY: height * 0.1, side: 1, color: COLORS.purple },
    { delay: 900, size: 3, startX: width * 0.75, startY: height * 0.35, side: -1, color: COLORS.primary },
    { delay: 400, size: 4, startX: width * 0.5, startY: height * 0.15, side: 1, color: COLORS.secondary },
    { delay: 700, size: 2, startX: width * 0.9, startY: height * 0.4, side: -1, color: COLORS.warning },
    { delay: 200, size: 3, startX: width * 0.1, startY: height * 0.45, side: 1, color: COLORS.primary },
    { delay: 1000, size: 4, startX: width * 0.65, startY: height * 0.2, side: -1, color: COLORS.purple },
  ];

  return (
    <Animated.View style={{ flex: 1, opacity: containerOpacity, transform: [{ scale: containerScale }] }}>
      <LinearGradient
        colors={[COLORS.bg, '#0A1222', '#0D1A2A', COLORS.bg]}
        style={styles.container}
        locations={[0, 0.4, 0.7, 1]}
      >
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        <RotatingRing size={280} color={COLORS.primary} duration={10000} delay={0} />
        <RotatingRing size={360} color={COLORS.secondary} duration={14000} delay={1000} />
        <RotatingRing size={200} color={COLORS.purple} duration={8000} delay={500} />

        <Animated.View
          style={[styles.glowBall, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.15] }) }]}
        />

        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoGlowWrap}>
            <Image
              source={LOGO}
              style={{ width: width * 0.28, height: width * 0.28 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.titleWrap,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Naero</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.taglineWrap,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.tagline}>Not a stranger anymore</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleWrap,
            { opacity: subtitleOpacity },
          ]}
        >
          <Text style={styles.subtitle}>Your guide to a new home</Text>
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  glowBall: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    top: height * 0.35,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoGlowWrap: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  titleWrap: {
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -1.5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  taglineWrap: {
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  subtitleWrap: {
    marginBottom: SPACING.xxxl,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressTrack: {
    width: 120,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
  },
});
