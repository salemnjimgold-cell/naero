import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';

const LOGO = require('../../assets/branding/naero-logo.png');
const { width } = Dimensions.get('window');

export default function LocationPermissionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { requestLocationPermission, locationLoading, locationPermissionStatus } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const autoSkipped = useRef(false);

  React.useEffect(() => {
    if (autoSkipped.current) return;
    if (locationPermissionStatus === 'granted' || locationPermissionStatus === 'denied') {
      autoSkipped.current = true;
      navigation.replace('Main');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [locationPermissionStatus]);

  const handleAllow = async () => {
    await requestLocationPermission();
    navigation.replace('Main');
  };

  const handleNotNow = () => {
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bg, '#0A1222', COLORS.bg]}
        style={[styles.content, { paddingTop: insets.top + SPACING.huge }]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoSection}>
            <View style={styles.iconGlow}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.badge}>Location Access</Text>
          </View>

          <Text style={styles.title}>Help us help you better</Text>
          <Text style={styles.description}>
            Naero uses your location to show nearby services, jobs, housing,
            transport, pharmacies, hospitals, safe places, and local community
            help. Your location is only used to improve your experience.
          </Text>

          <View style={styles.benefitsList}>
            {[
              { icon: 'compass-outline', text: 'Find places near you' },
              { icon: 'medkit-outline', text: 'Nearby hospitals & pharmacies' },
              { icon: 'bus-outline', text: 'Local transport routes' },
              { icon: 'people-outline', text: 'Community help nearby' },
            ].map((item, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.benefitText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
            <Text style={styles.privacyText}>
              Your location never leaves your device unless you explicitly search
              for nearby places.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.allowBtn, locationLoading && styles.btnDisabled]}
            onPress={handleAllow}
            disabled={locationLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.allowGradient}
            >
              {locationLoading ? (
                <Text style={styles.allowText}>Enabling...</Text>
              ) : (
                <>
                  <Ionicons name="location" size={20} color={COLORS.white} />
                  <Text style={styles.allowText}>Allow Location</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notNowBtn}
            onPress={handleNotNow}
            activeOpacity={0.7}
          >
            <Text style={styles.notNowText}>Not Now</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can change this anytime in Settings
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxxl,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    marginBottom: SPACING.md,
  },
  logo: {
    width: 56,
    height: 56,
  },
  badge: {
    ...FONTS.smallBold,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  benefitsList: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.secondary + '08',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  privacyText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  allowBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  allowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  allowText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  notNowBtn: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  notNowText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  footerText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
});
