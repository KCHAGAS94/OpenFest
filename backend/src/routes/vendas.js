import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'
import { registrarVenda, listarVendas, importarDadosLocais } from '../controllers/vendasController.js'

const router = Router()

router.use(authMiddleware)

router.post('/', requirePermissao('caixa'), registrarVenda)
router.get('/', requirePermissao('gestao'), listarVendas)
router.post('/importar', requirePermissao('configuracoes'), importarDadosLocais)

export default router
