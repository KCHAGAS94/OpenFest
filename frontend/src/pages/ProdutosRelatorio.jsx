import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'

function carregarProdutos() {
  try {
    return JSON.parse(localStorage.getItem('openfest_produtos')) || []
  } catch {
    return []
  }
}

function carregarVendas() {
  try {
    return JSON.parse(localStorage.getItem('openfest_vendas')) || []
  } catch {
    return []
  }
}

export default function ProdutosRelatorio() {
  const [filtroData, setFiltroData] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')
  const [filtroQuantidade, setFiltroQuantidade] = useState('')
  const [filtroValor, setFiltroValor] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  
  const produtos = useMemo(() => carregarProdutos(), [])
  const vendas = useMemo(() => carregarVendas(), [])
  
  // Estatísticas dos produtos
  const totalProdutos = produtos.length
  const valorTotalEstoque = produtos.reduce((sum, produto) => sum + produto.preco * produto.estoque, 0)
  const baixoEstoque = produtos.filter((produto) => produto.estoque > 0 && produto.estoque <= 3).length
  const semEstoque = produtos.filter((produto) => produto.estoque === 0).length
  const estoqueSaudavel = produtos.filter((produto) => produto.estoque > 3).length

  // Estatísticas das vendas
  const totalVendas = vendas.length
  const valorTotalVendas = vendas.reduce((sum, venda) => sum + venda.total, 0)
  const vendasPorProduto = vendas.reduce((acc, venda) => {
    venda.itens.forEach(item => {
      acc[item.nome] = (acc[item.nome] || 0) + item.quantidade
    })
    return acc
  }, {})

  // Transformar vendas em formato plano para a tabela
  const vendasPlanas = useMemo(() => {
    return vendas.flatMap(venda => 
      venda.itens.map(item => ({
        data: new Date(venda.data).toLocaleString('pt-BR'),
        produto: item.nome,
        quantidade: item.quantidade,
        valor: `R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}`,
        vendedor: venda.vendedor || 'Sistema',
      }))
    )
  }, [vendas])

  const vendasFiltradas = useMemo(() => {
    const termoData = filtroData.trim().toLowerCase()
    const termoProduto = filtroProduto.trim().toLowerCase()
    const termoQuantidade = filtroQuantidade.trim().toLowerCase()
    const termoValor = filtroValor.trim().toLowerCase()
    const termoVendedor = filtroVendedor.trim().toLowerCase()

    return vendasPlanas.filter((item) => {
      const dataMatch = termoData ? item.data.toLowerCase().includes(termoData) : true
      const produtoMatch = termoProduto ? item.produto.toLowerCase().includes(termoProduto) : true
      const quantidadeMatch = termoQuantidade ? item.quantidade.toString().includes(termoQuantidade) : true
      const valorMatch = termoValor ? item.valor.toLowerCase().includes(termoValor) : true
      const vendedorMatch = termoVendedor ? item.vendedor.toLowerCase().includes(termoVendedor) : true
      return dataMatch && produtoMatch && quantidadeMatch && valorMatch && vendedorMatch
    })
  }, [filtroData, filtroProduto, filtroQuantidade, filtroValor, filtroVendedor, vendasPlanas])

  const barraStats = [
    {
      label: 'Estoque saudável',
      value: estoqueSaudavel,
      color: 'bg-blue-500',
    },
    {
      label: 'Baixo estoque',
      value: baixoEstoque,
      color: 'bg-purple-500',
    },
    {
      label: 'Sem estoque',
      value: semEstoque,
      color: 'bg-amber-500',
    },
  ]

  const maxValue = Math.max(1, ...barraStats.map((item) => item.value))

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Gestão</p>
              <h1 className="text-3xl font-semibold text-white">Produtos</h1>
              <div className="mt-4 flex flex-wrap items-center gap-8 text-sm uppercase tracking-[0.3em] text-gray-300">
                <a href="/gestao" className="hover:text-white/80">Dashboard</a>
                <a href="/relatorio" className="hover:text-white/80">Financeiro</a>
                <a href="/produtos/relatorio" className="text-white">Produtos</a>
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Acompanhe o estoque, o valor total dos produtos e os principais indicadores da área de produtos.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <label htmlFor="pesquisa-produtos" className="sr-only">Pesquisar produtos</label>
              <input
                id="pesquisa-produtos"
                type="text"
                placeholder="Pesquisar"
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.7fr_0.65fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="mt-2 text-xl font-semibold text-white">Resumo de produtos</h2>
                    <p className="mt-1 text-sm text-gray-400">Dados calculados a partir dos produtos cadastrados.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-gray-900 p-6">
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm text-gray-400">Gráfico de status de estoque</p>
                    </div>

                    <div className="space-y-5">
                      {barraStats.map((stat) => (
                        <div key={stat.label}>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span>{stat.label}</span>
                            <span>{stat.value}</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${stat.color}`}
                              style={{ width: `${(stat.value / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                <h2 className="text-lg font-semibold text-white">Relatório de vendas</h2>
                <p className="mt-2 text-sm text-gray-400">Aqui estão as últimas vendas registradas com hora, produto e vendedor.</p>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-gray-900">
                  <table className="min-w-full border-collapse border border-white/10 text-left text-sm text-gray-200">
                    <thead className="bg-gray-950/70">
                      <tr>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap">Data</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap">Produto</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap">Quantidade</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap">Valor</th>
                        <th className="border border-white/10 px-4 py-3 font-medium whitespace-nowrap">Vendedor</th>
                      </tr>
                      <tr className="bg-gray-900/80">
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
                          <tr key={`${venda.data}-${index}`}>
                            <td className="border border-white/10 px-4 py-3">{venda.data}</td>
                            <td className="border border-white/10 px-4 py-3">{venda.produto}</td>
                            <td className="border border-white/10 px-4 py-3">{venda.quantidade}</td>
                            <td className="border border-white/10 px-4 py-3">{venda.valor}</td>
                            <td className="border border-white/10 px-4 py-3">{venda.vendedor}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
