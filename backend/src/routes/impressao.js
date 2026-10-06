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
  res.status(201).json({ ok: true })
})

// A estação retira todos os pendentes de uma vez para imprimir.
router.get('/pendentes', (_req, res) => {
  res.json(fila.splice(0, fila.length))
})

export default router
