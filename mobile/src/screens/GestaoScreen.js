import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { api } from '../api/client';

const CORES = {
  card: '#111827',
  campo: '#1f2937',
  cardBorder: 'rgba(255,255,255,0.1)',
  pink: '#ec4899',
  pinkLight: '#f472b6',
  textoMuted: '#9ca3af',
  azul: '#3b82f6',
  roxo: '#a855f7',
  ambar: '#f59e0b',
  amarelo: '#eab308',
};

const ABAS = [
  { chave: 'dashboard', label: 'Dashboard' },
  { chave: 'financeiro', label: 'Financeiro' },
  { chave: 'produtos', label: 'Produtos' },
  { chave: 'funcionarios', label: 'Funcionários' },
];

function getTaxa(tipo, taxas) {
  if (tipo === 'Pix') return parseFloat(taxas.taxaPix) || 0;
  if (tipo === 'Débito' || tipo === 'Debito') return parseFloat(taxas.taxaDebito) || 0;
  if (tipo === 'Crédito' || tipo === 'Credito') return parseFloat(taxas.taxaCredito) || 0;
  return 0;
}

export default function GestaoScreen() {
  const [aba, setAba] = useState('dashboard');
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [taxas, setTaxas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [produtosRes, vendasRes, configRes] = await Promise.all([
        api.get('/api/produtos'),
        api.get('/api/vendas'),
        api.get('/api/configuracoes'),
      ]);
      setProdutos(produtosRes.data.map((p) => ({ ...p, preco: Number(p.preco) })));
      setVendas(vendasRes.data.map((v) => ({ ...v, total: Number(v.total) })));
      setTaxas(configRes.data);
    } catch (err) {
      setErro('Não foi possível carregar os dados de gestão.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.abas}>
        {ABAS.map((item) => (
          <Pressable key={item.chave} onPress={() => setAba(item.chave)} style={styles.abaItem}>
            <Text style={[styles.abaLabel, aba === item.chave && styles.abaLabelAtiva]}>{item.label}</Text>
            {aba === item.chave && <View style={styles.abaIndicador} />}
          </Pressable>
        ))}
      </View>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={CORES.pink} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={carregar} tintColor={CORES.pink} />}
        >
          {!!erro && <Text style={styles.errorBanner}>{erro}</Text>}

          {aba === 'dashboard' && <AbaDashboard produtos={produtos} vendas={vendas} taxas={taxas} />}
          {aba === 'financeiro' && <AbaFinanceiro vendas={vendas} />}
          {aba === 'produtos' && <AbaProdutos vendas={vendas} />}
          {aba === 'funcionarios' && <AbaFuncionarios />}
        </ScrollView>
      )}
    </View>
  );
}

function AbaDashboard({ produtos, vendas, taxas }) {
  const vendasDoDia = vendas
    .filter((venda) => new Date(venda.data).toDateString() === new Date().toDateString())
    .reduce((sum, venda) => sum + venda.total, 0);

  const valorTotalVendas = vendas.reduce((sum, venda) => sum + (venda.total || 0), 0);

  const saldoDisponivel = vendas.reduce((sum, venda) => {
    const tipo = (venda.tipoPagamento || 'Dinheiro').toLowerCase();
    let tipoPadrao = 'Dinheiro';
    if (tipo === 'pix') tipoPadrao = 'Pix';
    else if (tipo === 'debito' || tipo === 'débito') tipoPadrao = 'Débito';
    else if (tipo === 'credito' || tipo === 'crédito') tipoPadrao = 'Crédito';
    const taxa = getTaxa(tipoPadrao, taxas);
    const total = venda.total || 0;
    return sum + (total - (total * taxa) / 100);
  }, 0);

  return (
    <>
      <Card label="Vendas do dia" valor={`R$ ${vendasDoDia.toFixed(2).replace('.', ',')}`} nota="Atualizado em tempo real" />
      <Card label="Produtos cadastrados" valor={`${produtos.length} itens`} />
      <Card label="Vendas registradas" valor={String(vendas.length)} />
      <Card label="Venda total" valor={`R$ ${valorTotalVendas.toFixed(2).replace('.', ',')}`} />
      <Card
        label="Saldo disponível"
        valor={`R$ ${saldoDisponivel.toFixed(2).replace('.', ',')}`}
        nota="Já descontando as taxas de pagamento"
      />
    </>
  );
}

function AbaFinanceiro({ vendas }) {
  const pagamentos = { Dinheiro: 0, Pix: 0, Debito: 0, Credito: 0 };
  let totalGeral = 0;

  vendas.forEach((venda) => {
    let tipo = venda.tipoPagamento || 'Dinheiro';
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === 'debito' || tipoLower === 'débito') tipo = 'Debito';
    else if (tipoLower === 'credito' || tipoLower === 'crédito') tipo = 'Credito';
    else if (tipoLower === 'pix') tipo = 'Pix';
    else tipo = 'Dinheiro';
    pagamentos[tipo] += venda.total;
    totalGeral += venda.total;
  });

  const barras = [
    { label: 'Dinheiro', cor: CORES.azul, valor: pagamentos.Dinheiro },
    { label: 'Pix', cor: CORES.roxo, valor: pagamentos.Pix },
    { label: 'Débito', cor: CORES.ambar, valor: pagamentos.Debito },
    { label: 'Crédito', cor: CORES.amarelo, valor: pagamentos.Credito },
  ];

  return (
    <>
      <Card label="Total geral" valor={`R$ ${totalGeral.toFixed(2).replace('.', ',')}`} />
      {barras.map((barra) => {
        const pct = totalGeral > 0 ? (barra.valor / totalGeral) * 100 : 0;
        return (
          <View key={barra.label} style={styles.card}>
            <View style={styles.barraTopo}>
              <Text style={[styles.barraLabel, { color: barra.cor }]}>{barra.label}</Text>
              <Text style={[styles.barraValor, { color: barra.cor }]}>
                R$ {barra.valor.toFixed(2).replace('.', ',')} ({pct.toFixed(1).replace('.', ',')}%)
              </Text>
            </View>
            <View style={styles.barraFundo}>
              <View style={[styles.barraPreenchida, { width: `${pct}%`, backgroundColor: barra.cor }]} />
            </View>
          </View>
        );
      })}
    </>
  );
}

