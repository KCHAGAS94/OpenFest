import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

export function requirePermissao(permissao) {
  return (req, res, next) => {
    if (!req.user?.permissoes?.[permissao]) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' })
    }
    next()
  }
}
