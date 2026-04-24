import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

// Use localStorage on web, AsyncStorage on native
const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (name) => {
        const value = localStorage.getItem(name);
        return Promise.resolve(value);
      },
      setItem: (name, value) => {
        localStorage.setItem(name, value);
        return Promise.resolve();
      },
      removeItem: (name) => {
        localStorage.removeItem(name);
        return Promise.resolve();
      },
    };
  }
  // Native: use AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      goals: {
        dailySteps: 10000,
        dailyCalories: 500,
        weeklyMinutes: 150
      },
      activities: [],
      setUser: (user) => set({ user }),
      setGoals: (goals) => set((state) => ({ goals: { ...state.goals, ...goals } })),
      addActivity: (activity) => set((state) => ({ 
        activities: [activity, ...state.activities] 
      })),
      deleteActivity: (id) => set((state) => ({ 
        activities: state.activities.filter(a => a.id !== id) 
      })),
      logout: () => set({ user: null, activities: [] })
    }),
    {
      name: 'fittrack-storage',
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
