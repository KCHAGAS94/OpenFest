import Navbar from '../components/Navbar'

export default function Gestao() {
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Gestão</p>
              <h1 className="text-3xl font-semibold text-white">Painel de gestão</h1>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Inicie a organização das principais áreas do OpenFest.
                Aqui você vai gerenciar vendas, estoque, relatórios e configurações do evento.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/produtos"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Ir para produtos
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                  <p className="text-sm text-gray-400">Vendas do dia</p>
                  <p className="mt-4 text-3xl font-semibold text-white">R$ 3.450,00</p>
                  <p className="mt-2 text-sm text-gray-500">Atualizado em tempo real</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                  <p className="text-sm text-gray-400">Produtos cadastrados</p>
                  <p className="mt-4 text-3xl font-semibold text-white">42 itens</p>
                  <p className="mt-2 text-sm text-gray-500">Inclui comidas, bebidas e brindes</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                  <p className="text-sm text-gray-400">Pedidos em aberto</p>
                  <p className="mt-4 text-3xl font-semibold text-white">8</p>
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
                    <p className="mt-2 text-xl font-semibold text-white">R$ 14.780,00</p>
                  </div>
                  <div className="rounded-2xl bg-gray-900 p-4">
                    <p className="text-sm text-gray-400">Erros de estoque</p>
                    <p className="mt-2 text-xl font-semibold text-white">2 itens</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                <h2 className="text-lg font-semibold text-white">Ações rápidas</h2>
                <div className="mt-5 space-y-3">
                  <button className="w-full rounded-2xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-600">
                    Adicionar novo produto
                  </button>
                  <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                    Gerenciar estoque
                  </button>
                  <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                    Abrir relatório diário
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6">
                <h2 className="text-lg font-semibold text-white">Próximas etapas</h2>
                <ul className="mt-5 space-y-3 text-sm text-gray-300">
                  <li className="rounded-2xl bg-gray-900/70 p-4">Rever preços e promoções do dia.</li>
                  <li className="rounded-2xl bg-gray-900/70 p-4">Verificar níveis de estoque mínimos.</li>
                  <li className="rounded-2xl bg-gray-900/70 p-4">Conferir relatórios de vendas por horário.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  )
}
