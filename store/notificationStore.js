import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';

// Unique ID: timestamp + random suffix — collision-proof
const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      rawNotifications: [],
      notifications: [],
      currentUserUid: null,

      setCurrentUserUid: (uid) => {
        set((state) => ({
          currentUserUid: uid,
          notifications: (state.rawNotifications || []).filter(n => n.userId === uid),
        }));
      },

      addNotification: (notification) => {
        const uid = useAuthStore.getState().user?.uid || null;
        const newNotif = {
          id: generateId(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          userId: uid,
          ...notification,
        };
        set((state) => {
          const nextRaw = (state.rawNotifications || []).some(n => n.id === newNotif.id)
            ? state.rawNotifications
            : [newNotif, ...(state.rawNotifications || [])];
          return {
            rawNotifications: nextRaw,
            notifications: nextRaw.filter(n => n.userId === state.currentUserUid),
          };
        });
      },

      markAllAsRead: () => {
        const uid = get().currentUserUid;
        set((state) => {
          const nextRaw = (state.rawNotifications || []).map(n =>
            n.userId === uid ? { ...n, unread: false } : n
          );
          return {
            rawNotifications: nextRaw,
            notifications: nextRaw.filter(n => n.userId === uid),
          };
        });
      },

      markAsRead: (id) => {
        const uid = get().currentUserUid;
        set((state) => {
          const nextRaw = (state.rawNotifications || []).map(n =>
            n.id === id ? { ...n, unread: false } : n
          );
          return {
            rawNotifications: nextRaw,
            notifications: nextRaw.filter(n => n.userId === uid),
          };
        });
      },

      clearNotifications: () => {
        const uid = get().currentUserUid;
        set((state) => {
          const nextRaw = (state.rawNotifications || []).filter(n => n.userId !== uid);
          return {
            rawNotifications: nextRaw,
            notifications: [],
          };
        });
      },

      // Deduplicates existing persisted notifications — call once on boot
      deduplicateNotifications: () => {
        const uid = get().currentUserUid;
        const seen = new Set();
        set((state) => {
          const nextRaw = (state.rawNotifications || []).filter(n => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          });
          return {
            rawNotifications: nextRaw,
            notifications: nextRaw.filter(n => n.userId === uid),
          };
        });
      },
    }),
    {
      name: 'fittrack-notifications-v3', // NEW KEY forces fresh store, wiping old structure
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        rawNotifications: state.rawNotifications,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Deduplicate and partition on hydration complete
        const seen = new Set();
        const nextRaw = (state.rawNotifications || []).filter(n => {
          if (!n.id || seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
        const uid = useAuthStore.getState().user?.uid || null;
        state.rawNotifications = nextRaw;
        state.currentUserUid = uid;
        state.notifications = nextRaw.filter(n => n.userId === uid);
      },
    }
  )
);

// Subscribe to auth state changes to partition notifications by user
useAuthStore.subscribe((state) => {
  const uid = state.user?.uid || null;
  useNotificationStore.getState().setCurrentUserUid(uid);
});
