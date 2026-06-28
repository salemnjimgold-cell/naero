import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ServicesScreen from '../screens/ServicesScreen';
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
            case 'Explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Services':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Community':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          ...FONTS.tab,
        },
        tabBarStyle: {
          borderTopColor: COLORS.cardBorder,
          backgroundColor: COLORS.card,
          height: Platform.OS === 'ios' ? 85 : 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 25 : insets.bottom,
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: t('nav.explore') }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ tabBarLabel: t('nav.services') }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarLabel: t('nav.community') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'slide_from_right' }}
        />
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
          component={TabNavigator}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
