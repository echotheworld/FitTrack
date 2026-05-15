import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import DashboardScreen from '../screens/main/DashboardScreen';
import ProgressScreen   from '../screens/main/ProgressScreen';
import CoachScreen      from '../screens/main/CoachScreen';
import GoalsScreen      from '../screens/main/GoalsScreen';
import ProfileScreen    from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused, size }) => {
          const icons = {
            Home:     focused ? 'home'          : 'home-outline',
            Workouts: focused ? 'fitness'       : 'fitness-outline',
            Coach:    focused ? 'sparkles'      : 'sparkles-outline',
            Goal:     focused ? 'flag'          : 'flag-outline',
            Profile:  focused ? 'person'        : 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'grid-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#EEE',
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 4,
          paddingTop: 6,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"     component={DashboardScreen} />
      <Tab.Screen name="Workouts" component={ProgressScreen} />
      <Tab.Screen
        name="Coach"
        component={CoachScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: focused ? COLORS.primary : COLORS.accent,
              alignItems: 'center', justifyContent: 'center',
              marginTop: -10,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: focused ? 0.35 : 0,
              shadowRadius: 8,
              elevation: focused ? 6 : 0,
            }}>
              <Ionicons name="sparkles" size={22} color={focused ? '#FFF' : COLORS.primary} />
            </View>
          ),
          tabBarLabel: () => null, // No label — floating button style
        }}
      />
      <Tab.Screen name="Goal"    component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
