import React, { useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, type } from '../theme/design-tokens';
import ActionButton from '../components/ActionButton';
import SocialAuthButton from '../components/SocialAuthButton';

const LOGO = require('../../assets/branding/naero-logo.png');

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const eyeOpacity = useSharedValue(0);
  const eyeOffset = useSharedValue(16);
  const headlineOpacity = useSharedValue(0);
  const headlineOffset = useSharedValue(16);
  const buttonsOpacity = useSharedValue(0);
  const buttonsOffset = useSharedValue(16);
  const footerOpacity = useSharedValue(0);

  /* eslint-disable react-hooks/exhaustive-deps */
  const fadeConfig = { duration: 400, easing: Easing.out(Easing.ease) };

  useEffect(() => {
    eyeOpacity.value = withTiming(1, fadeConfig);
    eyeOffset.value = withTiming(0, fadeConfig);

    headlineOpacity.value = withDelay(150, withTiming(1, fadeConfig));
    headlineOffset.value = withDelay(150, withTiming(0, fadeConfig));

    buttonsOpacity.value = withDelay(300, withTiming(1, fadeConfig));
    buttonsOffset.value = withDelay(300, withTiming(0, fadeConfig));

    footerOpacity.value = withDelay(450, withTiming(1, fadeConfig));
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const eyeStyle = useAnimatedStyle(() => ({
    opacity: eyeOpacity.value,
    transform: [{ translateY: eyeOffset.value }],
  }));

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineOffset.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsOffset.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const handleGuest = useCallback(() => {
    navigation.replace('Main');
  }, [navigation]);

  const handleGoogle = useCallback(() => {
    navigation.replace('Main');
  }, [navigation]);

  const handleApple = useCallback(() => {
    navigation.replace('Main');
  }, [navigation]);

  const handleSignIn = useCallback(() => {
    navigation.navigate('Auth');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing['4xl'] }]}>
      <Animated.View style={[styles.eyeWrap, eyeStyle]}>
        <Image source={LOGO} style={styles.eye} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.headlineWrap, headlineStyle]}>
        <Text style={styles.headline}>Welcome to Naero</Text>
        <Text style={styles.subheadline}>
          Your guide to a new home. Discover places, connect with communities, and settle in with confidence.
        </Text>
        <Text style={styles.versionLabel}>Naero UX v2</Text>
      </Animated.View>

      <Animated.View style={[styles.buttonsWrap, buttonsStyle]}>
        <ActionButton title="Continue as Guest" onPress={handleGuest} style={styles.guestBtn} />
        <SocialAuthButton icon="logo-google" title="Continue with Google" onPress={handleGoogle} />
        {Platform.OS === 'ios' && (
          <SocialAuthButton icon="logo-apple" title="Continue with Apple" onPress={handleApple} style={styles.appleBtn} />
        )}
        <TouchableOpacity
          onPress={handleSignIn}
          style={styles.signInBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }, footerStyle]}>
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  eyeWrap: {
    marginBottom: spacing['3xl'],
  },
  eye: {
    width: 52,
    height: 52,
  },
  headlineWrap: {
    alignItems: 'center',
    marginBottom: spacing['5xl'],
  },
  headline: {
    ...type.scale.h1,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subheadline: {
    ...type.scale.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  buttonsWrap: {
    width: '100%',
    maxWidth: 340,
    gap: spacing.md,
    alignItems: 'center',
  },
  guestBtn: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  appleBtn: {
    marginTop: 0,
  },
  signInBtn: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  signInText: {
    ...type.scale.btn,
    color: colors.text.link,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing['2xl'],
  },
  terms: {
    ...type.scale.caption,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.text.link,
  },
  versionLabel: {
    ...type.scale.caption,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
