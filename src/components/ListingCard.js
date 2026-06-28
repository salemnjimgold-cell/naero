import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

export function PlaceCard({ item, onPress, onFavorite, isFavorite, wide }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: getCategoryColor(item.category) + '40' }]}>
        <View style={styles.imageGlow}>
          <Ionicons name="image-outline" size={28} color={COLORS.primaryLight} />
        </View>
        {item.priceLevel && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{item.priceLevel}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => onFavorite?.(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={18}
          color={isFavorite ? COLORS.error : COLORS.white}
        />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={COLORS.warning} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewCount}>({item.reviews})</Text>
        </View>
        <View style={styles.tagRow}>
          {item.tags?.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ServiceCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.serviceIcon, { backgroundColor: getServiceColor(item.category) + '18' }]}>
        <Ionicons name={getServiceIcon(item.category)} size={22} color={getServiceColor(item.category)} />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.serviceProvider} numberOfLines={1}>{item.provider}</Text>
        <View style={styles.serviceMeta}>
          <View style={styles.priceTag}>
            <Ionicons name="pricetag-outline" size={12} color={COLORS.primary} />
            <Text style={styles.priceLabel}>{item.price}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

export function JobCard({ item, onPress, onSave, isSaved }) {
  return (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobIcon}>
          <Ionicons name={getJobIcon(item.type)} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.jobCompany} numberOfLines={1}>{item.company}</Text>
        </View>
        <TouchableOpacity onPress={() => onSave?.(item.id)}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? COLORS.primary : COLORS.textTertiary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.jobMeta}>
        <View style={styles.jobMetaItem}>
          <Ionicons name="briefcase-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.jobMetaText}>{getJobTypeLabel(item.type)}</Text>
        </View>
        <View style={styles.jobMetaItem}>
          <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.jobMetaText} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.jobMetaItem}>
          <Ionicons name="cash-outline" size={13} color={COLORS.primary} />
          <Text style={[styles.jobMetaText, { color: COLORS.primary }]}>{item.salary}</Text>
        </View>
      </View>
      <View style={styles.tagRow}>
        {item.tags?.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export function CommunityCard({ item, onPress }) {
  const typeColors = {
    post: COLORS.primary,
    review: COLORS.secondary,
    tip: COLORS.warning,
    alert: COLORS.error,
  };

  return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: typeColors[item.type] || COLORS.primary }]}>
          <Ionicons name="person" size={16} color={COLORS.white} />
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.postTime}>{item.timestamp}</Text>
        </View>
        <View style={[styles.postType, { backgroundColor: (typeColors[item.type] || COLORS.primary) + '18' }]}>
          <Text style={[styles.postTypeText, { color: typeColors[item.type] || COLORS.primary }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      <View style={styles.postActions}>
        <View style={styles.postAction}>
          <Ionicons name="heart-outline" size={16} color={COLORS.textTertiary} />
          <Text style={styles.postActionText}>{item.likes}</Text>
        </View>
        <View style={styles.postAction}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.textTertiary} />
          <Text style={styles.postActionText}>{item.comments?.length || 0}</Text>
        </View>
        <Ionicons name="share-outline" size={16} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

function getCategoryColor(category) {
  const colors = {
    restaurants: COLORS.primary,
    landmarks: COLORS.purple,
    healthcare: COLORS.secondary,
    education: '#8B5CF6',
    shopping: '#EC4899',
    transport: COLORS.warning,
    housing: COLORS.accent,
    entertainment: COLORS.error,
    government: COLORS.accent,
    religious: '#A855F7',
  };
  return colors[category] || COLORS.primary;
}

function getServiceColor(category) {
  const colors = {
    legal: COLORS.purple,
    translation: '#8B5CF6',
    housing: COLORS.secondary,
    healthcare: COLORS.error,
    education: COLORS.warning,
    transport: COLORS.accent,
    banking: COLORS.secondary,
    food: COLORS.primary,
  };
  return colors[category] || COLORS.primary;
}

function getServiceIcon(category) {
  const icons = {
    legal: 'shield-checkmark',
    translation: 'language',
    housing: 'home',
    healthcare: 'medkit',
    education: 'school',
    transport: 'car',
    banking: 'wallet',
    food: 'fast-food',
  };
  return icons[category] || 'help-buoy';
}

function getJobIcon(type) {
  const icons = {
    'full-time': 'briefcase',
    'part-time': 'time',
    freelance: 'laptop',
    internship: 'school',
    volunteer: 'heart',
  };
  return icons[type] || 'briefcase';
}

function getJobTypeLabel(type) {
  const labels = {
    'full-time': 'Full-Time',
    'part-time': 'Part-Time',
    freelance: 'Freelance',
    internship: 'Internship',
    volunteer: 'Volunteer',
  };
  return labels[type] || type;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  imagePlaceholder: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageGlow: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  priceText: {
    ...FONTS.smallBold,
    color: COLORS.textPrimary,
  },
  favoriteBtn: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 2,
  },
  ratingText: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
  },
  reviewCount: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tagText: {
    ...FONTS.small,
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  serviceContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  serviceName: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  serviceProvider: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    ...FONTS.smallBold,
    color: COLORS.primary,
  },
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  jobIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  jobInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  jobTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  jobCompany: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    ...FONTS.small,
    color: COLORS.textTertiary,
  },
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  postAuthorInfo: {
    flex: 1,
  },
  authorName: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
  },
  postTime: {
    ...FONTS.small,
    color: COLORS.textTertiary,
  },
  postType: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  postTypeText: {
    ...FONTS.smallBold,
    fontSize: 11,
  },
  postContent: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    ...FONTS.small,
    color: COLORS.textTertiary,
  },
});
