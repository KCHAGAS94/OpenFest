import { Navigate } from 'react-router-dom'
import { usuarioLogado, temPermissao, primeiraRotaPermitida } from '../utils/configuracoes'

export default function RotaProtegida({ permissao, children }) {
  if (!usuarioLogado()) return <Navigate to="/login" replace />
  if (!temPermissao(permissao)) return <Navigate to={primeiraRotaPermitida()} replace />
  return children
}
