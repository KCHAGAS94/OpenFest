import { Router } from 'express'
import {
  criarPix,
  criarCobrancaCartao,
  verificarStatus,
  listarDispositivos,
  debugToken,
} from '../controllers/pagamentoController.js'

const router = Router()

router.post('/pix', criarPix)
router.post('/cartao', criarCobrancaCartao)
router.get('/status/:id', verificarStatus)
router.get('/dispositivos', listarDispositivos)
router.get('/debug-token', debugToken)

export default router
