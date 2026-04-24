import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, StatusBar, Animated } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { 
    id: '1', 
    title: 'Track Your Move', 
    desc: 'Precision hardware tracking for your runs, walks, and hikes. See every step in real-time.', 
    icon: 'fitness',
    bgColor: '#FFFFFF'
  },
  { 
    id: '2', 
    title: 'Set Your Goals', 
    desc: 'Challenge yourself with personalized daily targets and weekly milestones.', 
    icon: 'flame',
    bgColor: '#FFFFFF'
  },
  { 
    id: '3', 
    title: 'Achieve More', 
    desc: 'Visualize your success with professional-grade analytics and athlete rankings.', 
    icon: 'trophy',
    bgColor: '#FFFFFF'
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const { setHasSeenOnboarding } = useAuthStore();

  const handleComplete = () => {
    setHasSeenOnboarding(true);
    navigation.navigate('Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: item.bgColor }]}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={100} color={COLORS.primary} />
        </View>
        <View style={styles.decorativeCircle} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.desc}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <TouchableOpacity style={styles.skipBtn} onPress={handleComplete}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [10, 25, 10],
              extrapolate: 'clamp'
            });
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp'
            });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
          })}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </Text>
          <Ionicons 
            name={currentIndex === SLIDES.length - 1 ? "rocket" : "arrow-forward"} 
            size={20} 
            color="#FFF" 
            style={{ marginLeft: 8 }} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 25,
    zIndex: 10,
    padding: 10
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700'
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  iconContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  decorativeCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: COLORS.primary + '15',
    zIndex: 1
  },
  textContainer: {
    alignItems: 'center'
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500'
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center'
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginHorizontal: 5
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1
  }
});
