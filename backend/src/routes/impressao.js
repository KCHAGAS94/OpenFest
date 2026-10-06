import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'

// Fila de cupons enviados por outros aparelhos (ex.: celular) para a estação
// de impressão (o PC com a impressora). Fica em memória: cupons pendentes se
// perdem se o backend reiniciar.
const fila = []
let proximoId = 1

const router = Router()

router.use(authMiddleware)

// Envia cupom: venda no Caixa ou reimpressão pelo relatório da Gestão.
function podeEnviarCupom(req, res, next) {
  const { caixa, gestao } = req.user?.permissoes || {}
  if (!caixa && !gestao) {
    return res.status(403).json({ message: 'Você não tem permissão para imprimir cupons.' })
  }
  next()
}

router.post('/', podeEnviarCupom, (req, res) => {
  const { recibo } = req.body
  if (!recibo?.itens?.length) {
    return res.status(400).json({ message: 'Cupom sem itens.' })
  }
  fila.push({ id: proximoId++, recibo })
  console.log(`[impressão] cupom recebido de ${req.user.email} (${fila.length} na fila)`)
  res.status(201).json({ ok: true })
})

// A estação retira todos os pendentes de uma vez para imprimir.
router.get('/pendentes', requirePermissao('caixa'), (req, res) => {
  const pendentes = fila.splice(0, fila.length)
  if (pendentes.length) console.log(`[impressão] estação (${req.user.email}) retirou ${pendentes.length} cupom(ns)`)
  res.json(pendentes)
})

export default router
