import { MercadoPagoConfig, Payment } from 'mercadopago'

function criarCliente() {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  })
}

// ─── PIX ──────────────────────────────────────────────
export async function criarPix(req, res) {
  const { valor, descricao } = req.body

  if (!valor || valor <= 0) {
    return res.status(400).json({ message: 'Valor inválido.' })
  }

  try {
    const payment = new Payment(criarCliente())
    const resposta = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: descricao || 'Venda OpenFest',
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@openfest.com',
        },
      },
    })

    const pix = resposta.point_of_interaction?.transaction_data

    res.json({
      id: resposta.id,
      status: resposta.status,
      qr_code: pix?.qr_code,
      qr_code_base64: pix?.qr_code_base64,
    })
  } catch (err) {
    const detalhe = err?.cause?.message || err?.message || JSON.stringify(err)
    console.error('Erro ao criar PIX:', detalhe)
    res.status(500).json({ message: 'Erro ao gerar PIX.', detalhe })
  }
}

// ─── CARTÃO (Point Tap) ────────────────────────────────
export async function criarCobrancaCartao(req, res) {
  const { valor, descricao, tipo } = req.body
  const deviceId = process.env.MP_DEVICE_ID

  if (!deviceId || deviceId === 'COLE_O_ID_DO_DISPOSITIVO_AQUI') {
    return res.status(400).json({
      message: 'DEVICE_ID não configurado. Consulte /api/pagamento/dispositivos para obtê-lo.',
    })
  }

  if (!valor || valor <= 0) {
    return res.status(400).json({ message: 'Valor inválido.' })
  }

  try {
    const resposta = await fetch(
      `https://api.mercadopago.com/point/integration-api/devices/${deviceId}/payment-intents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(valor),
          description: descricao || 'Venda OpenFest',
          payment: {
            type: tipo === 'credito' ? 'credit_card' : 'debit_card',
            installments: 1,
            installments_cost: 'seller',
          },
        }),
      }
    )

    const data = await resposta.json()

    if (!resposta.ok) {
      console.error('Erro MP Point:', data)
      return res.status(resposta.status).json({ message: data.message || 'Erro ao criar cobrança.' })
    }

    res.json({ id: data.id, status: 'pendente' })
  } catch (err) {
    console.error('Erro ao criar cobrança cartão:', err)
    res.status(500).json({ message: 'Erro ao criar cobrança.' })
  }
}

// ─── VERIFICAR STATUS ──────────────────────────────────
export async function verificarStatus(req, res) {
  const { id } = req.params

  try {
    const resposta = await payment.get({ id: Number(id) })
    res.json({ id: resposta.id, status: resposta.status })
  } catch (err) {
    console.error('Erro ao verificar pagamento:', err)
    res.status(500).json({ message: 'Erro ao verificar pagamento.' })
  }
}

// ─── LISTAR DISPOSITIVOS (para pegar o DEVICE_ID) ─────
export async function listarDispositivos(_req, res) {
  try {
    const resposta = await fetch(
      'https://api.mercadopago.com/point/integration-api/devices',
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    )
    const data = await resposta.json()
    res.json(data)
  } catch (err) {
    console.error('Erro ao listar dispositivos:', err)
    res.status(500).json({ message: 'Erro ao listar dispositivos.' })
  }
}

// ─── DEBUG (remover em produção) ──────────────────────
export function debugToken(_req, res) {
  const token = process.env.MP_ACCESS_TOKEN || ''
  res.json({
    token_definido: token.length > 0,
    primeiros_chars: token.slice(0, 10) + '...',
    tamanho: token.length,
  })
}
