import { Router } from 'express'
import {
  criarPix,
  verificarPagamentoRecente,
  verificarStatus,
  listarDispositivos,
  debugToken,
} from '../controllers/pagamentoController.js'

const router = Router()

router.post('/pix', criarPix)
router.get('/cartao/verificar', verificarPagamentoRecente)
router.get('/status/:id', verificarStatus)
router.get('/dispositivos', listarDispositivos)
router.get('/debug-token', debugToken)

export default router
