import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import pool from '../db/pool.js'

function paraSaida(row) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    permissoes: {
      caixa: row.permCaixa,
      produtos: row.permProdutos,
      gestao: row.permGestao,
      configuracoes: row.permConfiguracoes,
    },
    createdAt: row.createdAt,
  }
}

export async function listarUsuarios(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, email, "permCaixa", "permProdutos", "permGestao", "permConfiguracoes", "createdAt"
       FROM usuarios ORDER BY nome`
    )
    res.json(rows.map(paraSaida))
  } catch (err) {
    console.error('Erro ao listar usuários:', err)
    res.status(500).json({ message: 'Erro ao listar usuários.' })
  }
}

export async function criarUsuario(req, res) {
  const { nome, email, senha, permissoes = {} } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' })
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    const { rows } = await pool.query(
      `INSERT INTO usuarios
         (id, nome, email, senha, "permCaixa", "permProdutos", "permGestao", "permConfiguracoes", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, nome, email, "permCaixa", "permProdutos", "permGestao", "permConfiguracoes", "createdAt"`,
      [
        crypto.randomUUID(),
        nome,
        email,
        senhaHash,
        !!permissoes.caixa,
        !!permissoes.produtos,
        !!permissoes.gestao,
        !!permissoes.configuracoes,
      ]
    )
    res.status(201).json(paraSaida(rows[0]))
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Já existe um usuário com esse e-mail.' })
    }
    console.error('Erro ao criar usuário:', err)
    res.status(500).json({ message: 'Erro ao criar usuário.' })
  }
}

export async function atualizarUsuario(req, res) {
  const { id } = req.params
  const { nome, email, senha, permissoes = {} } = req.body

  try {
    const senhaHash = senha ? await bcrypt.hash(senha, 10) : null

    const { rows } = await pool.query(
      `UPDATE usuarios SET
         nome = COALESCE($1, nome),
         email = COALESCE($2, email),
         senha = COALESCE($3, senha),
         "permCaixa" = $4,
         "permProdutos" = $5,
         "permGestao" = $6,
         "permConfiguracoes" = $7,
         "updatedAt" = NOW()
       WHERE id = $8
       RETURNING id, nome, email, "permCaixa", "permProdutos", "permGestao", "permConfiguracoes", "createdAt"`,
      [
        nome || null,
        email || null,
        senhaHash,
        !!permissoes.caixa,
        !!permissoes.produtos,
        !!permissoes.gestao,
        !!permissoes.configuracoes,
        id,
      ]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }

    res.json(paraSaida(rows[0]))
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Já existe um usuário com esse e-mail.' })
    }
    console.error('Erro ao atualizar usuário:', err)
    res.status(500).json({ message: 'Erro ao atualizar usuário.' })
  }
}

export async function deletarUsuario(req, res) {
  const { id } = req.params
  try {
    const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1', [id])
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }
    res.json({ ok: true })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Esse usuário já tem vendas registradas e não pode ser removido.' })
    }
    console.error('Erro ao deletar usuário:', err)
    res.status(500).json({ message: 'Erro ao deletar usuário.' })
  }
}
