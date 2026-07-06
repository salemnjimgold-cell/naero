import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/design-tokens';

const LOGO = require('../../assets/branding/naero-logo.png');
const HAS_LAUNCHED_KEY = '@naero_has_launched';

export default function SplashScreen({ navigation }) {
  const eyeOpacity = useRef(new Animated.Value(0)).current;
  const eyeScale = useRef(new Animated.Value(0.92)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const run = async () => {
      const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
      const isFirstLaunch = !hasLaunched;

      if (isFirstLaunch) {
        await AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
      }

      const fadeIn = isFirstLaunch ? 200 : 100;
      const hold = isFirstLaunch ? 450 : 200;
      const fadeOut = isFirstLaunch ? 200 : 150;

      Animated.sequence([
        Animated.parallel([
          Animated.timing(eyeOpacity, {
            toValue: 1,
            duration: fadeIn,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 1,
            duration: fadeIn,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(hold),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: fadeOut,
          easing: Easing.in(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start(() => {
        navigation.replace('Welcome');
      });
    };

    run();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View style={{ opacity: eyeOpacity, transform: [{ scale: eyeScale }] }}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.canvas,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
