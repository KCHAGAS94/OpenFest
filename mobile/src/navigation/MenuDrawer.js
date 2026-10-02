import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const CORES = {
  bg: '#030712',
  card: '#111827',
  cardBorder: 'rgba(255,255,255,0.1)',
  pink: '#ec4899',
  pinkLight: '#f472b6',
  textoMuted: '#9ca3af',
  erro: '#f87171',
};

const ITENS = [
  { tela: 'caixa', label: 'Caixa', permissao: 'caixa', icone: '💰' },
  { tela: 'produtos', label: 'Produtos', permissao: 'produtos', icone: '🛍️' },
  { tela: 'gestao', label: 'Gestão', permissao: 'gestao', icone: '📊' },
  { tela: 'configuracoes', label: 'Configurações', permissao: 'configuracoes', icone: '⚙️' },
];

export default function MenuDrawer({ visivel, telaAtiva, onNavegar, onFechar }) {
  const { user, logout } = useAuth();
  const itensVisiveis = ITENS.filter((item) => user?.permissoes?.[item.permissao]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={styles.overlay} onPress={onFechar} />
      <View style={styles.drawer}>
        <View style={styles.perfil}>
          <Text style={styles.perfilNome}>{user?.name}</Text>
          <Text style={styles.perfilEmail}>{user?.email}</Text>
        </View>

        <View style={styles.lista}>
          {itensVisiveis.map((item) => (
            <Pressable
              key={item.tela}
              onPress={() => {
                onNavegar(item.tela);
                onFechar();
              }}
              style={[styles.item, telaAtiva === item.tela && styles.itemAtivo]}
            >
              <Text style={styles.itemIcone}>{item.icone}</Text>
              <Text style={[styles.itemLabel, telaAtiva === item.tela && styles.itemLabelAtivo]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.sair} onPress={logout}>
          <Text style={styles.sairTexto}>Sair</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '78%',
    maxWidth: 300,
    backgroundColor: CORES.card,
    borderRightWidth: 1,
    borderRightColor: CORES.cardBorder,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  perfil: { paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: CORES.cardBorder, marginBottom: 12 },
  perfilNome: { color: '#fff', fontWeight: '700', fontSize: 16 },
  perfilEmail: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  lista: { flex: 1, gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemAtivo: { backgroundColor: 'rgba(255,255,255,0.08)' },
  itemIcone: { fontSize: 16 },
  itemLabel: { color: CORES.textoMuted, fontSize: 15, fontWeight: '500' },
  itemLabelAtivo: { color: '#fff' },
  sair: {
    borderTopWidth: 1,
    borderTopColor: CORES.cardBorder,
    paddingVertical: 16,
    marginBottom: 24,
  },
  sairTexto: { color: CORES.erro, fontWeight: '600', fontSize: 15 },
});
