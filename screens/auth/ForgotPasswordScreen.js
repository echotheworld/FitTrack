import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { auth } from '../../utils/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Send standard Firebase reset link
      await sendPasswordResetEmail(auth, email);
      
      Alert.alert(
        'Check Your Email',
        `A password reset link has been sent to ${email}. Please follow the instructions in the email to update your password.`,
        [
          { text: 'Back to Login', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error) {
      console.log("Forgot Password Error:", error.code, error.message);
      let message = "Could not process request. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        message = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      }
      
      Alert.alert('Request Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.header}>Reset Password</Text>
        <Text style={styles.subHeader}>Enter your email address and we'll send you a code to reset your password.</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>SEND CODE</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, padding: SPACING.lg, paddingTop: 100 },
  backBtn: { marginBottom: 20 },
  header: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  subHeader: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.xl, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    height: 56,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
