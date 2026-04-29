const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');

// Rota para cadastrar produto com estoque
router.post('/', produtosController.cadastrarProduto);

// Rota para listar produtos
router.get('/', produtosController.listarProdutos);

module.exports = router;
