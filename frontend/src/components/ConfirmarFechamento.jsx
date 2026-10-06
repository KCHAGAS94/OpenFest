import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ehEstacaoImpressao, saidaFoiPermitida } from '../utils/configuracoes'

// 1) Links internos (<a href="/...">) trocam de tela sem recarregar a página.
// 2) Na estação de impressão, fechar a janela pede confirmação, porque fechada
//    ela para de imprimir os cupons dos celulares.
export default function ConfirmarFechamento() {
  const navigate = useNavigate()

  useEffect(() => {
    function aoClicar(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target.closest('a[href]')
      if (!link || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href)
      if (url.origin !== window.location.origin) return
      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }

    function aoFechar(e) {
      if (!ehEstacaoImpressao() || saidaFoiPermitida()) return
      // O texto e os botões do aviso são do próprio navegador e não podem ser trocados.
      e.preventDefault()
      e.returnValue = ''
    }

    document.addEventListener('click', aoClicar)
    window.addEventListener('beforeunload', aoFechar)
    return () => {
      document.removeEventListener('click', aoClicar)
      window.removeEventListener('beforeunload', aoFechar)
    }
  }, [navigate])

  return null
}
