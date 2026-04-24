import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function WeeklyChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value), 1000); // Scale relative to 1000 or max

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxVal) * 120; // Max height 120px
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      height: barHeight, 
                      backgroundColor: item.frontColor || '#333333' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    justifyContent: 'center',
    paddingTop: 20,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    width: (width - 80) / 7,
  },
  barBackground: {
    width: 14,
    height: 120,
    backgroundColor: '#222222',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
  }
});
