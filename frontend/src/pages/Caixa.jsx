import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'

function carregarProdutos() {
  try {
    return JSON.parse(localStorage.getItem('openfest_produtos')) || []
  } catch {
    return []
  }
}

// Estados do pagamento: 'idle' | 'escolha' | 'aguardando_cartao' | 'aguardando_pix' | 'confirmado' | 'erro'

export default function Caixa() {
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

  // Imprime e fecha ao confirmar
  useEffect(() => {
    if (etapa === 'confirmado') {
      imprimirRecibo()
      const t = setTimeout(() => concluirVenda(), 1500)
      return () => clearTimeout(t)
    }
  }, [etapa])

  function imprimirRecibo() {
    const agora = new Date().toLocaleString('pt-BR')

    const itens = carrinho
      .flatMap((i) =>
        Array.from({ length: i.quantidade }, () =>
          `<div class="ticket">
            <div class="linha"></div>
            <div class="titulo">OpenFest</div>
            <div class="subtitulo">${agora}</div>
            <div style="height:10px"></div>
            <div class="nome">${i.nome}</div>
            <div class="valor">R$ ${i.preco.toFixed(2)}</div>
            <div class="linha"></div>
          </div>`
        )
      )
      .join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: monospace; font-size: 14px; width: 80mm; padding: 8px; text-align: center; }
        .ticket { margin-bottom: 0; }
        .titulo { font-weight: bold; font-size: 15px; text-align: center; }
        .subtitulo { font-size: 11px; color: #555; margin-bottom: 4px; text-align: center; }
        .linha { border-top: 1px dashed #000; margin: 6px 0; }
        .nome { font-weight: bold; font-size: 17.3px; margin-top: 8px; text-align: center; }
        .valor { font-size: 17.3px; margin-top: 2px; text-align: center; }
      </style>
    </head><body>
      ${itens}
    </body></html>`

    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0)

  function adicionarItem(produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id)
      if (existe) return prev.map((i) => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      return [...prev, { ...produto, quantidade: 1 }]
    })
  }

  function removerItem(id) {
    setCarrinho((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item.quantidade === 1) return prev.filter((i) => i.id !== id)
      return prev.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i))
    })
  }

  function limparCarrinho() { setCarrinho([]) }

  function fecharPagamento() {
    clearInterval(poolRef.current)
    setEtapa('idle')
    setPixData(null)
    setErroPag('')
  }

  function finalizarVenda() {
    if (carrinho.length === 0) return
    setEtapa('escolha')
    setErroPag('')
  }

  function iniciarPolling(id) {
    poolRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagamento/status/${id}`)
        const data = await res.json()
        if (data.status === 'approved') {
          clearInterval(poolRef.current)
          setEtapa('confirmado')
        }
      } catch { /* ignora erros de rede temporários */ }
    }, 3000)
  }

  async function selecionarPagamento(tipo) {
    setLoadingPag(true)
    setErroPag('')

    try {
      if (tipo === 'Dinheiro') {
        setValorPago('')
        setEtapa('dinheiro')
        setLoadingPag(false)
        return
      }

      if (tipo === 'Pix') {
        const res = await fetch('/api/pagamento/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: total, descricao: 'Venda OpenFest' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setPixData(data)
        setEtapa('aguardando_pix')
        iniciarPolling(data.id)
        return
      }

      // Débito ou Crédito — Point Tap
      const res = await fetch('/api/pagamento/cartao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: total,
          descricao: 'Venda OpenFest',
          tipo: tipo === 'Crédito' ? 'credito' : 'debito',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setEtapa('aguardando_cartao')
      iniciarPolling(data.id)

    } catch (err) {
      setErroPag(err.message || 'Erro ao processar pagamento.')
      setEtapa('escolha')
    } finally {
      setLoadingPag(false)
    }
  }

  function concluirVenda() {
    limparCarrinho()
    setCarrinhoAberto(false)
    fecharPagamento()
  }

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
                <p className="text-xs text-gray-400">R$ {item.preco.toFixed(2)} × {item.quantidade}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => removerItem(item.id)}
                  className="w-7 h-7 rounded-full bg-gray-700 hover:bg-pink-600 text-sm font-bold transition-colors"
                >−</button>
                <span className="text-sm w-4 text-center">{item.quantidade}</span>
                <button
                  onClick={() => adicionarItem(item)}
                  className="w-7 h-7 rounded-full bg-gray-700 hover:bg-green-600 text-sm font-bold transition-colors"
                >+</button>
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
        {carrinho.length > 0 && (
          <button
            onClick={limparCarrinho}
            className="w-full py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Limpar pedido
          </button>
        )}
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

              {/* Cabeçalho */}
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

              {/* ── Escolha do pagamento ── */}
              {etapa === 'escolha' && (
                <>
                  <p className="text-gray-500 text-sm mb-5">
                    Total: <span className="text-pink-400 font-bold text-base">R$ {total.toFixed(2)}</span>
                  </p>

                  {erroPag && (
                    <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
                      {erroPag}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Débito', emoji: '💳' },
                      { label: 'Crédito', emoji: '💳' },
                      { label: 'Pix', emoji: '⚡' },
                      { label: 'Dinheiro', emoji: '💵' },
                    ].map(({ label, emoji }) => (
                      <button
                        key={label}
                        onClick={() => selecionarPagamento(label)}
                        disabled={loadingPag}
                        className="flex flex-col items-center justify-center gap-2 bg-gray-800 hover:bg-pink-500/20 hover:border-pink-500 border border-white/10 rounded-xl py-5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-sm font-medium text-white">{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Dinheiro / Troco ── */}
              {etapa === 'dinheiro' && (
                <div>
                  <p className="text-gray-400 text-sm mb-4">
                    Total: <span className="text-pink-400 font-bold text-base">R$ {total.toFixed(2)}</span>
                  </p>
                  <label className="block text-gray-400 text-sm mb-1">Valor recebido</label>
                  <input
                    type="number"
                    min={total}
                    step="0.01"
                    placeholder={`R$ ${total.toFixed(2)}`}
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-lg text-center focus:outline-none focus:border-pink-500 mb-4"
                    autoFocus
                  />
                  {valorPago && Number(valorPago) >= total && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center mb-4">
                      <p className="text-gray-400 text-xs mb-1">Troco</p>
                      <p className="text-green-400 font-bold text-2xl">
                        R$ {(Number(valorPago) - total).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {valorPago && Number(valorPago) < total && (
                    <p className="text-red-400 text-sm text-center mb-4">Valor insuficiente</p>
                  )}
                  <button
                    onClick={() => setEtapa('confirmado')}
                    disabled={!valorPago || Number(valorPago) < total}
                    className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              )}

              {/* ── Aguardando cartão (Point Tap) ── */}
              {etapa === 'aguardando_cartao' && (
                <div className="text-center py-4">
                  <p className="text-4xl mb-4">📲</p>
                  <p className="text-white font-medium mb-2">Aproxime o cartão do celular</p>
                  <p className="text-gray-500 text-sm mb-2">
                    O app do Mercado Pago abrirá no seu celular com a cobrança de{' '}
                    <span className="text-pink-400 font-bold">R$ {total.toFixed(2)}</span>
                  </p>
                  <div className="flex justify-center mt-4">
                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <button onClick={fecharPagamento} className="mt-5 text-gray-600 hover:text-red-400 text-sm transition-colors">
                    Cancelar
                  </button>
                </div>
              )}

              {/* ── PIX QR Code ── */}
              {etapa === 'aguardando_pix' && pixData && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    Total: <span className="text-pink-400 font-bold">R$ {total.toFixed(2)}</span>
                  </p>
                  {pixData.qr_code_base64 && (
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto rounded-xl bg-white p-2"
                    />
                  )}
                  <p className="text-gray-500 text-xs mt-3 mb-2">Ou copie o código:</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(pixData.qr_code)}
                    className="w-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-3 py-2 truncate transition-colors"
                  >
                    {pixData.qr_code?.slice(0, 40)}...
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
                    <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    Aguardando pagamento...
                  </div>
                  <button
                    onClick={() => { clearInterval(poolRef.current); setEtapa('confirmado') }}
                    className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    ✓ Já paguei
                  </button>
                  <button onClick={fecharPagamento} className="mt-2 text-gray-600 hover:text-red-400 text-sm transition-colors">
                    Cancelar
                  </button>
                </div>
              )}

              {/* ── Confirmado ── */}
              {etapa === 'confirmado' && (
                <div className="text-center py-6">
                  <p className="text-5xl mb-3">🖨️</p>
                  <p className="text-white font-semibold">Imprimindo recibo...</p>
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* ─── Layout desktop ─── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 py-8 gap-6" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Produtos */}
        <section className="flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Produtos disponíveis</h2>
          {produtos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-gray-600">
              <span className="text-4xl mb-3">🛍️</span>
              <p className="text-sm">Nenhum produto cadastrado ainda.</p>
              <a href="/produtos" className="mt-4 text-pink-400 text-sm hover:text-pink-300 transition-colors">
                Ir para Produtos →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
              {produtos.map((produto) => (
                <button
                  key={produto.id}
                  onClick={() => adicionarItem(produto)}
                  className="bg-gray-900 border border-white/10 rounded-xl p-4 text-left hover:border-pink-500/50 hover:bg-gray-800 transition-all active:scale-95"
                >
                  <p className="font-medium text-white text-sm leading-tight">{produto.nome}</p>
                  <p className="text-pink-400 font-bold mt-2">R$ {produto.preco.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Carrinho fixo lateral */}
        <aside className="w-80 flex-shrink-0 bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col min-h-0">
          {PainelCarrinho}
        </aside>
      </div>

      {/* ─── Layout mobile ─── */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Produtos */}
        <section className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
          <h2 className="text-base font-semibold mb-3 text-gray-200">Produtos disponíveis</h2>
          {produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl text-gray-600">
              <span className="text-4xl mb-3">🛍️</span>
              <p className="text-sm">Nenhum produto cadastrado ainda.</p>
              <a href="/produtos" className="mt-4 text-pink-400 text-sm hover:text-pink-300 transition-colors">
                Ir para Produtos →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produtos.map((produto) => (
                <button
                  key={produto.id}
                  onClick={() => adicionarItem(produto)}
                  className="bg-gray-900 border border-white/10 rounded-xl p-4 text-left hover:border-pink-500/50 active:scale-95 transition-all"
                >
                  <p className="font-medium text-white text-sm leading-tight">{produto.nome}</p>
                  <p className="text-pink-400 font-bold mt-2">R$ {produto.preco.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Botão flutuante do carrinho */}
        <button
          onClick={() => setCarrinhoAberto(true)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-pink-900/40 transition-colors z-40"
        >
          🛒
          {totalItens > 0 && (
            <span className="bg-white text-pink-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItens}
            </span>
          )}
          <span>R$ {total.toFixed(2)}</span>
        </button>

        {/* Gaveta do carrinho */}
        {carrinhoAberto && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setCarrinhoAberto(false)}
            />
            {/* Painel */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 rounded-t-2xl p-5 z-50 flex flex-col" style={{ maxHeight: '80vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">Pedido atual</h2>
                <button
                  onClick={() => setCarrinhoAberto(false)}
                  className="text-gray-500 hover:text-white text-2xl leading-none transition-colors"
                >×</button>
              </div>
              <div className="overflow-y-auto flex-1">
                {PainelCarrinho}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

