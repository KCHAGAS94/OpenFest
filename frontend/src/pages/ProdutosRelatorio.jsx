import { useMemo, useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ReciboImpressao from '../components/ReciboImpressao'
import { listarProdutos, listarVendas } from '../utils/dados'
import { carregarConfig, ehEstacaoImpressao } from '../utils/configuracoes'
import { montarRecibo, enviarParaFila } from '../utils/recibo'
import '../print.css'

export default function ProdutosRelatorio() {
  const [filtroPedido, setFiltroPedido] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')
  const [filtroQuantidade, setFiltroQuantidade] = useState('')
  const [filtroValor, setFiltroValor] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  
  const [produtos, setProdutos] = useState([])
  const [vendas, setVendas] = useState([])

  useEffect(() => {
    listarProdutos().then(setProdutos).catch(() => {})
    listarVendas().then(setVendas).catch(() => {})
  }, [])
  
  // Estatísticas dos produtos
  const totalProdutos = produtos.length
  const valorTotalEstoque = produtos.reduce((sum, produto) => sum + produto.preco * produto.estoque, 0)

  // Estatísticas das vendas
  const totalVendas = vendas.length
  const valorTotalVendas = vendas.reduce((sum, venda) => sum + venda.total, 0)
  // Soma quantidade vendida por produto
  const vendasPorProduto = vendas.reduce((acc, venda) => {
    venda.itens.forEach(item => {
      acc[item.nome] = (acc[item.nome] || 0) + item.quantidade
    })
    return acc
  }, {})
  // Array para gráfico
  const totalVendidoGeral = Object.values(vendasPorProduto).reduce((sum, qtd) => sum + qtd, 0);
  const produtosVendidos = Object.entries(vendasPorProduto).map(([nome, quantidade]) => ({
    nome,
    quantidade,
    percentual: totalVendidoGeral > 0 ? (quantidade / totalVendidoGeral) * 100 : 0
  }));

  // Transformar vendas em formato plano para a tabela
  // Adiciona idPedido sequencial formatado
  const vendasPlanas = useMemo(() => {
    let seq = 1;
    return vendas.flatMap(venda => {
      const idPedido = String(seq).padStart(5, '0');
      seq++;
      return venda.itens.map(item => ({
        vendaId: venda.id,
        idPedido,
        data: new Date(venda.data).toLocaleString('pt-BR'),
        produto: item.nome,
        quantidade: item.quantidade,
        valor: `R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}`,
        vendedor: venda.vendedor || 'Sistema',
      }));
    });
  }, [vendas]);

  const vendasFiltradas = useMemo(() => {
    const termoPedido = filtroPedido.trim()
    const termoData = filtroData.trim().toLowerCase()
    const termoProduto = filtroProduto.trim().toLowerCase()
    const termoQuantidade = filtroQuantidade.trim().toLowerCase()
    const termoValor = filtroValor.trim().toLowerCase()
    const termoVendedor = filtroVendedor.trim().toLowerCase()

    // Ordena por data (mais recente primeiro)
    return vendasPlanas
      .filter((item) => {
        const pedidoMatch = termoPedido ? item.idPedido.includes(termoPedido) : true
        const dataMatch = termoData ? item.data.toLowerCase().includes(termoData) : true
        const produtoMatch = termoProduto ? item.produto.toLowerCase().includes(termoProduto) : true
        const quantidadeMatch = termoQuantidade ? item.quantidade.toString().includes(termoQuantidade) : true
        const valorMatch = termoValor ? item.valor.toLowerCase().includes(termoValor) : true
        const vendedorMatch = termoVendedor ? item.vendedor.toLowerCase().includes(termoVendedor) : true
        return pedidoMatch && dataMatch && produtoMatch && quantidadeMatch && valorMatch && vendedorMatch
      })
      .sort((a, b) => {
        // Precisa converter a string de data para Date para comparar corretamente
        const [dA, tA] = a.data.split(', ');
        const [dB, tB] = b.data.split(', ');
        const [diaA, mesA, anoA] = dA.split('/');
        const [diaB, mesB, anoB] = dB.split('/');
        const dateA = new Date(`${anoA}-${mesA}-${diaA}T${tA}`);
        const dateB = new Date(`${anoB}-${mesB}-${diaB}T${tB}`);
        return dateB - dateA;
      });
  }, [filtroPedido, filtroData, filtroProduto, filtroQuantidade, filtroValor, filtroVendedor, vendasPlanas])

  // No celular, uma busca única procura em todas as colunas.
  const [buscaMobile, setBuscaMobile] = useState('')
  const vendasMobile = useMemo(() => {
    const termo = buscaMobile.trim().toLowerCase()
    if (!termo) return vendasFiltradas
    return vendasFiltradas.filter((item) =>
      [item.idPedido, item.data, item.produto, item.quantidade, item.valor, item.vendedor]
        .some((campo) => String(campo).toLowerCase().includes(termo))
    )
  }, [buscaMobile, vendasFiltradas])

  // Pedido aberto ao tocar numa linha/cartão, com opção de reimprimir o pedido inteiro.
  const [pedidoAberto, setPedidoAberto] = useState(null)
  const [reciboLocal, setReciboLocal] = useState(null)
  const [msgReimpressao, setMsgReimpressao] = useState({ tipo: '', texto: '' })
  const [reimprimindo, setReimprimindo] = useState(false)

  function abrirPedido(linha) {
    const venda = vendas.find((v) => v.id === linha.vendaId)
    if (!venda) return
    setPedidoAberto({ ...venda, idPedido: linha.idPedido })
    setMsgReimpressao({ tipo: '', texto: '' })
  }

  async function reimprimir() {
    setReimprimindo(true)
    setMsgReimpressao({ tipo: '', texto: '' })
    try {
      const config = await carregarConfig()
      const recibo = montarRecibo({
        itens: pedidoAberto.itens,
        config,
        data: pedidoAberto.data,
        pagamento: pedidoAberto.tipoPagamento,
      })
      if (ehEstacaoImpressao()) {
        setReciboLocal(recibo)
        setMsgReimpressao({ tipo: 'ok', texto: 'Pedido enviado para a impressora.' })
      } else {
        await enviarParaFila(recibo)
        setMsgReimpressao({ tipo: 'ok', texto: 'Pedido enviado para a impressora do PC.' })
      }
    } catch (err) {
      setMsgReimpressao({ tipo: 'erro', texto: err.message || 'Não foi possível reimprimir.' })
    } finally {
      setReimprimindo(false)
    }
  }


  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-10">
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-5 md:p-8 shadow-xl shadow-black/20 overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Gestão</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-white">Produtos</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 md:gap-8 text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-gray-300">
                <a href="/gestao" className="hover:text-white/80">Dashboard</a>
                <a href="/relatorio" className="hover:text-white/80">Financeiro</a>
                <a href="/produtos/relatorio" className="text-white">Produtos</a>
                <a href="/funcionarios" className="hover:text-white/80">Funcionários</a>
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Acompanhe o estoque, o valor total dos produtos e os principais indicadores da área de produtos.
              </p>
            </div>

            {/* Campo de pesquisa removido */}
          </div>

          <div className="mt-10 grid gap-6">
            <div className="space-y-6 min-w-0">
              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6 overflow-hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="mt-2 text-xl font-semibold text-white">Resumo de produtos</h2>
                    <p className="mt-1 text-sm text-gray-400">Dados calculados a partir dos produtos cadastrados.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-gray-900 p-6 overflow-hidden">
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm text-gray-400">Gráfico de produtos vendidos</p>
                    </div>
                    <div className="space-y-5 max-h-105 overflow-y-auto pr-2 scrollbar-tema">
                      {produtosVendidos.length === 0 && (
                        <div className="text-gray-500 text-sm">Nenhum produto vendido ainda.</div>
                      )}
                      {[...produtosVendidos]
                        .sort((a, b) => b.quantidade - a.quantidade)
                        .map((produto) => (
                          <div key={produto.nome}>
                            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                              <span>{produto.nome}</span>
                              <span>{produto.quantidade} ({produto.percentual.toFixed(1).replace('.', ',')}%)</span>
                            </div>
                            <div className="h-10 rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${produto.percentual}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6 overflow-hidden">
                <h2 className="text-lg font-semibold text-white">Relatório de vendas</h2>
                <p className="mt-2 text-sm text-gray-400">Aqui estão as últimas vendas registradas com hora, produto e vendedor.</p>

                {/* Celular: cartões com busca única */}
                <div className="md:hidden mt-5 space-y-3">
                  <input
                    type="search"
                    value={buscaMobile}
                    onChange={(e) => setBuscaMobile(e.target.value)}
                    placeholder="Buscar pedido, produto, data, vendedor..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-pink-400"
                  />
                  {vendasMobile.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">Nenhum resultado encontrado.</p>
                  ) : (
                    <div className="space-y-2 max-h-144 overflow-y-auto scrollbar-tema">
                      {vendasMobile.map((venda, index) => (
                        <button
                          type="button"
                          key={`${venda.idPedido}-${venda.data}-${index}`}
                          onClick={() => abrirPedido(venda)}
                          className="block w-full text-left rounded-xl border border-white/10 bg-gray-900 p-4 active:scale-[0.99] hover:border-pink-500/40 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-white wrap-break-word">{venda.produto}</p>
                              <p className="mt-0.5 text-xs text-gray-400">Pedido {venda.idPedido} · {venda.data}</p>
                            </div>
                            <p className="shrink-0 font-semibold text-pink-400">{venda.valor}</p>
                          </div>
                          <div className="mt-3 flex justify-between text-xs text-gray-400">
                            <span>Qtd: <span className="text-gray-200">{venda.quantidade}</span></span>
                            <span>Vendedor: <span className="text-gray-200">{venda.vendedor}</span></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Computador: tabela com filtro por coluna */}
                <div className="hidden md:block mt-6 rounded-2xl border border-white/10 bg-gray-900 overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-144 pr-4 scrollbar-tema" style={{ width: '100%' }}>
                  <table className="w-full border-collapse border border-white/10 text-left text-sm text-gray-200" style={{ tableLayout: 'fixed' }}>
                    <thead className="bg-gray-950/70">
                      <tr className="sticky top-0 z-20 bg-gray-950">
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap w-24">Pedido</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap w-48">Data</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap w-64">Produto</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap w-28">Quantidade</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap w-28">Valor</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap w-32">Vendedor</th>
                      </tr>
                      <tr className="sticky z-10 bg-gray-900" style={{ top: '2.75rem' }}>
                        <th className="border border-white/10 px-4 py-2">
                          <input
                            value={filtroPedido}
                            onChange={(event) => setFiltroPedido(event.target.value)}
                            placeholder="Filtrar pedido"
                            className="w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                          />
                        </th>
                        <th className="border border-white/10 px-4 py-2">
                          <input
                            value={filtroData}
                            onChange={(event) => setFiltroData(event.target.value)}
                            placeholder="Filtrar data"
                            className="w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                          />
                        </th>
                        <th className="border border-white/10 px-4 py-2">
                          <input
                            value={filtroProduto}
                            onChange={(event) => setFiltroProduto(event.target.value)}
                            placeholder="Filtrar produto"
                            className="w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                          />
                        </th>
                        <th className="border border-white/10 px-4 py-2">
                          <input
                            value={filtroQuantidade}
                            onChange={(event) => setFiltroQuantidade(event.target.value)}
                            placeholder="Filtrar qtd"
                            className="w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                          />
                        </th>
                        <th className="border border-white/10 px-4 py-2">
                          <input
                            value={filtroValor}
                            onChange={(event) => setFiltroValor(event.target.value)}
                            placeholder="Filtrar valor"
                            className="w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                          />
                        </th>
                        <th className="border border-white/10 px-4 py-2">
                          <input
                            value={filtroVendedor}
                            onChange={(event) => setFiltroVendedor(event.target.value)}
                            placeholder="Filtrar vendedor"
                            className="w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-gray-950/50">
                      {vendasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="border border-white/10 px-4 py-6 text-center text-sm text-gray-400">
                            Nenhum resultado encontrado.
                          </td>
                        </tr>
                      ) : (
                        vendasFiltradas.map((venda, index) => (
                          <tr
                            key={`${venda.data}-${index}`}
                            onClick={() => abrirPedido(venda)}
                            className="cursor-pointer hover:bg-white/5"
                            title="Ver pedido e reimprimir"
                          >
                            <td className="border border-white/10 px-4 py-3 whitespace-nowrap">{venda.idPedido}</td>
                            <td className="border border-white/10 px-4 py-3 whitespace-nowrap">{venda.data}</td>
                            <td className="border border-white/10 px-4 py-3 wrap-break-word">{venda.produto}</td>
                            <td className="border border-white/10 px-4 py-3 whitespace-nowrap">{venda.quantidade}</td>
                            <td className="border border-white/10 px-4 py-3 whitespace-nowrap">{venda.valor}</td>
                            <td className="border border-white/10 px-4 py-3 wrap-break-word">{venda.vendedor}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {pedidoAberto && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPedidoAberto(null)} />
          <div className="relative w-full sm:max-w-md bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Pedido {pedidoAberto.idPedido}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(pedidoAberto.data).toLocaleString('pt-BR')} · {pedidoAberto.tipoPagamento} · {pedidoAberto.vendedor}
                </p>
              </div>
              <button onClick={() => setPedidoAberto(null)} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-tema">
              {pedidoAberto.itens.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3 bg-gray-800 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white wrap-break-word">{item.nome}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantidade} × R$ {item.preco.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-200">
                    R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 mt-4 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-xl font-bold text-white">R$ {pedidoAberto.total.toFixed(2).replace('.', ',')}</span>
              </div>
              {msgReimpressao.texto && (
                <p className={`text-sm rounded-lg px-3 py-2 border ${msgReimpressao.tipo === 'erro'
                  ? 'text-red-400 bg-red-400/10 border-red-400/20'
                  : 'text-green-400 bg-green-400/10 border-green-400/20'}`}
                >
                  {msgReimpressao.texto}
                </p>
              )}
              <button
                onClick={reimprimir}
                disabled={reimprimindo}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
              >
                {reimprimindo ? 'Enviando...' : '🖨️ Reimprimir pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reciboLocal && (
        <ReciboImpressao
          evento={reciboLocal.evento}
          itens={reciboLocal.itens}
          total={reciboLocal.total}
          data={reciboLocal.data}
          mensagem={reciboLocal.mensagem}
          onAfterPrint={() => setReciboLocal(null)}
        />
      )}
    </>
  )
}
