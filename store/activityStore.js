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

export const useActivityStore = create(
  persist(
    (set, get) => ({
      activities: [],
      waterIntake: 0,
      currentWorkout: null, // { type, steps, distance, duration, startTime }
      
      addActivity: (activity) => set((state) => ({ 
        activities: [
          { ...activity, id: Date.now().toString() }, 
          ...state.activities
        ].sort((a, b) => new Date(b.date) - new Date(a.date)),
        currentWorkout: null // Clear current workout when saved
      })),

      startWorkout: (type) => set({ 
        currentWorkout: { 
          type, 
          steps: 0, 
          distance: 0, 
          duration: 0, 
          startTime: new Date().toISOString() 
        } 
      }),

      updateCurrentWorkout: (updates) => set((state) => ({
        currentWorkout: state.currentWorkout ? { ...state.currentWorkout, ...updates } : null
      })),

      clearCurrentWorkout: () => set({ currentWorkout: null }),

      setActivities: (activities) => set({ activities: activities || [] }),
      
      clearActivities: () => set({ activities: [], waterIntake: 0, currentWorkout: null }),
      
      deleteActivity: (id) => set((state) => ({ 
        activities: state.activities.filter(a => a.id !== id) 
      })),

      updateActivity: (id, updatedActivity) => set((state) => ({
        activities: state.activities.map(a => a.id === id ? { ...a, ...updatedActivity } : a)
      })),
      
      updateWaterIntake: (amount) => set((state) => ({ 
        waterIntake: Math.max(0, state.waterIntake + amount) 
      })),

      getActivitiesByDateRange: (range) => {
        const now = new Date();
        const { activities } = get();
        if (range === 'Week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return activities.filter(a => new Date(a.date) >= weekAgo);
        }
        if (range === 'Month') {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return activities.filter(a => new Date(a.date) >= monthAgo);
        }
        return activities;
      }
    }),
    {
      name: 'fittrack-activity-storage-v2',
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
