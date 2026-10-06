import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'
import { listarProdutos, criarProduto, atualizarProduto, excluirProduto } from '../controllers/produtosController.js'

const router = Router()

router.use(authMiddleware)

// Qualquer usuário logado lista (o Caixa precisa); só quem gerencia produtos altera.
router.get('/', listarProdutos)
router.post('/', requirePermissao('produtos'), criarProduto)
router.put('/:id', requirePermissao('produtos'), atualizarProduto)
router.delete('/:id', requirePermissao('produtos'), excluirProduto)

export default router
