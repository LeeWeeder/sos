import { Colors } from '@/constants/Color';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CellValue } from '../types/sos';

interface Props {
  value: CellValue;
  isSelected: boolean; // For drag selection
  isPending: boolean;  // For popup selection
  size: number;
}

export const SOSCell: React.FC<Props> = ({ value, isSelected, isPending, size }) => {
  const GAP = 4;
  const innerSize = size - GAP;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={[
          styles.visualTile,
          { width: innerSize, height: innerSize, borderRadius: innerSize * 0.2 },
          // Visual States
          isPending && styles.pending,
          isSelected && styles.dragSelected,
          // If it has a value, give it a subtle background change
          value !== null && styles.filled
        ]}
      >
        <Text style={[
          styles.text, 
          { fontSize: innerSize * 0.6 },
          value === 'S' ? styles.textS : styles.textO
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  visualTile: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    // Clean Flat Design
    borderWidth: 1,
    borderColor: '#E5E7EB', // Very subtle gray
  },
  filled: {
    backgroundColor: '#F8F9FA', // Slightly darker when filled
    borderColor: '#D1D5DB',
  },
  // State: When user taps to open popup
  pending: {
    backgroundColor: '#E3F2FD', // Light Blue
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  // State: When user is slashing/dragging
  dragSelected: {
    backgroundColor: '#FFF9C4', // Light Yellow
    borderColor: Colors.warning,
    borderWidth: 2,
  },
  text: { 
    fontWeight: '900', 
  },
  textS: { color: Colors.primaryS },
  textO: { color: Colors.primaryO },
});