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
  laranja: '#f97316',
};

const FORM_VAZIO = { nome: '', preco: '', estoque: '', bloqueado: false, tipo: 'unidade', unidadesCombo: '' };

// Máscara monetária: digita centavos e desliza para reais (7 -> 0,07 -> 0,75 -> 7,50), igual ao web.
function formatarValorDigitado(valorDigitado) {
  const onlyNums = valorDigitado.replace(/\D/g, '');
  const centavos = onlyNums ? parseInt(onlyNums, 10) : 0;
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paraNumero(valorFormatado) {
  if (!valorFormatado) return 0;
  return Number(valorFormatado.replace('.', '').replace(',', '.')) || 0;
}

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await api.get('/api/produtos');
      setProdutos(data.map((p) => ({ ...p, preco: Number(p.preco) })));
    } catch (err) {
      setErro('Não foi possível carregar os produtos.');
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(produto) {
    setEditandoId(produto.id);
    setForm({
      nome: produto.nome,
      preco: produto.preco.toFixed(2).replace('.', ','),
      estoque: String(produto.estoque),
      bloqueado: !!produto.bloqueado,
      tipo: produto.tipo || 'unidade',
      unidadesCombo: produto.unidadesCombo ? String(produto.unidadesCombo) : '',
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.nome || !form.preco || !form.estoque || (form.tipo === 'combo' && !form.unidadesCombo)) {
      setErro('Preencha todos os campos.');
      return;
    }
    setSalvando(true);
    setErro('');
    const payload = {
      nome: form.nome,
      preco: paraNumero(form.preco),
      estoque: parseInt(form.estoque, 10),
      bloqueado: form.bloqueado,
      tipo: form.tipo,
      unidadesCombo: form.tipo === 'combo' ? parseInt(form.unidadesCombo, 10) || 1 : null,
    };
    try {
      if (editandoId) {
        await api.put(`/api/produtos/${editandoId}`, payload);
      } else {
        await api.post('/api/produtos', payload);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro('Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarBloqueio(produto) {
    try {
      await api.put(`/api/produtos/${produto.id}`, { ...produto, bloqueado: !produto.bloqueado });
      carregar();
    } catch {
      setErro('Não foi possível atualizar o produto.');
    }
  }

  function confirmarExclusao(produto) {
    Alert.alert('Excluir Produto?', `Tem certeza que deseja remover "${produto.nome}"? Esta ação não pode ser desfeita.`, [
      { text: 'Manter', style: 'cancel' },
      { text: 'Sim, Excluir', style: 'destructive', onPress: () => excluir(produto) },
    ]);
  }

  async function excluir(produto) {
    try {
      await api.delete(`/api/produtos/${produto.id}`);
      carregar();
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível excluir o produto.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View>
          <Text style={styles.titulo}>Gestão de Produtos</Text>
          <Text style={styles.subtitulo}>Cadastre e gerencie os itens do evento</Text>
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
          data={produtos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNome}>{item.nome}</Text>
                  <Text style={styles.cardPreco}>R$ {item.preco.toFixed(2)}</Text>
                  {item.tipo === 'combo' && (
                    <Text style={styles.cardCombo}>
                      Combo {item.unidadesCombo}un · R$ {(item.preco / item.unidadesCombo).toFixed(2)}/un
                    </Text>
                  )}
                  <Text style={styles.cardEstoque}>Estoque: {item.estoque}</Text>
                </View>
                <Text style={item.bloqueado ? styles.badgeBloqueado : styles.badgeAtivo}>
                  {item.bloqueado ? 'BLOQUEADO' : 'ATIVO'}
                </Text>
              </View>

              <View style={styles.cardAcoes}>
                <Pressable style={styles.acaoEditar} onPress={() => abrirEdicao(item)}>
                  <Text style={styles.acaoEditarTexto}>Editar</Text>
                </Pressable>
                <Pressable style={styles.acaoIcone} onPress={() => alternarBloqueio(item)}>
                  <Text style={{ fontSize: 16 }}>{item.bloqueado ? '🔓' : '🚫'}</Text>
                </Pressable>
                <Pressable style={[styles.acaoIcone, styles.acaoExcluir]} onPress={() => confirmarExclusao(item)}>
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado.</Text>}
        />
      )}

      <Modal visible={modalAberto} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editandoId ? '📝 Editar Produto' : '🛍️ Novo Produto'}</Text>

              {!!erro && <Text style={styles.errorBanner}>{erro}</Text>}

              <Text style={styles.label}>Nome do Produto</Text>
              <TextInput
                placeholder="Ex: Cerveja Lata"
                placeholderTextColor={CORES.textoMuted}
                value={form.nome}
                onChangeText={(v) => setForm({ ...form, nome: v })}
                style={styles.input}
              />

              <Text style={styles.label}>Tipo de Venda</Text>
              <View style={styles.tipoRow}>
                <Pressable
                  style={[styles.tipoBtn, form.tipo === 'unidade' && styles.tipoBtnAtivo]}
                  onPress={() => setForm({ ...form, tipo: 'unidade' })}
                >
                  <Text style={[styles.tipoBtnTexto, form.tipo === 'unidade' && styles.tipoBtnTextoAtivo]}>
                    Unidade
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tipoBtn, form.tipo === 'combo' && styles.tipoBtnAtivo]}
                  onPress={() => setForm({ ...form, tipo: 'combo' })}
                >
                  <Text style={[styles.tipoBtnTexto, form.tipo === 'combo' && styles.tipoBtnTextoAtivo]}>
                    Combo
                  </Text>
                </Pressable>
              </View>

              <View style={styles.linhaCampos}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{form.tipo === 'combo' ? 'Preço do combo (R$)' : 'Preço (R$)'}</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={form.preco}
                    onChangeText={(v) => setForm({ ...form, preco: formatarValorDigitado(v) })}
                    style={styles.input}
                    placeholder="0,00"
                    placeholderTextColor={CORES.textoMuted}
                  />
                </View>
                {form.tipo === 'combo' && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Unidades</Text>
                    <TextInput
                      keyboardType="number-pad"
                      placeholder="Ex: 5"
                      placeholderTextColor={CORES.textoMuted}
                      value={form.unidadesCombo}
                      onChangeText={(v) => setForm({ ...form, unidadesCombo: v })}
                      style={styles.input}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Estoque</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={form.estoque}
                    onChangeText={(v) => setForm({ ...form, estoque: v })}
                    style={styles.input}
                  />
                </View>
              </View>

              {form.tipo === 'combo' && form.preco && Number(form.unidadesCombo) > 0 && (
                <Text style={styles.dicaCombo}>
                  Valor por unidade:{' '}
                  <Text style={{ color: CORES.pinkLight, fontWeight: '600' }}>
                    R$ {(paraNumero(form.preco) / parseInt(form.unidadesCombo, 10)).toFixed(2).replace('.', ',')}
                  </Text>
                </Text>
              )}

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setForm({ ...form, bloqueado: !form.bloqueado })}
              >
                <View style={[styles.checkbox, form.bloqueado && styles.checkboxMarcado]}>
                  {form.bloqueado && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Bloquear este produto no caixa</Text>
              </Pressable>

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
                  <Text style={styles.salvarBtnText}>
                    {salvando ? 'Salvando...' : editandoId ? 'Salvar' : 'Cadastrar'}
                  </Text>
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
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNome: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardPreco: { color: CORES.pinkLight, fontWeight: 'bold', marginTop: 4 },
  cardCombo: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  cardEstoque: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  badgeAtivo: {
    color: CORES.verde,
    backgroundColor: 'rgba(34,197,94,0.15)',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeBloqueado: {
    color: CORES.vermelho,
    backgroundColor: 'rgba(239,68,68,0.15)',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardAcoes: { flexDirection: 'row', gap: 8, marginTop: 14 },
  acaoEditar: { flex: 1, backgroundColor: CORES.campo, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  acaoEditarTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  acaoIcone: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 10,
  },
  acaoExcluir: { backgroundColor: 'rgba(239,68,68,0.1)' },
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
  tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tipoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    backgroundColor: CORES.campo,
    alignItems: 'center',
  },
  tipoBtnAtivo: { backgroundColor: 'rgba(236,72,153,0.2)', borderColor: CORES.pink },
  tipoBtnTexto: { color: CORES.textoMuted, fontWeight: '600', fontSize: 13 },
  tipoBtnTextoAtivo: { color: '#fff' },
  linhaCampos: { flexDirection: 'row', gap: 10 },
  dicaCombo: { color: CORES.textoMuted, fontSize: 11, marginTop: -6, marginBottom: 12 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: CORES.textoMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: CORES.pink, borderColor: CORES.pink },
  checkboxCheck: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  checkboxLabel: { color: '#d1d5db', fontSize: 13 },
  modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelarBtn: { flex: 1, backgroundColor: CORES.campo, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelarTexto: { color: '#fff', fontWeight: '600' },
  salvarBtn: { flex: 1, backgroundColor: CORES.pink, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  salvarBtnText: { color: '#fff', fontWeight: '700' },
});
