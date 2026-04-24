import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { auth, database } from '../utils/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useActivityStore } from './activityStore';
import { useGoalStore } from './goalStore';

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

export const useAuthStore = create(
  persist(
    (set, getStore) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      hasSeenOnboarding: false,
      loading: true,
      preferences: {
        isMetric: true,
        notifsEnabled: true
      },
      
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      
      setPreferences: (newPrefs) => set((state) => ({ 
        preferences: { ...state.preferences, ...newPrefs } 
      })),
      
      setUser: (userData) => {
        const currentUser = getStore().user;
        
        // Only clear activities if logging in as a DIFFERENT user
        if (userData && currentUser && userData.uid !== currentUser.uid) {
          useActivityStore.getState().clearActivities();
        }
        
        if (userData) {
          // Sync goals from user profile if they exist in the database
          const goalStore = useGoalStore.getState();
          if (userData.dailyStepGoal) goalStore.setDailyStepGoal(userData.dailyStepGoal);
          if (userData.dailyCalorieGoal) goalStore.setDailyCalorieGoal(userData.dailyCalorieGoal);
          if (userData.weeklyDistanceGoal) goalStore.setWeeklyDistanceGoal(userData.weeklyDistanceGoal);
        }

        set({ 
          user: userData, 
          isAuthenticated: !!userData,
          hasCompletedOnboarding: userData ? (!!userData.age && !!userData.weight && !!userData.height) : false 
        });
      },

      setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
      
      setLoading: (loading) => set({ loading }),

      logout: async () => {
        const { clearActivities } = useActivityStore.getState();
        await signOut(auth);
        clearActivities(); // Reset all activities on logout
        set({ user: null, isAuthenticated: false, hasCompletedOnboarding: false });
      },

      initializeAuth: () => {
        console.log("Initializing Auth...");
        onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("Auth State Changed. User:", firebaseUser ? firebaseUser.email : "None");
          const { setActivities, clearActivities } = useActivityStore.getState();
          
          if (firebaseUser) {
            try {
              const userRef = ref(database, `users/${firebaseUser.uid}`);
              const snapshot = await get(userRef);
              
              if (snapshot.exists()) {
                const userData = snapshot.val();
                set({ 
                  user: { ...userData, uid: firebaseUser.uid }, 
                  isAuthenticated: true,
                  hasCompletedOnboarding: !!userData.age && !!userData.weight && !!userData.height
                });

                // FETCH ACTIVITIES FROM FIREBASE
                try {
                  const activitiesRef = ref(database, `users/${firebaseUser.uid}/activities`);
                  const actSnapshot = await get(activitiesRef);
                  if (actSnapshot.exists()) {
                    const acts = Object.values(actSnapshot.val());
                    setActivities(acts.sort((a, b) => new Date(b.date) - new Date(a.date)));
                  }
                } catch (e) {
                  console.error("Error fetching activities:", e);
                }

              } else {
                clearActivities(); // New account starts at 0
                set({ 
                  user: { email: firebaseUser.email, uid: firebaseUser.uid }, 
                  isAuthenticated: true,
                  hasCompletedOnboarding: false 
                });
              }
            } catch (error) {
              set({ 
                user: { email: firebaseUser.email, uid: firebaseUser.uid }, 
                isAuthenticated: true,
                hasCompletedOnboarding: false 
              });
            }
          } else {
            clearActivities();
            set({ user: null, isAuthenticated: false, hasCompletedOnboarding: false });
          }
          set({ loading: false });
        });
      }
    }),
    {
      name: 'fittrack-auth-storage',
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
