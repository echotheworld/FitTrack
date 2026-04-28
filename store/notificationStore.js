import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => {
        const newNotif = {
          id: Date.now().toString(),
          time: 'Just now',
          unread: true,
          ...notification
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications]
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, unread: false }))
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, unread: false } : n
          )
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      }
    }),
    {
      name: 'fittrack-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
