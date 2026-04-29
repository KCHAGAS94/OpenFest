import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

function carregarProdutos() {
  try {
    return JSON.parse(localStorage.getItem('openfest_produtos')) || []
  } catch {
    return []
  }
}

function salvarProdutos(lista) {
  localStorage.setItem('openfest_produtos', JSON.stringify(lista))
}

export default function Produtos() {
  const [produtos, setProdutos] = useState(carregarProdutos)
  const [form, setForm] = useState({ nome: '', preco: '', estoque: '' })
  const [erro, setErro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    salvarProdutos(produtos)
  }, [produtos])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'preco') {
      // Remove tudo que não for dígito
      const onlyNums = value.replace(/\D/g, '')
      // Converte para centavos
      let centavos = parseInt(onlyNums, 10)
      if (isNaN(centavos)) centavos = 0
      // Formata para reais
      const reais = (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      setForm({ ...form, preco: reais })
    } else {
      setForm({
        ...form,
        [name]: name === 'nome' ? value.toUpperCase() : value
      })
    }
  }

  function handleAdicionar(e) {
    e.preventDefault()
    setErro('')

    const nome = form.nome.trim()
    const preco = parseFloat(form.preco.replace('.', '').replace(',', '.'))
    const estoque = parseInt(form.estoque, 10)

    if (!nome) return setErro('Informe o nome do produto.')
    if (isNaN(preco) || preco <= 0) return setErro('Informe um preço válido.')
    if (isNaN(estoque) || estoque < 0) return setErro('Informe um estoque válido.')

    const novo = { id: Date.now(), nome, preco, estoque }
    setProdutos((prev) => [...prev, novo])
    setForm({ nome: '', preco: '', estoque: '' })
  }

  function handleRemover(id) {
    setProdutos((prev) => prev.filter((p) => p.id !== id))
  }

  function handleEditar(id) {
    const prod = produtos.find((p) => p.id === id)
    if (prod) {
      setForm({
        nome: prod.nome,
        preco: prod.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        estoque: prod.estoque.toString()
      })
      setEditId(id)
      setModalOpen(true)
    }
  }

  function handleSalvarEdicao(e) {
    e.preventDefault()
    setErro('')
    const nome = form.nome.trim()
    const preco = parseFloat(form.preco.replace('.', '').replace(',', '.'))
    const estoque = parseInt(form.estoque, 10)
    if (!nome) return setErro('Informe o nome do produto.')
    if (isNaN(preco) || preco <= 0) return setErro('Informe um preço válido.')
    if (isNaN(estoque) || estoque < 0) return setErro('Informe um estoque válido.')
    setProdutos((prev) => prev.map((p) => p.id === editId ? { ...p, nome, preco, estoque } : p))
    setModalOpen(false)
    setEditId(null)
    setForm({ nome: '', preco: '', estoque: '' })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Produtos</h2>
        <p className="text-gray-500 text-sm mb-8">
          Adicione os produtos disponíveis para venda no caixa.
        </p>

        {/* Formulário */}
        <form
          onSubmit={handleAdicionar}
          className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do produto"
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          />
          <input
            type="text"
            name="preco"
            value={form.preco}
            onChange={handleChange}
            placeholder="Preço (ex: 5,00)"
            className="w-32 px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          />
          <input
            type="number"
            name="estoque"
            value={form.estoque}
            onChange={handleChange}
            placeholder="Estoque"
            min="0"
            className="w-28 px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition appearance-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold text-white transition-colors whitespace-nowrap"
          >
            + Adicionar
          </button>
        </form>

        {erro && (
          <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            {erro}
          </p>
        )}

        {/* Lista */}
        {produtos.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">Nenhum produto cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-900 border border-white/10 rounded-xl px-5 py-3"
              >
                <span className="font-medium text-white">{p.nome}</span>
                <div className="flex items-center gap-4">
                  <span className="text-pink-400 font-bold">
                    R$ {p.preco.toFixed ? p.preco.toFixed(2) : Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-blue-400 font-semibold">
                    Estoque: {p.estoque}
                  </span>
                  <button
                    onClick={() => handleEditar(p.id)}
                    title="Editar"
                    className="text-gray-400 hover:text-yellow-400 text-lg transition-colors mr-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M5 19h14v2H5v-2Zm13.71-11.29-2.42-2.42a1 1 0 0 0-1.41 0l-9.18 9.18A1 1 0 0 0 5 15v2a1 1 0 0 0 1 1h2a1 1 0 0 0 .71-.29l9.18-9.18a1 1 0 0 0 0-1.41ZM7 16v-1.59l8.59-8.59 1.59 1.59L8.59 16H7Z"/></svg>
                  </button>
                  <button
                    onClick={() => handleRemover(p.id)}
                    title="Remover"
                    className="text-gray-600 hover:text-red-400 text-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9 3v1H4v2h16V4h-5V3h-6Zm2 4v10h2V7h-2Zm-4 0v10h2V7H7Zm8 0v10h2V7h-2Z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de edição */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-xl"
                title="Fechar"
              >
                ×
              </button>
              <h3 className="text-xl font-semibold mb-6">Editar Produto</h3>
              <form onSubmit={handleSalvarEdicao} className="flex flex-col gap-4">
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Nome do produto"
                  className="px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                />
                <input
                  type="text"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                  placeholder="Preço (ex: 5,00)"
                  className="px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                />
                <input
                  type="number"
                  name="estoque"
                  value={form.estoque}
                  onChange={handleChange}
                  placeholder="Estoque"
                  min="0"
                  className="px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition appearance-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold text-white transition-colors"
                >
                  Salvar Alterações
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

