// Ordem de prioridade de acesso após o login.
const ROTAS_POR_PERMISSAO = [
  { permissao: 'caixa', rota: '/caixa' },
  { permissao: 'produtos', rota: '/produtos' },
  { permissao: 'gestao', rota: '/gestao' },
  { permissao: 'configuracoes', rota: '/configuracoes' },
]

export function primeiraRotaPermitida(permissoes) {
  const permitida = ROTAS_POR_PERMISSAO.find(({ permissao }) => permissoes?.[permissao])
  return permitida ? permitida.rota : '/sem-acesso'
}
