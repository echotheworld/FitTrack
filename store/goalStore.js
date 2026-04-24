import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (name) => Promise.resolve(localStorage.getItem(name)),
      setItem: (name, value) => Promise.resolve(localStorage.setItem(name, value)),
      removeItem: (name) => Promise.resolve(localStorage.removeItem(name)),
    };
  }
  return require('@react-native-async-storage/async-storage').default;
};

export const useGoalStore = create(
  persist(
    (set, get) => ({
      dailyStepGoal: 10000,
      dailyCalorieGoal: 500,
      weeklyDistanceGoal: 50, // in KM
      weeklyActiveDaysGoal: 5,
      
      setDailyStepGoal: (goal) => set({ dailyStepGoal: goal }),
      setDailyCalorieGoal: (goal) => set({ dailyCalorieGoal: goal }),
      setWeeklyDistanceGoal: (goal) => set({ weeklyDistanceGoal: goal }),
      setWeeklyActiveDaysGoal: (goal) => set({ weeklyActiveDaysGoal: goal }),
      
      // Resets goals to defaults (for demo)
      resetToDemoGoals: () => set({
        dailyStepGoal: 10000,
        dailyCalorieGoal: 600,
        weeklyDistanceGoal: 40,
        weeklyActiveDaysGoal: 5
      })
    }),
    {
      name: 'fittrack-goal-storage',
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
