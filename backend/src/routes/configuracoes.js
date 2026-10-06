import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'
import { obterConfiguracoes, salvarConfiguracoes } from '../controllers/configuracoesController.js'

const router = Router()

// Qualquer usuário logado lê (o Caixa usa para o cupom); só quem tem permissão altera.
router.get('/', authMiddleware, obterConfiguracoes)
router.put('/', authMiddleware, requirePermissao('configuracoes'), salvarConfiguracoes)

export default router
