import Navbar from '../components/Navbar'

export default function Portaria() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Portaria</h2>
        <p className="text-gray-500 text-sm mb-8">
          Página da portaria. Adicione aqui as funcionalidades desejadas para o controle de entrada/saída ou outras operações da portaria.
        </p>
        {/* Conteúdo da portaria */}
      </main>
    </div>
  )
}
