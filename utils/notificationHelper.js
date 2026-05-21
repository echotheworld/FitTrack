import { Platform, LogBox } from 'react-native';
import { useNotificationStore } from '../store/notificationStore';
import { COLORS } from '../constants/theme';

// Ignore the SDK 53/54 Expo Go push notification warning in LogBox
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

let Notifications = null;
try {
  // Temporarily override console.error and console.warn to prevent the Expo Go warning
  // from triggering a full-screen red box during require.
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('expo-notifications: Android Push notifications')) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('expo-notifications: Android Push notifications')) {
      return;
    }
    originalConsoleWarn(...args);
  };

  Notifications = require('expo-notifications');

  // Restore original console functions
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
} catch (_) {
  console.log('[FitTrack] Notifications module not available (expected in Expo Go Android)');
}

// ─── Notification Handler (foreground) ───────────────────────────────────────
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('[FitTrack] Failed to set notification handler:', e.message);
    Notifications = null; // Disable if it fails
  }
}

// ─── Permission + Channel Setup ───────────────────────────────────────────────
export const setupNotifications = async () => {
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fittrack-reminders', {
      name: 'FitTrack Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: COLORS.primary,
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
  }
  return true;
};

// ─── Activity-specific messages ───────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  Run: {
    title: '🏃 Time to Run!',
    body: (gap) => `You're ${gap}km from your weekly goal — hit the pavement!`,
    icon: 'walk',
    color: '#F97316',
  },
  'Trail Run': {
    title: '🌲 Trails are Calling!',
    body: (gap) => `Only ${gap}km left on your weekly goal. Trail time!`,
    icon: 'map-outline',
    color: '#10B981',
  },
  Walk: {
    title: '🚶 Step it Up!',
    body: (gap) => `${gap} more steps to hit today's goal. Take a walk!`,
    icon: 'footsteps-outline',
    color: '#3B82F6',
  },
  Hike: {
    title: '⛰️ Adventure Awaits!',
    body: (gap) => `${gap}km left on your weekly goal — lace up your boots!`,
    icon: 'trail-sign-outline',
    color: '#8B5CF6',
  },
  Wheelchair: {
    title: '♿ Keep Moving!',
    body: (gap) => `${gap}km away from your goal. Ready for a session?`,
    icon: 'body-outline',
    color: '#EC4899',
  },
};

// ─── Send a reminder (in-app store + local push) ─────────────────────────────
export const sendActivityReminder = async (activityType, gap) => {
  const cfg = ACTIVITY_CONFIG[activityType] ?? ACTIVITY_CONFIG.Walk;
  const body = cfg.body(gap);

  // 1. In-app notification store
  useNotificationStore.getState().addNotification({
    title: cfg.title,
    description: body,
    icon: cfg.icon,
    color: cfg.color,
    type: 'reminder',
    activity: activityType,
  });

  // 2. Local device push notification
  if (Notifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: cfg.title,
          body,
          data: { activityType },
          ...(Platform.OS === 'android' && { channelId: 'fittrack-reminders' }),
        },
        trigger: null, // fire immediately
      });
    } catch (e) {
      console.warn('[FitTrack] Push notification failed:', e.message);
    }
  }
};

// ─── Automatic goal-progress check ───────────────────────────────────────────
// Call this from App.js on mount. Fires reminders based on unmet goals.
export const scheduleGoalReminders = async (dailyStepGoal, weeklyDistanceGoal) => {
  if (!Notifications) return;
  const permitted = await setupNotifications();
  if (!permitted) return;

  // Cancel old FitTrack-scheduled reminders before rescheduling
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content?.data?.fittrackReminder) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  // Daily step reminder — fires at 6 PM if goal likely unmet
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚶 Daily Step Reminder',
      body: `Don't forget — your goal is ${dailyStepGoal.toLocaleString()} steps today! Time for a walk.`,
      data: { fittrackReminder: true, type: 'steps' },
      ...(Platform.OS === 'android' && { channelId: 'fittrack-reminders' }),
    },
    trigger: {
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });

  // Weekly distance nudge — fires every Sunday at 10 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 Weekly Goal Check-in',
      body: `Your weekly distance target is ${weeklyDistanceGoal}km. How are you tracking?`,
      data: { fittrackReminder: true, type: 'weekly' },
      ...(Platform.OS === 'android' && { channelId: 'fittrack-reminders' }),
    },
    trigger: {
      weekday: 1, // Sunday (1 = Sun in Expo)
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });
};

// ─── Coach-specific Personalized Notifications ──────────────────────────────
/**
 * Triggers a notification based on the Coach's local intelligence.
 * @param {Object} ctx - The activity context (steps, goals, streak, etc.)
 * @param {string} type - 'morning' | 'evening' | 'milestone' | 'random'
 */
export const sendCoachReminder = async (ctx, type = 'random') => {
  const { getCoachMessage, getLocalResponse } = require('./coachEngine');
  const firstName = ctx.firstName || 'Athlete';
  
  let title = "💡 FitCoach Tip";
  let body = "";

  if (type === 'morning') {
    title = `☀️ Morning, ${firstName}!`;
    body = getCoachMessage({ ...ctx, mood: 'slow_start' });
  } else if (type === 'evening' && ctx.mood === 'near_goal') {
    title = `🚀 Almost there, ${firstName}!`;
    body = getCoachMessage({ ...ctx, mood: 'near_goal' });
  } else if (ctx.mood === 'goal_achieved') {
    title = `🏆 Champion status!`;
    body = getCoachMessage({ ...ctx, mood: 'goal_achieved' });
  } else {
    // Random expert advice from the intentional dataset
    body = getLocalResponse("give me a tip", ctx);
  }

  // 1. In-app store
  useNotificationStore.getState().addNotification({
    title,
    description: body,
    icon: 'sparkles',
    color: COLORS.primary,
    type: 'coach',
  });

  // 2. Push Notification (if available)
  if (Notifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { screen: 'Coach' },
        },
        trigger: null, // Instant push for now
      });
    } catch (e) {
      console.log('[FitTrack] Push failed:', e.message);
    }
  }
};
