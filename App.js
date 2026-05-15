import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { COLORS } from './constants/theme';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import { setupNotifications, scheduleGoalReminders } from './utils/notificationHelper';
import { useGoalStore } from './store/goalStore';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const deduplicateNotifications = useNotificationStore((state) => state.deduplicateNotifications);
  const { dailyStepGoal, weeklyDistanceGoal } = useGoalStore();

  useEffect(() => {
    // 1. Fix any duplicate keys from persisted store immediately on boot
    deduplicateNotifications();

    // 2. Initialize auth
    initializeAuth();

    // 3. Set up notification permissions + schedule automatic daily/weekly goal reminders
    const initNotifications = async () => {
      const granted = await setupNotifications();
      if (granted && dailyStepGoal && weeklyDistanceGoal) {
        await scheduleGoalReminders(dailyStepGoal, weeklyDistanceGoal);
      }
    };
    initNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