function AbaProdutos({ vendas }) {
  const vendasPorProduto = vendas.reduce((acc, venda) => {
    venda.itens?.forEach((item) => {
      acc[item.produtoNome] = (acc[item.produtoNome] || 0) + item.quantidade;
    });
    return acc;
  }, {});

  const totalVendido = Object.values(vendasPorProduto).reduce((sum, qtd) => sum + qtd, 0);
  const produtosVendidos = Object.entries(vendasPorProduto)
    .map(([nome, quantidade]) => ({ nome, quantidade, pct: totalVendido > 0 ? (quantidade / totalVendido) * 100 : 0 }))
    .sort((a, b) => b.quantidade - a.quantidade);

  return (
    <>
      <Text style={styles.secaoTitulo}>Produtos mais vendidos</Text>
      {produtosVendidos.length === 0 && <Text style={styles.empty}>Nenhum produto vendido ainda.</Text>}
      {produtosVendidos.map((produto) => (
        <View key={produto.nome} style={styles.card}>
          <View style={styles.barraTopo}>
            <Text style={styles.barraLabel}>{produto.nome}</Text>
            <Text style={styles.barraValor}>
              {produto.quantidade} ({produto.pct.toFixed(1).replace('.', ',')}%)
            </Text>
          </View>
          <View style={styles.barraFundo}>
            <View style={[styles.barraPreenchida, { width: `${produto.pct}%`, backgroundColor: CORES.azul }]} />
          </View>
        </View>
      ))}

      <Text style={[styles.secaoTitulo, { marginTop: 16 }]}>Últimas vendas</Text>
      {vendas.length === 0 && <Text style={styles.empty}>Nenhuma venda registrada.</Text>}
      {vendas.slice(0, 20).map((venda) => (
        <View key={venda.id} style={styles.card}>
          <View style={styles.vendaTopo}>
            <Text style={styles.vendaPedido}>#{String(venda.idPedido).padStart(5, '0')}</Text>
            <Text style={styles.vendaData}>{new Date(venda.data).toLocaleString('pt-BR')}</Text>
          </View>
          <Text style={styles.vendaVendedor}>{venda.vendedorNome} · {venda.tipoPagamento}</Text>
          {venda.itens?.map((item) => (
            <Text key={item.id} style={styles.vendaItem}>
              {item.quantidade}x {item.produtoNome}
            </Text>
          ))}
          <Text style={styles.vendaTotal}>R$ {venda.total.toFixed(2).replace('.', ',')}</Text>
        </View>
      ))}
    </>
  );
}

function AbaFuncionarios() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
      <Text style={{ fontSize: 32 }}>🚧</Text>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Funcionários</Text>
      <Text style={{ color: CORES.textoMuted, textAlign: 'center' }}>
        Essa área ainda guarda dados só no navegador do desktop (não está no banco). Use o desktop por enquanto.
      </Text>
    </View>
  );
}

function Card({ label, valor, nota }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValor}>{valor}</Text>
      {!!nota && <Text style={styles.cardNota}>{nota}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  abas: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: CORES.cardBorder,
    paddingHorizontal: 8,
  },
  abaItem: { paddingHorizontal: 12, paddingVertical: 14, alignItems: 'center' },
  abaLabel: { color: CORES.textoMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  abaLabelAtiva: { color: '#fff' },
  abaIndicador: { marginTop: 8, height: 2, width: '100%', backgroundColor: CORES.pink, borderRadius: 1 },
  errorBanner: {
    color: '#fecaca',
    backgroundColor: 'rgba(248,113,113,0.1)',
    padding: 10,
    borderRadius: 10,
  },
  empty: { color: '#6b7280', textAlign: 'center', marginVertical: 8 },
  secaoTitulo: { color: '#e5e7eb', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: CORES.card,
    borderWidth: 1,
    borderColor: CORES.cardBorder,
    borderRadius: 16,
    padding: 18,
  },
  cardLabel: { color: CORES.textoMuted, fontSize: 13 },
  cardValor: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 8 },
  cardNota: { color: '#6b7280', fontSize: 12, marginTop: 6 },
  barraTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  barraLabel: { color: '#e5e7eb', fontWeight: '600', fontSize: 13 },
  barraValor: { color: '#e5e7eb', fontWeight: '700', fontSize: 13 },
  barraFundo: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)' },
  barraPreenchida: { height: '100%', borderRadius: 999 },
  vendaTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  vendaPedido: { color: CORES.pinkLight, fontWeight: '700', fontSize: 13 },
  vendaData: { color: CORES.textoMuted, fontSize: 12 },
  vendaVendedor: { color: CORES.textoMuted, fontSize: 12, marginTop: 4, marginBottom: 6 },
  vendaItem: { color: '#d1d5db', fontSize: 13 },
  vendaTotal: { color: '#fff', fontWeight: '700', marginTop: 8 },
});
