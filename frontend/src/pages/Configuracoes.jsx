import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import {
  PERMISSOES,
  CONFIG_PADRAO,
  apiFetch,
  usuarioLogado,
  ehEstacaoImpressao,
  definirEstacaoImpressao,
} from '../utils/configuracoes'
import { dadosLocaisPendentes, importarDadosLocais } from '../utils/dados'

const FORM_VAZIO = {
  nome: '',
  email: '',
  senha: '',
  permissoes: { caixa: true, produtos: false, gestao: false, configuracoes: false },
}

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500'

function Secao({ titulo, descricao, children }) {
  return (
    <section className="bg-gray-900 border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white">{titulo}</h2>
      <p className="text-sm text-gray-500 mb-5">{descricao}</p>
      {children}
    </section>
  )
}

function Aviso({ tipo, children }) {
  if (!children) return null
  const cores = tipo === 'erro'
    ? 'text-red-400 bg-red-400/10 border-red-400/20'
    : 'text-green-400 bg-green-400/10 border-green-400/20'
  return <p className={`text-sm border rounded-lg px-3 py-2 ${cores}`}>{children}</p>
}

export default function Configuracoes() {
  const [config, setConfig] = useState(CONFIG_PADRAO)
  const [msgConfig, setMsgConfig] = useState({ tipo: '', texto: '' })
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [estacao, setEstacao] = useState(ehEstacaoImpressao)
  const [dadosLocais, setDadosLocais] = useState(dadosLocaisPendentes)
  const [msgImportacao, setMsgImportacao] = useState({ tipo: '', texto: '' })
  const [importando, setImportando] = useState(false)

  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editId, setEditId] = useState(null)
  const [erroUsuario, setErroUsuario] = useState('')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const logado = usuarioLogado()

  useEffect(() => {
    Promise.all([apiFetch('/api/configuracoes'), apiFetch('/api/usuarios')])
      .then(([configBanco, listaUsuarios]) => {
        setConfig({ ...CONFIG_PADRAO, ...configBanco })
        setUsuarios(listaUsuarios)
      })
      .catch((err) => setMsgConfig({ tipo: 'erro', texto: err.message }))
      .finally(() => setCarregando(false))
  }, [])

  function alterarConfig(campo, valor) {
    setConfig((prev) => ({ ...prev, [campo]: valor }))
    setMsgConfig({ tipo: '', texto: '' })
  }

  async function salvarConfiguracoes(e) {
    e.preventDefault()
    setSalvandoConfig(true)
    try {
      setConfig(await apiFetch('/api/configuracoes', { method: 'PUT', body: config }))
      setMsgConfig({ tipo: 'ok', texto: 'Configurações salvas.' })
    } catch (err) {
      setMsgConfig({ tipo: 'erro', texto: err.message })
    } finally {
      setSalvandoConfig(false)
    }
  }

  function limparForm() {
    setForm(FORM_VAZIO)
    setEditId(null)
    setErroUsuario('')
  }

  async function salvarUsuario(e) {
    e.preventDefault()
    setErroUsuario('')

    if (!form.nome.trim() || !form.email.trim() || (!editId && !form.senha)) {
      setErroUsuario('Preencha nome, e-mail e senha.')
      return
    }

    setSalvandoUsuario(true)
    try {
      if (editId) {
        const atualizado = await apiFetch(`/api/usuarios/${editId}`, { method: 'PUT', body: form })
        setUsuarios((prev) => prev.map((u) => (u.id === editId ? atualizado : u)))
      } else {
        const criado = await apiFetch('/api/usuarios', { method: 'POST', body: form })
        setUsuarios((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
      }
      limparForm()
    } catch (err) {
      setErroUsuario(err.message)
    } finally {
      setSalvandoUsuario(false)
    }
  }

  function editarUsuario(usuario) {
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', permissoes: { ...usuario.permissoes } })
    setEditId(usuario.id)
    setErroUsuario('')
  }

  async function excluirUsuario(usuario) {
    if (!window.confirm(`Excluir o usuário ${usuario.nome}?`)) return
    setErroUsuario('')
    try {
      await apiFetch(`/api/usuarios/${usuario.id}`, { method: 'DELETE' })
      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id))
      if (editId === usuario.id) limparForm()
    } catch (err) {
      setErroUsuario(err.message)
    }
  }

  async function importar() {
    setImportando(true)
    try {
      const { produtosImportados, vendasImportadas } = await importarDadosLocais()
      setDadosLocais(dadosLocaisPendentes())
      setMsgImportacao({
        tipo: 'ok',
        texto: `Importação concluída: ${produtosImportados} produto(s) novo(s) e ${vendasImportadas} venda(s).`,
      })
    } catch (err) {
      setMsgImportacao({ tipo: 'erro', texto: err.message })
    } finally {
      setImportando(false)
    }
  }

  function alternarPermissao(chave) {
    setForm((prev) => ({ ...prev, permissoes: { ...prev.permissoes, [chave]: !prev.permissoes[chave] } }))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Sistema</p>
          <h1 className="text-3xl font-semibold">Configurações</h1>
        </div>

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : (
          <>
            <form onSubmit={salvarConfiguracoes} className="grid gap-6 md:grid-cols-2">
              <Secao titulo="Evento" descricao="Informações que aparecem no cupom impresso.">
                <label className="block text-sm text-gray-400 mb-1">Nome do evento</label>
                <input
                  value={config.nomeEvento}
                  onChange={(e) => alterarConfig('nomeEvento', e.target.value)}
                  className={`${inputClass} mb-4`}
                  placeholder="SwingSamba"
                />
                <label className="block text-sm text-gray-400 mb-1">Mensagem do cupom</label>
                <input
                  value={config.mensagemRecibo}
                  onChange={(e) => alterarConfig('mensagemRecibo', e.target.value)}
                  className={inputClass}
                  placeholder="Obrigado pela preferência!"
                />
              </Secao>

              <Secao titulo="Impressão" descricao="Comportamento do cupom ao finalizar uma venda no Caixa.">
                <label className="flex items-center justify-between gap-4 bg-gray-800 rounded-xl px-4 py-3 cursor-pointer">
                  <span>
                    <span className="block font-medium">Imprimir cupom automaticamente</span>
                    <span className="block text-xs text-gray-500">Desligado, a venda é concluída sem imprimir.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.imprimirAutomatico}
                    onChange={(e) => alterarConfig('imprimirAutomatico', e.target.checked)}
                    className="w-5 h-5 accent-pink-500"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 bg-gray-800 rounded-xl px-4 py-3 mt-3 cursor-pointer">
                  <span>
                    <span className="block font-medium">Este aparelho é a estação de impressão</span>
                    <span className="block text-xs text-gray-500">
                      Marque só no PC com a impressora e deixe o Caixa aberto nele. Cupons de outros aparelhos (celular) saem aqui. Vale só para este aparelho e salva na hora.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={estacao}
                    onChange={(e) => {
                      definirEstacaoImpressao(e.target.checked)
                      setEstacao(e.target.checked)
                    }}
                    className="w-5 h-5 accent-pink-500"
                  />
                </label>
              </Secao>

              <div className="md:col-span-2 flex items-center justify-end gap-4">
                <Aviso tipo={msgConfig.tipo}>{msgConfig.texto}</Aviso>
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-xl font-semibold transition-colors"
                >
                  {salvandoConfig ? 'Salvando...' : 'Salvar configurações'}
                </button>
              </div>
            </form>

            {(dadosLocais.produtos.length > 0 || dadosLocais.vendas.length > 0 || msgImportacao.texto) && (
              <Secao
                titulo="Dados salvos neste navegador"
                descricao="Produtos e vendas cadastrados antes de o sistema usar o banco. Importe para que apareçam em todos os aparelhos."
              >
                {(dadosLocais.produtos.length > 0 || dadosLocais.vendas.length > 0) && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <p className="text-sm text-gray-300">
                      {dadosLocais.produtos.length} produto(s) e {dadosLocais.vendas.length} venda(s) encontrados.
                      Produtos com o mesmo nome de um já existente no banco não são duplicados.
                    </p>
                    <button
                      onClick={importar}
                      disabled={importando}
                      className="shrink-0 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-xl font-semibold transition-colors"
                    >
                      {importando ? 'Importando...' : 'Importar para o banco'}
                    </button>
                  </div>
                )}
                <Aviso tipo={msgImportacao.tipo}>{msgImportacao.texto}</Aviso>
              </Secao>
            )}

            <Secao titulo="Usuários e permissões" descricao="Defina quem acessa cada área do sistema.">
              <form onSubmit={salvarUsuario} className="grid gap-4 md:grid-cols-3 mb-6">
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" className={inputClass} />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" className={inputClass} />
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder={editId ? 'Nova senha (opcional)' : 'Senha'}
                  className={inputClass}
                />

                <div className="md:col-span-3 flex flex-wrap gap-3">
                  {PERMISSOES.map(({ chave, label }) => (
                    <label key={chave} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!form.permissoes[chave]} onChange={() => alternarPermissao(chave)} className="accent-pink-500" />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="md:col-span-3">
                  <Aviso tipo="erro">{erroUsuario}</Aviso>
                </div>

                <div className="md:col-span-3 flex justify-end gap-3">
                  {editId && (
                    <button type="button" onClick={limparForm} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={salvandoUsuario}
                    className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-xl font-semibold transition-colors"
                  >
                    {editId ? 'Salvar usuário' : 'Adicionar usuário'}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gray-800 rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {usuario.nome}
                        {logado?.id === usuario.id && <span className="ml-2 text-xs text-pink-400">(você)</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{usuario.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {PERMISSOES.filter(({ chave }) => usuario.permissoes[chave]).map(({ chave, label }) => (
                        <span key={chave} className="text-xs bg-pink-500/15 text-pink-300 rounded-full px-2.5 py-1">{label}</span>
                      ))}
                      <button onClick={() => editarUsuario(usuario)} className="ml-2 text-sm text-gray-300 hover:text-white">Editar</button>
                      <button onClick={() => excluirUsuario(usuario)} className="text-sm text-red-400 hover:text-red-300">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </Secao>
          </>
        )}
      </main>
    </div>
  )
}
