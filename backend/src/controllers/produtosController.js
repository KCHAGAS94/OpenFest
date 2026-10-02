// Controller para produtos com cadastro de estoque
import crypto from 'crypto';
import pool from '../db/pool.js';

export async function cadastrarProduto(req, res) {
  const { nome, preco, estoque, bloqueado = false, tipo = 'unidade', unidadesCombo = null } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO produtos (id, nome, preco, estoque, bloqueado, tipo, "unidadesCombo", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [crypto.randomUUID(), nome, preco, estoque, bloqueado, tipo, unidadesCombo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
}

export async function listarProdutos(req, res) {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
}

export async function atualizarProduto(req, res) {
  const { id } = req.params;
  const { nome, preco, estoque, bloqueado, tipo, unidadesCombo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE produtos SET
         nome = $1, preco = $2, estoque = $3, bloqueado = $4, tipo = $5, "unidadesCombo" = $6, "updatedAt" = NOW()
       WHERE id = $7
       RETURNING *`,
      [nome, preco, estoque, !!bloqueado, tipo || 'unidade', unidadesCombo ?? null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
}

export async function deletarProduto(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ ok: true });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({ error: 'Esse produto já tem vendas registradas e não pode ser removido.' });
    }
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
}
