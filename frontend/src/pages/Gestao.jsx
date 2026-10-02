import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { fetchAutenticado } from '../utils/apiAuth'

export default function Gestao() {
  const [produtos, setProdutos] = useState([])
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Estado das taxas
  const [taxaPix, setTaxaPix] = useState('')
  const [taxaDebito, setTaxaDebito] = useState('')
  const [taxaCredito, setTaxaCredito] = useState('')
  const [taxaMsg, setTaxaMsg] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    setErro('')
    try {
      const [resProdutos, resVendas, resConfig] = await Promise.all([
        fetch('/api/produtos'),
        fetchAutenticado('/api/vendas'),
        fetchAutenticado('/api/configuracoes'),
      ])

      const produtosData = await resProdutos.json()
      const vendasData = await resVendas.json()
      const configData = await resConfig.json()

      if (!resProdutos.ok) throw new Error(produtosData.error)
      if (!resVendas.ok) throw new Error(vendasData.message)
      if (!resConfig.ok) throw new Error(configData.message)

      setProdutos(produtosData.map(p => ({ ...p, preco: Number(p.preco) })))
      setVendas(vendasData.map(v => ({ ...v, total: Number(v.total) })))
      if (configData.taxaPix !== undefined) setTaxaPix(configData.taxaPix)
      if (configData.taxaDebito !== undefined) setTaxaDebito(configData.taxaDebito)
      if (configData.taxaCredito !== undefined) setTaxaCredito(configData.taxaCredito)
    } catch (err) {
      setErro(err.message || 'Não foi possível carregar os dados de gestão.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSalvarTaxas(e) {
    e.preventDefault()
    try {
      const res = await fetchAutenticado('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxaPix, taxaDebito, taxaCredito }),
      })
      if (!res.ok) throw new Error()
      setTaxaMsg('Taxas salvas!')
      setTimeout(() => setTaxaMsg(''), 2000)
    } catch {
      setErro('Não foi possível salvar as taxas.')
    }
  }

  // Calcular estatísticas
  const vendasDoDia = vendas.filter(venda => {
    const hoje = new Date()
    const dataVenda = new Date(venda.data)
    return dataVenda.toDateString() === hoje.toDateString()
  }).reduce((sum, venda) => sum + venda.total, 0)

  const totalProdutos = produtos.length
  const valorTotalVendas = vendas.reduce((sum, venda) => sum + (venda.total || 0), 0)

  // Calcular saldo disponível considerando taxas
  function getTaxa(tipo) {
    if (tipo === 'Pix') return parseFloat(taxaPix) || 0;
    if (tipo === 'Débito' || tipo === 'Debito') return parseFloat(taxaDebito) || 0;
    if (tipo === 'Crédito' || tipo === 'Credito') return parseFloat(taxaCredito) || 0;
    return 0;
  }

  const saldoDisponivel = vendas.reduce((sum, venda) => {
    const tipo = (venda.tipoPagamento || 'Dinheiro').toLowerCase();
    let tipoPadrao = 'Dinheiro';
    if (tipo === 'pix') tipoPadrao = 'Pix';
    else if (tipo === 'debito' || tipo === 'débito') tipoPadrao = 'Débito';
    else if (tipo === 'credito' || tipo === 'crédito') tipoPadrao = 'Crédito';
    const taxa = getTaxa(tipoPadrao);
    const total = venda.total || 0;
    return sum + (total - (total * taxa / 100));
  }, 0);
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Gestão</p>
              <h1 className="text-3xl font-semibold text-white">Painel de gestão</h1>
              <div className="mt-4 flex flex-wrap items-center gap-8 text-sm uppercase tracking-[0.3em] text-gray-300">
                <a href="/gestao" className="text-white hover:text-white/80">Dashboard</a>
                <a href="/relatorio" className="hover:text-white/80">Financeiro</a>
                <a href="/produtos/relatorio" className="hover:text-white/80">Produtos</a>
                <a href="/funcionarios" className="hover:text-white/80">Funcionários</a>
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Inicie a organização das principais áreas do OpenFest.
                Aqui você vai gerenciar vendas, estoque, financeiro e configurações do evento.
              </p>
            </div>
          </div>

          {!!erro && (
            <p className="mt-6 text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-2">
              {erro}
            </p>
          )}

          {carregando ? (
            <p className="mt-10 text-gray-400">Carregando...</p>
          ) : (
          <div className="mt-10 space-y-6">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                  <p className="text-sm text-gray-400">Vendas do dia</p>
                  <p className="mt-4 text-3xl font-semibold text-white">R$ {vendasDoDia.toFixed(2).replace('.', ',')}</p>
                  <p className="mt-2 text-sm text-gray-500">Atualizado em tempo real</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                  <p className="text-sm text-gray-400">Produtos cadastrados</p>
                  <p className="mt-4 text-3xl font-semibold text-white">{totalProdutos} itens</p>
                  <p className="mt-2 text-sm text-gray-500">Inclui comidas, bebidas e brindes</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                  <p className="text-sm text-gray-400">Vendas registradas</p>
                  <p className="mt-4 text-3xl font-semibold text-white">{vendas.length}</p>
                  <p className="mt-2 text-sm text-gray-500">Total de pedidos no evento</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Resumo operacional</h2>
                    <p className="mt-2 text-sm text-gray-400">Visão rápida dos principais indicadores e ações pendentes.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-900 p-4">
                    <p className="text-sm text-gray-400">Venda total</p>
                    <p className="mt-2 text-xl font-semibold text-white">R$ {valorTotalVendas.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-900 p-4">
                    <p className="text-sm text-gray-400">Saldo disponível</p>
                    <p className="mt-2 text-xl font-semibold text-white">R$ {saldoDisponivel.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </section>
        {/* Cadastro de taxas de pagamento - agora no final da página */}
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-8 shadow-xl shadow-black/20 mt-10">
          <h3 className="text-lg font-semibold text-white mb-4">Taxas de pagamento</h3>
          <form className="grid gap-4 sm:grid-cols-3" onSubmit={handleSalvarTaxas}>
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="taxa-pix">Pix (%)</label>
              <input
                id="taxa-pix"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                placeholder="Ex: 1.29"
                value={taxaPix}
                onChange={e => setTaxaPix(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="taxa-debito">Débito (%)</label>
              <input
                id="taxa-debito"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                placeholder="Ex: 1.99"
                value={taxaDebito}
                onChange={e => setTaxaDebito(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="taxa-credito">Crédito (%)</label>
              <input
                id="taxa-credito"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                placeholder="Ex: 3.49"
                value={taxaCredito}
                onChange={e => setTaxaCredito(e.target.value)}
              />
            </div>
          </form>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="submit"
              formAction="#"
              className="px-6 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow transition-colors"
              onClick={handleSalvarTaxas}
            >
              Salvar taxas
            </button>
            {taxaMsg && <span className="text-green-400 text-sm">{taxaMsg}</span>}
          </div>
        </section>
      </main>
    </>
  )
}
