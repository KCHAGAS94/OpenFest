import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    )

    const user = rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const valid = await bcrypt.compare(password, user.senha)

    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const permissoes = {
      caixa: user.permCaixa,
      produtos: user.permProdutos,
      gestao: user.permGestao,
      configuracoes: user.permConfiguracoes,
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, permissoes },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, user: { id: user.id, name: user.nome, email: user.email, permissoes } })
  } catch (err) {
    console.error('Erro no login:', err)
    res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}
