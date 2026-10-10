import { useState, useEffect, useCallback } from 'react'
import ReciboImpressao from './ReciboImpressao'
import { apiFetch, ehEstacaoImpressao, usuarioLogado, temPermissao } from '../utils/configuracoes'
import '../print.css'

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Rota única de impressão: vendas (PC e celular) e reimpressões entram na fila do
// backend, e a estação de impressão (PC) busca e imprime um cupom por vez, em qualquer tela.
export default function FilaImpressao() {
  const [fila, setFila] = useState([])
  const atual = fila[0]

  useEffect(() => {
    if (atual) return
    const controle = new AbortController()

    // Long polling: o backend segura a requisição até chegar um cupom, então
    // a impressão sai na hora; ao voltar vazia, já pede de novo.
    async function aguardarCupons() {
      while (!controle.signal.aborted) {
        // Só a estação, logada e com acesso ao Caixa, retira cupons da fila.
        if (!ehEstacaoImpressao() || !usuarioLogado() || !temPermissao('caixa')) {
          await esperar(2000)
          continue
        }
        try {
          const pendentes = await apiFetch('/api/impressao/pendentes', { signal: controle.signal })
          if (pendentes.length) return setFila(pendentes)
        } catch {
          // Backend fora do ar: tenta de novo em instantes.
          await esperar(2000)
        }
      }
    }

    aguardarCupons()
    return () => controle.abort()
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
      vendedor={recibo.vendedor}
      onAfterPrint={proximo}
    />
  )
}
