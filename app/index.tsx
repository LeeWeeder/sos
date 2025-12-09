import { Colors } from '@/constants/Color';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSBoard } from '../components/SOSBoard';
import { useSOSGame } from '../hooks/useSOSGame';

export default function SOSGameScreen() {
  const game = useSOSGame();

  // --- SETUP VIEW ---
  if (game.phase === 'SETUP') {
    return (
      <SafeAreaView style={styles.setupContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextS}>S</Text>
          <Text style={styles.logoTextO}>O</Text>
          <Text style={styles.logoTextS}>S</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="grid" size={24} color={Colors.text} />
            <Text style={styles.cardTitle}>Grid Size</Text>
          </View>
          <View style={styles.selectionRow}>
            {[7, 8, 9].map((size) => (
              <TouchableOpacity 
                key={size} 
                style={[styles.selectBtn, game.gridSize === size && styles.selectBtnActive]}
                onPress={() => game.setGridSize(size as any)}
              >
                <Text style={[styles.selectText, game.gridSize === size && styles.selectTextActive]}>
                  {size}x{size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={24} color={Colors.text} />
            <Text style={styles.cardTitle}>Players</Text>
          </View>
          <View style={styles.selectionRow}>
            {[2, 3, 4].map((count) => (
              <TouchableOpacity 
                key={count} 
                style={[styles.selectBtn, game.playerCount === count && styles.selectBtnActive]}
                onPress={() => game.setPlayerCount(count)}
              >
                <Text style={[styles.selectText, game.playerCount === count && styles.selectTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.playBtn} onPress={game.startGame}>
          <Ionicons name="play" size={32} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- GAME OVER VIEW ---
  if (game.phase === 'GAME_OVER') {
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const isDraw = sortedPlayers[0].score === sortedPlayers[1].score;

    return (
      <SafeAreaView style={styles.centerContainer}>
        <MaterialCommunityIcons name="trophy" size={80} color={Colors.warning} style={{marginBottom: 20}} />
        
        {isDraw ? (
          <Text style={styles.winnerText}>Draw!</Text>
        ) : (
          <Text style={[styles.winnerText, { color: winner.color }]}>{winner.name} Wins!</Text>
        )}
        
        <View style={styles.resultsCard}>
          {sortedPlayers.map((p, index) => (
            <View key={p.id} style={styles.resultRow}>
              <View style={styles.rankBadge}><Text style={styles.rankText}>{index + 1}</Text></View>
              <Text style={[styles.resultName, { color: p.color }]}>{p.name}</Text>
              <Text style={styles.resultScore}>{p.score}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={game.resetGame}>
          <Ionicons name="refresh" size={28} color="#fff" />
          <Text style={styles.resetText}>Play Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- ACTIVE GAME VIEW ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Bar: Players */}
      <View style={styles.topBar}>
        {game.players.map((p) => {
          const isActive = game.currentPlayer.id === p.id;
          return (
            <View key={p.id} style={[styles.playerPill, isActive && styles.playerPillActive]}>
              <View style={[styles.avatar, { backgroundColor: p.color }]}>
                <Text style={styles.avatarText}>{p.name.charAt(1)}</Text>
              </View>
              <Text style={styles.scoreText}>{p.score}</Text>
            </View>
          );
        })}
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        {game.canPlaceBonus ? (
          <View style={[styles.statusPill, { backgroundColor: Colors.warning }]}>
            <MaterialCommunityIcons name="star" size={16} color="#fff" />
            <Text style={styles.statusText}>BONUS MOVE</Text>
          </View>
        ) : game.phase === 'PLACEMENT' ? (
          <View style={[styles.statusPill, { backgroundColor: Colors.textLight }]}>
            <MaterialCommunityIcons name="gesture-tap" size={16} color="#fff" />
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: Colors.success }]}>
            <MaterialCommunityIcons name="gesture-swipe" size={16} color="#fff" />
          </View>
        )}
      </View>

      {/* The Board */}
      <View style={styles.boardWrapper}>
        <SOSBoard 
          grid={game.grid}
          onCellTap={game.handleCellTap}
          pendingCell={game.pendingCell}
          onConfirmPlacement={game.confirmPlacement}
          onDismiss={game.dismissPopup}
          dragPath={game.dragPath}
          onDragEnter={game.handleDragEnter}
          onDragEnd={game.handleDragEnd}
          slashedLines={game.slashedLines}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {game.phase === 'CLAIMING' && (
          <TouchableOpacity 
            style={styles.endTurnFab}
            onPress={game.endTurn}
            activeOpacity={0.8}
          >
            <Feather name="check" size={32} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  setupContainer: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: Colors.background },
  
  // Setup Styles
  logoContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 50, gap: 5 },
  logoTextS: { fontSize: 60, fontWeight: '900', color: Colors.primaryS },
  logoTextO: { fontSize: 60, fontWeight: '900', color: Colors.primaryO },
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, ...Colors.shadow },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  selectionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  selectBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center' },
  selectBtnActive: { backgroundColor: Colors.primaryS },
  selectText: { fontSize: 16, fontWeight: 'bold', color: Colors.textLight },
  selectTextActive: { color: '#fff' },
  
  playBtn: { alignSelf: 'center', backgroundColor: Colors.success, width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginTop: 20, ...Colors.shadow },

  // Game Header
  topBar: { flexDirection: 'row', justifyContent: 'center', paddingTop: 20, gap: 15 },
  playerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 6, paddingRight: 15, borderRadius: 30, opacity: 0.5 },
  playerPillActive: { opacity: 1, transform: [{scale: 1.1}], ...Colors.shadow },
  avatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  scoreText: { fontWeight: '900', fontSize: 16, color: Colors.text },

  // Status
  statusContainer: { alignItems: 'center', marginTop: 20, height: 30 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Board
  boardWrapper: { flex: 1, justifyContent: 'center' },

  // Bottom Controls
  bottomBar: { height: 100, justifyContent: 'center', alignItems: 'center' },
  endTurnFab: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primaryS, justifyContent: 'center', alignItems: 'center', ...Colors.shadow },

  // Game Over
  winnerText: { fontSize: 32, fontWeight: '900', color: Colors.text, marginBottom: 30 },
  resultsCard: { backgroundColor: '#fff', width: '80%', borderRadius: 20, padding: 20, ...Colors.shadow, marginBottom: 30 },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, justifyContent: 'space-between' },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontWeight: 'bold', fontSize: 12, color: Colors.textLight },
  resultName: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  resultScore: { fontSize: 20, fontWeight: '900', color: Colors.text },
  resetBtn: { flexDirection: 'row', backgroundColor: Colors.primaryS, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', gap: 10 },
  resetText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});