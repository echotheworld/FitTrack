import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { auth, database } from '../../utils/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { encryptData } from '../../utils/encryption';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Save extra info to Realtime Database (ENCRYPTED)
      await set(ref(database, `users/${user.uid}`), {
        firstName: encryptData(formData.firstName),
        lastName: encryptData(formData.lastName),
        email: encryptData(formData.email),
        name: encryptData(`${formData.firstName} ${formData.lastName}`),
        createdAt: new Date().toISOString(),
      });

      // Navigation will be handled by the auth state listener in AppNavigator
    } catch (error) {
      console.log("Registration error:", error.code, error.message);

      let friendlyMessage = "We couldn't create your account. Please try again.";

      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "This email is already registered. Please try logging in instead.";
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = "The email address you entered is not valid.";
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = "Your password is too weak. Please use at least 6 characters.";
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMessage = "Network error. Please check your internet connection.";
      }

      Alert.alert('Registration Issue', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (key, placeholder, icon, secureTextEntry = false, keyboardType = 'default') => (
    <View style={styles.inputWrapper}>
      <View style={[styles.inputContainer, errors[key] && styles.inputError]}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={formData[key]}
          onChangeText={(text) => setFormData({ ...formData, [key]: text })}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
        />
      </View>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 50 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subHeader}>Start your fitness journey today</Text>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            {renderInput('firstName', 'First Name', 'person-outline')}
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            {renderInput('lastName', 'Last Name', 'person-outline')}
          </View>
        </View>

        {renderInput('email', 'Email Address', 'mail-outline', false, 'email-address')}
        {renderInput('password', 'Password', 'lock-closed-outline', true)}
        {renderInput('confirmPassword', 'Confirm Password', 'lock-closed-outline', true)}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.buttonText}>REGISTER</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { marginTop: 40, marginBottom: 20 },
  header: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  subHeader: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.xl, marginTop: 4 },
  inputWrapper: { marginBottom: SPACING.md },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  inputError: { borderColor: COLORS.error, borderWidth: 1 },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
  row: { flexDirection: 'row' },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  link: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl }
});
