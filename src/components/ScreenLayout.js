import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme';

export default function ScreenLayout({
  children,
  scrollable = false,
  keyboardAvoid = false,
  statusBarStyle = 'light-content',
  statusBarBg = 'transparent',
  padding = SPACING.lg,
  backgroundColor = COLORS.bg,
  style,
  contentContainerStyle,
  bottomInset = true,
}) {
  const insets = useSafeAreaInsets();

  const safeStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: insets.top,
    paddingBottom: bottomInset ? insets.bottom : 0,
  };

  const innerStyle = {
    flex: 1,
    paddingHorizontal: padding,
    ...style,
  };

  const content = (
    <View style={[innerStyle, contentContainerStyle]}>
      {children}
    </View>
  );

  const wrapped = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  const final = keyboardAvoid ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {wrapped}
    </KeyboardAvoidingView>
  ) : (
    wrapped
  );

  return (
    <View style={safeStyle}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} translucent />
      {final}
    </View>
  );
}
