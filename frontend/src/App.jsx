import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Caixa from './pages/Caixa'
import Produtos from './pages/Produtos'
import ProdutosRelatorio from './pages/ProdutosRelatorio'
import Gestao from './pages/Gestao'
import Relatorio from './pages/Relatorio'
import Funcionarios from './pages/Funcionarios'
import Configuracoes from './pages/Configuracoes'
import RotaProtegida from './components/RotaProtegida'
import { primeiraRotaPermitida } from './utils/configuracoes'

function protegida(permissao, elemento) {
  return <RotaProtegida permissao={permissao}>{elemento}</RotaProtegida>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={primeiraRotaPermitida()} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/caixa" element={protegida('caixa', <Caixa />)} />
      <Route path="/produtos" element={protegida('produtos', <Produtos />)} />
      <Route path="/produtos/relatorio" element={protegida('gestao', <ProdutosRelatorio />)} />
      <Route path="/gestao" element={protegida('gestao', <Gestao />)} />
      <Route path="/relatorio" element={protegida('gestao', <Relatorio />)} />
      <Route path="/funcionarios" element={protegida('gestao', <Funcionarios />)} />
      <Route path="/configuracoes" element={protegida('configuracoes', <Configuracoes />)} />
    </Routes>
  )
}
