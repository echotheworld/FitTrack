import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { useActivityStore } from '../../store/activityStore';
import { useGoalStore } from '../../store/goalStore';
import { useAuthStore } from '../../store/authStore';
import {
  buildContext, getCoachMessage, askGemini
} from '../../utils/coachEngine';
import {
  getMondayOfCurrentWeek, getDailyStats,
  calculateStatsForPeriod, calculateStreak
} from '../../utils/statsHelper';

const { width } = Dimensions.get('window');

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingBubble}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, {
            opacity: dot,
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }]
          }]}
        />
      ))}
    </View>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ message }) {
  const isCoach = message.role === 'model';
  return (
    <View style={[styles.bubbleRow, isCoach ? styles.bubbleRowLeft : styles.bubbleRowRight]}>
      {isCoach && (
        <View style={styles.coachAvatar}>
          <Ionicons name="sparkles" size={12} color="#FFF" />
        </View>
      )}
      <View style={[
        styles.bubble,
        isCoach ? styles.coachBubble : styles.userBubble,
        !isCoach && { borderBottomRightRadius: 4 }
      ]}>
        <Text style={[styles.bubbleText, isCoach ? styles.coachText : styles.userText]}>
          {message.text}
        </Text>
        <View style={styles.bubbleFooter}>
          <Text style={[styles.bubbleTime, !isCoach && { color: 'rgba(255,255,255,0.7)' }]}>
            {message.time}
          </Text>
          {!isCoach && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const activities = useActivityStore(s => s.activities);
  const currentWorkout = useActivityStore(s => s.currentWorkout);
  const { dailyStepGoal, weeklyDistanceGoal } = useGoalStore();

  // Build live context
  const dailyStats = getDailyStats(activities, new Date(), currentWorkout);
  const monday = getMondayOfCurrentWeek();
  const weeklyStats = calculateStatsForPeriod(activities, monday, new Date(), currentWorkout);
  const streak = calculateStreak(activities);
  const firstName = user?.firstName || 'Athlete';

  const ctx = buildContext({
    dailyStats, weeklyStats,
    goals: { dailyStepGoal, weeklyDistanceGoal },
    streak,
    firstName,
  });

  const coachGreeting = getCoachMessage(ctx);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [messages, setMessages] = useState([
    { id: '1', role: 'model', text: `Hey ${firstName}! ${coachGreeting}`, time: timeStr },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Quick prompts
  const QUICK_PROMPTS = [
    "How am I doing today?",
    "Give me a workout tip",
    "What is my streak?",
    "Am I close to my goal?",
  ];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now().toString(), role: 'user', text: msg, time: userTime };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Artificial delay to make it feel like "thinking"
    setTimeout(() => {
      const { getLocalResponse } = require('../../utils/coachEngine');
      const localReply = getLocalResponse(msg, ctx);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages(prev => [
        ...prev,
        { id: `${Date.now()}_fb`, role: 'model', text: localReply, time: replyTime }
      ]);
      setLoading(false);
    }, 800);
  };

  // Mood color/label
  const moodConfig = {
    goal_achieved: { label: 'Goal Smashed!', color: '#10B981', icon: 'trophy' },
    near_goal:     { label: 'Almost There!', color: '#F59E0B', icon: 'flame' },
    active:        { label: 'On Track',      color: COLORS.primary, icon: 'trending-up' },
    slow_start:    { label: 'Getting Going', color: '#6366F1', icon: 'walk' },
    no_activity:   { label: 'Rest Day?',     color: '#94A3B8', icon: 'moon' },
  };
  const mood = moodConfig[ctx.mood] ?? moodConfig.no_activity;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.coachBadge}>
              <Ionicons name="sparkles" size={20} color="#FFF" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.headerTitle}>FitCoach</Text>
              <Text style={styles.headerSub}>Personal Fitness AI</Text>
            </View>
          </View>
          <View style={[styles.moodTag, { backgroundColor: mood.color + '25' }]}>
            <Ionicons name={mood.icon} size={14} color={mood.color} />
            <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          </View>
        </View>

        {/* Context Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{ctx.steps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>steps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{Math.round(ctx.stepPct * 100)}%</Text>
            <Text style={styles.statLabel}>goal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{ctx.streak}</Text>
            <Text style={styles.statLabel}>streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{ctx.distance?.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km/wk</Text>
          </View>
        </View>

        {/* Chat */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
          {loading && (
            <View style={styles.bubbleRow}>
              <View style={styles.coachAvatar}>
                <Ionicons name="sparkles" size={10} color="#FFF" />
              </View>
              <TypingDots />
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <View style={styles.quickWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickContent}
            >
              {QUICK_PROMPTS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={styles.quickChip}
                  onPress={() => sendMessage(p)}
                >
                  <Text style={styles.quickChipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputShadow}>
            <TextInput
              style={styles.input}
              placeholder="Message FitCoach..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="arrow-up" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  coachBadge: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSub:  { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 1 },
  moodTag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  moodLabel: { fontSize: 12, fontWeight: '700', marginLeft: 6 },

  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  statPill: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 24, backgroundColor: '#F1F5F9' },

  chatContainer: { flex: 1 },
  chatContent:   { padding: 16, paddingBottom: 30 },

  bubbleRow:      { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  bubbleRowLeft:  { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },

  coachAvatar: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginBottom: 2,
  },
  bubble: {
    maxWidth: width * 0.75, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 20,
  },
  coachBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText:  { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  coachText:   { color: COLORS.text },
  userText:    { color: '#FFF' },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  bubbleTime:  { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },

  typingBubble: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 20, borderBottomLeftRadius: 4,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  typingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.primary, marginHorizontal: 2,
  },

  quickWrapper: { marginBottom: 10 },
  quickContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  quickChip: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  quickChipText: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  inputBar: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  inputShadow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#F1F5F9', borderRadius: 24, padding: 6,
  },
  input: {
    flex: 1, fontSize: 15, color: COLORS.text,
    paddingHorizontal: 14, paddingVertical: 10,
    maxHeight: 120, fontWeight: '500',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
});
