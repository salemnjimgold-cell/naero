import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  FONTS, SPACING, RADIUS,
  DEPTH, ACCENT, TEXT, BORDER, STATUS,
} from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

function getGreetingHour() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function getAmbientColor(hour) {
  if (hour >= 5 && hour < 12) return 'rgba(59,130,246,0.05)';
  if (hour >= 12 && hour < 17) return 'rgba(59,130,246,0.04)';
  if (hour >= 17 && hour < 21) return 'rgba(96,165,250,0.05)';
  return 'rgba(59,130,246,0.03)';
}

function getAmbientColor2(hour) {
  if (hour >= 5 && hour < 12) return 'rgba(59,130,246,0.025)';
  if (hour >= 12 && hour < 17) return 'rgba(59,130,246,0.015)';
  if (hour >= 17 && hour < 21) return 'rgba(96,165,250,0.025)';
  return 'rgba(8,17,31,0)';
}

// ─── Data ──────────────────────────────────────────────────────────────────

const STEPS_TOTAL = 12;
const STEPS_DONE = 3;

const PLACES = [
  { id: '1', icon: 'storefront-outline', name: 'Bakery', sub: 'Speaks your language', distance: '0.3 km', color: '#60A5FA' },
  { id: '2', icon: 'people-outline', name: 'Community', sub: 'Thursday gatherings', distance: '1.2 km', color: '#3B82F6' },
  { id: '3', icon: 'library-outline', name: 'Library', sub: 'Free English classes', distance: '0.8 km', color: '#94A3B8' },
  { id: '4', icon: 'medkit-outline', name: 'Clinic', sub: 'Walk-in accepted', distance: '1.5 km', color: '#22C55E' },
];

const PEOPLE = [
  { id: '1', name: 'Amira', initial: 'A', color: '#3B82F6', note: 'Found housing' },
  { id: '2', name: 'Carlos', initial: 'C', color: '#60A5FA', note: 'Chef, looking for work' },
  { id: '3', name: 'Yuki', initial: 'Y', color: '#94A3B8', note: 'Translator' },
  { id: '4', name: 'Omar', initial: 'O', color: '#22C55E', note: 'Arrived last week' },
];

