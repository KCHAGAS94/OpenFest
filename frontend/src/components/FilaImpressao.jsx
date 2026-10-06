import { useState, useEffect, useCallback } from 'react'
import ReciboImpressao from './ReciboImpressao'
import { apiFetch } from '../utils/configuracoes'

// Na estação de impressão, busca os cupons enviados por outros aparelhos e imprime um por vez.
// `pausado` evita imprimir junto com um cupom da própria estação.
export default function FilaImpressao({ pausado }) {
  const [fila, setFila] = useState([])
  const atual = fila[0]

  useEffect(() => {
    if (pausado || atual) return
    const intervalo = setInterval(async () => {
      try {
        const pendentes = await apiFetch('/api/impressao/pendentes')
        if (pendentes.length) setFila(pendentes)
      } catch {
        // Tenta de novo no próximo ciclo.
      }
    }, 2000)
    return () => clearInterval(intervalo)
  }, [pausado, atual])

  const proximo = useCallback(() => setFila((prev) => prev.slice(1)), [])

  if (pausado || !atual) return null

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
