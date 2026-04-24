import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, update } from 'firebase/database';
import { database } from '../../utils/firebaseConfig';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useGoalStore } from '../../store/goalStore';
import { useActivityStore } from '../../store/activityStore';
import { getMondayOfCurrentWeek, calculateStatsForPeriod } from '../../utils/statsHelper';

export default function GoalsScreen() {
  const { user } = useAuthStore();
  const activities = useActivityStore(state => state.activities);
  const currentWorkout = useActivityStore(state => state.currentWorkout);

  // Source goals from user profile first (Database), then fallback to local store
  const storeGoals = useGoalStore();
  const dailyStepGoal = user?.dailyStepGoal || storeGoals.dailyStepGoal;
  const dailyCalorieGoal = user?.dailyCalorieGoal || storeGoals.dailyCalorieGoal;
  const weeklyDistanceGoal = user?.weeklyDistanceGoal || storeGoals.weeklyDistanceGoal;
  
  const { 
    setDailyStepGoal,
    setDailyCalorieGoal,
    setWeeklyDistanceGoal,
  } = storeGoals;
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [suggestedPlan, setSuggestedPlan] = useState(null);

  // Simulated AI Logic
  const handleAIGenerate = () => {
    if (!aiPrompt) return Alert.alert("AI Architect", "Please describe your goal first!");
    
    setIsAnalyzing(true);
    
    // Simulate thinking...
    setTimeout(() => {
      const text = aiPrompt.toLowerCase();
      let steps = 10000;
      let dist = 40;
      let kcal = 500;
      let planName = "Balanced Fitness";

      if (text.includes('marathon') || text.includes('pro') || text.includes('athlete')) {
        steps = 15000; dist = 80; kcal = 800; planName = "Elite Performance";
      } else if (text.includes('weight loss') || text.includes('burn') || text.includes('slim')) {
        steps = 12000; dist = 50; kcal = 700; planName = "Weight Loss Warrior";
      } else if (text.includes('beginner') || text.includes('start') || text.includes('easy')) {
        steps = 6000; dist = 20; kcal = 300; planName = "Starter Path";
      } else if (text.includes('hike') || text.includes('trail')) {
        steps = 8000; dist = 60; kcal = 600; planName = "Trail Explorer";
      }

      setSuggestedPlan({ steps, dist, kcal, planName });
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleConfirmPlan = async () => {
    if (!suggestedPlan) return;
    
    const { steps, dist, kcal } = suggestedPlan;
    
    try {
      // 1. Update local stores
      setDailyStepGoal(steps);
      setDailyCalorieGoal(kcal);
      setWeeklyDistanceGoal(dist);
      
      // 2. Persist to Firebase
      if (user?.uid) {
        const updates = {
          dailyStepGoal: steps,
          dailyCalorieGoal: kcal,
          weeklyDistanceGoal: dist
        };
        await update(ref(database, `users/${user.uid}`), updates);
        useAuthStore.getState().setUser({ ...user, ...updates });
      }

      setSuggestedPlan(null);
      setShowAI(false);
      setAiPrompt('');
      Alert.alert("AI Architect", "Plan Applied! Your goals have been updated successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to apply plan. Please try again.");
    }
  };

  // Calculate Progress (Current Week - Monday start)
  const monday = getMondayOfCurrentWeek();
  const stats = calculateStatsForPeriod(activities, monday, new Date(), currentWorkout);

  const handleEdit = (key, currentVal) => {
    setEditingKey(key);
    setEditValue(currentVal.toString());
  };

  const handleSave = async () => {
    const val = parseInt(editValue) || 0;
    if (val <= 0) {
      Alert.alert("Invalid Goal", "Please enter a value greater than 0.");
      return;
    }

    const updates = {};
    if (editingKey === 'steps') {
      setDailyStepGoal(val);
      updates.dailyStepGoal = val;
    }
    if (editingKey === 'calories') {
      setDailyCalorieGoal(val);
      updates.dailyCalorieGoal = val;
    }
    if (editingKey === 'distance') {
      setWeeklyDistanceGoal(val);
      updates.weeklyDistanceGoal = val;
    }

    // Persist to Firebase
    if (user?.uid) {
      try {
        await update(ref(database, `users/${user.uid}`), updates);
        // Also update local user object in authStore
        useAuthStore.getState().setUser({ ...user, ...updates });
      } catch (error) {
        Alert.alert("Error", "Failed to save goal to cloud. Please check your connection.");
      }
    }

    setEditingKey(null);
  };

  const GoalCard = ({ title, keyName, current, target, unit, icon, color }) => {
    const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const isEditing = editingKey === keyName;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <TouchableOpacity 
            onPress={() => isEditing ? handleSave() : handleEdit(keyName, target)}
            style={styles.editBtn}
          >
            <Ionicons name={isEditing ? "checkmark-sharp" : "pencil-sharp"} size={18} color={isEditing ? COLORS.success : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>{title}</Text>
        
        <View style={styles.progressInfo}>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              autoFocus
              placeholder="Target"
            />
          ) : (
            <Text style={styles.mainValue}>{current.toLocaleString()} <Text style={styles.targetLabel}>/ {target.toLocaleString()} {unit}</Text></Text>
          )}
          <Text style={[styles.percentLabel, { color }]}>{percent}%</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  // Overall Weekly Completion
  const overallPercent = Math.round(
    ((stats.steps / (dailyStepGoal * 7)) + 
     (stats.distance / weeklyDistanceGoal) + 
     (stats.calories / (dailyCalorieGoal * 7))) / 3 * 100
  ) || 0;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <Text style={styles.headerSubtitle}>Weekly Progress Tracking</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* AI Architect Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAI}
          onRequestClose={() => setShowAI(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAI(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="sparkles" size={22} color="#FFF" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.modalTitle}>AI Goal Architect</Text>
                    <Text style={styles.modalSub}>Intelligent Plan Designer</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowAI(false)}>
                  <Ionicons name="close" size={28} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.aiDescription}>
                {suggestedPlan 
                  ? `For you to reach your ${suggestedPlan.planName} goals, we recommend the following targets:` 
                  : "Tell me your fitness goals and I'll generate a custom weekly plan for you."}
              </Text>

              {suggestedPlan ? (
                <View style={styles.suggestionContainer}>
                  <View style={styles.suggestionRow}>
                    <View style={styles.suggestedItem}>
                      <Ionicons name="footsteps" size={20} color={COLORS.primary} />
                      <Text style={styles.suggestedValue}>{suggestedPlan.steps.toLocaleString()}</Text>
                      <Text style={styles.suggestedLabel}>Daily Steps</Text>
                    </View>
                    <View style={styles.suggestedItem}>
                      <Ionicons name="location" size={20} color="#10B981" />
                      <Text style={styles.suggestedValue}>{suggestedPlan.dist}km</Text>
                      <Text style={styles.suggestedLabel}>Weekly Dist</Text>
                    </View>
                    <View style={styles.suggestedItem}>
                      <Ionicons name="flame" size={20} color={COLORS.accentOrange} />
                      <Text style={styles.suggestedValue}>{suggestedPlan.kcal}</Text>
                      <Text style={styles.suggestedLabel}>Daily kcal</Text>
                    </View>
                  </View>

                  <Text style={styles.confirmationText}>Would you like to apply this plan now?</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.cancelBtn} 
                      onPress={() => setSuggestedPlan(null)}
                    >
                      <Text style={styles.cancelBtnText}>Discard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmBtn} 
                      onPress={handleConfirmPlan}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.confirmBtnText}>Apply Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.modalAiInput}
                    placeholder="Type your intent here..."
                    placeholderTextColor="#94A3B8"
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    multiline
                  />

                  <TouchableOpacity 
                    style={[styles.aiBtn, isAnalyzing && { opacity: 0.7 }]} 
                    onPress={handleAIGenerate}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.aiBtnText}>Architect My Plan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Overall Progress Card */}
        <View style={styles.overallCard}>
          <View style={styles.overallInfo}>
            <View>
              <Text style={styles.overallValue}>{overallPercent}%</Text>
              <Text style={styles.overallLabel}>Weekly Completion</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity 
                style={styles.aiToggleBtn} 
                onPress={() => setShowAI(true)}
              >
                <Ionicons name="sparkles" size={24} color="#6366F1" />
              </TouchableOpacity>
              <Ionicons name="trophy" size={48} color="#FFD700" />
            </View>
          </View>
          <Text style={styles.motivationalText}>
            {overallPercent >= 80 ? "Phenomenal work! You're dominating this week! 🏆" : 
             overallPercent >= 50 ? "Strong momentum! You're halfway to greatness. 💪" : 
             "Consistency is key. Let's hit those targets today! 🔥"}
          </Text>
        </View>

        {/* Goal Cards Grid */}
        <View style={styles.grid}>
          <GoalCard title="Daily Steps Target" keyName="steps" current={stats.steps / (new Date().getDay() || 7)} target={dailyStepGoal} unit="steps" icon="footsteps" color="#6366F1" />
          <GoalCard title="Weekly Distance" keyName="distance" current={stats.distance} target={weeklyDistanceGoal} unit="km" icon="location" color="#10B981" />
          <GoalCard title="Daily Calorie Goal" keyName="calories" current={stats.calories / (new Date().getDay() || 7)} target={dailyCalorieGoal} unit="kcal" icon="flame" color={COLORS.accentOrange} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 80,
    paddingBottom: 30,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 4 },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  
  overallCard: {
    backgroundColor: '#1F2937',
    borderRadius: 32,
    padding: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  overallInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  overallValue: { color: '#FFF', fontSize: 36, fontWeight: '800' },
  overallLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  motivationalText: { color: '#FFF', fontSize: 14, fontWeight: '600', lineHeight: 22, opacity: 0.9 },
  
  grid: { marginTop: 25 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  mainValue: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  targetLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  percentLabel: { fontSize: 18, fontWeight: '800' },
  progressBarContainer: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  editInput: { borderBottomWidth: 2, borderBottomColor: COLORS.primary, color: COLORS.text, fontSize: 20, fontWeight: '800', width: 100, padding: 0 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  aiDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20
  },
  modalAiInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  suggestionContainer: {
    marginTop: 10
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  suggestedItem: {
    alignItems: 'center',
    flex: 1
  },
  suggestedValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4
  },
  suggestedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2
  },
  confirmationText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9'
  },
  confirmBtn: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981'
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF'
  },
  aiToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  aiBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  aiBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
