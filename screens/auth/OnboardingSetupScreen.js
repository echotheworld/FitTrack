import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { auth, database } from '../../utils/firebaseConfig';
import { ref, update } from 'firebase/database';
import { useAuthStore } from '../../store/authStore';
import { useGoalStore } from '../../store/goalStore';
import { Ionicons } from '@expo/vector-icons';
import { encryptData } from '../../utils/encryption';
import { useNotificationStore } from '../../store/notificationStore';

const CompactInput = ({ label, value, unit, onChangeText, placeholder }) => (
  <View style={styles.compactInputBox}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput
        style={styles.textInput}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
      <Text style={styles.unitSmall}>{unit}</Text>
    </View>
  </View>
);

const GoalInput = ({ label, value, unit, icon, onChangeText, subLabel, placeholder }) => (
  <View style={styles.goalInputCard}>
    <View style={styles.goalHeader}>
      <View style={styles.goalIconBox}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.goalTitle}>{label}</Text>
        <Text style={styles.goalSub}>{subLabel}</Text>
      </View>
    </View>
    <View style={styles.goalActionRow}>
      <TextInput
        style={styles.goalTextInput}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
      <Text style={styles.goalUnit}>{unit}</Text>
    </View>
  </View>
);

export default function OnboardingSetupScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    age: '', weight: '', height: '',
    dailyStepGoal: '',
    weeklyDistanceGoal: '',
    dailyCalorieGoal: ''
  });
  const [loading, setLoading] = useState(false);
  const { user, setUser, setOnboardingCompleted } = useAuthStore();
  const { setDailyStepGoal, setDailyCalorieGoal, setWeeklyDistanceGoal } = useGoalStore();

  const validateStep1 = () => {
    const age = parseInt(formData.age);
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (!formData.age || isNaN(age) || age < 5 || age > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 5 and 100.');
      return false;
    }
    if (!formData.weight || isNaN(weight) || weight < 20 || weight > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return false;
    }
    if (!formData.height || isNaN(height) || height < 50 || height > 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height in cm.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const steps = parseInt(formData.dailyStepGoal);
    const distance = parseFloat(formData.weeklyDistanceGoal);
    const calories = parseInt(formData.dailyCalorieGoal);

    if (!formData.dailyStepGoal || isNaN(steps) || steps < 500) {
      Alert.alert('Invalid Steps', 'Please set a daily step goal of at least 500.');
      return false;
    }
    if (!formData.weeklyDistanceGoal || isNaN(distance) || distance < 1) {
      Alert.alert('Invalid Distance', 'Please set a weekly distance goal of at least 1 KM.');
      return false;
    }
    if (!formData.dailyCalorieGoal || isNaN(calories) || calories < 100) {
      Alert.alert('Invalid Calories', 'Please set a daily calorie goal of at least 100 kCal.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const dbUpdates = {
        age: encryptData(formData.age),
        weight: encryptData(formData.weight),
        height: encryptData(formData.height),
        dailyStepGoal: encryptData(formData.dailyStepGoal),
        weeklyDistanceGoal: encryptData(formData.weeklyDistanceGoal),
        dailyCalorieGoal: encryptData(formData.dailyCalorieGoal),
        onboardingCompleted: true
      };

      const localUpdates = {
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        dailyStepGoal: parseInt(formData.dailyStepGoal),
        weeklyDistanceGoal: parseFloat(formData.weeklyDistanceGoal),
        dailyCalorieGoal: parseInt(formData.dailyCalorieGoal),
        onboardingCompleted: true
      };
      
      await update(ref(database, `users/${user.uid}`), dbUpdates);
      
      // Sync with local stores
      setUser({ ...user, ...localUpdates });
      setDailyStepGoal(localUpdates.dailyStepGoal);
      setDailyCalorieGoal(localUpdates.dailyCalorieGoal);
      setWeeklyDistanceGoal(localUpdates.weeklyDistanceGoal);
      
      setOnboardingCompleted(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const { addNotification } = useNotificationStore();

  const handleFinish = async () => {
    await handleSaveProfile();
    
    // Add Welcome Notification
    const firstName = user?.firstName || 'there';
    addNotification({
      type: 'welcome',
      title: `Welcome, ${firstName}!`,
      description: 'Your FitTrack journey begins now. We\'ve set up your personalized goals to help you stay active and healthy.',
      icon: 'sparkles',
      color: COLORS.primary,
    });

    // Add Initial Reminder
    addNotification({
      type: 'reminder',
      title: 'Daily Goal Reminder',
      description: `Don't forget to reach your daily goal of ${formData.dailyStepGoal} steps today!`,
      icon: 'notifications',
      color: '#F59E0B',
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            <View style={styles.headerBox}>
              <Text style={styles.header}>Welcome!</Text>
              <Text style={styles.subHeader}>Let's start with the basics.</Text>
            </View>

            <View style={styles.mainCard}>
              <View style={styles.inputsGrid}>
                <CompactInput 
                  label="Age" 
                  value={formData.age} 
                  unit="yrs" 
                  placeholder="25"
                  onChangeText={(t) => setFormData({...formData, age: t})}
                />
                <View style={styles.divider} />
                <CompactInput 
                  label="Weight" 
                  value={formData.weight} 
                  unit="kg" 
                  placeholder="70"
                  onChangeText={(t) => setFormData({...formData, weight: t})}
                />
                <View style={styles.divider} />
                <CompactInput 
                  label="Height" 
                  value={formData.height} 
                  unit="cm" 
                  placeholder="170"
                  onChangeText={(t) => setFormData({...formData, height: t})}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.headerBox}>
              <View style={styles.backRow}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
                   <Text style={styles.header}>Set Your Goals</Text>
                </View>
              </View>
              <Text style={styles.subHeader}>Personalize your fitness journey.</Text>
            </View>

            <GoalInput 
              label="Daily Steps" 
              subLabel="Recommended: 6,000 - 10,000"
              icon="footsteps"
              value={formData.dailyStepGoal}
              unit="Steps"
              placeholder="6000"
              onChangeText={(t) => setFormData({...formData, dailyStepGoal: t})}
            />

            <GoalInput 
              label="Weekly Distance" 
              subLabel="Total distance goal for the week"
              icon="map"
              value={formData.weeklyDistanceGoal}
              unit="KM"
              placeholder="10"
              onChangeText={(t) => setFormData({...formData, weeklyDistanceGoal: t})}
            />

            <GoalInput 
              label="Daily Calories" 
              subLabel="Estimated active calories target"
              icon="flame"
              value={formData.dailyCalorieGoal}
              unit="kCal"
              placeholder="2000"
              onChangeText={(t) => setFormData({...formData, dailyCalorieGoal: t})}
            />

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.7 }]} 
              onPress={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Finish Setup</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.infoText}>
          {step === 1 ? "We use this to calculate your BMI and daily goals." : "You can always change these later in your profile."}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg, paddingTop: 100 },
  headerBox: { marginBottom: SPACING.xl, alignItems: 'center' },
  header: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  subHeader: { color: COLORS.textSecondary, fontSize: 15, marginTop: 4 },
  
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: SPACING.xl,
  },
  inputsGrid: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  compactInputBox: { flex: 1, alignItems: 'center' },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: COLORS.textSecondary, 
    textTransform: 'uppercase', 
    marginBottom: 8,
    letterSpacing: 0.5
  },
  inputRow: { flexDirection: 'row', alignItems: 'baseline' },
  textInput: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.text, 
    padding: 0,
    textAlign: 'right'
  },
  unitSmall: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    marginLeft: 4,
    marginBottom: 2 
  },
  divider: { width: 1, height: 40, backgroundColor: COLORS.border, marginHorizontal: 10 },
  
  // Step 2 Styles
  backRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 10 },
  backBtn: { padding: 8, backgroundColor: COLORS.accent, borderRadius: 12 },
  
  goalInputCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  goalSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  goalActionRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    backgroundColor: COLORS.background, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 16 
  },
  goalTextInput: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.primary, padding: 0 },
  goalUnit: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 8 },

  button: { 
    backgroundColor: COLORS.primary, 
    height: 56,
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  infoText: { 
    textAlign: 'center', 
    color: COLORS.textSecondary, 
    fontSize: 13, 
    marginTop: 20,
    paddingHorizontal: 20 
  }
});


