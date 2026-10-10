import crypto from 'crypto'
import pool from '../db/pool.js'

export function produtoParaSaida(row) {
  return {
    id: row.id,
    nome: row.nome,
    preco: Number(row.preco),
    estoque: row.estoque,
    bloqueado: row.bloqueado,
    tipo: row.tipo,
    unidadesCombo: row.unidadesCombo ?? undefined,
  }
}

function dadosDoCorpo(body) {
  const tipo = body.tipo === 'combo' ? 'combo' : 'unidade'
  return [
    String(body.nome || '').trim(),
    Number(body.preco) || 0,
    Number.parseInt(body.estoque, 10) || 0,
    !!body.bloqueado,
    tipo,
    tipo === 'combo' ? Number.parseInt(body.unidadesCombo, 10) || 1 : null,
  ]
}

export async function listarProdutos(_req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY "createdAt", nome')
    res.json(rows.map(produtoParaSaida))
  } catch (err) {
    console.error('Erro ao listar produtos:', err)
    res.status(500).json({ message: 'Erro ao listar produtos.' })
  }
}

export async function criarProduto(req, res) {
  const dados = dadosDoCorpo(req.body)
  if (!dados[0]) return res.status(400).json({ message: 'Informe o nome do produto.' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO produtos (id, nome, preco, estoque, bloqueado, tipo, "unidadesCombo", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [crypto.randomUUID(), ...dados]
    )
    res.status(201).json(produtoParaSaida(rows[0]))
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err)
    res.status(500).json({ message: 'Erro ao cadastrar produto.' })
  }
}

export async function atualizarProduto(req, res) {
  const dados = dadosDoCorpo(req.body)
  if (!dados[0]) return res.status(400).json({ message: 'Informe o nome do produto.' })

  try {
    const { rows } = await pool.query(
      `UPDATE produtos SET
         nome = $1, preco = $2, estoque = $3, bloqueado = $4, tipo = $5, "unidadesCombo" = $6,
         "updatedAt" = NOW()
       WHERE id = $7
       RETURNING *`,
      [...dados, req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' })
    res.json(produtoParaSaida(rows[0]))
  } catch (err) {
    console.error('Erro ao atualizar produto:', err)
    res.status(500).json({ message: 'Erro ao atualizar produto.' })
  }
}

export async function excluirProduto(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: 'Produto não encontrado.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Erro ao excluir produto:', err)
    res.status(500).json({ message: 'Erro ao excluir produto.' })
  }
}
