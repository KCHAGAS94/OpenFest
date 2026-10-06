import { Router } from 'express'
import { authMiddleware, requirePermissao } from '../middlewares/auth.js'
import { listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario } from '../controllers/usuariosController.js'

const router = Router()

router.use(authMiddleware, requirePermissao('configuracoes'))

router.get('/', listarUsuarios)
router.post('/', criarUsuario)
router.put('/:id', atualizarUsuario)
router.delete('/:id', excluirUsuario)

export default router
