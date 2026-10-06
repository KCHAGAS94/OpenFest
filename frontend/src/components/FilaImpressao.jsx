import { useState, useEffect, useCallback } from 'react'
import ReciboImpressao from './ReciboImpressao'
import { apiFetch, ehEstacaoImpressao, usuarioLogado, temPermissao } from '../utils/configuracoes'
import '../print.css'

// Rota única de impressão: vendas (PC e celular) e reimpressões entram na fila do
// backend, e a estação de impressão (PC) busca e imprime um cupom por vez, em qualquer tela.
export default function FilaImpressao() {
  const [fila, setFila] = useState([])
  const atual = fila[0]

  useEffect(() => {
    if (atual) return
    const intervalo = setInterval(async () => {
      // Só a estação, logada e com acesso ao Caixa, retira cupons da fila.
      if (!ehEstacaoImpressao() || !usuarioLogado() || !temPermissao('caixa')) return
      try {
        const pendentes = await apiFetch('/api/impressao/pendentes')
        if (pendentes.length) setFila(pendentes)
      } catch {
        // Tenta de novo no próximo ciclo.
      }
    }, 2000)
    return () => clearInterval(intervalo)
  }, [atual])

  const proximo = useCallback(() => setFila((prev) => prev.slice(1)), [])

  if (!atual) return null

  const { recibo } = atual
  return (
    <ReciboImpressao
      key={atual.id}
      evento={recibo.evento}
      itens={recibo.itens}
      total={recibo.total}
      data={recibo.data}
      mensagem={recibo.mensagem}
      onAfterPrint={proximo}
    />
  )
}
