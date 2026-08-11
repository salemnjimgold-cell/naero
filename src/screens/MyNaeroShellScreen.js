import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ACCENT, BORDER, DEPTH, FONTS, RADIUS, SPACING, TEXT } from '../theme';
import { useApp } from '../context/AppContext';
import core from '../domain/onboardingContextCore';

export default function MyNaeroShellScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { auth, isAuthenticated } = useApp();
  const insets = useSafeAreaInsets();
  const [context, setContext] = useState(null);
  const tx = (key) => t(`compass3c.mine.${key}`);
  useFocusEffect(useCallback(() => { let active = true; AsyncStorage.getItem(core.STORAGE_KEY).then((raw) => { if (active) setContext(core.parseStoredContext(raw)); }); return () => { active = false; }; }, []));
  const Row = ({ icon, title, value, onPress }) => <Pressable accessibilityRole={onPress ? 'button' : 'text'} onPress={onPress} disabled={!onPress} style={styles.row}><Ionicons name={icon} size={24} color={ACCENT.light} /><View style={styles.copy}><Text style={styles.label}>{title}</Text>{value ? <Text style={styles.value}>{value}</Text> : null}</View>{onPress ? <Ionicons name="chevron-forward" size={20} color={TEXT.tertiary} /> : null}</Pressable>;
  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + SPACING.xxl, paddingBottom: insets.bottom + 100, paddingHorizontal: SPACING.xl }}><Text accessibilityRole="header" style={styles.title}>{tx('title')}</Text><View style={styles.card}><Row icon="location-outline" title={tx('context')} value={context?.municipality ? `${context.municipality}, ${context.country}` : tx('unknown')} /><Row icon="language-outline" title={tx('language')} value={i18n.language.toUpperCase()} /><Row icon="person-outline" title={tx('account')} value={isAuthenticated && auth?.mode === 'authenticated' ? tx('signedIn') : tx('guest')} /></View><View style={styles.card}><Row icon="settings-outline" title={tx('profile')} onPress={() => navigation.navigate('Profile')} /><Row icon="people-outline" title={tx('community')} onPress={() => navigation.navigate('Community')} /></View></ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: DEPTH.canvas }, title: { ...FONTS.h1, color: TEXT.primary, marginBottom: SPACING.xxl }, card: { borderWidth: 1, borderColor: BORDER.subtle, borderRadius: RADIUS.lg, backgroundColor: DEPTH.surface, marginBottom: SPACING.lg, overflow: 'hidden' }, row: { minHeight: 68, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: BORDER.subtle }, copy: { flex: 1 }, label: { ...FONTS.bodyBold, color: TEXT.primary }, value: { ...FONTS.caption, color: TEXT.secondary, marginTop: 2 } });
