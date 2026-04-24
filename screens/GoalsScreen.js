import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

export default function GoalsScreen() {
  const { goals, setGoals } = useAppStore();
  const [steps, setSteps] = useState(goals.dailySteps.toString());
  const [calories, setCalories] = useState(goals.dailyCalories.toString());

  const handleSave = () => {
    setGoals({
      dailySteps: parseInt(steps) || 0,
      dailyCalories: parseInt(calories) || 0
    });
    alert('Goals Updated!');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Set Your Targets</Text>
      <Text style={styles.subtitle}>Define your daily fitness goals</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Daily Steps Goal</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={steps}
          onChangeText={setSteps}
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Daily Calories Goal (kcal)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={calories}
          onChangeText={setCalories}
          placeholderTextColor={COLORS.textSecondary}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>SAVE GOALS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  title: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.lg },
  card: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 16 },
  label: { color: COLORS.text, fontSize: 14, marginBottom: SPACING.sm, fontWeight: '600' },
  input: { 
    backgroundColor: COLORS.background, 
    color: COLORS.text, 
    padding: SPACING.md, 
    borderRadius: 12, 
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: COLORS.background, fontWeight: 'bold', fontSize: 16 }
});
