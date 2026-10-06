import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PERMISSOES, temPermissao, sair, usuarioLogado, irPara } from '../utils/configuracoes'

const ICONES = { caixa: '💰', produtos: '🛍️', gestao: '📊', configuracoes: '⚙️' }

// As subpáginas da Gestão deixam o item "Gestão" marcado.
const ROTAS_GESTAO = ['/gestao', '/relatorio', '/produtos/relatorio', '/funcionarios']

function estaAtivo(chave, rota, pathname) {
  return chave === 'gestao' ? ROTAS_GESTAO.includes(pathname) : pathname === rota
}

function encerrarSessao() {
  sair()
  irPara('/login')
}

export default function Navbar() {
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const usuario = usuarioLogado()
  const links = PERMISSOES
    .filter(({ chave }) => temPermissao(chave))
    .map(({ chave, rota, label }) => ({ chave, href: rota, label, ativo: estaAtivo(chave, rota, pathname) }))
  const titulo = links.find((link) => link.ativo)?.label

  // Trava a rolagem da página e fecha com Esc enquanto o menu lateral está aberto.
  useEffect(() => {
    if (!menuAberto) return
    const fecharComEsc = (e) => e.key === 'Escape' && setMenuAberto(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', fecharComEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', fecharComEsc)
    }
  }, [menuAberto])

  return (
    <header className="border-b border-white/10 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Celular: botão do menu lateral */}
        <button
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="md:hidden flex flex-col justify-center gap-1.25 w-10 h-10 -ml-2 px-2"
        >
          <span className="h-0.5 rounded bg-white" />
          <span className="h-0.5 rounded bg-white" />
          <span className="h-0.5 rounded bg-white" />
        </button>

        <a href="/" className="text-lg md:text-xl font-bold text-white">
          Open<span className="text-pink-400">Fest</span>
          {titulo && <span className="md:hidden text-sm font-normal text-gray-400"> · {titulo}</span>}
        </a>

        {/* Espaço do mesmo tamanho do botão para manter o logo centralizado no celular */}
        <span className="md:hidden w-10" />

        {/* Computador: barra de links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, ativo }) => (
            <a
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ativo ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </a>
          ))}

          <button
            onClick={encerrarSessao}
            className="ml-4 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Sair
          </button>
        </nav>
      </div>

      {/* Celular: menu lateral */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-[78%] max-w-75 bg-gray-900 border-r border-white/10 px-4 pt-8 flex flex-col">
            <div className="pb-5 mb-3 border-b border-white/10">
              <p className="text-white font-bold">{usuario?.nome}</p>
              <p className="text-gray-400 text-xs mt-0.5">{usuario?.email}</p>
            </div>

            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
              {links.map(({ chave, href, label, ativo }) => (
                <a
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[10px] text-[15px] font-medium ${
                    ativo ? 'bg-white/8 text-white' : 'text-gray-400'
                  }`}
                >
                  <span>{ICONES[chave]}</span>
                  {label}
                </a>
              ))}
            </nav>

            <button
              onClick={encerrarSessao}
              className="text-left border-t border-white/10 py-4 mb-6 text-red-400 font-semibold text-[15px]"
            >
              Sair
            </button>
          </aside>
        </div>
      )}
    </header>
  )
}
