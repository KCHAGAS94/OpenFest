import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'

// Fila de cupons enviados por outros aparelhos (ex.: celular) para a estação
// de impressão (o PC com a impressora). Fica em memória: cupons pendentes se
// perdem se o backend reiniciar.
const fila = []
let proximoId = 1

const router = Router()

router.use(authMiddleware, requirePermissao('caixa'))

router.post('/', (req, res) => {
  const { recibo } = req.body
  if (!recibo?.itens?.length) {
    return res.status(400).json({ message: 'Cupom sem itens.' })
  }
  fila.push({ id: proximoId++, recibo })
  console.log(`[impressão] cupom recebido de ${req.user.email} (${fila.length} na fila)`)
  res.status(201).json({ ok: true })
})

// A estação retira todos os pendentes de uma vez para imprimir.
router.get('/pendentes', (req, res) => {
  const pendentes = fila.splice(0, fila.length)
  if (pendentes.length) console.log(`[impressão] estação (${req.user.email}) retirou ${pendentes.length} cupom(ns)`)
  res.json(pendentes)
})

export default router
