import { useMemo } from 'react'
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

export default function Gestao() {
  const produtos = useMemo(() => carregarProdutos(), [])
  const vendas = useMemo(() => carregarVendas(), [])
  
  // Calcular estatísticas
  const vendasDoDia = vendas.filter(venda => {
    const hoje = new Date()
    const dataVenda = new Date(venda.data)
    return dataVenda.toDateString() === hoje.toDateString()
  }).reduce((sum, venda) => sum + venda.total, 0)
  
  const totalProdutos = produtos.length
  const pedidosEmAberto = vendas.filter(venda => !venda.confirmada).length // Simulando pedidos em aberto
  const valorTotalEstoque = produtos.reduce((sum, produto) => sum + produto.preco * produto.estoque, 0)
  const errosEstoque = produtos.filter(produto => produto.estoque < 0).length
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
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Inicie a organização das principais áreas do OpenFest.
                Aqui você vai gerenciar vendas, estoque, financeiro e configurações do evento.
              </p>
            </div>
          </div>

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
                  <p className="text-sm text-gray-400">Pedidos em aberto</p>
                  <p className="mt-4 text-3xl font-semibold text-white">{pedidosEmAberto}</p>
                  <p className="mt-2 text-sm text-gray-500">Acompanhamento de atendimento</p>
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
                    <p className="text-sm text-gray-400">Saldo disponível</p>
                    <p className="mt-2 text-xl font-semibold text-white">R$ {valorTotalEstoque.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-900 p-4">
                    <p className="text-sm text-gray-400">Erros de estoque</p>
                    <p className="mt-2 text-xl font-semibold text-white">{errosEstoque} itens</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
