import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const EVENTO = 'SwingSamba';

export default function VendasScreen() {
  const { user, logout } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [etapa, setEtapa] = useState('idle'); // idle | escolha | aguardando_pix | aguardando_cartao | confirmado
  const [pixData, setPixData] = useState(null);
  const [erro, setErro] = useState('');
  const [loadingPag, setLoadingPag] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    carregarProdutos();
    return () => clearInterval(pollRef.current);
  }, []);

  async function carregarProdutos() {
    try {
      const { data } = await api.get('/api/produtos');
      setProdutos(data);
    } catch (err) {
      setErro('Não foi possível conectar ao servidor. Verifique se o PC está ligado e na mesma rede.');
    }
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  function adicionarItem(produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      const estoqueDisponivel = produto.estoque ?? Infinity;
      if (existe) {
        if (existe.quantidade >= estoqueDisponivel) return prev;
        return prev.map((i) => (i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      if (estoqueDisponivel <= 0) return prev;
      return [...prev, { ...produto, preco: Number(produto.preco) || 0, quantidade: 1 }];
    });
  }

  function removerItem(id) {
    setCarrinho((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      if (item.quantidade === 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i));
    });
  }

  function fecharPagamento() {
    clearInterval(pollRef.current);
    setEtapa('idle');
    setPixData(null);
    setErro('');
  }

  async function imprimirRecibo(tipoPagamento) {
    const recibo = {
      evento: EVENTO,
      itens: carrinho.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        preco: item.preco,
        total: item.preco * item.quantidade,
      })),
      total,
      data: new Date().toLocaleString('pt-BR'),
      pagamento: tipoPagamento,
    };
    try {
      await api.post('/api/print', recibo);
    } catch (err) {
      setErro('Venda confirmada, mas falhou ao imprimir o cupom no PC.');
    }
  }

  async function confirmarVenda(tipoPagamento) {
    clearInterval(pollRef.current);
    await imprimirRecibo(tipoPagamento);
    setEtapa('confirmado');
  }

  function iniciarPollingPix(id) {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/pagamento/status/${id}`);
        if (data.status === 'approved') {
          confirmarVenda('Pix');
        }
      } catch {}
    }, 3000);
  }

  function iniciarPollingCartao(tipoApi, tipoLabel) {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/api/pagamento/cartao/verificar', {
          params: { valor: String(total), tipo: tipoApi },
        });
        if (data.encontrado) {
          confirmarVenda(tipoLabel);
        }
      } catch {}
    }, 3000);
  }

  async function selecionarPagamento(tipo) {
    setLoadingPag(true);
    setErro('');
    try {
      if (tipo === 'Dinheiro') {
        await confirmarVenda('Dinheiro');
        return;
      }

      if (tipo === 'Pix') {
        const { data } = await api.post('/api/pagamento/pix', {
          valor: total,
          descricao: `Venda ${EVENTO}`,
        });
        setPixData(data);
        setEtapa('aguardando_pix');
        iniciarPollingPix(data.id);
        return;
      }

      const tipoApi = tipo === 'Crédito' ? 'credito' : 'debito';
      setEtapa('aguardando_cartao');
      iniciarPollingCartao(tipoApi, tipo);
    } catch (err) {
      setErro(err?.response?.data?.message || 'Erro ao processar pagamento.');
      setEtapa('escolha');
    } finally {
      setLoadingPag(false);
    }
  }

  function concluirVenda() {
    setCarrinho([]);
    fecharPagamento();
    carregarProdutos();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OpenFest · {user?.name}</Text>
        <Pressable onPress={logout}>
          <Text style={styles.headerLogout}>Sair</Text>
        </Pressable>
      </View>

      {!!erro && etapa === 'idle' && <Text style={styles.errorBanner}>{erro}</Text>}

      <FlatList
        data={produtos}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => adicionarItem(item)}>
            <Text style={styles.cardNome}>{item.nome}</Text>
            <Text style={styles.cardPreco}>R$ {Number(item.preco).toFixed(2)}</Text>
            <Text style={styles.cardEstoque}>Estoque: {item.estoque ?? '-'}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum produto disponível.</Text>}
      />

      {carrinho.length > 0 && (
        <View style={styles.cartBar}>
          <View style={{ flex: 1 }}>
            {carrinho.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Text style={styles.cartItemNome} numberOfLines={1}>
                  {item.quantidade}x {item.nome}
                </Text>
                <Pressable onPress={() => removerItem(item.id)}>
                  <Text style={styles.cartItemRemover}>−</Text>
                </Pressable>
              </View>
            ))}
          </View>
          <Pressable style={styles.finalizarBtn} onPress={() => setEtapa('escolha')}>
            <Text style={styles.finalizarBtnText}>Finalizar{'\n'}R$ {total.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={etapa !== 'idle'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {etapa === 'escolha' && (
              <>
                <Text style={styles.modalTitle}>Forma de pagamento</Text>
                <Text style={styles.modalTotal}>Total: R$ {total.toFixed(2)}</Text>
                {!!erro && <Text style={styles.errorBanner}>{erro}</Text>}
                <View style={styles.pagamentoGrid}>
                  {['Débito', 'Crédito', 'Pix', 'Dinheiro'].map((label) => (
                    <Pressable
                      key={label}
                      style={styles.pagamentoBtn}
                      disabled={loadingPag}
                      onPress={() => selecionarPagamento(label)}
                    >
                      <Text style={styles.pagamentoBtnText}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={fecharPagamento}>
                  <Text style={styles.cancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {etapa === 'aguardando_cartao' && (
              <>
                <Text style={styles.modalTitle}>Aguardando cartão</Text>
                <Text style={styles.modalInfo}>
                  Realize a cobrança de R$ {total.toFixed(2)} na maquininha/celular do Mercado Pago.
                  Assim que aprovar, a venda confirma automaticamente.
                </Text>
                <ActivityIndicator size="large" color="#ec4899" style={{ marginVertical: 16 }} />
                <Pressable onPress={fecharPagamento}>
                  <Text style={styles.cancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {etapa === 'aguardando_pix' && pixData && (
              <>
                <Text style={styles.modalTitle}>Pague via Pix</Text>
                <Image
                  source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }}
                  style={styles.qrCode}
                />
                <Pressable
                  style={styles.copiarBtn}
                  onPress={() => Clipboard.setStringAsync(pixData.qr_code)}
                >
                  <Text style={styles.copiarBtnText}>Copiar código Pix</Text>
                </Pressable>
                <ActivityIndicator size="small" color="#ec4899" style={{ marginVertical: 12 }} />
                <Pressable onPress={fecharPagamento}>
                  <Text style={styles.cancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {etapa === 'confirmado' && (
              <>
                <Text style={styles.modalTitle}>✅ Pagamento confirmado</Text>
                <Text style={styles.modalInfo}>Cupom enviado para impressão no PC.</Text>
                <Pressable style={styles.finalizarBtn} onPress={concluirVenda}>
                  <Text style={styles.finalizarBtnText}>Nova venda</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  headerLogout: { color: '#f87171' },
  errorBanner: {
    color: '#fecaca',
    backgroundColor: 'rgba(248,113,113,0.15)',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  grid: { padding: 16, gap: 10 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardNome: { color: '#fff', fontWeight: '500' },
  cardPreco: { color: '#ec4899', fontWeight: 'bold', marginTop: 6 },
  cardEstoque: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  cartBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  cartItemNome: { color: '#e2e8f0', fontSize: 13, flex: 1 },
  cartItemRemover: { color: '#f87171', fontSize: 18, paddingHorizontal: 8 },
  finalizarBtn: { backgroundColor: '#ec4899', borderRadius: 10, padding: 12 },
  finalizarBtnText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#111827', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  modalTotal: { color: '#ec4899', fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  modalInfo: { color: '#94a3b8', textAlign: 'center', marginBottom: 8 },
  pagamentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pagamentoBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    minWidth: '42%',
    alignItems: 'center',
  },
  pagamentoBtnText: { color: '#fff', fontWeight: '500' },
  cancelar: { color: '#64748b', textAlign: 'center', marginTop: 16 },
  qrCode: { width: 220, height: 220, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 12 },
  copiarBtn: { backgroundColor: '#1e293b', borderRadius: 10, padding: 10, marginTop: 12 },
  copiarBtnText: { color: '#e2e8f0', textAlign: 'center', fontSize: 12 },
});
