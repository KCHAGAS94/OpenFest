import { useLocation } from 'react-router-dom'

const links = [
  { href: '/caixa', label: 'Caixa', permissao: 'caixa' },
  { href: '/produtos', label: 'Produtos', permissao: 'produtos' },
  { href: '/gestao', label: 'Gestão', permissao: 'gestao' },
  { href: '/configuracoes', label: 'Configurações', permissao: 'configuracoes' },
]

function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null
  } catch {
    return null
  }
}

export default function Navbar() {
  const { pathname } = useLocation()
  const usuario = usuarioLogado()
  const linksVisiveis = links.filter((link) => usuario?.permissoes?.[link.permissao])

  return (
    <header className="border-b border-white/10 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-white">
          Open<span className="text-pink-400">Fest</span>
        </a>

        <nav className="flex items-center gap-1">
          {linksVisiveis.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </a>
          ))}

          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className="ml-4 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}
