import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
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
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Please agree to the Terms and Policy';
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

  const renderInput = (fieldName, placeholder, icon, secureTextEntry = false, keyboardType = 'default') => (
    <View key={fieldName} style={styles.inputWrapper}>
      <View style={[styles.inputContainer, errors[fieldName] && styles.inputError]}>
        <Ionicons key={`${fieldName}-icon`} name={icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={formData[fieldName]}
          onChangeText={(text) => setFormData({ ...formData, [fieldName]: text })}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
        />
      </View>
      {errors[fieldName] && <Text style={styles.errorText}>{errors[fieldName]}</Text>}
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
          <View key="firstNameWrapper" style={{ flex: 1, marginRight: 8 }}>
            {renderInput('firstName', 'First Name', 'person-outline')}
          </View>
          <View key="lastNameWrapper" style={{ flex: 1, marginLeft: 8 }}>
            {renderInput('lastName', 'Last Name', 'person-outline')}
          </View>
        </View>

        {renderInput('email', 'Email', 'mail-outline', false, 'email-address')}
        {renderInput('password', 'Password', 'lock-closed-outline', true)}
        {renderInput('confirmPassword', 'Password confirmation', 'lock-closed-outline', true)}

        <View style={styles.checkboxWrapper}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={styles.checkboxIcon}
              onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
            >
              <Ionicons 
                name={formData.agreeToTerms ? "checkbox" : "square-outline"} 
                size={24} 
                color={formData.agreeToTerms ? COLORS.primary : COLORS.textSecondary} 
              />
            </TouchableOpacity>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>I agree about </Text>
              <TouchableOpacity onPress={() => setShowTerms(true)}>
                <Text style={styles.termsLink}>terms and policy</Text>
              </TouchableOpacity>
            </View>
          </View>
          {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || !formData.agreeToTerms) && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading || !formData.agreeToTerms}
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

      {/* Terms and Policy Modal - Moved outside ScrollView */}
      <Modal
        visible={showTerms}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTerms(false)}
      >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
                <TouchableOpacity onPress={() => setShowTerms(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.policyTitle}>FitTrack – Data Privacy Policy</Text>
                <Text style={styles.policyDate}>Last Updated: May 15, 2026</Text>
                
                <Text style={styles.policyText}>
                  Welcome to FitTrack. Your privacy is important to us. This Privacy Policy explains how FitTrack collects, uses, stores, and protects your information when using the mobile application.{"\n\n"}
                  By using FitTrack, you agree to the collection and use of information in accordance with this policy.
                </Text>

                <Text style={styles.sectionHeader}>1. Information We Collect</Text>
                <Text style={styles.policyText}>
                  FitTrack may collect the following information:{"\n\n"}
                  <Text style={{fontWeight: 'bold'}}>Personal Information</Text>{"\n"}
                  • Name{"\n"}
                  • Email address{"\n"}
                  • Profile information{"\n"}
                  • User account credentials{"\n\n"}
                  <Text style={{fontWeight: 'bold'}}>Activity & Fitness Data</Text>{"\n"}
                  • Step count{"\n"}
                  • Distance traveled{"\n"}
                  • Calories burned{"\n"}
                  • Walking activity{"\n"}
                  • Running activity{"\n"}
                  • Trail running activity{"\n"}
                  • Hiking activity{"\n"}
                  • Wheelchair activity{"\n"}
                  • Daily goals and progress{"\n\n"}
                  <Text style={{fontWeight: 'bold'}}>Device Information</Text>{"\n"}
                  • Mobile device type{"\n"}
                  • Operating system{"\n"}
                  • App version{"\n"}
                  • Device identifiers{"\n"}
                  • Sensor and motion activity data{"\n\n"}
                  <Text style={{fontWeight: 'bold'}}>Location Data</Text>{"\n"}
                  FitTrack may request access to your location to accurately track outdoor activities such as:{"\n"}
                  • Running{"\n"}
                  • Trail running{"\n"}
                  • Hiking{"\n"}
                  • Walking{"\n\n"}
                  Location access can be enabled or disabled anytime through your device settings.
                </Text>

                <Text style={styles.sectionHeader}>2. How We Use Your Information</Text>
                <Text style={styles.policyText}>
                  We use your information to:{"\n"}
                  • Track fitness activities and progress{"\n"}
                  • Provide goal-setting features{"\n"}
                  • Improve app performance and user experience{"\n"}
                  • Monitor app functionality and analytics{"\n"}
                  • Provide activity summaries and insights{"\n"}
                  • Maintain account security{"\n\n"}
                  We do not sell your personal information to third parties.
                </Text>

                <Text style={styles.sectionHeader}>3. Data Storage & Security</Text>
                <Text style={styles.policyText}>
                  FitTrack uses reasonable security measures to protect your personal data from:{"\n"}
                  • Unauthorized access{"\n"}
                  • Data loss{"\n"}
                  • Misuse{"\n"}
                  • Disclosure{"\n\n"}
                  However, no method of electronic storage or internet transmission is 100% secure. Users acknowledge that they use the application at their own risk.
                </Text>

                <Text style={styles.sectionHeader}>4. Sharing of Information</Text>
                <Text style={styles.policyText}>
                  FitTrack may share limited information only when:{"\n"}
                  • Required by law{"\n"}
                  • Necessary to protect user safety{"\n"}
                  • Required for technical services such as cloud storage or analytics{"\n\n"}
                  Third-party services used by FitTrack may have their own privacy policies.
                </Text>

                <Text style={styles.sectionHeader}>5. User Rights</Text>
                <Text style={styles.policyText}>
                  Users may:{"\n"}
                  • Edit profile information{"\n"}
                  • Update fitness goals{"\n"}
                  • Request deletion of account data{"\n"}
                  • Disable permissions such as location or activity tracking{"\n\n"}
                  Requests regarding personal data may be submitted through the application's support channels.
                </Text>

                <Text style={styles.sectionHeader}>6. Children's Privacy</Text>
                <Text style={styles.policyText}>
                  FitTrack is not intended for children under the age of 13 without parental consent. We do not knowingly collect information from children.
                </Text>

                <Text style={styles.sectionHeader}>7. Changes to This Policy</Text>
                <Text style={styles.policyText}>
                  FitTrack reserves the right to update or modify this Privacy Policy at any time. Users will be notified of significant changes through the application.
                </Text>

                <View style={{height: 1, backgroundColor: COLORS.border, marginVertical: 20}} />

                <Text style={styles.policyTitle}>FitTrack – Terms and Conditions</Text>
                <Text style={styles.policyDate}>Last Updated: May 15, 2026</Text>

                <Text style={styles.policyText}>
                  By downloading, accessing, or using FitTrack, you agree to comply with these Terms and Conditions.
                </Text>

                <Text style={styles.sectionHeader}>1. Use of the Application</Text>
                <Text style={styles.policyText}>
                  FitTrack is designed for tracking foot-based sports and movement activities including:{"\n"}
                  • Walking{"\n"}
                  • Running{"\n"}
                  • Trail Running{"\n"}
                  • Hiking{"\n"}
                  • Wheelchair movement tracking{"\n\n"}
                  Users agree to use the application responsibly and lawfully.
                </Text>

                <Text style={styles.sectionHeader}>2. User Responsibilities</Text>
                <Text style={styles.policyText}>
                  Users are responsible for:{"\n"}
                  • Providing accurate information{"\n"}
                  • Maintaining account security{"\n"}
                  • Using the app safely during physical activities{"\n"}
                  • Ensuring device permissions are properly managed{"\n\n"}
                  Users must not:{"\n"}
                  • Misuse the application{"\n"}
                  • Attempt unauthorized access{"\n"}
                  • Interfere with app functionality{"\n"}
                  • Use the application for illegal purposes
                </Text>

                <Text style={styles.sectionHeader}>3. Activity Tracking Accuracy</Text>
                <Text style={styles.policyText}>
                  FitTrack uses mobile sensors, GPS, and activity recognition technologies. Activity measurements may not always be perfectly accurate due to:{"\n"}
                  • Device limitations{"\n"}
                  • GPS interference{"\n"}
                  • Sensor inconsistencies{"\n"}
                  • Environmental conditions{"\n\n"}
                  FitTrack does not guarantee 100% accuracy of activity data.
                </Text>

                <Text style={styles.sectionHeader}>4. Intellectual Property</Text>
                <Text style={styles.policyText}>
                  All content, branding, logos, features, and software related to FitTrack are protected by intellectual property laws and may not be copied or redistributed without permission.
                </Text>

                <Text style={styles.sectionHeader}>5. Limitation of Liability</Text>
                <Text style={styles.policyText}>
                  FitTrack and its developers shall not be liable for:{"\n"}
                  • Injuries during physical activities{"\n"}
                  • Health complications{"\n"}
                  • Data inaccuracies{"\n"}
                  • Device damage{"\n"}
                  • Loss of data{"\n"}
                  • Service interruptions{"\n\n"}
                  Users assume full responsibility when participating in physical activities tracked by the application.
                </Text>

                <Text style={styles.sectionHeader}>6. Termination</Text>
                <Text style={styles.policyText}>
                  FitTrack reserves the right to suspend or terminate accounts that violate these Terms and Conditions.
                </Text>

                <Text style={styles.sectionHeader}>7. Changes to Terms</Text>
                <Text style={styles.policyText}>
                  FitTrack may revise these Terms and Conditions at any time. Continued use of the application means acceptance of the updated terms.
                </Text>

                <View style={{height: 1, backgroundColor: COLORS.border, marginVertical: 20}} />

                <Text style={styles.policyTitle}>Health Disclaimer</Text>
                <Text style={styles.policyText}>
                  FitTrack is not a medical application and does not provide medical advice, diagnosis, or treatment.{"\n\n"}
                  The information provided by the application, including step counts, calorie estimates, activity tracking, and fitness goals, is intended for general fitness and wellness purposes only.{"\n\n"}
                  Users should:{"\n"}
                  • Consult a qualified healthcare professional before starting any fitness or exercise program{"\n"}
                  • Stop physical activity immediately if pain, dizziness, or discomfort occurs{"\n"}
                  • Use proper safety precautions during outdoor activities such as running, hiking, and trail running{"\n\n"}
                  FitTrack is not responsible for injuries, health complications, or medical conditions resulting from the use of the application or participation in physical activities.
                </Text>
                
                <View style={{height: 40}} />
              </ScrollView>
              
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowTerms(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  link: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },
  checkboxWrapper: { marginBottom: SPACING.lg },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkboxIcon: { paddingRight: 4 },
  checkboxTextContainer: { flexDirection: 'row', marginLeft: 6, flexWrap: 'wrap', flex: 1 },
  checkboxLabel: { color: COLORS.textSecondary, fontSize: 14 },
  termsLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  modalBody: { flex: 1 },
  policyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  policyDate: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 20, marginBottom: 8 },
  policyText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  modalButton: { backgroundColor: COLORS.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  modalButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
