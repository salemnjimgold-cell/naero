import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';
import { CommunityCard } from '../components/ListingCard';
import { EmptyState } from '../components/EmptyState';

const LOGO = require('../../assets/branding/naero-logo.png');

export default function CommunityScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { communityService, userCity } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const result = await communityService.getPosts();
    if (result.data) setPosts(result.data);
    setLoading(false);
  }

  const handlePostPress = useCallback((item) => {
    navigation.navigate('CommunityDetail', { item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('community.title')}</Text>
            <Text style={styles.subtitle}>{t('community.subtitle')}</Text>
          </View>
          <Image source={LOGO} style={{ width: 44, height: 44 }} resizeMode="contain" />
        </View>
      </LinearGradient>

      <TouchableOpacity style={styles.createPost} activeOpacity={0.7}>
        <Image source={LOGO} style={{ width: 30, height: 30 }} resizeMode="contain" />
        <Text style={styles.createPostText}>{t('community.writePost')}</Text>
        <View style={styles.createPostBtn}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommunityCard item={item} onPress={handlePostPress} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <EmptyState message={t('community.noPosts')} mascotSize={72} />
          )
        }
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
    alignItems: 'center',
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
  createPost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  createPostText: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.textTertiary,
  },
  createPostBtn: {},
  list: {
    paddingHorizontal: SPACING.xl,
  },

});
