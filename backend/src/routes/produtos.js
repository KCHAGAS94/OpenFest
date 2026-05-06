import express from 'express';
import * as produtosController from '../controllers/produtosController.js';

const router = express.Router();

// Rota para cadastrar produto com estoque
router.post('/', produtosController.cadastrarProduto);

// Rota para listar produtos
router.get('/', produtosController.listarProdutos);

export default router;
