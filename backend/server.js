import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.js'
import pagamentoRoutes from './src/routes/pagamento.js'

dotenv.config({ override: true })

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// Rotas
app.use('/api/auth', authRoutes)
app.use('/api/pagamento', pagamentoRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
