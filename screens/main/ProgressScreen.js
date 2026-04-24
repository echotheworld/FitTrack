import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useActivityStore } from '../../store/activityStore';
import { useGoalStore } from '../../store/goalStore';
import { getMondayOfCurrentWeek, getDailyStats, calculateStatsForPeriod } from '../../utils/statsHelper';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState('Weekly');
  const activities = useActivityStore(state => state.activities);
  const dailyStepGoal = useGoalStore(state => state.dailyStepGoal);
  const dailyCalorieGoal = useGoalStore(state => state.dailyCalorieGoal);

  // -- REAL DATA AGGREGATION --

  // 1. Daily Data
  const today = new Date();
  const todayStats = getDailyStats(activities, today);
  const todayActivities = activities.filter(a => new Date(a.date).toDateString() === today.toDateString());
  const dailyProgressPercent = Math.min(Math.round((todayStats.steps / dailyStepGoal) * 100), 100);

  // 2. Weekly Data (Current Week - Monday start)
  const monday = getMondayOfCurrentWeek();
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weeklyCalsData = weekDays.map((label, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const dayStats = getDailyStats(activities, d);
    return { 
      value: dayStats.calories || 0, 
      label, 
      frontColor: d.toDateString() === today.toDateString() ? COLORS.primary : undefined 
    };
  });

  const weeklyStepsData = weekDays.map((label, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const dayStats = getDailyStats(activities, d);
    return { 
      value: dayStats.steps || 0,
      label: label,
      dataPointText: dayStats.steps > 0 ? dayStats.steps.toString() : undefined
    };
  });

  const weeklyTotals = calculateStatsForPeriod(activities, monday);
  const maxStepsInWeek = Math.max(...weeklyStepsData.map(d => d.value), 5000);
  const chartMaxValue = Math.ceil(maxStepsInWeek / 1000) * 1000;

  const bestDayStats = weeklyCalsData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  const bestDayName = bestDayStats.label === 'M' ? 'Monday' : 
                     bestDayStats.label === 'T' ? 'Tuesday' :
                     bestDayStats.label === 'W' ? 'Wednesday' :
                     bestDayStats.label === 'T' ? 'Thursday' :
                     bestDayStats.label === 'F' ? 'Friday' :
                     bestDayStats.label === 'S' ? 'Saturday' : 'Sunday';

  // 3. Monthly Data
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyStats = calculateStatsForPeriod(activities, startOfMonth);
  
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthStats = calculateStatsForPeriod(activities, lastMonthStart, lastMonthEnd);

  const monthDiff = lastMonthStats.calories > 0 
    ? Math.round(((monthlyStats.calories - lastMonthStats.calories) / lastMonthStats.calories) * 100) 
    : 100;

  const [expandedDay, setExpandedDay] = useState(null);

  const renderDaily = () => {
    // Generate last 7 days
    const historyData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayStats = getDailyStats(activities, d);
      const dayActivities = activities.filter(a => new Date(a.date).toDateString() === d.toDateString());
      
      historyData.push({
        id: i,
        date: d,
        steps: dayStats.steps,
        kcal: dayStats.calories,
        isToday: i === 0,
        activityList: dayActivities
      });
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>7-Day Performance Log</Text>
        {historyData.map((item) => (
          <View key={item.id}>
            <TouchableOpacity 
              style={[styles.historyLogItem, item.isToday && styles.todayLogItem]}
              onPress={() => setExpandedDay(expandedDay === item.id ? null : item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.logDateBox}>
                <Text style={styles.logDayName}>
                  {item.isToday ? 'Today' : item.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={styles.logDateNum}>{item.date.getDate()}</Text>
              </View>
              
              <View style={styles.logDataRow}>
                <View style={styles.logStat}>
                  <Ionicons name="footsteps" size={16} color={COLORS.primary} />
                  <Text style={styles.logStatValue}>{item.steps.toLocaleString()}</Text>
                </View>
                <View style={styles.logStat}>
                  <Ionicons name="flame" size={16} color={COLORS.accentOrange} />
                  <Text style={styles.logStatValue}>{item.kcal.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.logActionBox}>
                <Ionicons 
                  name={expandedDay === item.id ? "chevron-up" : "list-outline"} 
                  size={20} 
                  color={item.activityList.length > 0 ? COLORS.primary : "#E1E8ED"} 
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Activity List */}
            {expandedDay === item.id && item.activityList.length > 0 && (
              <View style={styles.expandedContent}>
                {item.activityList.map((act) => (
                  <View key={act.id} style={styles.miniActivityItem}>
                    <View style={styles.miniDot} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.miniType}>{act.type}</Text>
                      <Text style={styles.miniTime}>
                        {new Date(act.date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.miniValue}>+{act.steps} <Text style={{ fontSize: 10 }}>steps</Text></Text>
                      <Text style={styles.miniSubValue}>{act.calories} kcal</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {expandedDay === item.id && item.activityList.length === 0 && (
              <View style={styles.expandedContent}>
                <Text style={styles.emptyLogText}>No activities recorded for this day.</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderWeekly = () => (
    <View style={styles.tabContent}>
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Calories Burned</Text>
        <BarChart
          data={weeklyCalsData}
          barWidth={22}
          noOfSections={3}
          barBorderRadius={8}
          frontColor={COLORS.primary}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          yAxisTextStyle={{ color: COLORS.textSecondary }}
          xAxisLabelTextStyle={{ color: COLORS.textSecondary }}
          height={150}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Daily Steps</Text>
        <LineChart
          data={weeklyStepsData}
          color={COLORS.primary}
          thickness={3}
          dataPointsColor={COLORS.primary}
          dataPointsRadius={4}
          areaChart
          startFillColor={COLORS.primary}
          startOpacity={0.1}
          endOpacity={0}
          initialSpacing={20}
          spacing={ (width - 100) / 7 }
          maxValue={chartMaxValue}
          noOfSections={5}
          yAxisColor="#E1E8ED"
          xAxisColor="#E1E8ED"
          yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
          yAxisLabelSuffix=""
          rulesType="solid"
          rulesColor="#F0F3F5"
          height={150}
          hideDataPoints={false}
          showVerticalLines
          verticalLinesColor="#F0F3F5"
        />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Best Day</Text>
          <Text style={styles.summaryValue}>{bestDayName}</Text>
          <Text style={styles.summarySub}>{bestDayStats.value.toLocaleString()} kcal</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Weekly Total</Text>
          <Text style={styles.summaryValue}>{weeklyTotals.steps.toLocaleString()}</Text>
          <Text style={styles.summarySub}>Steps reached</Text>
        </View>
      </View>
    </View>
  );

  const renderMonthly = () => (
    <View style={styles.tabContent}>
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Monthly Heatmap</Text>
        <View style={styles.heatmapPlaceholder}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.placeholderText}>Monthly heatmap visualization coming soon</Text>
        </View>
      </View>
      
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Comparison</Text>
        <View style={styles.comparisonRow}>
          <View>
            <Text style={styles.comparisonLabel}>This Month</Text>
            <Text style={styles.comparisonValue}>{monthlyStats.calories.toLocaleString()} kcal</Text>
          </View>
          <View style={[styles.comparisonBadge, monthDiff < 0 && { backgroundColor: '#FCA5A5' }]}>
            <Ionicons name={monthDiff >= 0 ? "arrow-up" : "arrow-down"} size={16} color="#FFF" />
            <Text style={styles.badgeText}>{Math.abs(monthDiff)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>
      
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {['Daily', 'Weekly', 'Monthly'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'Daily' && renderDaily()}
        {activeTab === 'Weekly' && renderWeekly()}
        {activeTab === 'Monthly' && renderMonthly()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  tabBarContainer: { paddingHorizontal: SPACING.lg, marginBottom: 10 },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600' },
  activeTabText: { color: '#FFF' },
  tabContent: { padding: SPACING.lg },
  chartCard: { 
    backgroundColor: COLORS.surface, 
    padding: SPACING.lg, 
    borderRadius: 28, 
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  totalsCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 32,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  totalItem: {
    flex: 1,
    alignItems: 'center'
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase'
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  historyLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  todayLogItem: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F7FF',
  },
  logDateBox: {
    width: 50,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F0F3F5',
    marginRight: 16
  },
  logDayName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  logDateNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  logDataRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 20
  },
  logStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  logStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text
  },
  logStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  logActionBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandedContent: {
    paddingLeft: 66,
    paddingRight: 16,
    paddingBottom: 20,
    marginTop: -8,
  },
  miniActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  miniType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  miniTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  miniValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  miniSubValue: {
    fontSize: 10,
    color: COLORS.accentOrange,
    fontWeight: '700',
    marginTop: 2
  },
  emptyLogText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  activityTimeline: { marginTop: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginTop: 4 },
  timelineLine: { width: 2, height: 30, backgroundColor: '#E1E8ED', position: 'absolute', left: 5, top: 16 },
  timelineTextContainer: { marginLeft: 20 },
  timelineTime: { color: COLORS.textSecondary, fontSize: 12 },
  timelineActivity: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 2 },
  timelineStats: { color: COLORS.primary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCard: { 
    backgroundColor: COLORS.surface, 
    padding: SPACING.lg, 
    borderRadius: 24, 
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  summarySub: { color: COLORS.primary, fontSize: 12, marginTop: 4, fontWeight: '600' },
  heatmapPlaceholder: { height: 150, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 40 },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comparisonLabel: { color: COLORS.textSecondary, fontSize: 14 },
  comparisonValue: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  comparisonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accentGreen, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4 }
});
