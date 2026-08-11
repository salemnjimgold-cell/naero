import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FONTS, DEPTH, ACCENT, TEXT, BORDER } from '../theme';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JobsScreen from '../screens/JobsScreen';
import SafetyScreen from '../screens/SafetyScreen';
import AIScreen from '../screens/AIScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ContextualOnboardingScreen from '../screens/ContextualOnboardingScreen';
import PlanShellScreen from '../screens/PlanShellScreen';
import MyNaeroShellScreen from '../screens/MyNaeroShellScreen';
import { featureFlags } from '../config/featureFlags';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'World':
              iconName = focused ? 'globe' : 'globe-outline';
              break;
            case 'People':
              iconName = focused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: ACCENT.primary,
        tabBarInactiveTintColor: TEXT.tertiary,
        tabBarLabelStyle: {
          ...FONTS.tab,
        },
        tabBarStyle: {
          backgroundColor: DEPTH.canvas,
          borderTopColor: BORDER.subtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : insets.bottom,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('nav.home') }}
        listeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}
      />
      <Tab.Screen
        name="World"
        component={DiscoverScreen}
        options={{ tabBarLabel: t('nav.world') }}
        listeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}
      />
      <Tab.Screen
        name="People"
        component={CommunityScreen}
        options={{ tabBarLabel: t('nav.people') }}
        listeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}
      />
    </Tab.Navigator>
  );
}

function ContextualTabNavigator({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const icons = { Home: ['home', 'home-outline'], Discover: ['compass', 'compass-outline'], Plan: ['list', 'list-outline'], MyNaero: ['person-circle', 'person-circle-outline'] };
  return <View style={styles.contextualRoot}><Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ focused, color }) => <Ionicons name={icons[route.name][focused ? 0 : 1]} size={22} color={color} />,
    tabBarActiveTintColor: ACCENT.primary,
    tabBarInactiveTintColor: TEXT.tertiary,
    tabBarLabelStyle: FONTS.tab,
    tabBarItemStyle: { minHeight: 48 },
    tabBarStyle: { backgroundColor: DEPTH.canvas, borderTopColor: BORDER.subtle, borderTopWidth: 1, height: 58 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom },
  })}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
    <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarLabel: t('compass3c.nav.discover') }} />
    <Tab.Screen name="Plan" component={PlanShellScreen} options={{ tabBarLabel: t('compass3c.nav.plan') }} />
    <Tab.Screen name="MyNaero" component={MyNaeroShellScreen} options={{ tabBarLabel: t('compass3c.nav.myNaero') }} />
  </Tab.Navigator><Pressable accessibilityRole="button" accessibilityLabel={t('compass3c.nav.ask')} onPress={() => navigation.navigate('AI')} style={[styles.askButton, { bottom: 72 + insets.bottom }]}><Ionicons name="sparkles" size={24} color={TEXT.primary} /></Pressable></View>;
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={{
      ...DarkTheme,
      dark: true,
      colors: {
        ...DarkTheme.colors,
        primary: ACCENT.primary,
        background: DEPTH.canvas,
        card: DEPTH.surface,
        text: TEXT.primary,
        border: BORDER.subtle,
        notification: ACCENT.primary,
      },
    }}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade',           contentStyle: { backgroundColor: DEPTH.canvas } }}
        />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ animation: 'fade', contentStyle: { backgroundColor: DEPTH.canvas } }}
        />
        <Stack.Screen name="ContextualOnboarding" component={ContextualOnboardingScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="LocationPermission"
          component={LocationPermissionScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Main"
          component={featureFlags.newNavigation ? ContextualTabNavigator : TabNavigator}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Jobs"
          component={JobsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Safety"
          component={SafetyScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AI"
          component={AIScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="PlaceDetail"
          component={PlaceDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ServiceDetail"
          component={ServiceDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="JobDetail"
          component={JobDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="CommunityDetail"
          component={CommunityDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="Community" component={CommunityScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ contextualRoot: { flex: 1 }, askButton: { position: 'absolute', end: 20, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT.primary, borderWidth: 1, borderColor: ACCENT.light, elevation: 5 } });
