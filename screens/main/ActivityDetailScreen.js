import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

export default function ActivityDetailScreen({ route }) {
  const { activity } = route.params;

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.lg }}>
      <View style={styles.header}>
        <Ionicons name={activity.type === 'Running' ? 'walk' : 'fitness'} size={80} color={COLORS.primary} />
        <Text style={styles.title}>{activity.type}</Text>
        <Text style={styles.date}>{new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statValue}>{activity.calories}</Text>
          <Text style={styles.statUnit}>kcal</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{activity.duration}</Text>
          <Text style={styles.statUnit}>mins</Text>
        </View>
      </View>

      <DetailRow icon="speedometer" label="Intensity" value={activity.intensity} />
      {activity.distance && (
        <DetailRow icon="navigate" label="Distance" value={`${activity.distance} km`} />
      )}
      
      {activity.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{activity.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', marginBottom: SPACING.xl, marginTop: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginTop: 12 },
  date: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl },
  statItem: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 16, alignItems: 'center', marginHorizontal: 6 },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' },
  statValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statUnit: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 16, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12 },
  value: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  notesContainer: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 16, marginTop: 12 },
  notesLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 },
  notesText: { color: COLORS.text, fontSize: 15, lineHeight: 22 }
});
