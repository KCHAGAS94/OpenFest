import express from 'express';
import * as produtosController from '../controllers/produtosController.js';

const router = express.Router();

// Rota para cadastrar produto com estoque
router.post('/', produtosController.cadastrarProduto);

// Rota para listar produtos
router.get('/', produtosController.listarProdutos);

// Rotas para editar e remover produto
router.put('/:id', produtosController.atualizarProduto);
router.delete('/:id', produtosController.deletarProduto);

export default router;
