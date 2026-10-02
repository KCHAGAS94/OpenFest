import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'
import { criarVenda, listarVendas } from '../controllers/vendasController.js'

const router = Router()

router.use(authMiddleware)

router.post('/', criarVenda)
router.get('/', requirePermissao('gestao'), listarVendas)

export default router
