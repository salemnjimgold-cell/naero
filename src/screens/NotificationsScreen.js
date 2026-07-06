import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';
import { naeroNotifications, trackScreenView } from '../services';
import { EmptyState } from '../components/EmptyState';

const NOTIF_ICONS = {
  review: 'chatbubble-ellipses-outline',
  place: 'location-outline',
  saved_place: 'heart-outline',
  profile: 'person-outline',
  system: 'settings-outline',
  default: 'notifications-outline',
};

const NOTIF_COLORS = {
  review: COLORS.primary,
  place: COLORS.success,
  saved_place: COLORS.error,
  profile: COLORS.purple,
  system: COLORS.warning,
  default: COLORS.textSecondary,
};

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { fetchNotifications } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    trackScreenView('Notifications');
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const result = await naeroNotifications.getAll(50, 0);
    if (result.data) {
      setNotifications(result.data);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifications();
    await fetchNotifications();
    setRefreshing(false);
  }

  async function handleMarkRead(id) {
    await naeroNotifications.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetchNotifications();
  }

  async function handleMarkAllRead() {
    await naeroNotifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }) => {
    const type = item.type || 'default';
    const icon = NOTIF_ICONS[type] || NOTIF_ICONS.default;
    const color = NOTIF_COLORS[type] || NOTIF_COLORS.default;

    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.read && styles.notifUnread]}
        onPress={() => handleMarkRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
            {item.title || 'Notification'}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.body || item.message || ''}
          </Text>
          <Text style={styles.notifTime}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ flex: 1 }} />
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        {unreadCount > 0 && (
          <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications"
          message="You're all caught up!"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    flex: 1,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  markAllText: {
    ...FONTS.smallBold,
    color: COLORS.primary,
  },
  unreadLabel: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    marginLeft: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  notifUnread: {
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primary + '06',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  notifTitleUnread: {
    color: COLORS.white,
  },
  notifBody: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  notifTime: {
    ...FONTS.small,
    color: COLORS.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});
