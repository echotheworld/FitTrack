import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { COLORS } from './constants/theme';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
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
