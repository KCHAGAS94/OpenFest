import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.js'
import pagamentoRoutes from './src/routes/pagamento.js'
import produtosRoutes from './src/routes/produtos.js'
import { printReceipt } from './src/printTest.js' // Movi o import para o topo

dotenv.config({ override: true })

// 1. INICIALIZAÇÃO (Obrigatório vir antes das rotas)
const app = express()
const PORT = process.env.PORT || 3000

// 2. MIDDLEWARES
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// 3. ROTAS DE API
app.use('/api/auth', authRoutes)
app.use('/api/pagamento', pagamentoRoutes)
app.use('/api/produtos', produtosRoutes)

// Endpoint de impressão (Agora o 'app' já existe aqui)
app.post('/api/print', async (req, res) => {
  try {
    const { evento, itens, total, data, pagamento, observacao } = req.body;
    await printReceipt({ evento, itens, total, data, pagamento, observacao });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao imprimir recibo:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Erro ao imprimir recibo.', 
      detalhe: err?.message || err 
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 4. TRATAMENTO DE ERROS (Sempre por último nas rotas)
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err)
  res.status(500).json({ 
    message: 'Erro interno do servidor.', 
    detalhe: err?.message || err 
  })
})

// 5. INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})