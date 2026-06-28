import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

const TYPE_CONFIG = {
  post: { color: COLORS.primary, label: 'Post' },
  review: { color: COLORS.secondary, label: 'Review' },
  tip: { color: COLORS.warning, label: 'Tip' },
  alert: { color: COLORS.error, label: 'Alert' },
};

export default function CommunityDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.post;
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);

  const handleAddComment = useCallback(() => {
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), text: comment.trim(), author: 'You' },
    ]);
    setComment('');
  }, [comment]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('community.post')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={[styles.avatar, { backgroundColor: typeCfg.color }]}>
              <Ionicons name="person" size={18} color={COLORS.white} />
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.author}</Text>
              <Text style={styles.postTime}>{item.timestamp}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: typeCfg.color + '18' }]}>
              <Text style={[styles.typeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
            </View>
          </View>
          <Text style={styles.postContent}>{item.content}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionItem} onPress={() => setLiked(!liked)}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={18}
                color={liked ? COLORS.error : COLORS.textTertiary}
              />
              <Text style={styles.actionText}>{item.likes + (liked ? 1 : 0)}</Text>
            </TouchableOpacity>
            <View style={styles.actionItem}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.textTertiary} />
              <Text style={styles.actionText}>{item.comments + comments.length}</Text>
            </View>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="share-outline" size={18} color={COLORS.textTertiary} />
              <Text style={styles.actionText}>{t('community.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>{t('community.comments')}</Text>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentCard}>
                <View style={[styles.commentAvatar, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="person" size={14} color={COLORS.primary} />
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{c.author}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.commentBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={t('community.addComment')}
          placeholderTextColor={COLORS.textTertiary}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !comment.trim() && { opacity: 0.5 }]}
          onPress={handleAddComment}
          disabled={!comment.trim()}
        >
          <Ionicons name="send" size={18} color={COLORS.primary} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
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
  },
  postCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.xl,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  authorInfo: {
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
  typeBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    ...FONTS.smallBold,
    fontSize: 11,
  },
  postContent: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...FONTS.small,
    color: COLORS.textTertiary,
  },
  commentsSection: {
    paddingHorizontal: SPACING.xl,
  },
  commentsTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  commentText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    maxHeight: 80,
    ...FONTS.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(6,182,212,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
});
