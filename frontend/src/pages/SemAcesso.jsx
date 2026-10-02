export default function SemAcesso() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Sem permissões liberadas</h1>
      <p className="text-gray-400 max-w-sm">
        Sua conta ainda não tem acesso a nenhuma área do sistema. Fale com um gestor para liberar suas permissões.
      </p>
      <button
        onClick={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }}
        className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
      >
        Voltar para o login
      </button>
    </div>
  )
}
