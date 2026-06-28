import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';

const severityConfig = {
  critical: { bg: 'rgba(239,68,68,0.12)', text: COLORS.error, icon: 'alert-circle' },
  important: { bg: 'rgba(245,158,11,0.12)', text: COLORS.warning, icon: 'warning' },
  info: { bg: 'rgba(59,130,246,0.12)', text: COLORS.info, icon: 'information-circle' },
};

export default function SafetyScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { safetyTipService, emergencyContactService, userCity } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [tips, setTips] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [tipsRes, contactsRes] = await Promise.all([
      safetyTipService.getAll(),
      emergencyContactService.getAll(),
    ]);
    if (tipsRes.data) setTips(tipsRes.data);
    if (contactsRes.data) setContacts(contactsRes.data);
    setLoading(false);
  }

  const handleCall = useCallback((number) => {
    Linking.openURL(`tel:${number.replace(/[^+\d]/g, '')}`);
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.title}>{t('safety.title')}</Text>
            <Text style={styles.subtitle}>{t('safety.subtitle')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>{t('safety.emergency')}</Text>
          <View style={styles.emergencyGrid}>
            {contacts.map((contact) => (
              <TouchableOpacity
                key={contact.name}
                style={[styles.emergencyCard, contact.name === 'General Emergency' && styles.emergencyCardPrimary]}
                onPress={() => handleCall(contact.number)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={contact.name === 'General Emergency' ? GRADIENTS.primary : ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emergencyGradient}
                >
                  <Ionicons
                    name={contact.icon}
                    size={24}
                    color={contact.name === 'General Emergency' ? COLORS.white : COLORS.error}
                  />
                  <Text style={[styles.emergencyName, contact.name === 'General Emergency' && { color: COLORS.white }]}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.emergencyNumber, contact.name === 'General Emergency' && { color: COLORS.white }]}>
                    {contact.number}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>{t('safety.tips')}</Text>
          {tips.map((tip) => {
            const sev = severityConfig[tip.severity] || severityConfig.info;
            const isExpanded = expandedId === tip.id;
            return (
              <TouchableOpacity
                key={tip.id}
                style={styles.tipCard}
                onPress={() => toggleExpand(tip.id)}
                activeOpacity={0.7}
              >
                <View style={styles.tipHeader}>
                  <View style={[styles.tipIcon, { backgroundColor: sev.bg }]}>
                    <Ionicons name={sev.icon} size={20} color={sev.text} />
                  </View>
                  <View style={styles.tipInfo}>
                    <Text style={styles.tipCategory}>{t(`safety.${tip.category}`)}</Text>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textTertiary}
                  />
                </View>
                {isExpanded && (
                  <View style={styles.tipContent}>
                    <Text style={styles.tipBody}>{tip.content}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
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
  emergencySection: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  emergencyCard: {
    width: '47%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emergencyCardPrimary: {
    width: '100%',
    borderColor: COLORS.primary,
  },
  emergencyGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emergencyName: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emergencyNumber: {
    ...FONTS.bodyBold,
    color: COLORS.error,
    fontSize: 18,
  },
  tipsSection: {
    paddingHorizontal: SPACING.xl,
  },
  tipCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipInfo: {
    flex: 1,
  },
  tipCategory: {
    ...FONTS.small,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  tipContent: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  tipBody: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
