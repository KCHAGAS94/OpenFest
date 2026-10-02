import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { api } from '../api/client';

const CORES = {
  card: '#111827',
  campo: '#1f2937',
  cardBorder: 'rgba(255,255,255,0.1)',
  pink: '#ec4899',
  pinkLight: '#f472b6',
  textoMuted: '#9ca3af',
  verde: '#22c55e',
  vermelho: '#ef4444',
};

const PERMISSOES_LABEL = {
  caixa: 'Caixa',
  produtos: 'Produtos',
  gestao: 'Gestão',
  configuracoes: 'Configurações',
};

const FORM_VAZIO = {
  nome: '',
  email: '',
  senha: '',
  permissoes: { caixa: false, produtos: false, gestao: false, configuracoes: false },
};

export default function ConfiguracoesScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await api.get('/api/usuarios');
      setUsuarios(data);
    } catch (err) {
      setErro(err?.response?.data?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setEditId(null);
    setModalAberto(true);
  }

  function abrirEdicao(usuario) {
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      permissoes: { ...usuario.permissoes },
    });
    setEditId(usuario.id);
    setModalAberto(true);
  }

  function togglePermissao(chave) {
    setForm((prev) => ({
      ...prev,
      permissoes: { ...prev.permissoes, [chave]: !prev.permissoes[chave] },
    }));
  }

  async function salvar() {
    if (!form.nome || !form.email || (!editId && !form.senha)) {
      setErro('Preencha nome, e-mail e senha.');
      return;
    }
    setSalvando(true);
    setErro('');
    const body = { nome: form.nome, email: form.email, permissoes: form.permissoes };
    if (form.senha) body.senha = form.senha;

    try {
      if (editId) {
        await api.put(`/api/usuarios/${editId}`, body);
      } else {
        await api.post('/api/usuarios', body);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(err?.response?.data?.message || 'Não foi possível salvar o usuário.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(usuario) {
    Alert.alert('Remover usuário?', `Remover ${usuario.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => excluir(usuario) },
    ]);
  }

  async function excluir(usuario) {
    try {
      await api.delete(`/api/usuarios/${usuario.id}`);
      carregar();
    } catch (err) {
      setErro(err?.response?.data?.message || 'Não foi possível remover o usuário.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View>
          <Text style={styles.titulo}>Usuários do sistema</Text>
          <Text style={styles.subtitulo}>Gerencie acessos e permissões</Text>
        </View>
        <Pressable style={styles.novoBtn} onPress={abrirNovo}>
          <Text style={styles.novoBtnText}>+ Novo</Text>
        </Pressable>
      </View>

      {!!erro && !modalAberto && <Text style={styles.errorBanner}>{erro}</Text>}

      {carregando ? (
        <ActivityIndicator color={CORES.pink} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardEmail}>{item.email}</Text>

              <View style={styles.badges}>
                {Object.entries(item.permissoes)
                  .filter(([, ativo]) => ativo)
                  .map(([chave]) => (
                    <Text key={chave} style={styles.badge}>
                      {PERMISSOES_LABEL[chave]}
                    </Text>
                  ))}
              </View>

              <View style={styles.cardAcoes}>
                <Pressable style={styles.acaoEditar} onPress={() => abrirEdicao(item)}>
                  <Text style={styles.acaoEditarTexto}>Editar</Text>
                </Pressable>
                <Pressable style={styles.acaoExcluir} onPress={() => confirmarExclusao(item)}>
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuário cadastrado.</Text>}
        />
      )}

      <Modal visible={modalAberto} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editId ? 'Editar usuário' : 'Novo usuário'}</Text>

              {!!erro && <Text style={styles.errorBanner}>{erro}</Text>}

              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={form.nome}
                onChangeText={(v) => setForm({ ...form, nome: v })}
                style={styles.input}
                placeholderTextColor={CORES.textoMuted}
              />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={CORES.textoMuted}
              />

              <Text style={styles.label}>
                Senha {editId ? '(deixe em branco para manter a atual)' : ''}
              </Text>
              <TextInput
                value={form.senha}
                onChangeText={(v) => setForm({ ...form, senha: v })}
                style={styles.input}
                secureTextEntry
                placeholderTextColor={CORES.textoMuted}
              />

              <Text style={styles.label}>Permissões</Text>
              <View style={styles.permissoesGrid}>
                {Object.entries(PERMISSOES_LABEL).map(([chave, label]) => (
                  <Pressable
                    key={chave}
                    style={styles.permissaoItem}
                    onPress={() => togglePermissao(chave)}
                  >
                    <View style={[styles.checkbox, form.permissoes[chave] && styles.checkboxMarcado]}>
                      {form.permissoes[chave] && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={styles.permissaoLabel}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalBotoes}>
                <Pressable
                  style={styles.cancelarBtn}
                  onPress={() => {
                    setModalAberto(false);
                    setErro('');
                  }}
                >
                  <Text style={styles.cancelarTexto}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.salvarBtn} onPress={salvar} disabled={salvando}>
                  <Text style={styles.salvarBtnText}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titulo: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtitulo: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  novoBtn: { backgroundColor: CORES.pink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  novoBtnText: { color: '#fff', fontWeight: '600' },
  errorBanner: {
    color: '#fecaca',
    backgroundColor: 'rgba(248,113,113,0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: CORES.card,
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    borderRadius: 14,
    padding: 16,
  },
  cardNome: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardEmail: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: {
    color: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardAcoes: { flexDirection: 'row', gap: 8, marginTop: 14 },
  acaoEditar: { flex: 1, backgroundColor: CORES.campo, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  acaoEditarTexto: { color: CORES.verde, fontSize: 13, fontWeight: '600' },
  acaoExcluir: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 24 },
  modalBox: { backgroundColor: CORES.card, borderWidth: 1, borderColor: CORES.cardBorder, borderRadius: 20, padding: 22 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { color: CORES.textoMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: CORES.campo,
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 14,
  },
  permissoesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  permissaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CORES.campo,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '45%',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: CORES.textoMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: CORES.pink, borderColor: CORES.pink },
  checkboxCheck: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  permissaoLabel: { color: '#d1d5db', fontSize: 13 },
  modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelarBtn: { flex: 1, backgroundColor: CORES.campo, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelarTexto: { color: '#fff', fontWeight: '600' },
  salvarBtn: { flex: 1, backgroundColor: CORES.pink, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  salvarBtnText: { color: '#fff', fontWeight: '700' },
});
