import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CellValue } from '../types/sos';

interface Props {
  value: CellValue;
  isSelected: boolean;
  size: number;
}

export const SOSCell: React.FC<Props> = ({ value, isSelected, size }) => {
  return (
    <View
      style={[
        styles.cell, 
        { width: size, height: size },
        isSelected && styles.selected
      ]}
    >
      <Text style={[
        styles.text, 
        { fontSize: size * 0.6 },
        value === 'S' ? styles.textS : styles.textO
      ]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 1,
    borderRadius: 4,
  },
  selected: {
    backgroundColor: '#ffe082',
    borderColor: '#ffca28',
    borderWidth: 2,
  },
  text: { fontWeight: 'bold' },
  textS: { color: '#2c3e50' },
  textO: { color: '#e74c3c' },
});