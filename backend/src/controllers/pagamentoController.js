import { MercadoPagoConfig, Payment } from 'mercadopago'

// Validação de variáveis de ambiente essenciais
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error('A variável de ambiente MERCADO_PAGO_ACCESS_TOKEN não está definida.')
  // Em um app real, você poderia querer que o servidor nem subisse.
  // process.exit(1);
}

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
})

const payment = new Payment(mpClient)

// ─── PIX ──────────────────────────────────────────────
export async function criarPix(req, res) {
  console.log('Recebida requisição para /api/pagamento/pix:', req.body)
  const { valor, descricao, emailPagador } = req.body

  if (!valor || valor <= 0) {
    return res.status(400).json({ message: 'O valor da transação é obrigatório e deve ser maior que zero.' })
  }

  try {
    const resposta = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: descricao || 'Venda OpenFest',
        payment_method_id: 'pix',
        payer: {
          email: emailPagador || 'cliente@openfest.com',
        },
      },
    })

    const pix = resposta.point_of_interaction?.transaction_data

    if (!pix) {
      console.error('Resposta do Mercado Pago não contém dados do PIX:', resposta)
      return res.status(502).json({ message: 'Não foi possível obter os dados do PIX do provedor de pagamento.' })
    }

    res.json({
      id: resposta.id,
      status: resposta.status,
      qr_code: pix?.qr_code,
      qr_code_base64: pix?.qr_code_base64,
    })
  } catch (err) {
    const erroCausa = err.cause ?? err
    const detalhe = erroCausa?.message || JSON.stringify(erroCausa)
    console.error('Erro ao criar PIX:', detalhe)

    if (res.headersSent) return

    const statusCode = erroCausa?.statusCode || 500
    res.status(statusCode).json({ message: 'Erro ao gerar PIX.', detalhe })
  }
}

// ─── CARTÃO (venda feita fora do sistema, no celular via NFC) ──
// Não cria cobrança nenhuma: só confere se existe um pagamento aprovado
// recente (últimos N segundos) na conta Mercado Pago com o mesmo valor e tipo.
const TOLERANCIA_VALOR = 0.01
const JANELA_BUSCA_MS = 10_000

export async function verificarPagamentoRecente(req, res) {
  const { valor, tipo } = req.query

  const valorNumerico = Number(valor)
  if (!valor || isNaN(valorNumerico) || valorNumerico <= 0) {
    return res.status(400).json({ message: 'O valor da transação é obrigatório e deve ser maior que zero.' })
  }

  const paymentTypeId = tipo === 'credito' ? 'credit_card' : 'debit_card'
  const beginDate = new Date(Date.now() - JANELA_BUSCA_MS).toISOString()
  const endDate = new Date().toISOString()

  try {
    const params = new URLSearchParams({
      sort: 'date_created',
      criteria: 'desc',
      range: 'date_created',
      begin_date: beginDate,
      end_date: endDate,
    })

    const resposta = await fetch(
      `https://api.mercadopago.com/v1/payments/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      }
    )

    const data = await resposta.json()

    if (!resposta.ok) {
      console.error('Erro ao buscar pagamentos recentes:', data)
      return res.status(resposta.status).json({ message: data.message || 'Erro ao consultar pagamentos.', detalhe: data })
    }

    const pagamentoEncontrado = (data.results || []).find(p =>
      p.status === 'approved' &&
      p.payment_type_id === paymentTypeId &&
      Math.abs(Number(p.transaction_amount) - valorNumerico) <= TOLERANCIA_VALOR
    )

    if (!pagamentoEncontrado) {
      return res.json({ encontrado: false })
    }

    res.json({ encontrado: true, id: pagamentoEncontrado.id, status: pagamentoEncontrado.status })
  } catch (err) {
    console.error('Erro ao verificar pagamento recente:', err)
    res.status(500).json({ message: 'Erro interno ao verificar pagamento.', detalhe: err.message })
  }
}

// ─── VERIFICAR STATUS ──────────────────────────────────
export async function verificarStatus(req, res) {
  const { id } = req.params

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ message: 'ID de pagamento inválido.' })
  }

  try {
    const resposta = await payment.get({ id: Number(id) })
    res.json({ id: resposta.id, status: resposta.status })
  } catch (err) {
    const erroCausa = err.cause ?? err
    const detalhe = erroCausa?.message || JSON.stringify(erroCausa)
    console.error('Erro ao verificar pagamento:', detalhe)

    if (res.headersSent) return

    const statusCode = erroCausa?.statusCode || 500
    res.status(statusCode).json({ message: 'Erro ao verificar pagamento.', detalhe })
  }
}

// ─── LISTAR DISPOSITIVOS (para pegar o DEVICE_ID) ─────
export async function listarDispositivos(_req, res) {
  try {
    const resposta = await fetch(
      'https://api.mercadopago.com/point/integration-api/devices',
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      }
    )
    const data = await resposta.json()

    if (!resposta.ok) {
      console.error('Erro ao listar dispositivos:', data)
      return res.status(resposta.status).json({ message: data.message || 'Erro ao listar dispositivos.', detalhe: data })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro ao listar dispositivos:', err)
    res.status(500).json({ message: 'Erro interno ao listar dispositivos.', detalhe: err.message })
  }
}

// ─── DEBUG (remover em produção) ──────────────────────
export function debugToken(_req, res) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
  if (!token) {
    return res.json({
      token_definido: false,
      mensagem: 'A variável de ambiente MERCADO_PAGO_ACCESS_TOKEN não está configurada.'
    })
  }

  res.json({
    token_definido: token.length > 0,
    primeiros_chars: token.slice(0, 10) + '...',
    tamanho: token.length,
  })
}
