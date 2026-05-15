import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Unique ID: timestamp + random suffix — collision-proof
const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotif = {
          id: generateId(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          ...notification,
        };
        set((state) => ({
          // Guard: never add if same title+description already exists with same time (double-fire protection)
          notifications: state.notifications.some(n => n.id === newNotif.id)
            ? state.notifications
            : [newNotif, ...state.notifications],
        }));
      },

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, unread: false })),
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, unread: false } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Deduplicates existing persisted notifications — call once on boot
      deduplicateNotifications: () => {
        const seen = new Set();
        set((state) => ({
          notifications: state.notifications.filter(n => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          }),
        }));
      },
    }),
    {
      name: 'fittrack-notifications-v2', // NEW KEY forces fresh store, wiping old duplicate data
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Deduplicate on every rehydration from storage
        const seen = new Set();
        state.notifications = state.notifications.filter(n => {
          if (!n.id || seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
      },
    }
  )
);
