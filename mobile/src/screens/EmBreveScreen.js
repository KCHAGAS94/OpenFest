import { View, Text, StyleSheet } from 'react-native';

export default function EmBreveScreen({ titulo }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.texto}>Essa área ainda não foi construída no app mobile. Por enquanto, use o desktop.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emoji: { fontSize: 36, marginBottom: 8 },
  titulo: { color: '#fff', fontSize: 18, fontWeight: '700' },
  texto: { color: '#9ca3af', textAlign: 'center' },
});
