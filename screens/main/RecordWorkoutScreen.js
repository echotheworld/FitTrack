import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { COLORS, SPACING } from '../../constants/theme';
import { useActivityStore } from '../../store/activityStore';
import { useAuthStore } from '../../store/authStore';
import { database } from '../../utils/firebaseConfig';
import { ref, push } from 'firebase/database';

export default function RecordWorkoutScreen({ route, navigation }) {
  const { activityType } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState(0);
  const [sessionSteps, setSessionSteps] = useState(0); // Total steps across all active periods
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  
  const addActivity = useActivityStore(state => state.addActivity);
  const startWorkout = useActivityStore(state => state.startWorkout);
  const updateCurrentWorkout = useActivityStore(state => state.updateCurrentWorkout);
  const clearCurrentWorkout = useActivityStore(state => state.clearCurrentWorkout);

  // Initialize workout in store
  useEffect(() => {
    startWorkout(activityType);
    return () => clearCurrentWorkout();
  }, []);

  // Constants for distance calculation
  const STEP_LENGTH_METERS = 0.762; // Average step length

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Sync duration to store when seconds change
  useEffect(() => {
    if (isActive) {
      updateCurrentWorkout({ duration: Math.ceil(seconds / 60) });
    }
  }, [seconds, isActive]);

  // Pedometer logic
  useEffect(() => {
    let subscription;
 
    const subscribe = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(String(isAvailable));
 
      if (isAvailable && isActive) {
        subscription = Pedometer.watchStepCount(result => {
          const totalSteps = sessionSteps + result.steps;
          setSteps(totalSteps);
          updateCurrentWorkout({ 
            steps: totalSteps,
            distance: parseFloat(((totalSteps * STEP_LENGTH_METERS) / 1000).toFixed(2))
          });
        });
      }
    };
 
    subscribe();
 
    return () => {
      if (subscription) {
        // When pausing, save the current session steps into sessionSteps
        setSessionSteps(prev => steps); 
        subscription.remove();
      }
    };
  }, [isActive]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDistance = () => {
    const distanceKm = (steps * STEP_LENGTH_METERS) / 1000;
    return distanceKm.toFixed(2);
  };

  const handleFinish = () => {
    if (seconds < 5) {
      Alert.alert("Discard Workout", "This session is too short. Discard?", [
        { text: "Continue", style: "cancel" },
        { text: "Discard", onPress: () => navigation.goBack(), style: "destructive" }
      ]);
      return;
    }
    
    setIsActive(false);
    Alert.alert(
      "Finish Workout",
      "Great job! Want to save this session?",
      [
        { text: "Resume", onPress: () => setIsActive(true), style: "cancel" },
        { 
          text: "Save", 
          onPress: async () => {
            const newActivity = {
              type: activityType,
              duration: Math.ceil(seconds / 60),
              distance: parseFloat(calculateDistance()),
              steps: steps,
              date: new Date().toISOString(),
              calories: Math.floor(steps * 0.045)
            };

            // 1. Save locally
            addActivity(newActivity);

            // 2. Save to Firebase
            if (user?.uid) {
              try {
                const activitiesRef = ref(database, `users/${user.uid}/activities`);
                await push(activitiesRef, { ...newActivity, id: Date.now().toString() });
              } catch (error) {
                console.error("Cloud sync failed:", error);
              }
            }

            navigation.navigate('Main');
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.activityLabel}>{activityType.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>Workout Session</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {!isActive && seconds === 0 ? (
          <View style={styles.readyContainer}>
            <Text style={styles.readyTitle}>Start your record now</Text>
            <Text style={styles.readySub}>Your {activityType.toLowerCase()} session is ready.</Text>
            
            <TouchableOpacity 
              style={styles.bigPlayBtn} 
              onPress={() => setIsActive(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={48} color="#FFF" />
              <Text style={styles.playText}>GO</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>ELAPSED TIME</Text>
              <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STEPS</Text>
                <Text style={styles.statValue}>{steps}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DISTANCE (KM)</Text>
                <Text style={styles.statValue}>{calculateDistance()}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              {!isActive ? (
                <TouchableOpacity 
                  style={[styles.controlBtn, styles.saveBtn]} 
                  onPress={handleFinish}
                >
                  <Ionicons name="checkmark" size={32} color="#FFF" />
                  <Text style={styles.btnLabel}>FINISH</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity 
                style={[styles.controlBtn, isActive ? styles.pauseBtn : styles.resumeBtn]} 
                onPress={() => setIsActive(!isActive)}
              >
                <Ionicons name={isActive ? "pause" : "play"} size={32} color="#FFF" />
                <Text style={styles.btnLabel}>{isActive ? "PAUSE" : "RESUME"}</Text>
              </TouchableOpacity>
            </View>

            {/* Tester Buttons (Temporary) */}
            <View style={styles.testerContainer}>
              <Text style={styles.testerLabel}>TESTER TOOLS</Text>
              <View style={styles.testerRow}>
                <TouchableOpacity
                  style={styles.testerBtn}
                  onPress={() => {
                    const newSteps = steps + 1000;
                    setSteps(newSteps);
                    updateCurrentWorkout({ 
                      steps: newSteps,
                      distance: parseFloat(((newSteps * STEP_LENGTH_METERS) / 1000).toFixed(2))
                    });
                  }}
                >
                  <Ionicons name="flash" size={16} color={COLORS.primary} />
                  <Text style={styles.testerText}>+1,000 Steps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testerBtn}
                  onPress={() => {
                    const newSteps = steps + 1;
                    setSteps(newSteps);
                    updateCurrentWorkout({ 
                      steps: newSteps,
                      distance: parseFloat(((newSteps * STEP_LENGTH_METERS) / 1000).toFixed(2))
                    });
                  }}
                >
                  <Ionicons name="add" size={16} color={COLORS.primary} />
                  <Text style={styles.testerText}>+1 Step</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.lg,
    paddingVertical: 20
  },
  activityLabel: { fontSize: 12, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent, borderRadius: 14 },
  
  mainContent: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg },
  
  // Ready State
  readyContainer: { alignItems: 'center' },
  readyTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  readySub: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8, marginBottom: 40 },
  bigPlayBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15
  },
  playText: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 4 },

  // Active State
  activeContainer: { flex: 1, paddingTop: 40 },
  timerBox: { alignItems: 'center', marginBottom: 60 },
  timerLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 2, marginBottom: 12 },
  timerValue: { fontSize: 80, fontWeight: '900', color: COLORS.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 80 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  controlBtn: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  pauseBtn: { backgroundColor: '#F59E0B' },
  resumeBtn: { backgroundColor: COLORS.primary },
  saveBtn: { backgroundColor: '#10B981' },
  btnLabel: { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  
  testerContainer: {
    marginTop: 40,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center'
  },
  testerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 15
  },
  testerRow: {
    flexDirection: 'row',
    gap: 12
  },
  testerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  testerText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8
  }
});
