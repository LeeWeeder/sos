import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSBoard } from '../components/SOSBoard';
import { useSOSGame } from '../hooks/useSOSGame';

export default function SOSGameScreen() {
  const game = useSOSGame();

  // --- SETUP VIEW ---
  if (game.phase === 'SETUP') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.title}>SOS GAME</Text>
        
        <View style={styles.optionGroup}>
          <Text style={styles.label}>Grid Size: {game.gridSize}x{game.gridSize}</Text>
          <View style={styles.row}>
            {[7, 8, 9].map((size) => (
              <TouchableOpacity 
                key={size} 
                style={[styles.btn, game.gridSize === size && styles.btnActive]}
                onPress={() => game.setGridSize(size as any)}
              >
                <Text style={[styles.btnText, game.gridSize === size && styles.btnTextActive]}>{size}x{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionGroup}>
          <Text style={styles.label}>Players: {game.playerCount}</Text>
          <View style={styles.row}>
            {[2, 3, 4].map((count) => (
              <TouchableOpacity 
                key={count} 
                style={[styles.btn, game.playerCount === count && styles.btnActive]}
                onPress={() => game.setPlayerCount(count)}
              >
                <Text style={[styles.btnText, game.playerCount === count && styles.btnTextActive]}>{count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={game.startGame}>
          <Text style={styles.startBtnText}>START GAME</Text>
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
        <Text style={styles.title}>GAME OVER</Text>
        {isDraw ? (
          <Text style={styles.winnerText}>Draw!</Text>
        ) : (
          <Text style={[styles.winnerText, { color: winner.color }]}>{winner.name} Wins!</Text>
        )}
        
        <View style={styles.scoreList}>
          {sortedPlayers.map(p => (
            <Text key={p.id} style={styles.scoreItem}>{p.name}: {p.score} pts</Text>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={game.resetGame}>
          <Text style={styles.startBtnText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- ACTIVE GAME VIEW ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Scoreboard */}
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {game.players.map((p) => (
            <View key={p.id} style={[
              styles.playerBadge, 
              game.currentPlayer.id === p.id && styles.activePlayerBadge,
              { borderColor: p.color }
            ]}>
              <Text style={{ fontWeight: 'bold', color: p.color }}>{p.name}</Text>
              <Text>{p.score}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Turn: <Text style={{color: game.currentPlayer.color, fontWeight: 'bold'}}>{game.currentPlayer.name}</Text>
        </Text>
        <Text style={styles.phaseText}>
          {game.phase === 'PLACEMENT' 
            ? "Tap a cell to place letter" 
            : "Swipe across S-O-S to slash!"}
        </Text>
      </View>

      {/* Board */}
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

      <View style={styles.controls}>
        {game.phase === 'CLAIMING' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#e74c3c' }]}
            onPress={game.endTurn}
          >
            <Text style={styles.actionBtnText}>END TURN</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {game.phase === 'CLAIMING' && (
        <Text style={styles.hintText}>Swipe your finger over S-O-S to score!</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6fa' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, color: '#2c3e50' },
  
  // Setup
  optionGroup: { marginBottom: 30, alignItems: 'center' },
  label: { fontSize: 18, marginBottom: 10, color: '#34495e' },
  row: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#ecf0f1', borderRadius: 8 },
  btnActive: { backgroundColor: '#3498db' },
  btnText: { fontSize: 16, color: '#2c3e50' },
  btnTextActive: { color: '#fff', fontWeight: 'bold' },
  startBtn: { backgroundColor: '#2c3e50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, marginTop: 20 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Game
  header: { padding: 10, backgroundColor: '#fff', elevation: 2 },
  playerBadge: { 
    padding: 10, marginHorizontal: 5, borderWidth: 2, borderRadius: 10, 
    alignItems: 'center', minWidth: 70, backgroundColor: '#fff' 
  },
  activePlayerBadge: { backgroundColor: '#ecf0f1' },
  infoBar: { alignItems: 'center', marginTop: 10 },
  infoText: { fontSize: 18 },
  phaseText: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  
  controls: { padding: 20, alignItems: 'center' },
  actionBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, elevation: 3 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  hintText: { textAlign: 'center', color: '#7f8c8d', marginBottom: 20 },

  // Game Over
  winnerText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  scoreList: { marginBottom: 30 },
  scoreItem: { fontSize: 18, marginBottom: 5 },
});