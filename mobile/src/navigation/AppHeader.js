import { View, Text, Pressable, StyleSheet } from 'react-native';

const CORES = {
  header: '#000000',
  cardBorder: 'rgba(255,255,255,0.1)',
  pinkLight: '#f472b6',
  textoMuted: '#9ca3af',
};

export default function AppHeader({ titulo, onAbrirMenu }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onAbrirMenu} hitSlop={12} style={styles.menuBtn}>
        <View style={styles.linha} />
        <View style={styles.linha} />
        <View style={styles.linha} />
      </Pressable>

      <Text style={styles.logo}>
        Open<Text style={{ color: CORES.pinkLight }}>Fest</Text>
        {!!titulo && <Text style={styles.subtitulo}> · {titulo}</Text>}
      </Text>

      <View style={{ width: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.header,
    borderBottomWidth: 1,
    borderBottomColor: CORES.cardBorder,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  menuBtn: { width: 24, gap: 5 },
  linha: { height: 2, borderRadius: 1, backgroundColor: '#fff' },
  logo: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: -0.5 },
  subtitulo: { color: CORES.textoMuted, fontSize: 14, fontWeight: '400' },
});
