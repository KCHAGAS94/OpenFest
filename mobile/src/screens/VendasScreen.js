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

const EVENTO = 'SwingSamba';

// Mesma paleta do frontend (Tailwind): gray-950/900/800, pink-500/400.
const CORES = {
  bg: '#030712',
  header: '#000000',
  card: '#111827',
  cardBorder: 'rgba(255,255,255,0.1)',
  pink: '#ec4899',
  pinkDark: '#db2777',
  pinkLight: '#f472b6',
  textoMuted: '#9ca3af',
  textoMutedForte: '#6b7280',
  erro: '#f87171',
  sucesso: '#22c55e',
};

export default function VendasScreen() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
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
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

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

  async function registrarVenda(tipoPagamento) {
    try {
      await api.post('/api/vendas', {
        itens: carrinho.map((item) => ({
          produtoId: item.id,
          quantidade: item.quantidade,
          precoUnit: item.preco,
        })),
        total,
        tipoPagamento,
      });
    } catch (err) {
      // Falha ao registrar a venda no banco não deve travar o fluxo já confirmado.
    }
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
    await registrarVenda(tipoPagamento);
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
    setCarrinhoAberto(false);
    fecharPagamento();
    carregarProdutos();
  }

  return (
    <View style={styles.container}>
      <View style={styles.conteudo}>
        <Text style={styles.sectionTitle}>Produtos disponíveis</Text>

        {!!erro && etapa === 'idle' && <Text style={styles.errorBanner}>{erro}</Text>}

        <FlatList
          data={produtos}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: carrinho.length > 0 ? 100 : 24 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => adicionarItem(item)}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardPreco}>R$ {Number(item.preco).toFixed(2)}</Text>
              <Text style={styles.cardEstoque}>Estoque: {item.estoque ?? '-'}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto disponível.</Text>}
        />
      </View>

      {carrinho.length > 0 && (
        <Pressable style={styles.cartFab} onPress={() => setCarrinhoAberto(true)}>
          <Text style={styles.cartFabEmoji}>🛒</Text>
          <View style={styles.cartFabBadge}>
            <Text style={styles.cartFabBadgeText}>{totalItens}</Text>
          </View>
          <Text style={styles.cartFabTotal}>R$ {total.toFixed(2)}</Text>
        </Pressable>
      )}

      {/* ─── Bottom sheet do carrinho ─── */}
      <Modal visible={carrinhoAberto} transparent animationType="slide">
        <Pressable style={styles.sheetOverlay} onPress={() => setCarrinhoAberto(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.modalTitle}>Pedido atual</Text>
            <Pressable onPress={() => setCarrinhoAberto(false)}>
              <Text style={styles.fechar}>×</Text>
            </Pressable>
          </View>

          <FlatList
            data={carrinho}
            keyExtractor={(item) => String(item.id)}
            style={{ maxHeight: 280 }}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum item adicionado.</Text>}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemNome}>{item.nome}</Text>
                  <Text style={styles.cartItemPreco}>
                    R$ {item.preco.toFixed(2)} × {item.quantidade}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable style={styles.qtdBtn} onPress={() => removerItem(item.id)}>
                    <Text style={styles.qtdBtnText}>−</Text>
                  </Pressable>
                  <Text style={{ color: '#fff', width: 16, textAlign: 'center' }}>{item.quantidade}</Text>
                  <Pressable style={[styles.qtdBtn, { backgroundColor: 'rgba(34,197,94,0.15)' }]} onPress={() => adicionarItem(item)}>
                    <Text style={styles.qtdBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />

          <View style={styles.sheetFooter}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ color: CORES.textoMuted }}>Total</Text>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>R$ {total.toFixed(2)}</Text>
            </View>
            <Pressable
              style={[styles.finalizarBtn, carrinho.length === 0 && { opacity: 0.4 }]}
              disabled={carrinho.length === 0}
              onPress={() => {
                setCarrinhoAberto(false);
                setEtapa('escolha');
              }}
            >
              <Text style={styles.finalizarBtnText}>Finalizar Venda</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Modal de pagamento ─── */}
      <Modal visible={etapa !== 'idle'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {etapa === 'escolha' && (
              <>
                <Text style={styles.modalTitle}>Forma de Pagamento</Text>
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
                <Text style={styles.modalTitle}>Aguardando Cartão</Text>
                <Text style={styles.modalInfo}>
                  Realize a cobrança de R$ {total.toFixed(2)} no celular/maquininha do Mercado Pago. Assim que
                  aprovar, a venda confirma automaticamente.
                </Text>
                <ActivityIndicator size="large" color={CORES.pink} style={{ marginVertical: 16 }} />
                <Pressable onPress={fecharPagamento}>
                  <Text style={styles.cancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {etapa === 'aguardando_pix' && pixData && (
              <>
                <Text style={styles.modalTitle}>Pague via PIX</Text>
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
                <ActivityIndicator size="small" color={CORES.pink} style={{ marginVertical: 12 }} />
                <Pressable onPress={fecharPagamento}>
                  <Text style={styles.cancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {etapa === 'confirmado' && (
              <>
                <Text style={styles.modalTitle}>✅ Pagamento Confirmado</Text>
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
  container: { flex: 1, backgroundColor: CORES.bg },
  conteudo: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { color: '#e5e7eb', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  errorBanner: {
    color: '#fecaca',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  empty: { color: CORES.textoMutedForte, textAlign: 'center', marginTop: 24 },
  card: {
    flex: 1,
    backgroundColor: CORES.card,
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardNome: { color: '#fff', fontWeight: '500', fontSize: 14, lineHeight: 18 },
  cardPreco: { color: CORES.pinkLight, fontWeight: 'bold', marginTop: 8 },
  cardEstoque: { color: CORES.textoMuted, fontSize: 12, marginTop: 4 },
  cartFab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CORES.pink,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cartFabEmoji: { fontSize: 18 },
  cartFabBadge: {
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFabBadgeText: { color: CORES.pinkDark, fontSize: 11, fontWeight: 'bold' },
  cartFabTotal: { color: '#fff', fontWeight: '600' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: CORES.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: CORES.cardBorder,
    padding: 20,
    maxHeight: '75%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetFooter: { borderTopWidth: 1, borderTopColor: CORES.cardBorder, paddingTop: 16, marginTop: 10 },
  fechar: { color: CORES.textoMuted, fontSize: 24, lineHeight: 24 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  cartItemNome: { color: '#fff', fontSize: 14, fontWeight: '500' },
  cartItemPreco: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  qtdBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtdBtnText: { color: '#fff', fontWeight: 'bold' },
  finalizarBtn: { backgroundColor: CORES.pink, borderRadius: 12, paddingVertical: 14 },
  finalizarBtnText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalBox: {
    backgroundColor: CORES.card,
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  modalTotal: { color: CORES.pinkLight, fontWeight: 'bold', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  modalInfo: { color: CORES.textoMuted, textAlign: 'center', marginTop: 8, marginBottom: 8 },
  pagamentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pagamentoBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    minWidth: '42%',
    alignItems: 'center',
  },
  pagamentoBtnText: { color: '#fff', fontWeight: '500' },
  cancelar: { color: CORES.textoMutedForte, textAlign: 'center', marginTop: 18 },
  qrCode: { width: 220, height: 220, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 12, marginTop: 8 },
  copiarBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, marginTop: 12 },
  copiarBtnText: { color: '#e5e7eb', textAlign: 'center', fontSize: 12 },
});
