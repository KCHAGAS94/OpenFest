// Controller para produtos com cadastro de estoque
import pool from '../db/pool.js';

export async function cadastrarProduto(req, res) {
  const { nome, preco, estoque } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco, estoque) VALUES ($1, $2, $3) RETURNING *',
      [nome, preco, estoque]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
}

export async function listarProdutos(req, res) {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
}
