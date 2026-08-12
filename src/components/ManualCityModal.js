import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

export function ManualCityModal({
  visible,
  initialCity = '',
  loading = false,
  onClose,
  onSave,
}) {
  const [city, setCity] = useState(initialCity);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setCity(initialCity || '');
      setError(null);
    }
  }, [visible, initialCity]);

  const handleSave = async () => {
    const normalized = city.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      setError('Enter a city name.');
      return;
    }
    const result = await onSave(normalized);
    if (result?.error) {
      setError(result.error.message || 'The city could not be saved.');
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            <Text style={styles.title}>Choose your city</Text>
          </View>
          <Text style={styles.description}>
            Use a city manually when you prefer not to share GPS or when location is unavailable.
          </Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={(value) => {
              setCity(value);
              setError(null);
            }}
            placeholder="City, country"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.save} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveText}>Use this city</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  input: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  error: {
    ...FONTS.caption,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancel: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  cancelText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  save: {
    minWidth: 128,
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  saveText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
});
