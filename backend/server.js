import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.js'
import pagamentoRoutes from './src/routes/pagamento.js'
import portariaRoutes from './src/routes/portaria.js' // Importe as rotas da portaria
import produtosRoutes from './src/routes/produtos.js'

dotenv.config({ override: true })

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// Rotas

app.use('/api/auth', authRoutes)
app.use('/api/pagamento', pagamentoRoutes)
app.use('/api/portaria', portariaRoutes) // Use as rotas da portaria
app.use('/api/produtos', produtosRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
