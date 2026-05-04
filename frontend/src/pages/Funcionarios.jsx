import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { IconEdit, IconTrash } from '../components/Icons'
import '../styles/Funcionarios.css'

function carregarFuncionarios() {
  try {
    return JSON.parse(localStorage.getItem('openfest_funcionarios')) || []
  } catch {
    return []
  }
}

function salvarFuncionarios(funcionarios) {
  localStorage.setItem('openfest_funcionarios', JSON.stringify(funcionarios))
}

function ConfirmModal({ aberto, onClose, onConfirm, mensagem }) {
  if (!aberto) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 400}}>
        <div className="modal-header">
          <h2>Confirmação</h2>
          <button className="btn-fechar" onClick={onClose}>✕</button>
        </div>
        <div style={{margin: '24px 0', color: '#fff', fontSize: 18}}>{mensagem}</div>
        <div className="modal-buttons">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-confirmar" onClick={() => { onConfirm(); onClose(); }}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default function Funcionarios() {
    // Modal de confirmação
    const [confirmModal, setConfirmModal] = useState({ aberto: false, mensagem: '', onConfirm: null })
  const [funcionarios, setFuncionarios] = useState(() => carregarFuncionarios())
  const [modalAberto, setModalAberto] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    funcao: '',
    salario: '',
    tipoAcesso: 'vendedor',
    statusPagamento: 'em dia'
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroFuncao, setFiltroFuncao] = useState('')
  const [filtroSalario, setFiltroSalario] = useState('')
  const [filtroTipoAcesso, setFiltroTipoAcesso] = useState('')
  const [filtroStatusPagamento, setFiltroStatusPagamento] = useState('')

  const funcionariosFiltrados = useMemo(() => {
    const termoNome = filtroNome.trim().toLowerCase()
    const termoFuncao = filtroFuncao.trim().toLowerCase()
    const termoSalario = filtroSalario.trim().toLowerCase()
    const termoTipoAcesso = filtroTipoAcesso.trim().toLowerCase()
    const termoStatusPagamento = filtroStatusPagamento.trim().toLowerCase()

    return funcionarios
      .filter(func => {
        const nomeMatch = termoNome ? func.nome.toLowerCase().includes(termoNome) : true
        const funcaoMatch = termoFuncao ? func.funcao.toLowerCase().includes(termoFuncao) : true
        const salarioFormatado = `r$ ${func.salario.toFixed(2)}`.toLowerCase()
        const salarioMatch = termoSalario ? salarioFormatado.includes(termoSalario) : true
        const tipoAcessoMatch = termoTipoAcesso ? func.tipoAcesso.toLowerCase().includes(termoTipoAcesso) : true
        const statusMatch = termoStatusPagamento ? func.statusPagamento.toLowerCase().includes(termoStatusPagamento) : true
        return nomeMatch && funcaoMatch && salarioMatch && tipoAcessoMatch && statusMatch
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  }, [funcionarios, filtroNome, filtroFuncao, filtroSalario, filtroTipoAcesso, filtroStatusPagamento])

  // Salvar funcionários quando mudar
  useEffect(() => {
    salvarFuncionarios(funcionarios)
  }, [funcionarios])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAdicionarFuncionario = () => {
    if (formData.nome && formData.funcao && formData.salario) {
      const novoFuncionario = {
        id: Date.now(),
        ...formData,
        salario: parseFloat(formData.salario)
      }
      setFuncionarios(prev => [...prev, novoFuncionario])
      limparModal()
    } else {
      alert('Por favor, preencha todos os campos!')
    }
  }

  const handleSalvarEdicao = () => {
    if (formData.nome && formData.funcao && formData.salario) {
      setFuncionarios(prev => prev.map(f => f.id === editId ? {
        ...f,
        ...formData,
        salario: parseFloat(formData.salario)
      } : f))
      limparModal()
    } else {
      alert('Por favor, preencha todos os campos!')
    }
  }


  const handleDeletarFuncionario = (id) => {
    setConfirmModal({
      aberto: true,
      mensagem: 'Tem certeza que deseja deletar este funcionário?',
      onConfirm: () => setFuncionarios(prev => prev.filter(f => f.id !== id))
    })
  }

  // Editar funcionário (abrir modal preenchido)
  const handleEditarFuncionario = (func) => {
    setFormData({
      nome: func.nome,
      funcao: func.funcao,
      salario: func.salario,
      tipoAcesso: func.tipoAcesso,
      statusPagamento: func.statusPagamento
    })
    setEditId(func.id)
    setIsEditMode(true)
    setModalAberto(true)
  }

  // Alterar status de pagamento ao clicar
  const handleToggleStatusPagamento = (id, statusAtual) => {
    if (statusAtual !== 'pago') {
      setConfirmModal({
        aberto: true,
        mensagem: 'Deseja realmente marcar como Pago?',
        onConfirm: () => {
          setFuncionarios(prev => prev.map(f => {
            if (f.id === id) {
              return {
                ...f,
                statusPagamento: 'pago'
              }
            }
            return f
          }))
        }
      })
    } else {
      setFuncionarios(prev => prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            statusPagamento: f.statusPagamento === 'pago' ? 'a pagar' : 'pago'
          }
        }
        return f
      }))
    }
  }

  const limparModal = () => {
    setFormData({
      nome: '',
      funcao: '',
      salario: '',
      tipoAcesso: 'vendedor',
      statusPagamento: 'em dia'
    })
    setIsEditMode(false)
    setEditId(null)
    setModalAberto(false)
  }

  const handleFecharModal = limparModal

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-gray-900/80 border border-white/10 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-pink-400 mb-2">Gestão</p>
              <h1 className="text-3xl font-semibold text-white">Funcionários</h1>
              <div className="mt-4 flex flex-wrap items-center gap-8 text-sm uppercase tracking-[0.3em] text-gray-300">
                <a href="/gestao" className="hover:text-white/80">Dashboard</a>
                <a href="/relatorio" className="hover:text-white/80">Financeiro</a>
                <a href="/produtos/relatorio" className="hover:text-white/80">Produtos</a>
                <a href="/funcionarios" className="text-white">Funcionários</a>
              </div>
              <p className="mt-3 max-w-2xl text-gray-300 leading-7">
                Gerencie os funcionários do OpenFest. Aqui você pode adicionar, visualizar e controlar informações de acesso e pagamento da equipe.
              </p>
            </div>
          </div>
        </section>
      </main>

      <div className="funcionarios-container">
        <div className="funcionarios-header">
          <button 
            className="btn-adicionar"
            onClick={() => setModalAberto(true)}
          >
            + Adicionar Funcionário
          </button>
        </div>

        <div className="funcionarios-content">
          {funcionarios.length === 0 ? (
            <p className="vazio-mensagem">Nenhum funcionário cadastrado ainda.</p>
          ) : (
            <table className="funcionarios-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Função</th>
                  <th>Sálario</th>
                  <th>Tipo de acesso</th>
                  <th>Status Pagamento</th>
                  <th>Ações</th>
                </tr>
                <tr className="filtro-linha">
                  <th>
                    <input
                      value={filtroNome}
                      onChange={(event) => setFiltroNome(event.target.value)}
                      placeholder="Filtrar nome"
                      className="filtro-input"
                    />
                  </th>
                  <th>
                    <input
                      value={filtroFuncao}
                      onChange={(event) => setFiltroFuncao(event.target.value)}
                      placeholder="Filtrar função"
                      className="filtro-input"
                    />
                  </th>
                  <th>
                    <input
                      value={filtroSalario}
                      onChange={(event) => setFiltroSalario(event.target.value)}
                      placeholder="Filtrar salário"
                      className="filtro-input"
                    />
                  </th>
                  <th>
                    <input
                      value={filtroTipoAcesso}
                      onChange={(event) => setFiltroTipoAcesso(event.target.value)}
                      placeholder="Filtrar acesso"
                      className="filtro-input"
                    />
                  </th>
                  <th>
                    <input
                      value={filtroStatusPagamento}
                      onChange={(event) => setFiltroStatusPagamento(event.target.value)}
                      placeholder="Filtrar status"
                      className="filtro-input"
                    />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {funcionariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sem-resultados">Nenhum resultado encontrado.</td>
                  </tr>
                ) : (
                  funcionariosFiltrados.map(func => (
                    <tr key={func.id}>
                      <td>{func.nome}</td>
                      <td>{func.funcao}</td>
                      <td>R$ {func.salario.toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${func.tipoAcesso.toLowerCase()}`}>
                          {func.tipoAcesso}
                        </span>
                      </td>
                      <td>
                        {func.statusPagamento === 'pago' ? (
                          <span className="status status-pago status-clickable">Pago</span>
                        ) : (
                          <span className="status status-a-pagar status-clickable" onClick={() => handleToggleStatusPagamento(func.id, func.statusPagamento)}>Á Pagar</span>
                        )}
                      </td>
                      <td style={{display: 'flex', gap: 8}}>
                        <button className="btn-editar" title="Editar" onClick={() => handleEditarFuncionario(func)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                          <IconEdit size={20} color="#22c55e" />
                        </button>
                        <button 
                          className="btn-deletar"
                          title="Deletar"
                          onClick={() => handleDeletarFuncionario(func.id)}
                          style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
                        >
                          <IconTrash size={20} color="#ef4444" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {modalAberto && (
          <div className="modal-overlay" onClick={handleFecharModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditMode ? 'Editar Funcionário' : 'Adicionar Funcionário'}</h2>
                <button 
                  className="btn-fechar"
                  onClick={handleFecharModal}
                >
                  ✕
                </button>
              </div>

              <form className="modal-form" onSubmit={e => {
                e.preventDefault()
                if (isEditMode) {
                  handleSalvarEdicao()
                } else {
                  handleAdicionarFuncionario()
                }
              }}>
                <div className="form-grupo">
                  <label htmlFor="nome">Nome</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="form-grupo">
                  <label htmlFor="funcao">Função</label>
                  <input
                    type="text"
                    id="funcao"
                    name="funcao"
                    value={formData.funcao}
                    onChange={handleInputChange}
                    placeholder="Ex: Gerente, Caixa, Segurança"
                  />
                </div>

                <div className="form-grupo">
                  <label htmlFor="salario">Sálario</label>
                  <input
                    type="number"
                    id="salario"
                    name="salario"
                    value={formData.salario}
                    onChange={handleInputChange}
                    placeholder="Ex: 2000.00"
                    step="0.01"
                  />
                </div>

                <div className="form-grupo">
                  <label htmlFor="tipoAcesso">Tipo de acesso</label>
                  <select
                    id="tipoAcesso"
                    name="tipoAcesso"
                    value={formData.tipoAcesso}
                    onChange={handleInputChange}
                  >
                    <option value="Admin">Admin</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="assistente">Assistente</option>
                  </select>
                </div>

                <div className="form-grupo">
                  <label htmlFor="statusPagamento">Status Pagamento</label>
                  <select
                    id="statusPagamento"
                    name="statusPagamento"
                    value={formData.statusPagamento}
                    onChange={handleInputChange}
                  >
                    <option value="pago">Pago</option>
                    <option value="a pagar">Á Pagar</option>
                  </select>
                </div>

                <div className="modal-buttons">
                  <button 
                    type="button"
                    className="btn-cancelar"
                    onClick={handleFecharModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn-confirmar"
                  >
                    {isEditMode ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        aberto={confirmModal.aberto}
        mensagem={confirmModal.mensagem}
        onClose={() => setConfirmModal({ ...confirmModal, aberto: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </>
  )
}
