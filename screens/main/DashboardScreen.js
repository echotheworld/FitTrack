import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useActivityStore } from '../../store/activityStore';
import { useGoalStore } from '../../store/goalStore';
import { getMondayOfCurrentWeek, getDailyStats, calculateStatsForPeriod, calculateStreak } from '../../utils/statsHelper';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const activities = useActivityStore(state => state.activities);
  const addActivity = useActivityStore(state => state.addActivity);
  const currentWorkout = useActivityStore(state => state.currentWorkout);
  
  // Source goals from database (user profile) first
  const storeGoals = useGoalStore();
  const dailyStepGoal = user?.dailyStepGoal || storeGoals.dailyStepGoal;
  const weeklyDistanceGoal = user?.weeklyDistanceGoal || storeGoals.weeklyDistanceGoal;

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Use helper for daily stats (passing currentWorkout for real-time)
  const dailyStats = getDailyStats(activities, selectedDate, currentWorkout);

  // Calculate Weekly Progress using Monday start
  const monday = getMondayOfCurrentWeek();
  const weeklyStats = calculateStatsForPeriod(activities, monday, new Date(), currentWorkout);
  
  const weeklyDistance = weeklyStats.distance;
  const weeklyProgress = Math.min(weeklyDistance / weeklyDistanceGoal, 1);

  // Calculate active days for athlete rank (using all activities)
  const uniqueDays = new Set(activities.map(a => new Date(a.date).toDateString()));
  const activeDaysCount = uniqueDays.size;
  const streak = calculateStreak(activities);

  // Generate dynamic days - FIXED 7 day window
  const generateDays = () => {
    const result = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const isSelected = d.toDateString() === selectedDate.toDateString();
      const isToday = d.toDateString() === today.toDateString();

      result.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        fullDate: d,
        isSelected,
        isToday
      });
    }
    return result;
  };

  const days = generateDays();
  const currentMonthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Helper to get relative date string
  const getRelativeDateString = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return target.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const isFuture = selectedDate.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);

  const metrics = {
    steps: dailyStats.steps.toLocaleString(),
    kcal: dailyStats.calories.toLocaleString(),
    min: dailyStats.duration.toString(),
    km: dailyStats.distance.toFixed(1),
    heartRate: dailyStats.steps > 0 ? '72' : '--',
    burn: (dailyStats.calories + 820).toLocaleString(), // Adding base metabolism burn
    progress: Math.min(dailyStats.steps / dailyStepGoal, 1),
  };

  // Helper to determine User Status
  const getUserStatus = (totalSteps, activeDays) => {
    if (totalSteps >= 20000 && activeDays >= 14) return { label: 'Peak Athlete', color: '#7C3AED' };
    if (totalSteps >= 15000 && activeDays >= 10) return { label: 'Elite Athlete', color: '#DB2777' };
    if (totalSteps >= 10000 && activeDays >= 7) return { label: 'Strong Athlete', color: '#2563EB' };
    if (totalSteps >= 7000 && activeDays >= 5) return { label: 'Fit Athlete', color: '#059669' };
    if (totalSteps >= 3000 && activeDays >= 3) return { label: 'Active Athlete', color: COLORS.primary };
    return { label: 'Beginner', color: COLORS.textSecondary };
  };

  // Get status based on most recent active day or overall average
  const currentStatus = getUserStatus(dailyStats.steps, activeDaysCount);

  return (
    <View style={styles.root}>
      {/* Top Header Section */}
      <View style={styles.headerBackground}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.profileBox}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarBorder}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.avatarText}>{user?.firstName?.[0] || 'J'}</Text>
                </View>
              )}
            </View>
            <View style={styles.nameBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName}>{user?.firstName || 'Jericho'} {user?.lastName ? `${user.lastName[0].toUpperCase()}.` : ''}</Text>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={14} color="#FFF" />
                    <Text style={styles.streakText}>{streak}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.userStatus, { color: currentStatus.color }]}>{currentStatus.label}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1A1C1E" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelectorContainer}>
          <View style={styles.monthHeader}>
            <View style={{ width: 24 }} />

            <View style={styles.monthTitleContainer}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
              <Text style={styles.monthText}>{currentMonthYear}</Text>
            </View>

            <View style={{ width: 24 }} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
            {days.map((d, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  d.isSelected && styles.activeDayCard,
                  d.isToday && !d.isSelected && { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }
                ]}
                onPress={() => handleDateSelect(d.fullDate)}
              >
                <Text style={[styles.dayText, d.isSelected && styles.activeDayText]}>{d.day}</Text>
                <Text style={[styles.dateText, d.isSelected && styles.activeDayText]}>{d.date}</Text>
                {d.isToday && <View style={[styles.activeDot, d.isSelected && { backgroundColor: COLORS.primary }]} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Daily Activity Ring Section */}
        <View style={styles.mainProgressCard}>
          <View style={styles.activityHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sectionTitle}>
                  {isFuture ? 'Upcoming Activity' : (selectedDate.toDateString() === new Date().toDateString() ? 'Daily Activity' : 'Activity History')}
                </Text>
              </View>
              <Text style={styles.activitySubtext}>
                {getRelativeDateString(selectedDate)}
              </Text>
            </View>
          </View>

          <View style={styles.ringContainer}>
            <View style={styles.chartWrapper}>
              <PieChart
                data={[
                  { value: dailyStats.steps, color: isFuture ? '#F3F4F6' : COLORS.primary },
                  { value: Math.max(0, dailyStepGoal - dailyStats.steps), color: '#F3F4F6' },
                ]}
                donut
                radius={75}
                innerRadius={65}
                innerCircleColor={'#FFF'}
                centerLabelComponent={() => (
                  <View style={styles.progressInner}>
                    {currentWorkout && (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                    <Text style={styles.progressValue}>{metrics.steps}</Text>
                    <Text style={styles.progressUnit}>Steps</Text>
                    <View style={styles.goalBadge}>
                      <Text style={styles.goalBadgeText}>Goal: {(dailyStepGoal / 1000).toFixed(0)}k</Text>
                    </View>
                  </View>
                )}
              />
            </View>

            <View style={styles.ringStats}>
              <View style={styles.ringStatItem}>
                <Ionicons name="flame" size={18} color={COLORS.accentOrange} />
                <Text style={styles.ringStatValue}>{metrics.kcal} <Text style={styles.ringStatUnit}>kcal</Text></Text>
              </View>
              <View style={styles.ringStatItem}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
                <Text style={styles.ringStatValue}>{metrics.min} <Text style={styles.ringStatUnit}>min</Text></Text>
              </View>
              <View style={styles.ringStatItem}>
                <Ionicons name="location" size={18} color="#6366F1" />
                <Text style={styles.ringStatValue}>{metrics.km} <Text style={styles.ringStatUnit}>km</Text></Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Challenge Section */}
        <View style={styles.weeklyGoalCard}>
          <View style={styles.weeklyGoalHeader}>
            <View style={styles.weeklyIconBox}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.weeklyGoalTitle}>Weekly Challenge</Text>
              <Text style={styles.weeklyGoalSub}>{weeklyDistance.toFixed(1)} / {weeklyDistanceGoal} km reached</Text>
            </View>
            <View style={styles.weeklyPercentBadge}>
              <Text style={styles.weeklyPercentText}>{Math.round(weeklyProgress * 100)}%</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${weeklyProgress * 100}%` }]} />
          </View>

          <View style={styles.weeklyFooter}>
            <Text style={styles.weeklyFooterText}>Keep going! You're {Math.round(weeklyDistanceGoal - weeklyDistance)}km away from your goal.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddActivity')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingTop: 70,
    paddingBottom: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 25,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 6,
    borderRadius: 35,
    paddingRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  avatar: { width: '100%', height: '100%' },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  nameBox: { marginLeft: 12 },
  userName: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  userStatus: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  testerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  dateSelectorContainer: {},
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: SPACING.lg,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  monthText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  daysScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10, // Adds space for the active card expansion
  },
  dayCard: {
    width: 55,
    height: 85,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activeDayCard: {
    backgroundColor: '#FFF',
    height: 95,
    marginTop: -5, // This is now safe because of paddingVertical in daysScroll
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dayText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  dateText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  activeDayText: { color: COLORS.textSecondary },
  activeDateText: { color: COLORS.primary },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 4 },

  container: { flex: 1, paddingHorizontal: SPACING.lg },
  mainProgressCard: {
    backgroundColor: '#FFF',
    borderRadius: 35,
    padding: 24,
    marginTop: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  activitySubtext: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  todayBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  historyBtn: {
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  chartWrapper: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  progressUnit: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  goalBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  goalBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  liveText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ringStats: { gap: 15 },
  ringStatItem: { flexDirection: 'row', alignItems: 'center' },
  ringStatValue: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginLeft: 8 },
  ringStatUnit: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },

  weeklyGoalCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weeklyGoalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  weeklyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyGoalTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  weeklyGoalSub: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  weeklyPercentBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weeklyPercentText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  weeklyFooter: { marginTop: 4 },
  weeklyFooterText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', fontStyle: 'italic' },

  sectionHeading: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginTop: 30, marginBottom: 15 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  metricValue: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  streakText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 2
  },
  userStatus: { fontSize: 13, fontWeight: '700', marginTop: 1 },
  metricUnit: { fontSize: 12, color: COLORS.textSecondary },
  trendTag: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendText: { color: '#10B981', fontSize: 10, fontWeight: '700', marginLeft: 4 },

  workoutActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  workoutActionLeft: { flexDirection: 'row', alignItems: 'center' },
  workoutIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  workoutActionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  workoutActionSub: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }
});
