import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

const LOGO = require('../../assets/branding/naero-logo.png');

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const links = [
    { icon: 'globe-outline', label: 'Website', url: 'https://naero.me' },
    { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/naero' },
    { icon: 'logo-twitter', label: 'Twitter / X', url: 'https://twitter.com/naero' },
    { icon: 'mail-outline', label: 'Contact Us', url: 'mailto:hello@naero.me' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}>
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={['rgba(6,182,212,0.12)', 'rgba(6,182,212,0.02)']}
              style={styles.logoBg}
            />
            <Image
              source={LOGO}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.tagline}>Not a stranger anymore</Text>
          <Text style={styles.brandName}>Naero v1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.body}>
            Naero helps foreigners, travelers, students, migrants, and newcomers feel safe and
            integrated in any new country. We provide trusted local information, affordable places,
            jobs, community support, and AI-powered guidance.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Who We Serve</Text>
          <View style={styles.tagRow}>
            {['Foreigners', 'Travelers', 'Students', 'Refugees', 'Expats', 'Workers'].map(
              (tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect</Text>
          {links.map((link, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.linkRow, idx < links.length - 1 && styles.linkBorder]}
              onPress={() => Linking.openURL(link.url)}
            >
              <Ionicons name={link.icon} size={20} color={COLORS.primary} />
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="open-outline" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
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
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginVertical: SPACING.xxxl,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  logoBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  tagline: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  brandName: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  body: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  tagText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  linkBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  linkLabel: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
});
