import React, { useEffect, useRef } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { CellValue, Coordinate, SlashedLine } from '../types/sos';
import { SOSCell } from './SOSCell';

interface Props {
  grid: CellValue[][];
  onCellTap: (row: number, col: number) => void;
  
  pendingCell: Coordinate | null;
  onConfirmPlacement: (char: 'S' | 'O') => void;
  
  dragPath: Coordinate[];
  onDragEnter: (row: number, col: number) => void;
  onDragEnd: () => void;
  
  slashedLines: SlashedLine[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 20;
const MAX_BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;

export const SOSBoard: React.FC<Props> = (props) => {
  const { 
    grid, pendingCell, onConfirmPlacement, 
    dragPath, slashedLines 
  } = props;

  const gridSize = grid.length;
  const cellSize = (MAX_BOARD_SIZE / gridSize) - 2;
  const totalBoardSize = gridSize * (cellSize + 2);

  // --- FIX: Keep track of latest props in a Ref ---
  const callbacksRef = useRef({
    onDragEnter: props.onDragEnter,
    onDragEnd: props.onDragEnd,
    onCellTap: props.onCellTap
  });

  // Update the ref whenever props change
  useEffect(() => {
    callbacksRef.current = {
      onDragEnter: props.onDragEnter,
      onDragEnd: props.onDragEnd,
      onCellTap: props.onCellTap
    };
  });

  const getGridCoords = (x: number, y: number) => {
    const col = Math.floor(x / (cellSize + 2));
    const row = Math.floor(y / (cellSize + 2));
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const coords = getGridCoords(locationX, locationY);
        if (coords) {
          // Call the LATEST function from ref
          callbacksRef.current.onDragEnter(coords.row, coords.col);
        }
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const coords = getGridCoords(locationX, locationY);
        if (coords) {
          callbacksRef.current.onDragEnter(coords.row, coords.col);
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;

        if (isTap) {
          const { locationX, locationY } = evt.nativeEvent;
          const coords = getGridCoords(locationX, locationY);
          if (coords) {
            callbacksRef.current.onCellTap(coords.row, coords.col);
          }
          callbacksRef.current.onDragEnd(); 
        } else {
          callbacksRef.current.onDragEnd();
        }
      },
    })
  ).current;

  const getCenter = (idx: number) => (idx * (cellSize + 2)) + (cellSize / 2) + 1;
  const isDragged = (r: number, c: number) => dragPath.some(p => p.row === r && p.col === c);

  return (
    <View style={styles.container}>
      <View style={[styles.gridContainer, { width: totalBoardSize, height: totalBoardSize }]}>
        
        {/* 1. Grid Layer */}
        {grid.map((row, rIndex) => (
          <View key={rIndex} style={styles.row}>
            {row.map((cell, cIndex) => (
              <SOSCell
                key={`${rIndex}-${cIndex}`}
                value={cell}
                size={cellSize}
                isSelected={isDragged(rIndex, cIndex)}
              />
            ))}
          </View>
        ))}

        {/* 2. SVG Layer */}
        <View style={styles.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            {slashedLines.map((line) => (
              <Line
                key={line.id}
                x1={getCenter(line.start.col)}
                y1={getCenter(line.start.row)}
                x2={getCenter(line.end.col)}
                y2={getCenter(line.end.row)}
                stroke={line.color}
                strokeWidth="4"
                strokeLinecap="round"
                opacity={0.8}
              />
            ))}
            {dragPath.length > 0 && (
              <>
                {dragPath.map((point, index) => {
                  if (index === 0) return null;
                  const prev = dragPath[index - 1];
                  return (
                    <Line
                      key={`drag-${index}`}
                      x1={getCenter(prev.col)}
                      y1={getCenter(prev.row)}
                      x2={getCenter(point.col)}
                      y2={getCenter(point.row)}
                      stroke="#e74c3c"
                      strokeWidth="6"
                      strokeDasharray="10, 5"
                      opacity={0.6}
                    />
                  );
                })}
              </>
            )}
          </Svg>
        </View>

        {/* 3. Touch Overlay */}
        <View 
          style={[styles.absoluteFill, { backgroundColor: 'transparent' }]}
          {...panResponder.panHandlers}
        />

        {/* 4. Popup Layer */}
        {pendingCell && (
          <View 
            style={[
              styles.popupContainer,
              {
                width: cellSize * 2.5,
                height: cellSize,
                top: (pendingCell.row * (cellSize + 2)),
                left: (pendingCell.col * (cellSize + 2)) - (cellSize * 0.75),
              }
            ]}
          >
            <TouchableOpacity onPress={() => onConfirmPlacement('S')} style={[styles.bubble, styles.bubbleS]}>
              <Text style={styles.bubbleText}>S</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirmPlacement('O')} style={[styles.bubble, styles.bubbleO]}>
              <Text style={styles.bubbleText}>O</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, zIndex: 10 },
  gridContainer: { position: 'relative' },
  row: { flexDirection: 'row' },
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  
  popupContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 50,
    padding: 5,
    elevation: 20, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999, 
  },
  bubble: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2, borderColor: '#fff'
  },
  bubbleS: { backgroundColor: '#2c3e50' },
  bubbleO: { backgroundColor: '#e74c3c' },
  bubbleText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});