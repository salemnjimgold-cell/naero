import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';

const TYPE_META = {
  'full-time': { icon: 'briefcase', label: 'Full-Time', color: COLORS.primary },
  'part-time': { icon: 'time', label: 'Part-Time', color: COLORS.secondary },
  freelance: { icon: 'laptop', label: 'Freelance', color: COLORS.purple },
  internship: { icon: 'school', label: 'Internship', color: COLORS.warning },
  volunteer: { icon: 'heart', label: 'Volunteer', color: COLORS.error },
};

export default function JobDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const { savedJobs, toggleSavedJob } = useApp();
  const isSaved = savedJobs.includes(item.id);
  const meta = TYPE_META[item.type] || TYPE_META['full-time'];

  const handleApply = () => {
    Linking.openURL(`mailto:${item.contact}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaved && { backgroundColor: COLORS.primary + '20' }]}
          onPress={() => toggleSavedJob(item.id)}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? COLORS.primary : COLORS.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View style={styles.hero}>
          <View style={[styles.typeBadge, { backgroundColor: meta.color + '15' }]}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
            <Text style={[styles.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.companyRow}>
            <Ionicons name="business-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.companyText}>{item.company}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={COLORS.primary} />
              <Text style={styles.metaText}>{item.salary}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.description')}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {item.requirements && item.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('jobs.requirements')}</Text>
            {item.requirements.map((req, i) => (
              <View key={i} style={styles.requirementRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {item.tags && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('jobs.tags')}</Text>
            <View style={styles.tagRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleApply}>
          <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionGradient}>
            <Ionicons name="mail-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>{t('jobs.apply')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  typeText: {
    ...FONTS.captionBold,
    fontSize: 12,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  companyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  section: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  requirementText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tagText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  actionBtnText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
});