// ─── Home Screen ───────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [greetingKey] = useState(getGreetingHour);
  const hour = new Date().getHours();

  const breathe = useRef(new Animated.Value(1)).current;
  const inputBreathe = useRef(new Animated.Value(0.06)).current;
  const fadeContent = useRef(new Animated.Value(0)).current;
  const pulseDot = useRef(new Animated.Value(0.4)).current;
  const section1 = useRef(new Animated.Value(0)).current;
  const section2 = useRef(new Animated.Value(0)).current;
  const section3 = useRef(new Animated.Value(0)).current;
  const section4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.92, duration: 2800, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(inputBreathe, { toValue: 0.10, duration: 2400, useNativeDriver: true }),
        Animated.timing(inputBreathe, { toValue: 0.06, duration: 2800, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseDot, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseDot, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  useEffect(() => {
    Animated.timing(fadeContent, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.stagger(120, [
      Animated.spring(section1, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(section2, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(section3, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(section4, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleInputPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('AI');
  }, [navigation]);
  const handleOrbPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('AI');
  }, [navigation]);
  const handlePlacePress = useCallback((place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('PlaceDetail', { placeId: place.id });
  }, [navigation]);
  const handleNextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('AI', { initialPrompt: 'I want to apply for my work permit' });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* ── Ambient glow — atmosphere before content ── */}
      <View style={[styles.ambientLayer, { paddingTop: insets.top }]}>
        <View style={[styles.ambientOrb1, { backgroundColor: getAmbientColor(hour) }]} />
        <View style={[styles.ambientOrb2, { backgroundColor: getAmbientColor2(hour) }]} />
      </View>

      {/* ── Orb — quiet compass ── */}
      <Animated.View style={[styles.orbWrap, { top: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={handleOrbPress} activeOpacity={0.7}>
          <View style={styles.orbPosition}>
            <Animated.View style={[styles.orbGlow, { transform: [{ scale: breathe }] }]} />
            <View style={styles.orbCore} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Main content ── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.huge + SPACING.sm,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: SPACING.xl,
        }}
        style={{ opacity: fadeContent }}
      >
        {/* ── Hero: Name + ambient — emotion in 3 seconds ── */}
        <Text style={styles.greetingSmall}>
          {t(`hub.greeting${greetingKey.charAt(0).toUpperCase() + greetingKey.slice(1)}`)}
        </Text>
        <Text style={styles.heroName}>Ahmed</Text>
        <Text style={styles.heroSub}>Seattle · Week 3</Text>

        {/* ── Next Step — visual card ── */}
        <Animated.View style={{ opacity: section1, transform: [{ translateY: section1.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <TouchableOpacity
          style={styles.nextStepCard}
          onPress={handleNextStep}
          activeOpacity={0.8}
        >
          <View style={styles.nextStepAccent} />
          <View style={styles.nextStepBody}>
            <View style={styles.nextStepIconRow}>
              <View style={styles.nextStepIcon}>
                <Ionicons name="document-text-outline" size={22} color={ACCENT.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextStepLabel}>{t('hub.nextStepTitle')}</Text>
                <Text style={styles.nextStepTitle}>{t('hub.nextStepBank')}</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={ACCENT.primary} />
            </View>
            <Text style={styles.nextStepDesc}>{t('hub.nextStepBankDesc')}</Text>
          </View>
        </TouchableOpacity>
        </Animated.View>

        {/* ── Progress — visual path ── */}
        <Animated.View style={[styles.section, { opacity: section2, transform: [{ translateY: section2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.sectionLabel}>{t('hub.journeyTitle')}</Text>
          <View style={styles.pathRow}>
            {Array.from({ length: STEPS_TOTAL }, (_, i) => {
              const done = i < STEPS_DONE;
              const current = i === STEPS_DONE;
              return (
                <React.Fragment key={i}>
                  <View style={[
                    styles.pathDot,
                    done && styles.pathDotDone,
                    current && styles.pathDotCurrent,
                  ]}>
                    {current && <Animated.View style={[styles.pathDotPulse, { opacity: pulseDot }]} />}
                  </View>
                  {i < STEPS_TOTAL - 1 && (
                    <View style={[styles.pathLine, done && styles.pathLineDone]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <Text style={styles.pathCaption}>{STEPS_DONE} of {STEPS_TOTAL} steps</Text>
        </Animated.View>

        {/* ── Nearby — visual tiles ── */}
        <Animated.View style={[styles.section, { opacity: section3, transform: [{ translateY: section3.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.sectionLabel}>{t('hub.nearby')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tilesRow}
          >
            {PLACES.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeTile}
                onPress={() => handlePlacePress(place)}
                activeOpacity={0.7}
              >
                <View style={[styles.placeVisual, { backgroundColor: place.color + '15' }]}>
                  <Ionicons name={place.icon} size={22} color={place.color} />
                </View>
                <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.placeSub} numberOfLines={1}>{place.sub}</Text>
                <Text style={styles.placeDist}>{place.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── People — visual avatars ── */}
        <Animated.View style={[styles.section, { opacity: section4, transform: [{ translateY: section4.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.sectionLabel}>{t('hub.peopleLikeYou')}</Text>
          <View style={styles.peopleRow}>
            {PEOPLE.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={styles.personTile}
                activeOpacity={0.7}
              >
                <View style={[styles.personAvatar, { backgroundColor: person.color + '18' }]}>
                  <Text style={[styles.personInitial, { color: person.color }]}>{person.initial}</Text>
                </View>
                <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
                <Text style={styles.personNote} numberOfLines={1}>{person.note}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Input ── */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity onPress={handleInputPress} activeOpacity={0.85} style={styles.inputTouch}>
          <Animated.View style={[styles.inputBorder, { opacity: inputBreathe }]} />
          <View style={styles.inputInner}>
            <Ionicons name="sparkles" size={16} color={ACCENT.primary} />
            <Text style={styles.inputPlaceholder}>{t('hub.askNaero')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DEPTH.canvas },

  /* ─── Ambient Layer ─── */
  ambientLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 360,
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: -80,
    left: (SCREEN_W - 320) / 2,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  ambientOrb2: {
    position: 'absolute',
    top: 40,
    left: (SCREEN_W - 480) / 2,
    width: 480,
    height: 240,
    borderRadius: 120,
  },

  /* ─── Orb ─── */
  orbWrap: { position: 'absolute', right: SPACING.xl, zIndex: 10 },
  orbPosition: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  orbGlow: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT.primary, opacity: 0.12 },
  orbCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: ACCENT.primary },

  /* ─── Hero ─── */
  greetingSmall: {
    ...FONTS.caption,
    color: TEXT.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  heroName: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    letterSpacing: -1.5,
    color: TEXT.primary,
    marginBottom: SPACING.sm,
  },
  heroSub: {
    ...FONTS.body,
    color: TEXT.secondary,
    marginBottom: SPACING.xxxl + SPACING.sm,
  },

  /* ─── Next Step Card ─── */
  nextStepCard: {
    flexDirection: 'row',
    backgroundColor: DEPTH.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xxxl,
  },
  nextStepAccent: { width: 3, backgroundColor: ACCENT.primary },
  nextStepBody: { flex: 1, padding: SPACING.lg },
  nextStepIconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  nextStepIcon: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: ACCENT.soft, alignItems: 'center', justifyContent: 'center',
  },
  nextStepLabel: { ...FONTS.caption, color: TEXT.tertiary, textTransform: 'uppercase', letterSpacing: 1 },
  nextStepTitle: { ...FONTS.bodyBold, color: TEXT.primary },
  nextStepDesc: { ...FONTS.caption, color: TEXT.secondary },

  /* ─── Progress Path ─── */
  section: { marginBottom: SPACING.xxxl },
  sectionLabel: {
    ...FONTS.caption, color: TEXT.tertiary,
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: SPACING.md,
  },
  pathRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  pathDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: DEPTH.elevated,
    borderWidth: 1.5, borderColor: BORDER.subtle,
  },
  pathDotDone: { backgroundColor: ACCENT.primary, borderColor: ACCENT.primary },
  pathDotCurrent: { borderColor: STATUS.success },
  pathDotPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    backgroundColor: STATUS.success,
    opacity: 0.3,
  },
  pathLine: { flex: 1, height: 2, backgroundColor: BORDER.subtle, marginHorizontal: 2 },
  pathLineDone: { backgroundColor: ACCENT.primary + '60' },
  pathCaption: { ...FONTS.caption, color: TEXT.tertiary },

  /* ─── Nearby Tiles ─── */
  tilesRow: { gap: SPACING.md, paddingRight: SPACING.xl },
  placeTile: {
    width: 130,
    backgroundColor: DEPTH.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  placeVisual: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  placeName: { ...FONTS.bodyBold, color: TEXT.primary, marginBottom: 2 },
  placeSub: { ...FONTS.caption, color: TEXT.secondary, marginBottom: SPACING.xs },
  placeDist: { ...FONTS.small, color: TEXT.tertiary },

  /* ─── People Avatars ─── */
  peopleRow: { flexDirection: 'row', gap: SPACING.lg },
  personTile: { alignItems: 'center', width: 64 },
  personAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  personInitial: { fontSize: 20, fontWeight: '700' },
  personName: { ...FONTS.caption, color: TEXT.primary, textAlign: 'center' },
  personNote: { ...FONTS.small, color: TEXT.tertiary, textAlign: 'center' },

  /* ─── Input ─── */
  inputArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.xl,
  },
  inputTouch: { position: 'relative' },
  inputBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999, borderWidth: 1, borderColor: ACCENT.primary,
  },
  inputInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DEPTH.surface, borderRadius: 999,
    paddingHorizontal: SPACING.lg, paddingVertical: 14, gap: SPACING.sm,
    borderWidth: 1,
    borderColor: BORDER.subtle,
  },
  inputPlaceholder: { ...FONTS.body, color: TEXT.muted },
});
