import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Caixa from './pages/Caixa'
import Produtos from './pages/Produtos'
import ProdutosRelatorio from './pages/ProdutosRelatorio'
import Gestao from './pages/Gestao'
import Relatorio from './pages/Relatorio'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/caixa" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/caixa" element={<Caixa />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/produtos/relatorio" element={<ProdutosRelatorio />} />
      <Route path="/gestao" element={<Gestao />} />
      <Route path="/relatorio" element={<Relatorio />} />
    </Routes>
  )
}
