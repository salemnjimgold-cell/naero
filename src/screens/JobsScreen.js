import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useApp } from '../context/AppContext';
import { jobTypes } from '../data/categories';
import { JobCard } from '../components/ListingCard';
import { EmptyState } from '../components/EmptyState';

const { width } = Dimensions.get('window');

function TypeChip({ type, active, onPress, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const isActive = active === type.id;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
      delay: index * 40,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.typeChip, isActive && styles.typeChipActive]}
      >
        <LinearGradient
          colors={isActive ? ['#06B6D4', '#0891B2'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.typeChipGrad}
        >
          <Ionicons
            name={type.icon}
            size={16}
            color={isActive ? COLORS.white : COLORS.primary}
          />
          <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>
            {type.label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function JobsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { savedJobs, toggleSavedJob, jobService, userCity } = useApp();
  const [activeType, setActiveType] = useState(null);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    const result = await jobService.getAll();
    if (result.data) setAllJobs(result.data);
    setLoading(false);
  }

  const filteredJobs = useMemo(() => {
    if (!activeType) return allJobs;
    return allJobs.filter((j) => j.type === activeType);
  }, [activeType, allJobs]);

  const handleJobPress = useCallback((item) => {
    navigation.navigate('JobDetail', { item });
  }, [navigation]);

  const typeCounts = useMemo(() => {
    const counts = {};
    allJobs.forEach((j) => {
      counts[j.type] = (counts[j.type] || 0) + 1;
    });
    return counts;
  }, [allJobs]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('jobs.title')}</Text>
            <Text style={styles.subtitle}>{t('jobs.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{allJobs.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{savedJobs.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeScroll}
          overScrollMode="never"
        >
          <TouchableOpacity
            style={[styles.typeChip, !activeType && styles.typeChipActive]}
            onPress={() => setActiveType(null)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={!activeType ? ['#06B6D4', '#0891B2'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.typeChipGrad}
            >
              <Ionicons name="grid-outline" size={16} color={!activeType ? COLORS.white : COLORS.primary} />
              <Text style={[styles.typeChipText, !activeType && styles.typeChipTextActive]}>
                All ({allJobs.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {jobTypes.map((type, idx) => (
            <TypeChip
              key={type.id}
              type={type}
              active={activeType}
              index={idx}
              onPress={() => setActiveType(activeType === type.id ? null : type.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            item={item}
            onPress={handleJobPress}
            onSave={toggleSavedJob}
            isSaved={savedJobs.includes(item.id)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <EmptyState message={t('jobs.noJobs')} mascotSize={72} />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statNumber: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.cardBorder,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  typeScroll: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  typeChip: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeChipGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  typeChipActive: {
    borderColor: COLORS.primary,
  },
  typeChipText: {
    ...FONTS.captionBold,
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
    color: COLORS.white,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
});
