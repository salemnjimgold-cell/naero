import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, type, motion } from '../theme';
import ActionButton from '../components/ActionButton';
import SocialAuthButton from '../components/SocialAuthButton';
import { GoogleIcon, FacebookIcon } from '../components/BrandIcons';
import { useApp } from '../context/AppContext';
import { signInWithOAuth, signInAsGuest } from '../services/authService';
import { signInWithFacebook } from '../services/facebookAuthService';

const LOGO = require('../../assets/branding/naero-logo.png');
const SPRING = motion.spring.gentle;

const SocialIconWrapper = ({ children }) => (
  <View style={{ marginInlineEnd: spacing.md, justifyContent: 'center', alignItems: 'center' }}>
    {children}
  </View>
);

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setAuth } = useApp();
  const [loading, setLoading] = useState(null);

  const eyeScale = useSharedValue(0.6);
  const eyeOpacity = useSharedValue(0);
  const blinkScaleY = useSharedValue(1);
  const floatY = useSharedValue(0);
  const headlineOpacity = useSharedValue(0);
  const headlineOffset = useSharedValue(24);
  const buttonsOpacity = useSharedValue(0);
  const buttonsOffset = useSharedValue(24);
  const footerOpacity = useSharedValue(0);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    eyeOpacity.value = withSpring(1, SPRING);
    eyeScale.value = withSpring(1, SPRING);

    headlineOpacity.value = withDelay(200, withSpring(1, SPRING));
    headlineOffset.value = withDelay(200, withSpring(0, SPRING));

    buttonsOpacity.value = withDelay(400, withSpring(1, SPRING));
    buttonsOffset.value = withDelay(400, withSpring(0, SPRING));

    footerOpacity.value = withDelay(600, withSpring(1, SPRING));

    blinkScaleY.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.12, { duration: 80 }),
        withTiming(1, { duration: 100 }),
      ),
      -1,
    ));

    floatY.value = withDelay(800, withRepeat(
      withTiming(-7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    ));
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const eyeStyle = useAnimatedStyle(() => ({
    opacity: eyeOpacity.value,
    transform: [
      { scale: eyeScale.value },
      { scaleY: blinkScaleY.value },
      { translateY: floatY.value },
    ],
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

  const handleAuthResult = useCallback((result, provider) => {
    setLoading(null);
    if (result.error) {
      Alert.alert('Sign In', result.error);
      return;
    }
    if (result.session) {
      setAuth(result.session);
      navigation.replace('Main');
    }
  }, [setAuth, navigation]);

  const handleGuest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading('guest');
    const result = await signInAsGuest();
    handleAuthResult({ ...result, session: result.session }, 'guest');
  }, [handleAuthResult]);

  const handleGoogle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading('google');
    const result = await signInWithOAuth('google');
    handleAuthResult(result, 'google');
  }, [handleAuthResult]);

  const handleFacebook = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading('facebook');
    const result = await signInWithFacebook();
    handleAuthResult(result, 'facebook');
  }, [handleAuthResult]);

  const handleApple = useCallback(async () => {
    setLoading('apple');
    const result = await signInWithOAuth('apple');
    handleAuthResult(result, 'apple');
  }, [handleAuthResult]);

  const handleSignIn = useCallback(() => {
    navigation.navigate('Auth');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing['3xl'] }]}>
      <View style={styles.body}>
        <Animated.View style={[styles.eyeWrap, eyeStyle]}>
          <Image source={LOGO} style={styles.eye} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Animated.View>

        <Animated.View style={[styles.headlineWrap, headlineStyle]}>
          <Text style={styles.headline} accessibilityRole="header">Welcome to Naero</Text>
          <Text style={styles.subheadline} accessibilityRole="text">
            Your AI companion for every new beginning.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonsWrap, buttonsStyle]}>
          <View style={styles.guestSection}>
            <ActionButton title="Start Exploring" onPress={handleGuest} loading={loading === 'guest'} disabled={loading !== null} style={styles.guestBtn} />
            <Text style={styles.guestSubtitle}>Continue without an account.</Text>
          </View>
          <View style={styles.socialDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.childGap}>
            <SocialAuthButton iconComponent={<SocialIconWrapper><GoogleIcon /></SocialIconWrapper>} title="Continue with Google" onPress={handleGoogle} loading={loading === 'google'} disabled={loading !== null} />
          </View>
          <View style={styles.childGap}>
            <SocialAuthButton iconComponent={<SocialIconWrapper><FacebookIcon /></SocialIconWrapper>} title="Continue with Facebook" onPress={handleFacebook} loading={loading === 'facebook'} disabled={loading !== null} />
          </View>
          {Platform.OS === 'ios' ? (
            <View style={styles.childGap}>
              <SocialAuthButton icon="logo-apple" title="Continue with Apple" onPress={handleApple} loading={loading === 'apple'} disabled={loading !== null} />
            </View>
          ) : (
            <View style={[styles.appleDisabled, styles.childGap]}>
              <SocialAuthButton icon="logo-apple" title="Continue with Apple" onPress={() => {}} disabled={true} />
              <Text style={styles.appleDisabledLabel}>Available on iOS</Text>
            </View>
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
      </View>

      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }, footerStyle]}>
        <Text style={styles.versionLabel}>Naero UX v2</Text>
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
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  eyeWrap: {
    marginBottom: spacing['4xl'],
  },
  eye: {
    width: 128,
    height: 128,
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
    alignItems: 'center',
  },
  childGap: {
    width: '100%',
    marginBottom: spacing.md,
  },
  guestSection: {
    width: '100%',
    alignItems: 'center',
  },
  guestBtn: {
    width: '100%',
  },
  guestSubtitle: {
    ...type.scale.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing.xs,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerLabel: {
    ...type.scale.caption,
    color: colors.text.muted,
  },
  appleDisabled: {
    width: '100%',
  },
  appleDisabledLabel: {
    ...type.scale.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xxs,
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
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing['2xl'],
  },
  terms: {
    ...type.scale.caption,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  termsLink: {
    color: colors.text.link,
  },
  versionLabel: {
    ...type.scale.label,
    color: colors.text.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
