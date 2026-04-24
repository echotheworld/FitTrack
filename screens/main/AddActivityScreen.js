import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useActivityStore } from '../../store/activityStore';

const ACTIVITIES = [
  { id: 'run', type: 'Run', icon: 'walk', desc: 'Outdoor or Treadmill' },
  { id: 'trail', type: 'Trail Run', icon: 'map-outline', desc: 'Off-road exploration' },
  { id: 'walk', type: 'Walk', icon: 'footsteps-outline', desc: 'Brisk or Casual' },
  { id: 'hike', type: 'Hike', icon: 'trail-sign-outline', desc: 'Mountain or Trail' },
  { id: 'wheelchair', type: 'Wheelchair', icon: 'body-outline', desc: 'Performance tracking' }
];

export default function AddActivityScreen({ navigation }) {
  const [selectedId, setSelectedId] = useState(null);
  const activities = useActivityStore(state => state.activities);
  const recentActivities = activities.slice(0, 5); // Show last 5 workouts

  const handleSelect = (activity) => {
    setSelectedId(activity.id);
    // Navigate instantly to RecordWorkout
    navigation.navigate('RecordWorkout', { activityType: activity.type });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Discipline</Text>
        <Text style={styles.subtitle}>Select an activity to start tracking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {ACTIVITIES.map((activity) => (
          <TouchableOpacity 
            key={activity.id} 
            style={[styles.activityCard, selectedId === activity.id && styles.activeCard]}
            onPress={() => handleSelect(activity)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: selectedId === activity.id ? '#FFF' : COLORS.accent }]}>
              <Ionicons name={activity.icon} size={28} color={COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.activityType, selectedId === activity.id && styles.activeText]}>{activity.type}</Text>
              <Text style={[styles.activityDesc, selectedId === activity.id && styles.activeTextSub]}>{activity.desc}</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={selectedId === activity.id ? '#FFF' : COLORS.textSecondary} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: { padding: SPACING.lg, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  
  scrollContent: { padding: SPACING.lg },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activeCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  activityType: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  activityDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  activeText: { color: '#FFF' },
  activeTextSub: { color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentType: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  recentSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  recentValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  recentLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' }
});

