import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

// Funções de Persistência
function carregarProdutos() {
  try {
    return JSON.parse(localStorage.getItem('openfest_produtos')) || []
  } catch {
    return []
  }
}

function salvarProdutos(produtos) {
  localStorage.setItem('openfest_produtos', JSON.stringify(produtos))
}

export default function Produtos() {
  const [produtos, setProdutos] = useState(carregarProdutos)
  
  // Estados dos Modais
  const [modalAberto, setModalAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  
  // Estados de Controle
  const [editandoId, setEditandoId] = useState(null)
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null)
  
  const [form, setForm] = useState({
    nome: '',
    preco: '',
    estoque: '',
    bloqueado: false,
    tipo: 'unidade',
    unidadesCombo: ''
  })

  // Sincroniza com localStorage sempre que a lista mudar
  useEffect(() => {
    salvarProdutos(produtos)
  }, [produtos])

  // --- Funções de Ação ---

  function abrirModalCadastro() {
    setEditandoId(null)
    setForm({ nome: '', preco: '', estoque: '', bloqueado: false, tipo: 'unidade', unidadesCombo: '' })
    setModalAberto(true)
  }

  function abrirModalEdicao(produto) {
    setEditandoId(produto.id)
    setForm({
      nome: produto.nome,
      preco: produto.preco.toString(),
      estoque: produto.estoque.toString(),
      bloqueado: produto.bloqueado || false,
      tipo: produto.tipo || 'unidade',
      unidadesCombo: produto.unidadesCombo ? produto.unidadesCombo.toString() : ''
    })
    setModalAberto(true)
  }

  function handleSalvar(e) {
    e.preventDefault()

    const dadosComuns = {
      nome: form.nome,
      preco: parseFloat(form.preco),
      estoque: parseInt(form.estoque),
      bloqueado: form.bloqueado,
      tipo: form.tipo,
      unidadesCombo: form.tipo === 'combo' ? parseInt(form.unidadesCombo) || 1 : undefined
    }

    if (editandoId) {
      const novosProdutos = produtos.map(p => {
        if (p.id === editandoId) {
          return { ...p, ...dadosComuns }
        }
        return p
      })
      setProdutos(novosProdutos)
    } else {
      const novoProduto = { id: Date.now(), ...dadosComuns }
      setProdutos([...produtos, novoProduto])
    }
    setModalAberto(false)
  }

  // --- Funções de Exclusão Customizada ---

  function prepararExclusao(produto) {
    setProdutoParaExcluir(produto)
    setModalExcluirAberto(true)
  }

  function confirmarExclusao() {
    if (produtoParaExcluir) {
      const novaLista = produtos.filter(p => p.id !== produtoParaExcluir.id)
      setProdutos(novaLista)
      setModalExcluirAberto(false)
      setProdutoParaExcluir(null)
    }
  }

  function alternarBloqueio(id) {
    const novaLista = produtos.map(p => 
      p.id === id ? { ...p, bloqueado: !p.bloqueado } : p
    )
    setProdutos(novaLista)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Gestão de Produtos</h1>
            <p className="text-gray-400 text-sm">Cadastre e gerencie os itens do evento</p>
          </div>
          <button 
            onClick={abrirModalCadastro}
            className="bg-pink-500 hover:bg-pink-600 px-6 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-pink-900/20 active:scale-95"
          >
            + Novo Produto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map(produto => (
            <div key={produto.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5 hover:border-pink-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-pink-400 transition-colors">{produto.nome}</h3>
                  <p className="text-pink-400 font-bold">R$ {produto.preco.toFixed(2)}</p>
                  {produto.tipo === 'combo' && (
                    <p className="text-xs text-gray-500">Combo {produto.unidadesCombo}un · R$ {(produto.preco / produto.unidadesCombo).toFixed(2)}/un</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Estoque: {produto.estoque ?? '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${produto.bloqueado ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {produto.bloqueado ? 'BLOQUEADO' : 'ATIVO'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => abrirModalEdicao(produto)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors font-medium"
                >
                  Editar
                </button>
                <button 
                  onClick={() => alternarBloqueio(produto.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${produto.bloqueado ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}`}
                  title={produto.bloqueado ? "Desbloquear no Caixa" : "Bloquear no Caixa"}
                >
                  {produto.bloqueado ? '🔓' : '🚫'}
                </button>
                <button 
                  onClick={() => prepararExclusao(produto)}
                  className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalAberto(false)} />
          <form 
            onSubmit={handleSalvar}
            className="relative bg-gray-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200"
          >
            <h2 className="text-xl font-bold mb-6 text-gray-100">
              {editandoId ? '📝 Editar Produto' : '🛍️ Novo Produto'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Nome do Produto</label>
                <input 
                  required
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({...form, nome: e.target.value})}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                  placeholder="Ex: Cerveja Lata"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Tipo de Venda</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({...form, tipo: 'unidade'})}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${form.tipo === 'unidade' ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-gray-800 border-white/10 text-gray-400 hover:bg-gray-700'}`}
                  >
                    Unidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({...form, tipo: 'combo'})}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${form.tipo === 'combo' ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-gray-800 border-white/10 text-gray-400 hover:bg-gray-700'}`}
                  >
                    Combo
                  </button>
                </div>
              </div>

              <div className={`grid gap-4 ${form.tipo === 'combo' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    {form.tipo === 'combo' ? 'Preço do combo (R$)' : 'Preço (R$)'}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.preco}
                    onChange={e => setForm({...form, preco: e.target.value})}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                  />
                </div>
                {form.tipo === 'combo' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Unidades no combo</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Ex: 5"
                      value={form.unidadesCombo}
                      onChange={e => setForm({...form, unidadesCombo: e.target.value})}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Estoque</label>
                  <input
                    required
                    type="number"
                    value={form.estoque}
                    onChange={e => setForm({...form, estoque: e.target.value})}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                  />
                </div>
              </div>

              {form.tipo === 'combo' && form.preco && form.unidadesCombo > 0 && (
                <p className="text-xs text-gray-400 -mt-2">
                  Valor impresso por unidade: <span className="text-pink-400 font-semibold">R$ {(parseFloat(form.preco) / parseInt(form.unidadesCombo)).toFixed(2).replace('.', ',')}</span>
                </p>
              )}

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <input 
                  type="checkbox"
                  id="bloqueado"
                  checked={form.bloqueado}
                  onChange={e => setForm({...form, bloqueado: e.target.checked})}
                  className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                />
                <label htmlFor="bloqueado" className="text-sm text-gray-300 cursor-pointer select-none">
                  Bloquear este produto no caixa
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                type="button"
                onClick={() => setModalAberto(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl font-semibold transition-all active:scale-95"
              >
                {editandoId ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO ESTILIZADO */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModalExcluirAberto(false)} />
          <div className="relative bg-gray-900 border border-red-500/20 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">Excluir Produto?</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Tem certeza que deseja remover <span className="text-white font-bold italic">"{produtoParaExcluir?.nome}"</span>? <br/>
                Esta ação não pode ser desfeita.
              </p>

              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setModalExcluirAberto(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors text-sm"
                >
                  Manter
                </button>
                <button 
                  onClick={confirmarExclusao}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all text-sm active:scale-95 shadow-lg shadow-red-900/20"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}