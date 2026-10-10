import { Router } from 'express'
import pool from '../db/pool.js'
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

router.post('/', podeEnviarCupom, async (req, res) => {
  const { recibo } = req.body
  if (!recibo?.itens?.length) {
    return res.status(400).json({ message: 'Cupom sem itens.' })
  }
  // Nome de quem enviou sai no fim da impressão, separando os pedidos de cada vendedor.
  let vendedor = req.user.email
  try {
    const { rows } = await pool.query('SELECT nome FROM usuarios_sistema WHERE id = $1', [req.user.id])
    if (rows[0]?.nome) vendedor = rows[0].nome
  } catch {
    // Sem o nome, imprime com o e-mail.
  }
  fila.push({ id: proximoId++, recibo: { ...recibo, vendedor } })
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
