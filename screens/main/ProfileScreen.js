import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useActivityStore } from '../../store/activityStore';
import { calculateStreak } from '../../utils/statsHelper';
import { database, storage } from '../../utils/firebaseConfig';
import { ref as dbRef, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import { encryptData } from '../../utils/encryption';

export default function ProfileScreen({ navigation }) {
  const { user, setUser, logout, preferences, setPreferences, refreshUser } = useAuthStore();
  const { activities, clearActivities } = useActivityStore();

  useEffect(() => {
    refreshUser();
  }, []);

  const isMetric = preferences?.isMetric ?? true;
  const notifsEnabled = preferences?.notifsEnabled ?? true;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({ ...user });
  const [uploading, setUploading] = useState(false);

  const stats = {
    totalWorkouts: activities.length,
    totalCalories: activities.reduce((sum, a) => sum + (a?.calories || 0), 0),
    totalDistance: activities.reduce((sum, a) => sum + (parseFloat(a?.distance) || 0), 0),
    totalSteps: activities.reduce((sum, a) => sum + (a?.steps || 0), 0),
    streak: calculateStreak(activities),
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return '??';
  };

  const handleResetData = () => {
    Alert.alert('Reset All Data', 'This will delete all your workout records permanently. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Everything',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Clear Local Store
            clearActivities();
            
            // 2. Clear Firebase Database activities for this user
            if (user?.uid) {
              await remove(dbRef(database, `users/${user.uid}/activities`));
            }
            
            Alert.alert('Success', 'All activity data has been cleared.');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear some data. Please try again.');
          }
        }
      }
    ]);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need gallery permissions to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = storageRef(storage, `avatars/${user.uid}`);

      await uploadBytes(fileRef, blob);
      const photoURL = await getDownloadURL(fileRef);

      // Update DB and Store
      await update(dbRef(database, `users/${user.uid}`), { photoURL });
      setUser({ ...user, photoURL });
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const dbUpdates = {
        firstName: encryptData(editData.firstName),
        lastName: encryptData(editData.lastName),
        name: encryptData(`${editData.firstName} ${editData.lastName}`),
        age: encryptData(editData.age?.toString()),
        weight: encryptData(editData.weight?.toString()),
        height: encryptData(editData.height?.toString())
      };

      const localUpdates = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        name: `${editData.firstName} ${editData.lastName}`,
        age: parseInt(editData.age),
        weight: parseFloat(editData.weight),
        height: parseFloat(editData.height)
      };

      await update(dbRef(database, `users/${user.uid}`), dbUpdates);
      setUser({ ...user, ...localUpdates });
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your changes have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile info.');
    }
  };

  const SettingRow = ({ icon, label, value, onValueChange, type = 'toggle' }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLabelGroup}>
        <View style={styles.settingIconBox}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E1E8ED', true: COLORS.primary }}
          thumbColor="#FFF"
        />
      ) : (
        <TouchableOpacity onPress={onValueChange}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={uploading}>
          <View style={styles.avatar}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user?.firstName, user?.lastName, user?.displayName || user?.name || user?.email)}
                </Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>
          {user?.firstName || user?.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : (user?.displayName || user?.name || 'User')}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => {
            setEditData({ ...user });
            setEditModalVisible(true);
          }}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Info */}
      <Text style={styles.sectionTitle}>Personal Details</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Age</Text>
          <Text style={styles.infoValue}>{user?.age || '--'} <Text style={styles.infoUnit}>yrs</Text></Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>{user?.weight || '--'} <Text style={styles.infoUnit}>kg</Text></Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Height</Text>
          <Text style={styles.infoValue}>{user?.height || '--'} <Text style={styles.infoUnit}>cm</Text></Text>
        </View>
      </View>

      {/* App Settings */}
      <Text style={styles.sectionTitle}>Account Settings</Text>
      <View style={styles.settingsBox}>
        <SettingRow
          icon="notifications-outline"
          label="Push Notifications"
          value={notifsEnabled}
          onValueChange={(val) => setPreferences({ notifsEnabled: val })}
        />
        <SettingRow
          icon="thermometer-outline"
          label="Metric Units"
          value={isMetric}
          onValueChange={(val) => setPreferences({ isMetric: val })}
        />
        <SettingRow
          icon="trash-outline"
          label="Clear Data"
          type="link"
          onValueChange={handleResetData}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#FF4D4D" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>First Name:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="First Name"
                  placeholderTextColor="#7A8C94"
                  value={editData.firstName}
                  onChangeText={(t) => setEditData({ ...editData, firstName: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Last Name:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Last Name"
                  placeholderTextColor="#7A8C94"
                  value={editData.lastName}
                  onChangeText={(t) => setEditData({ ...editData, lastName: t })}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Age:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Age"
              keyboardType="numeric"
              placeholderTextColor="#7A8C94"
              value={editData.age?.toString()}
              onChangeText={(t) => setEditData({ ...editData, age: t })}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Weight (kg):</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Weight"
                  keyboardType="numeric"
                  placeholderTextColor="#7A8C94"
                  value={editData.weight?.toString()}
                  onChangeText={(t) => setEditData({ ...editData, weight: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Height (cm):</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Height"
                  keyboardType="numeric"
                  placeholderTextColor="#7A8C94"
                  value={editData.height?.toString()}
                  onChangeText={(t) => setEditData({ ...editData, height: t })}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleUpdateProfile}>
                <Text style={styles.modalBtnSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { alignItems: 'center', marginTop: 60, marginBottom: SPACING.xl },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '800',
  },
  avatarImage: { width: '100%', height: '100%' },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background
  },
  name: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  email: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  editBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E1E8ED'
  },
  editBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 28,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, fontWeight: '600' },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.xl
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F3F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  infoUnit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 16, marginLeft: 4 },
  settingsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F5'
  },
  settingLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingLabel: { color: COLORS.text, fontSize: 16, marginLeft: 12, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFE5E5'
  },
  logoutText: { color: '#FF4D4D', fontWeight: '800', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.xl },
  modalContent: { backgroundColor: '#FFF', padding: SPACING.xl, borderRadius: 32 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 4
  },
  modalInput: {
    backgroundColor: '#F7F9FA',
    color: COLORS.text,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    fontWeight: '600'
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  modalBtnCancel: { padding: 12 },
  modalBtnCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalBtnSave: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginLeft: 16 },
  modalBtnSaveText: { color: '#FFF', fontWeight: '800' }
});
