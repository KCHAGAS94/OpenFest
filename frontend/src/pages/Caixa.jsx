  // Função para enviar recibo ao backend para impressão
  async function imprimirReciboBackend(recibo) {
    try {
      await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recibo),
      });
    } catch (err) {
      alert('Erro ao enviar recibo para impressão!');
    }
  }
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import ReciboImpressao from '../components/ReciboImpressao'
import '../print.css';

function carregarProdutos() {
  try {
    const produtos = JSON.parse(localStorage.getItem('openfest_produtos')) || [];
    // Garante que preco é sempre número
    return produtos.map(p => ({ ...p, preco: Number(p.preco) || 0 }));
  } catch {
    return [];
  }
}

function salvarVendas(vendas) {
  try {
    localStorage.setItem('openfest_vendas', JSON.stringify(vendas))
  } catch (error) {
    console.error('Erro ao salvar vendas:', error)
  }
}

function carregarVendas() {
  try {
    return JSON.parse(localStorage.getItem('openfest_vendas')) || []
  } catch {
    return []
  }
}

export default function Caixa() {
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [reciboInfo, setReciboInfo] = useState({});
  const [produtos, setProdutos] = useState(carregarProdutos)
  const [carrinho, setCarrinho] = useState([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)

  // Pagamento
  const [etapa, setEtapa] = useState('idle')
  const [pixData, setPixData] = useState(null)
  const [erroPag, setErroPag] = useState('')
  const [loadingPag, setLoadingPag] = useState(false)
  const [valorPago, setValorPago] = useState('')
  const poolRef = useRef(null)

  useEffect(() => {
    function onFocus() { setProdutos(carregarProdutos()) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    if (etapa === 'confirmado' && reciboInfo.itens) {
      setMostrarRecibo(true);
    }
  }, [etapa, reciboInfo]);

  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0)

  function adicionarItem(produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      const estoqueDisponivel = produto.estoque ?? Infinity;
      if (existe) {
        if (existe.quantidade >= estoqueDisponivel) return prev;
        return prev.map((i) => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      if (estoqueDisponivel <= 0) return prev;
      // Garante que preco é sempre número
      return [...prev, { ...produto, preco: Number(produto.preco) || 0, quantidade: 1 }];
    });
  }

  function removerItem(id) {
    setCarrinho((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item) return prev
      if (item.quantidade === 1) return prev.filter((i) => i.id !== id)
      return prev.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i))
    })
  }

  function limparCarrinho() { setCarrinho([]) }

  function fecharPagamento() {
    if (poolRef.current?.interval) clearInterval(poolRef.current.interval)
    else clearInterval(poolRef.current)
    setEtapa('idle')
    setPixData(null)
    setErroPag('')
  }

  function finalizarVenda() {
    if (carrinho.length === 0) return
    setEtapa('escolha')
    setErroPag('')
  }

  function confirmarPagamento(tipoPagamento = 'Dinheiro', imprimir = true) {
    if (poolRef.current?.interval) {
      clearInterval(poolRef.current.interval);
    } else {
      clearInterval(poolRef.current);
    }
    if (carrinho.length > 0) {
      const venda = {
        id: Date.now(),
        data: new Date(),
        itens: carrinho,
        total: carrinho.reduce((acc, item) => acc + Number(item.preco) * Number(item.quantidade), 0),
        vendedor: 'Sistema',
        tipoPagamento,
      };
      const vendasAtuais = carregarVendas();
      salvarVendas([...vendasAtuais, venda]);

      // Atualizar estoque e bloquear produtos se necessário
      const produtosAtualizados = produtos.map(produto => {
        const itemCarrinho = carrinho.find(item => item.id === produto.id);
        if (itemCarrinho) {
          const novoEstoque = (produto.estoque || 0) - itemCarrinho.quantidade;
          return {
            ...produto,
            estoque: novoEstoque,
            bloqueado: novoEstoque <= 0 ? true : produto.bloqueado
          };
        }
        return produto;
      });
      localStorage.setItem('openfest_produtos', JSON.stringify(produtosAtualizados));
      setProdutos(produtosAtualizados);

      // Montar dados do recibo para impressão
      const totalRecibo = carrinho.reduce((acc, item) => {
        const preco = Number(item.preco);
        const qtd = Number(item.quantidade);
        return acc + (isNaN(preco) || isNaN(qtd) ? 0 : preco * qtd);
      }, 0);
      const recibo = {
        evento: 'SwingSamba',
        itens: carrinho.map(item => {
          const preco = Number(item.preco);
          const qtd = Number(item.quantidade);
          const unidadesCombo = item.tipo === 'combo' ? (Number(item.unidadesCombo) || 1) : 1;
          const precoUnitario = isNaN(preco) ? 0 : preco / unidadesCombo;
          return {
            nome: item.nome,
            quantidade: isNaN(qtd) ? 0 : qtd * unidadesCombo,
            preco: precoUnitario,
            total: (isNaN(preco) || isNaN(qtd)) ? 0 : preco * qtd
          };
        }),
        total: isNaN(totalRecibo) ? 0 : totalRecibo,
        data: new Date().toLocaleString('pt-BR'),
        pagamento: tipoPagamento,
      };
      setReciboInfo(recibo);
      if (imprimir) imprimirReciboBackend(recibo);
    }
    setEtapa('confirmado');
  }

  function iniciarPolling(id, tipoPagamento = 'Dinheiro') {
    if (!poolRef.current) poolRef.current = {};
    poolRef.current.tipoPagamento = tipoPagamento;
    poolRef.current.interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagamento/status/${id}`);
        const data = await res.json();
        if (data.status === 'approved') {
          clearInterval(poolRef.current.interval);
          // Só imprime após aprovação do Pix
          confirmarPagamento(tipoPagamento, true);
        }
      } catch {}
    }, 3000);
  }

  async function selecionarPagamento(tipo) {
    setLoadingPag(true);
    setErroPag('');

    try {
      if (tipo === 'Dinheiro') {
        setValorPago('');
        setEtapa('dinheiro');
        setLoadingPag(false);
        return;
      }

      if (tipo === 'Pix') {
        const res = await fetch('/api/pagamento/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: total, descricao: 'Venda SwingSamba' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setPixData(data);
        setEtapa('aguardando_pix');
        poolRef.current = { tipoPagamento: 'Pix', interval: null, id: data.id };
        iniciarPolling(data.id, 'Pix');
        return;
      }

      const res = await fetch('/api/pagamento/cartao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: total,
          descricao: 'Venda SwingSamba',
          tipo: tipo === 'Crédito' ? 'credito' : 'debito',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEtapa('aguardando_cartao');
      poolRef.current = { tipoPagamento: tipo, interval: null, id: data.id };
      iniciarPolling(data.id, tipo);

    } catch (err) {
      setErroPag(err.message || 'Erro ao processar pagamento.');
      setEtapa('escolha');
    } finally {
      setLoadingPag(false);
    }
  }

  function concluirVenda() {
    limparCarrinho();
    setCarrinhoAberto(false);
    fecharPagamento();
    setMostrarRecibo(false);
    setReciboInfo({});
  }

  // FILTRAGEM: Somente produtos não bloqueados aparecem no catálogo e estoque > 0
  const produtosVisiveis = produtos.filter(p => !p.bloqueado && (p.estoque === undefined || p.estoque > 0));

  const PainelCarrinho = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Pedido atual</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {carrinho.length === 0 ? (
          <p className="text-gray-600 text-sm text-center mt-8">Nenhum item adicionado.</p>
        ) : (
          carrinho.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.nome}</p>
                <p className="text-xs text-gray-400">R$ {(Number(item.preco) || 0).toFixed(2)} × {item.quantidade}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => removerItem(item.id)} className="w-7 h-7 rounded-full bg-gray-700 hover:bg-pink-600 text-sm font-bold transition-colors">−</button>
                <span className="text-sm w-4 text-center">{item.quantidade}</span>
                <button 
                  onClick={() => adicionarItem(item)}
                  className="w-7 h-7 rounded-full bg-gray-700 hover:bg-green-600 text-sm font-bold transition-colors"
                  disabled={(() => {
                    const prod = produtos.find(p => p.id === item.id);
                    return !prod || item.quantidade >= (prod.estoque ?? Infinity);
                  })()}
                  title={(() => {
                    const prod = produtos.find(p => p.id === item.id);
                    if (!prod) return '';
                    if (item.quantidade >= (prod.estoque ?? Infinity)) return 'Estoque máximo atingido';
                    return '';
                  })()}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-xl font-bold text-white">R$ {total.toFixed(2)}</span>
        </div>
        <button
          onClick={finalizarVenda}
          disabled={carrinho.length === 0}
          className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors"
        >
          Finalizar Venda
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ─── Modal de Pagamento ─── */}
      {etapa !== 'idle' && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={etapa === 'escolha' ? fecharPagamento : undefined} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {etapa === 'escolha' && 'Forma de Pagamento'}
                  {etapa === 'dinheiro' && 'Pagamento em Dinheiro'}
                  {etapa === 'aguardando_cartao' && 'Aguardando Cartão'}
                  {etapa === 'aguardando_pix' && 'Pague via PIX'}
                  {etapa === 'confirmado' && 'Pagamento Confirmado'}
                </h3>
                {(etapa === 'escolha' || etapa === 'dinheiro') && (
                  <button onClick={fecharPagamento} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
                )}
              </div>

              {etapa === 'escolha' && (
                <>
                  <p className="text-gray-500 text-sm mb-5">Total: <span className="text-pink-400 font-bold text-base">R$ {total.toFixed(2)}</span></p>
                  {erroPag && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">{erroPag}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Débito', emoji: '💳' }, { label: 'Crédito', emoji: '💳' }, { label: 'Pix', emoji: '⚡' }, { label: 'Dinheiro', emoji: '💵' }].map(({ label, emoji }) => (
                      <button key={label} onClick={() => selecionarPagamento(label)} disabled={loadingPag} className="flex flex-col items-center justify-center gap-2 bg-gray-800 hover:bg-pink-500/20 hover:border-pink-500 border border-white/10 rounded-xl py-5 transition-all active:scale-95 disabled:opacity-50">
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-sm font-medium text-white">{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {etapa === 'dinheiro' && (
                <div>
                  <p className="text-gray-400 text-sm mb-4">Total: <span className="text-pink-400 font-bold text-base">R$ {total.toFixed(2)}</span></p>
                  <label className="block text-gray-400 text-sm mb-1">Valor recebido</label>
                  <input
                    type="text"
                    placeholder={`R$ ${total.toFixed(2)}`}
                    value={valorPago}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, "");
                      let centavos = onlyNums ? parseInt(onlyNums, 10) : 0;
                      let formatted = (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      setValorPago(formatted);
                    }}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-lg text-center focus:outline-none focus:border-pink-500 mb-4"
                    autoFocus
                  />
                  {valorPago && Number(valorPago.replace('.', '').replace(',', '.')) >= total && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center mb-4">
                      <p className="text-gray-400 text-xs mb-1">Troco</p>
                      <p className="text-green-400 font-bold text-2xl">R$ {(Number(valorPago.replace('.', '').replace(',', '.')) - total).toFixed(2)}</p>
                    </div>
                  )}
                  <button onClick={() => confirmarPagamento('Dinheiro')} disabled={!valorPago || Number(valorPago.replace('.', '').replace(',', '.')) < total} className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors">Confirmar</button>
                </div>
              )}

              {etapa === 'aguardando_cartao' && (
                <div className="text-center py-4">
                  <p className="text-4xl mb-4">📲</p>
                  <p className="text-white font-medium mb-2">Aproxime o cartão do celular</p>
                  <div className="flex justify-center mt-4"><div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
                  <button onClick={fecharPagamento} className="mt-5 text-gray-600 hover:text-red-400 text-sm transition-colors">Cancelar</button>
                </div>
              )}

              {etapa === 'aguardando_pix' && pixData && (
                <div className="text-center">
                  <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />
                  <button onClick={() => navigator.clipboard.writeText(pixData.qr_code)} className="w-full text-xs bg-gray-800 mt-3 text-gray-300 rounded-lg px-3 py-2 truncate uppercase">{pixData.qr_code?.slice(0, 30)}...</button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm"><div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />Aguardando...</div>
                  <button onClick={fecharPagamento} className="mt-4 text-gray-600 text-sm">Cancelar</button>
                </div>
              )}

              {etapa === 'confirmado' && mostrarRecibo && reciboInfo.itens && (
                <ReciboImpressao
                  evento={reciboInfo.evento}
                  itens={reciboInfo.itens}
                  total={reciboInfo.total}
                  data={reciboInfo.data}
                  onAfterPrint={concluirVenda}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Layout Principal ─── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 py-8 gap-6" style={{ height: 'calc(100vh - 4rem)' }}>
        <section className="flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Produtos disponíveis</h2>
          {produtosVisiveis.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-gray-600">
              <span className="text-4xl mb-3">🛍️</span>
              <p className="text-sm">Nenhum produto disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
              {produtosVisiveis.map((produto) => (
                <button key={produto.id} onClick={() => adicionarItem(produto)} className="bg-gray-900 border border-white/10 rounded-xl p-4 text-left hover:border-pink-500/50 hover:bg-gray-800 transition-all active:scale-95">
                  <p className="font-medium text-white text-sm leading-tight">{produto.nome}</p>
                  <p className="text-pink-400 font-bold mt-2">R$ {(Number(produto.preco) || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">Estoque: {produto.estoque ?? '-'}</p>
                </button>
              ))}
            </div>
          )}
        </section>
        <aside className="w-80 flex-shrink-0 bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col min-h-0">{PainelCarrinho}</aside>
      </div>

      {/* ─── Mobile ─── */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        <section className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
          <h2 className="text-base font-semibold mb-3 text-gray-200">Produtos disponíveis</h2>
          <div className="grid grid-cols-2 gap-3">
            {produtosVisiveis.map((produto) => (
              <button key={produto.id} onClick={() => adicionarItem(produto)} className="bg-gray-900 border border-white/10 rounded-xl p-4 text-left active:scale-95">
                <p className="font-medium text-white text-sm leading-tight">{produto.nome}</p>
                <p className="text-pink-400 font-bold mt-2">R$ {(Number(produto.preco) || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Estoque: {produto.estoque ?? '-'}</p>
              </button>
            ))}
          </div>
        </section>
        <button onClick={() => setCarrinhoAberto(true)} className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-pink-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg z-40">
          🛒 {totalItens > 0 && <span className="bg-white text-pink-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{totalItens}</span>}
          <span>R$ {total.toFixed(2)}</span>
        </button>
        {carrinhoAberto && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setCarrinhoAberto(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 rounded-t-2xl p-5 z-50 flex flex-col" style={{ maxHeight: '80vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">Pedido atual</h2>
                <button onClick={() => setCarrinhoAberto(false)} className="text-gray-500 text-2xl">×</button>
              </div>
              <div className="overflow-y-auto flex-1">{PainelCarrinho}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}