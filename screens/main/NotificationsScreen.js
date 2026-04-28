import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export default function NotificationsScreen({ navigation }) {
  const { notifications, markAllAsRead, markAsRead } = useNotificationStore();
  const { user } = useAuthStore();

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, item.unread && styles.unreadCard]}
      onPress={() => {
        if (item.unread) markAsRead(item.id);
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: (item.color || COLORS.primary) + '20' }]}>
        <Ionicons name={item.icon || 'notifications'} size={22} color={item.color || COLORS.primary} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              We'll notify you about achievements and reminders here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  markReadText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  listContent: { padding: SPACING.md },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  unreadCard: {
    backgroundColor: '#F0F9F6', // Light primary tint
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  time: { fontSize: 12, color: COLORS.textSecondary },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' }
});
