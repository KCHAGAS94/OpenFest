import { useMemo } from 'react'
import Navbar from '../components/Navbar'

function carregarVendas() {
  try {
    return JSON.parse(localStorage.getItem('openfest_vendas')) || []
  } catch {
    return []
  }
}

export default function Relatorio() {
  const vendas = useMemo(() => carregarVendas(), [])
  
  // Calcular estatísticas de pagamento
  const estatisticasPagamento = useMemo(() => {
    const pagamentos = { Dinheiro: 0, Pix: 0, Debito: 0, Credito: 0 }
    let totalGeral = 0
    
    vendas.forEach(venda => {
      // Usa o tipoPagamento salvo na venda
      let tipo = venda.tipoPagamento || 'Dinheiro';
      // Corrige possíveis variações de nome
      if (tipo.toLowerCase() === 'debito') tipo = 'Debito';
      if (tipo.toLowerCase() === 'débito') tipo = 'Debito';
      if (tipo.toLowerCase() === 'credito') tipo = 'Credito';
      if (tipo.toLowerCase() === 'crédito') tipo = 'Credito';
      if (tipo.toLowerCase() === 'pix') tipo = 'Pix';
      if (tipo.toLowerCase() === 'dinheiro') tipo = 'Dinheiro';
      if (!pagamentos[tipo]) tipo = 'Dinheiro';
      pagamentos[tipo] += venda.total;
      totalGeral += venda.total;
    });
    
    // Calcular porcentagens
    const porcentagens = {
      Dinheiro: totalGeral > 0 ? (pagamentos.Dinheiro / totalGeral) * 100 : 0,
      Pix: totalGeral > 0 ? (pagamentos.Pix / totalGeral) * 100 : 0,
      Debito: totalGeral > 0 ? (pagamentos.Debito / totalGeral) * 100 : 0,
      Credito: totalGeral > 0 ? (pagamentos.Credito / totalGeral) * 100 : 0,
    }
    
    return { pagamentos, totalGeral, porcentagens }
  }, [vendas])
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Gestão</p>
              <h1 className="text-3xl font-semibold text-white">Financeiro</h1>
              <div className="mt-4 flex flex-wrap items-center gap-8 text-sm uppercase tracking-[0.3em] text-gray-300">
                <a href="/gestao" className="hover:text-white/80">Dashboard</a>
                <a href="/relatorio" className="text-white">Financeiro</a>
                <a href="/produtos/relatorio" className="hover:text-white/80">Produtos</a>
                <a href="/funcionarios" className="hover:text-white/80">Funcionários</a>
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Acompanhe o desempenho por forma de pagamento e visualize os principais totais do evento.
              </p>
            </div>

            {/* Filtro removido */}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.7fr_0.65fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {/* <p className="text-sm uppercase tracking-[0.24em] text-gray-400">Periodos</p> */}
                    <h2 className="mt-2 text-xl font-semibold text-white">Tipo de pagamento</h2>
                  </div>
                  <div className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white">
                    Total geral: R$ {estatisticasPagamento.totalGeral.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Dinheiro</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ {estatisticasPagamento.pagamentos.Dinheiro.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Pix</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ {estatisticasPagamento.pagamentos.Pix.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Débito</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ {estatisticasPagamento.pagamentos.Debito.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Crédito</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ {estatisticasPagamento.pagamentos.Credito.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-gray-900 p-6">
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm text-gray-400">Gráficos</p>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span className="font-semibold text-blue-400">Dinheiro</span>
                            <span className="font-bold text-blue-400">R$ {estatisticasPagamento.pagamentos.Dinheiro.toFixed(2).replace('.', ',')} ({estatisticasPagamento.porcentagens.Dinheiro.toFixed(1).replace('.', ',')}%)</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${estatisticasPagamento.porcentagens.Dinheiro}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span className="font-semibold text-purple-400">Pix</span>
                            <span className="font-bold text-purple-400">R$ {estatisticasPagamento.pagamentos.Pix.toFixed(2).replace('.', ',')} ({estatisticasPagamento.porcentagens.Pix.toFixed(1).replace('.', ',')}%)</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${estatisticasPagamento.porcentagens.Pix}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span className="font-semibold text-amber-400">Débito</span>
                            <span className="font-bold text-amber-400">R$ {estatisticasPagamento.pagamentos.Debito.toFixed(2).replace('.', ',')} ({estatisticasPagamento.porcentagens.Debito.toFixed(1).replace('.', ',')}%)</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${estatisticasPagamento.porcentagens.Debito}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span className="font-semibold text-yellow-300">Crédito</span>
                            <span className="font-bold text-yellow-300">R$ {estatisticasPagamento.pagamentos.Credito.toFixed(2).replace('.', ',')} ({estatisticasPagamento.porcentagens.Credito.toFixed(1).replace('.', ',')}%)</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${estatisticasPagamento.porcentagens.Credito}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
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
