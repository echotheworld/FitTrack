import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

export default function HistoryScreen() {
  const activities = useAppStore((state) => state.activities);

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No activity history.</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.details}>{item.date} • {item.duration}m • {item.calories}kcal</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  item: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 12, marginBottom: SPACING.sm },
  type: { color: COLORS.text, fontWeight: 'bold', fontSize: 18 },
  details: { color: COLORS.textSecondary, marginTop: 4 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 100 }
});
