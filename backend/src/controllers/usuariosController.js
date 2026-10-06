import bcrypt from 'bcryptjs'
import pool from '../db/pool.js'

const CAMPOS = 'id, nome, email, perm_caixa, perm_produtos, perm_gestao, perm_configuracoes, created_at'

export function usuarioParaSaida(row) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    permissoes: {
      caixa: row.perm_caixa,
      produtos: row.perm_produtos,
      gestao: row.perm_gestao,
      configuracoes: row.perm_configuracoes,
    },
  }
}

function permissoesParaParametros(permissoes = {}) {
  return [!!permissoes.caixa, !!permissoes.produtos, !!permissoes.gestao, !!permissoes.configuracoes]
}

// Roda a alteração numa transação e desfaz se ninguém mais puder acessar Configurações.
async function alterarComAdminGarantido(executar) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const resultado = await executar(client)
    const { rows } = await client.query(
      'SELECT COUNT(*)::int AS total FROM usuarios_sistema WHERE perm_configuracoes'
    )
    if (rows[0].total === 0) {
      await client.query('ROLLBACK')
      const erro = new Error('Pelo menos um usuário precisa ter permissão de Configurações.')
      erro.status = 400
      throw erro
    }
    await client.query('COMMIT')
    return resultado
  } catch (err) {
    if (!err.status) await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

function responderErro(res, err, mensagemPadrao) {
  if (err.status) return res.status(err.status).json({ message: err.message })
  if (err.code === '23505') return res.status(409).json({ message: 'Já existe um usuário com esse e-mail.' })
  console.error(mensagemPadrao, err)
  res.status(500).json({ message: mensagemPadrao })
}

export async function listarUsuarios(_req, res) {
  try {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM usuarios_sistema ORDER BY nome`)
    res.json(rows.map(usuarioParaSaida))
  } catch (err) {
    responderErro(res, err, 'Erro ao listar usuários.')
  }
}

export async function criarUsuario(req, res) {
  const { nome, email, senha, permissoes } = req.body

  if (!nome?.trim() || !email?.trim() || !senha) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' })
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    const { rows } = await pool.query(
      `INSERT INTO usuarios_sistema
         (nome, email, senha_hash, perm_caixa, perm_produtos, perm_gestao, perm_configuracoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${CAMPOS}`,
      [nome.trim(), email.trim().toLowerCase(), senhaHash, ...permissoesParaParametros(permissoes)]
    )
    res.status(201).json(usuarioParaSaida(rows[0]))
  } catch (err) {
    responderErro(res, err, 'Erro ao criar usuário.')
  }
}

export async function atualizarUsuario(req, res) {
  const { id } = req.params
  const { nome, email, senha, permissoes } = req.body

  if (!nome?.trim() || !email?.trim()) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' })
  }

  try {
    const senhaHash = senha ? await bcrypt.hash(senha, 10) : null
    const rows = await alterarComAdminGarantido(async (client) => {
      const resultado = await client.query(
        `UPDATE usuarios_sistema SET
           nome = $1,
           email = $2,
           senha_hash = COALESCE($3, senha_hash),
           perm_caixa = $4,
           perm_produtos = $5,
           perm_gestao = $6,
           perm_configuracoes = $7
         WHERE id = $8
         RETURNING ${CAMPOS}`,
        [nome.trim(), email.trim().toLowerCase(), senhaHash, ...permissoesParaParametros(permissoes), id]
      )
      return resultado.rows
    })

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }
    res.json(usuarioParaSaida(rows[0]))
  } catch (err) {
    responderErro(res, err, 'Erro ao atualizar usuário.')
  }
}

export async function excluirUsuario(req, res) {
  const { id } = req.params

  try {
    const rowCount = await alterarComAdminGarantido(async (client) => {
      const resultado = await client.query('DELETE FROM usuarios_sistema WHERE id = $1', [id])
      return resultado.rowCount
    })

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }
    res.json({ ok: true })
  } catch (err) {
    responderErro(res, err, 'Erro ao excluir usuário.')
  }
}
