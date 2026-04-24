import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import ActivityHistoryScreen from '../screens/main/ActivityHistoryScreen';
import ActivityDetailScreen from '../screens/main/ActivityDetailScreen';
import AddActivityScreen from '../screens/main/AddActivityScreen';
import { COLORS } from '../constants/theme';

import OnboardingSetupScreen from '../screens/auth/OnboardingSetupScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import RecordWorkoutScreen from '../screens/main/RecordWorkoutScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, hasCompletedOnboarding, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen name="OnboardingSetup" component={OnboardingSetupScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="RecordWorkout" 
              component={RecordWorkoutScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="AddActivity" 
              component={AddActivityScreen} 
              options={{ 
                headerShown: true, 
                title: 'Add Activity',
                headerStyle: { backgroundColor: COLORS.background },
                headerTintColor: COLORS.text,
                headerShadowVisible: false
              }} 
            />
            <Stack.Screen 
              name="History" 
              component={ActivityHistoryScreen} 
              options={{ 
                headerShown: true, 
                title: 'Activity History',
                headerStyle: { backgroundColor: COLORS.background },
                headerTintColor: COLORS.text,
                headerShadowVisible: false
              }} 
            />
            <Stack.Screen 
              name="ActivityDetail" 
              component={ActivityDetailScreen} 
              options={{ 
                headerShown: true, 
                title: 'Activity Details',
                headerStyle: { backgroundColor: COLORS.background },
                headerTintColor: COLORS.text,
                headerShadowVisible: false
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
