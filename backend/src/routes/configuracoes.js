import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'
import { listarConfiguracoes, salvarConfiguracoes } from '../controllers/configuracoesController.js'

const router = Router()

router.use(authMiddleware, requirePermissao('gestao'))

router.get('/', listarConfiguracoes)
router.put('/', salvarConfiguracoes)

export default router
