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
  const [form, setForm] = useState({ nome: '', preco: '' })
  const [erro, setErro] = useState('')

  useEffect(() => {
    salvarProdutos(produtos)
  }, [produtos])

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'nome' ? value.toUpperCase() : value })
  }

  function handleAdicionar(e) {
    e.preventDefault()
    setErro('')

    const nome = form.nome.trim()
    const preco = parseFloat(form.preco.replace(',', '.'))

    if (!nome) return setErro('Informe o nome do produto.')
    if (isNaN(preco) || preco <= 0) return setErro('Informe um preço válido.')

    const novo = { id: Date.now(), nome, preco }
    setProdutos((prev) => [...prev, novo])
    setForm({ nome: '', preco: '' })
  }

  function handleRemover(id) {
    setProdutos((prev) => prev.filter((p) => p.id !== id))
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
            className="w-40 px-4 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
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
                    R$ {p.preco.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemover(p.id)}
                    className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

