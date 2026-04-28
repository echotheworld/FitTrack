import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { auth } from '../../utils/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleLogin = async () => {
    console.log("Login button pressed");
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    console.log("Attempting login for:", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log("Login error:", error.code, error.message);

      let friendlyMessage = "Something went wrong. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        friendlyMessage = "Invalid email or password. Please check your details and try again.";
      } else if (error.code === 'auth/too-many-requests') {
        friendlyMessage = "Too many failed attempts. Please try again in a few minutes.";
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMessage = "Network error. Please check your internet connection.";
      }

      Alert.alert('Authentication Error', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subHeader}>Login to continue your progress</Text>

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

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  subHeader: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.xl, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    height: 56,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.lg },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  link: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl }
});
