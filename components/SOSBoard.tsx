import { Colors } from '@/constants/Color';
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
  onDismiss: () => void;
  dragPath: Coordinate[];
  onDragEnter: (row: number, col: number) => void;
  onDragEnd: () => void;
  slashedLines: SlashedLine[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 20;
// We use the full width available
const MAX_BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;

const POPUP_WIDTH = 130; 
const POPUP_HEIGHT = 55;

export const SOSBoard: React.FC<Props> = (props) => {
  const { 
    grid, pendingCell, onConfirmPlacement, 
    dragPath, slashedLines 
  } = props;

  const gridSize = grid.length;
  const cellSize = MAX_BOARD_SIZE / gridSize; 
  const totalBoardSize = cellSize * gridSize;

  const callbacksRef = useRef({
    onDragEnter: props.onDragEnter,
    onDragEnd: props.onDragEnd,
    onCellTap: props.onCellTap
  });

  useEffect(() => {
    callbacksRef.current = {
      onDragEnter: props.onDragEnter,
      onDragEnd: props.onDragEnd,
      onCellTap: props.onCellTap
    };
  });

  const getGridCoords = (x: number, y: number) => {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
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
        if (coords) callbacksRef.current.onDragEnter(coords.row, coords.col);
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const coords = getGridCoords(locationX, locationY);
        if (coords) callbacksRef.current.onDragEnter(coords.row, coords.col);
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

  // Center is exactly half the cell size + offset
  const getCenter = (idx: number) => (idx * cellSize) + (cellSize / 2);
  const isDragged = (r: number, c: number) => dragPath.some(p => p.row === r && p.col === c);

  // --- Smart Popup Positioning ---
  const getPopupStyle = () => {
    if (!pendingCell) return {};
    
    const { row, col } = pendingCell;
    
    // Default: Centered horizontally, positioned ABOVE the cell
    let top = (row * cellSize) - POPUP_HEIGHT - 8;
    let left = (col * cellSize) + (cellSize / 2) - (POPUP_WIDTH / 2);

    // Check Top Edge (If row is 0 or 1, put it BELOW)
    if (row < 1) {
      top = (row * cellSize) + cellSize + 8;
    }

    // Check Left Edge
    if (left < 0) {
      left = 0; // Stick to left edge
    }

    // Check Right Edge
    if (left + POPUP_WIDTH > totalBoardSize) {
      left = totalBoardSize - POPUP_WIDTH; // Stick to right edge
    }

    return { top, left, width: POPUP_WIDTH, height: POPUP_HEIGHT };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.gridContainer, { width: totalBoardSize, height: totalBoardSize }]}>
        
        {/* Grid Layer */}
        {grid.map((row, rIndex) => (
          <View key={rIndex} style={styles.row}>
            {row.map((cell, cIndex) => (
              <SOSCell
                key={`${rIndex}-${cIndex}`}
                value={cell}
                size={cellSize}
                isSelected={isDragged(rIndex, cIndex)}
                isPending={pendingCell?.row === rIndex && pendingCell?.col === cIndex}
              />
            ))}
          </View>
        ))}

        {/* SVG Layer */}
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
                strokeWidth="6"
                strokeLinecap="round"
                opacity={0.7}
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
                      stroke={Colors.primaryO}
                      strokeWidth="6"
                      strokeDasharray="10, 5"
                      opacity={0.5}
                    />
                  );
                })}
              </>
            )}
          </Svg>
        </View>

        {/* Touch Overlay */}
        <View 
          style={[styles.absoluteFill, { backgroundColor: 'transparent' }]}
          {...panResponder.panHandlers}
        />

        {/* Popup Layer */}
        {pendingCell && (
          <View style={[styles.popupContainer, getPopupStyle()]}>
            <TouchableOpacity onPress={() => onConfirmPlacement('S')} style={[styles.bubble, styles.bubbleS]}>
              <Text style={styles.bubbleText}>S</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
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
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#2C3E50', // Dark background
    borderRadius: 50, // Pill shape
    paddingHorizontal: 10,
    // Modern Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 999, 
  },
  bubble: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  bubbleS: {},
  bubbleO: {},
  bubbleText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  divider: { width: 1, height: '50%', backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 5 },
});