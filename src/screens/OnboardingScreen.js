import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'compass-outline',
    title: 'Discover Your New Home',
    desc: 'Find affordable places, trusted services, and hidden gems recommended by people who\'ve been where you are.',
  },
  {
    id: '2',
    icon: 'people-outline',
    title: 'Join a Community',
    desc: 'Connect with foreigners, expats, and locals who share tips, reviews, and advice to help you settle in.',
  },
  {
    id: '3',
    icon: 'sparkles',
    title: 'AI-Powered Guidance',
    desc: 'Ask Naero AI anything — from translations to legal help. Your personal assistant in a new country.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Auth');
    }
  }, [currentIndex, navigation]);

  const handleSkip = useCallback(() => {
    navigation.replace('Auth');
  }, [navigation]);

  const renderSlide = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const iconScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
    });

    const iconOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScale }],
              opacity: iconOpacity,
            },
          ]}
        >
          {index === 2 ? (
            <Image source={LOGO} style={{ width: 140, height: 140 }} resizeMode="contain" />
          ) : (
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={64} color={COLORS.primary} />
            </View>
          )}
        </Animated.View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDesc}>{item.desc}</Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[COLORS.bg, '#0A1222', COLORS.bg]}
      style={styles.container}
    >
      <TouchableOpacity style={[styles.skipBtn, { top: insets.top + SPACING.lg }]} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <AnimatedFlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor:
                      currentIndex === index ? COLORS.primary : COLORS.textTertiary,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextGradient}
          >
            <Ionicons
              name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={24}
              color={COLORS.white}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  skipBtn: {
    position: 'absolute',
    right: SPACING.xl,
    zIndex: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: SPACING.huge,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  slideTitle: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  slideDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: SPACING.huge,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  nextGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
