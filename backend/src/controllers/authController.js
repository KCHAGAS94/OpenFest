import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'
import { usuarioParaSaida } from './usuariosController.js'

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios_sistema WHERE email = $1',
      [email.trim().toLowerCase()]
    )

    const user = rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const valid = await bcrypt.compare(password, user.senha_hash)

    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const usuario = usuarioParaSaida(user)

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, permissoes: usuario.permissoes },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, user: usuario })
  } catch (err) {
    console.error('Erro no login:', err)
    res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}
