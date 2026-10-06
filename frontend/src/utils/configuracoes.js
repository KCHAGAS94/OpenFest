// Sessão do usuário logado, permissões e acesso às APIs de usuários/configurações.

export const CONFIG_PADRAO = {
  nomeEvento: 'SwingSamba',
  mensagemRecibo: 'Obrigado pela preferência!',
  imprimirAutomatico: true,
}

export const PERMISSOES = [
  { chave: 'caixa', label: 'Caixa', rota: '/caixa' },
  { chave: 'produtos', label: 'Produtos', rota: '/produtos' },
  { chave: 'gestao', label: 'Gestão', rota: '/gestao' },
  { chave: 'configuracoes', label: 'Configurações', rota: '/configuracoes' },
]

function tokenValido(token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]))
    return !exp || exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function iniciarSessao(token, usuario) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(usuario))
}

export function sair() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function usuarioLogado() {
  const token = localStorage.getItem('token')
  if (!token || !tokenValido(token)) return null
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

export function temPermissao(chave) {
  return !!usuarioLogado()?.permissoes?.[chave]
}

export function primeiraRotaPermitida() {
  const permitida = PERMISSOES.find(({ chave }) => temPermissao(chave))
  return permitida ? permitida.rota : '/login'
}

export async function apiFetch(url, { body, ...options } = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401) {
    sair()
    window.location.href = '/login'
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Erro ao comunicar com o servidor.')
  return data
}

export async function carregarConfig() {
  try {
    return { ...CONFIG_PADRAO, ...(await apiFetch('/api/configuracoes')) }
  } catch {
    return CONFIG_PADRAO
  }
}
