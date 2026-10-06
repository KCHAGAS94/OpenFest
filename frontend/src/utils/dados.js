// Produtos e vendas salvos no banco, compartilhados entre todos os aparelhos.
import { apiFetch } from './configuracoes'

export function listarProdutos() {
  return apiFetch('/api/produtos')
}

export function salvarProduto(produto) {
  return produto.id
    ? apiFetch(`/api/produtos/${produto.id}`, { method: 'PUT', body: produto })
    : apiFetch('/api/produtos', { method: 'POST', body: produto })
}

export function excluirProduto(id) {
  return apiFetch(`/api/produtos/${id}`, { method: 'DELETE' })
}

export function listarVendas() {
  return apiFetch('/api/vendas')
}

export function registrarVenda(itens, tipoPagamento) {
  return apiFetch('/api/vendas', {
    method: 'POST',
    body: { itens: itens.map(({ id, quantidade }) => ({ id, quantidade })), tipoPagamento },
  })
}

// Dados antigos que ficaram no localStorage deste navegador, antes de irem para o banco.
const CHAVES_LOCAIS = { produtos: 'openfest_produtos', vendas: 'openfest_vendas' }

export function dadosLocaisPendentes() {
  const ler = (chave) => {
    try {
      return JSON.parse(localStorage.getItem(chave)) || []
    } catch {
      return []
    }
  }
  return { produtos: ler(CHAVES_LOCAIS.produtos), vendas: ler(CHAVES_LOCAIS.vendas) }
}

export async function importarDadosLocais() {
  const resumo = await apiFetch('/api/vendas/importar', { method: 'POST', body: dadosLocaisPendentes() })
  // Guarda uma cópia com outro nome e tira da lista de pendentes, para não importar duas vezes.
  for (const chave of Object.values(CHAVES_LOCAIS)) {
    const valor = localStorage.getItem(chave)
    if (valor !== null) localStorage.setItem(`${chave}_importado`, valor)
    localStorage.removeItem(chave)
  }
  return resumo
}
