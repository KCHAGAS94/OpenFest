import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { fetchAutenticado } from '../utils/apiAuth'

const PERMISSOES_LABEL = {
  caixa: 'Caixa',
  produtos: 'Produtos',
  gestao: 'Gestão',
  configuracoes: 'Configurações',
}

const FORM_VAZIO = {
  nome: '',
  email: '',
  senha: '',
  permissoes: { caixa: false, produtos: false, gestao: false, configuracoes: false },
}

export default function Configuracoes() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    setErro('')
    try {
      const res = await fetchAutenticado('/api/usuarios')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setUsuarios(data)
    } catch (err) {
      setErro(err.message || 'Erro ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setEditId(null)
    setModalAberto(true)
  }

  function abrirEdicao(usuario) {
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      permissoes: { ...usuario.permissoes },
    })
    setEditId(usuario.id)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditId(null)
  }

  function togglePermissao(chave) {
    setForm((prev) => ({
      ...prev,
      permissoes: { ...prev.permissoes, [chave]: !prev.permissoes[chave] },
    }))
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const url = editId ? `/api/usuarios/${editId}` : '/api/usuarios'
      const method = editId ? 'PUT' : 'POST'
      const body = { nome: form.nome, email: form.email, permissoes: form.permissoes }
      if (form.senha) body.senha = form.senha

      const res = await fetchAutenticado(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      fecharModal()
      carregarUsuarios()
    } catch (err) {
      setErro(err.message || 'Erro ao salvar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(usuario) {
    if (!confirm(`Remover o usuário ${usuario.nome}?`)) return
    try {
      const res = await fetchAutenticado(`/api/usuarios/${usuario.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      carregarUsuarios()
    } catch (err) {
      setErro(err.message || 'Erro ao remover usuário.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Configurações</p>
            <h1 className="text-3xl font-semibold">Usuários do sistema</h1>
          </div>
          <button
            onClick={abrirNovo}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold"
          >
            + Novo usuário
          </button>
        </div>

        {!!erro && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2 mb-4">
            {erro}
          </p>
        )}

        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Permissões</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{usuario.nome}</td>
                    <td className="px-4 py-3 text-gray-400">{usuario.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(usuario.permissoes)
                          .filter(([, ativo]) => ativo)
                          .map(([chave]) => (
                            <span
                              key={chave}
                              className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-gray-200"
                            >
                              {PERMISSOES_LABEL[chave]}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => abrirEdicao(usuario)} className="text-green-400 hover:text-green-300">
                        Editar
                      </button>
                      <button onClick={() => excluir(usuario)} className="text-red-400 hover:text-red-300">
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={fecharModal}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvar}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-semibold">{editId ? 'Editar usuário' : 'Novo usuário'}</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">E-mail</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Senha {editId && <span className="text-xs">(deixe em branco para manter a atual)</span>}
              </label>
              <input
                type="password"
                required={!editId}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Permissões</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PERMISSOES_LABEL).map(([chave, label]) => (
                  <label key={chave} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.permissoes[chave]}
                      onChange={() => togglePermissao(chave)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={fecharModal} className="px-4 py-2 text-gray-400 hover:text-white">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-lg font-semibold"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
