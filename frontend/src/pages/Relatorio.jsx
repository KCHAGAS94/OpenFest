import Navbar from '../components/Navbar'

export default function Relatorio() {
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
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Acompanhe o desempenho por forma de pagamento e visualize os principais totais do evento.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <label htmlFor="filtro" className="sr-only">Filtro</label>
              <input
                id="filtro"
                type="text"
                placeholder="FILTRO"
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
              />
            </div>
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
                    Total geral: R$ 2.290,00
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Dinheiro</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ 250,00</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Pix</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ 420,00</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Débito</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ 810,00</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900 p-6">
                      <p className="text-sm text-gray-400">Crédito</p>
                      <p className="mt-4 text-2xl font-semibold text-white">R$ 810,00</p>
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
                            <span>Dinheiro</span>
                            <span>60</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: '60%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span>Pix</span>
                            <span>45</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-purple-500" style={{ width: '45%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span>Débito</span>
                            <span>78</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '78%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span>Crédito</span>
                            <span>30</span>
                          </div>
                          <div className="h-10 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-yellow-400" style={{ width: '30%' }} />
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
