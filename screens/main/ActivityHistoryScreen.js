import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, SPACING } from '../../constants/theme';
import { useActivityStore } from '../../store/activityStore';

export default function ActivityHistoryScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const activities = useActivityStore(state => state.activities);
  const deleteActivity = useActivityStore(state => state.deleteActivity);
  const getActivitiesByDateRange = useActivityStore(state => state.getActivitiesByDateRange);
  const [filteredActivities, setFilteredActivities] = useState(activities);

  useEffect(() => {
    setFilteredActivities(getActivitiesByDateRange(filter));
  }, [filter, activities]);

  // Calculate total steps (Overall)
  const totalSteps = activities.reduce((acc, curr) => acc + (parseInt(curr?.steps) || 0), 0);
  const totalKcal = activities.reduce((acc, curr) => acc + (parseInt(curr?.calories) || 0), 0);

  const handleDelete = (id) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteActivity(id) }
    ]);
  };

  const renderRightActions = (id) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(id)}>
      <Ionicons name="trash" size={24} color="#FFF" />
    </TouchableOpacity>
  );

  const ActivityItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.type === 'Running' ? '#EFF6FF' : '#F0FDF4' }]}>
          <Ionicons
            name={item.type === 'Running' ? 'walk' : 'fitness'}
            size={24}
            color={item.type === 'Running' ? '#2563EB' : COLORS.primary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.itemTitle}>{item.type}</Text>
          <Text style={styles.itemSubtitle}>
            {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • {item.duration} min
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.itemValue}>{item.calories} <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>kcal</Text></Text>
          <Text style={styles.itemSteps}>{item.steps || '0'} steps</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Overall Total Steps</Text>
          <Text style={styles.summaryValue}>{totalSteps.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Calories</Text>
          <Text style={styles.summaryValue}>{totalKcal.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        {['All', 'Week', 'Month'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ActivityItem item={item} />}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>No activities found for this period.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryCard: {
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  filterBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'space-around'
  },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 16 },
  filterBtnActive: { backgroundColor: '#FFF', elevation: 2 },
  filterText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: COLORS.primary },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  iconContainer: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  itemSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
  itemValue: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  itemSteps: { color: COLORS.primary, fontSize: 11, fontWeight: '700', marginTop: 2 },

  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '84%',
    borderRadius: 24,
    marginLeft: 10
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 16, fontWeight: '600', marginTop: 16 }
});

